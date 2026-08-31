#!/usr/bin/env python3
"""
Turns generated expression sheets into the app's mascot assets.

    python3 scripts/mascot_sheets.py <sheet.png> <animal>

Each sheet is a 3x2 grid of the same animal in the six moods, drawn on a white
background. This cuts it into six squares, knocks the white background out to
transparency, and writes them where both halves of the app expect them:

    android/app/src/main/res/drawable-nodpi/mascot_<animal>_<mood>.png
    public/mascots/<animal>-<mood>.png     (the picker in Settings)

Two things here are less obvious than they look:

* **The background cannot be removed by thresholding.** The eyes' white sclera
  is the same pure white as the background, so a plain "white becomes
  transparent" pass punches holes through both eyes. Only white that is
  *connected to the border* is background, which means a flood fill.

* **The flood fill is done in runs, not pixels.** A per-pixel queue over four
  megapixels is slow in Python, and naive dilation needs as many passes as the
  image is tall. Filling whole runs along a row and then along a column spreads
  the fill across the image in both directions each pass, so it converges in a
  handful of them.

* **It is seeded per cell, not from the sheet's border.** The generator leaves
  a faint separator line around some cells, which walls that cell's background
  off from the edge of the sheet entirely — a sheet-wide fill left two of the
  thirty images with a solid white box behind them. Each cell is seeded from a
  ring just inside its own edge, which is background by construction.

Requires Pillow and numpy, which is why this is Python and not another .mjs:
neither has a dependency-free equivalent in this project's toolchain, and this
runs by hand when the art changes rather than as part of any build.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Reading order of the six cells, matching the prompt the sheets are generated
# from. Mirrors MOODS in scripts/mascots.mjs.
MOODS = ["sleepy", "neutral", "waiting", "worried", "sad", "happy"]
COLS, ROWS = 3, 2

# Which cell actually holds which mood. The prompt asks for the moods in
# reading order and three of the five sheets obliged, but a generator is not
# obliged to — on the bunny sheet the worried and sad faces came out the other
# way round, and on the panda sheet waiting and worried did. Reordering here
# beats regenerating: the art is good, only the labels were wrong.
CELL_ORDER = {
    "bunny": [0, 1, 2, 4, 3, 5],
    "panda": [0, 1, 3, 2, 4, 5],
}

# Only near-pure white counts as background. Anti-aliased edge pixels are a
# blend of the art and the white behind it, and leaving them opaque keeps a
# thin light rim rather than eating a pixel off every edge — the rim
# disappears into the downscale below.
WHITE = 246          # a couple of cells corner out at 250, so leave headroom
INSET = 0.02         # seed this far inside the cell, clear of separator lines
SPECK = 24           # opaque islands smaller than this are generation noise

# 190dp at 3x density is ~570px, the largest the widget ever draws one. The
# picker in Settings shows them at about 50dp, so the web copies are a
# quarter of the size rather than the same file served twice.
OUT_SIZE = 576
WEB_SIZE = 192
PAD = 0.04          # breathing room around the trimmed art, as a fraction

# Flat art with a handful of colours: a palette costs nothing visually and
# takes the whole set from 12.6MB to something an APK can carry. FASTOCTREE is
# the one PIL quantiser that keeps the alpha channel.
PALETTE = 64


def _fill_runs(mask, reach, axis):
    """Flood every run of `mask` along `axis` that already contains a seed."""
    m = mask if axis == 0 else mask.T
    r = reach if axis == 0 else reach.T
    for i in range(m.shape[0]):
        row, got = m[i], r[i]
        if not got.any():
            continue
        edges = np.flatnonzero(np.diff(np.concatenate(([0], row.view(np.int8), [0]))))
        for start, end in zip(edges[0::2], edges[1::2]):
            if got[start:end].any():
                got[start:end] = True


def _despeckle(opaque):
    """Drop opaque islands too small to be art — stray dots the model leaves
    in the background. Counted with an integral image so it stays vectorised."""
    pad = np.zeros((opaque.shape[0] + 1, opaque.shape[1] + 1), dtype=np.int32)
    pad[1:, 1:] = np.cumsum(np.cumsum(opaque.astype(np.int32), axis=0), axis=1)
    r = 5
    h, w = opaque.shape
    ys = np.clip(np.arange(h)[:, None] + np.array([-r, r + 1])[None, :], 0, h)
    xs = np.clip(np.arange(w)[:, None] + np.array([-r, r + 1])[None, :], 0, w)
    y0, y1 = ys[:, 0][:, None], ys[:, 1][:, None]
    x0, x1 = xs[:, 0][None, :], xs[:, 1][None, :]
    counts = pad[y1, x1] - pad[y0, x1] - pad[y1, x0] + pad[y0, x0]
    return opaque & (counts >= SPECK)


def background(rgb):
    """True where a pixel is background: white, and reachable from a ring just
    inside this cell's edge."""
    white = (rgb >= WHITE).all(axis=2)
    h, w = white.shape
    inset = max(3, int(min(h, w) * INSET))

    reach = np.zeros_like(white)
    reach[inset, :] = white[inset, :]
    reach[-inset - 1, :] = white[-inset - 1, :]
    reach[:, inset] = white[:, inset]
    reach[:, -inset - 1] = white[:, -inset - 1]

    for _ in range(24):
        before = reach.sum()
        _fill_runs(white, reach, 0)   # along rows
        _fill_runs(white, reach, 1)   # then down columns
        if reach.sum() == before:
            break

    # Everything outside the seed ring goes too: that band is the separator
    # line and the sheet margin, never art — the heads are generated with
    # room to spare.
    reach[:inset, :] = True
    reach[-inset:, :] = True
    reach[:, :inset] = True
    reach[:, -inset:] = True
    return ~_despeckle(~reach)


def square(img, size):
    """Trim to the art, then centre it on a transparent square canvas."""
    box = img.getbbox()
    if box:
        img = img.crop(box)
    side = int(max(img.size) * (1 + PAD * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    out = canvas.resize((size, size), Image.LANCZOS)
    return out.quantize(colors=PALETTE, method=Image.FASTOCTREE)


def main(sheet_path, animal):
    root = Path(__file__).resolve().parent.parent
    drawable = root / "android/app/src/main/res/drawable-nodpi"
    web = root / "public/mascots"
    drawable.mkdir(parents=True, exist_ok=True)
    web.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(sheet_path).convert("RGB")
    w, h = sheet.size
    order = CELL_ORDER.get(animal, list(range(len(MOODS))))
    for mood, i in zip(MOODS, order):
        col, row = i % COLS, i // COLS
        cell = sheet.crop((w * col // COLS, h * row // ROWS,
                           w * (col + 1) // COLS, h * (row + 1) // ROWS))
        rgba = cell.convert("RGBA")
        alpha = np.where(background(np.array(cell)), 0, 255).astype(np.uint8)
        rgba.putalpha(Image.fromarray(alpha))
        square(rgba, OUT_SIZE).save(drawable / f"mascot_{animal}_{mood}.png", optimize=True)
        square(rgba, WEB_SIZE).save(web / f"{animal}-{mood}.png", optimize=True)
        print(f"  {animal}:{mood}")
    print(f"wrote 6 images for {animal}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
