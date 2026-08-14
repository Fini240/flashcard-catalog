// Regenerates the Play Store phone screenshots in play-assets/.
//
// Drives the real app in the dev server through the system Chrome, so what
// ends up in the store listing is the actual UI rather than a mock-up.
//
//   npm run dev            # in one terminal
//   node scripts/screenshots.mjs
//
// Uses puppeteer-core against the installed Chrome — no bundled Chromium
// download. Override the binary with CHROME_PATH if yours lives elsewhere.
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.APP_URL || "http://localhost:5173";
const OUT = "play-assets";

// Play accepts 16:9–9:16; 412x915 at 2x gives a 824x1830 portrait phone shot.
const VIEWPORT = { width: 412, height: 915, deviceScaleFactor: 2 };

const now = Date.now();
const D = 864e5;
const mk = (id, sid, nid, front, back, mode, box, due) => ({
  id, subjectId: sid, nodeId: nid, front, back, mode, manualOptions: [],
  ...(box != null ? { srsBox: box, srsDue: due } : {}),
});

const DEMO = {
  subjects: [
    { id: "s1", name: "Biology", children: [
      { id: "c1", name: "Cell structure", children: [] },
      { id: "c2", name: "Genetics", children: [] }] },
    { id: "s2", name: "Spanish", children: [{ id: "c3", name: "Verbs", children: [] }] },
    { id: "s3", name: "History", children: [{ id: "c4", name: "Cold War", children: [] }] },
  ],
  cards: [
    mk("k1", "s1", "c1", "What is a mitochondrion?", "The powerhouse of the cell", "flip"),
    mk("k2", "s1", "c1", "What is osmosis?", "Diffusion of water across a membrane", "flip", 1, now - 1000),
    mk("k3", "s1", "c1", "What is a ribosome?", "Site of protein synthesis", "mcq", 4, now + 5 * D),
    mk("k4", "s1", "c2", "What is a gene?", "A unit of heredity", "flip", 2, now - 1000),
    mk("k5", "s1", "c2", "What does DNA stand for?", "Deoxyribonucleic acid", "write", 5, now + 20 * D),
    mk("k6", "s2", "c3", "hablar", "to speak", "flip", 1, now - 1000),
    mk("k7", "s2", "c3", "comer", "to eat", "flip", 3, now + 7 * D),
    mk("k8", "s2", "c3", "vivir", "to live", "flip"),
    mk("k9", "s3", "c4", "When did the Berlin Wall fall?", "1989", "flip", 2, now - 1000),
    mk("k10", "s3", "c4", "What was the Marshall Plan?", "US aid to rebuild post-war Europe", "flip", 4, now + 14 * D),
  ],
  updatedAt: now,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The UI is styled inline rather than with stable selectors, so find controls
// the way a person would — by their visible text. Always take the *deepest*
// match: a plain `includes` check also matches every wrapper up to <body>,
// and clicking one of those lands wherever its centre happens to fall.
async function clickText(page, text, tag = "button") {
  const clicked = await page.evaluate((t, sel) => {
    const matches = [...document.querySelectorAll(sel)]
      .filter((n) => n.textContent.trim().toLowerCase().includes(t.toLowerCase()));
    if (!matches.length) return false;
    const deepest = matches.reduce((a, b) => (b.contains(a) ? a : b));
    deepest.click(); // React listens on an ancestor; the click bubbles up
    return true;
  }, text, tag);
  if (!clicked) throw new Error(`Couldn't find a ${tag} containing "${text}"`);
  await sleep(450);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: VIEWPORT,
    args: ["--hide-scrollbars"],
  });
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: "networkidle2" });
  await page.evaluate((d) => {
    localStorage.clear();
    localStorage.setItem("flashcard-catalog-data", JSON.stringify(d));
  }, DEMO);
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(700);

  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

  // 1 — the catalog, with cards due for review
  await shot("screenshot-1-catalog");

  // 2 — a subject opened, showing its decks and per-folder actions
  await clickText(page, "Biology", "*");
  await shot("screenshot-2-subject");

  // 3 — deck picker with the due/all split and progress breakdown
  await clickText(page, "Study");
  await sleep(500);
  await shot("screenshot-3-study-setup");

  // 4 — a card mid-session with the answer revealed. The tappable face is the
  // sibling right before the "tap to reveal" hint, so anchor on that hint.
  await clickText(page, "Start session");
  await sleep(700);
  const flipped = await page.evaluate(() => {
    const hint = [...document.querySelectorAll("p")]
      .find((n) => n.textContent.includes("Tap the card to reveal"));
    const face = hint?.previousElementSibling;
    if (!face) return false;
    face.click();
    return true;
  });
  if (!flipped) throw new Error("Couldn't find the flip target on the session card");
  await sleep(600);
  await shot("screenshot-4-session");

  await browser.close();
  console.log(`Wrote 4 screenshots to ${OUT}/ at ${VIEWPORT.width * 2}x${VIEWPORT.height * 2}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
