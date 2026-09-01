// ---------------------------------------------------------------------------
// The shared visual vocabulary: buttons, fields, and the index card itself.
//
// These lived in FlashcardCatalog.jsx until the drill exercises needed them
// too. Importing them from there would have made a cycle — FlashcardCatalog
// renders the drills, the drills render the card — so they moved here, the way
// gameUI.jsx keeps the gamification screens out of that file.
// ---------------------------------------------------------------------------
import * as imageStore from "./imageStore";
import { RichText, isRich } from "./richText";

// Re-exported rather than redefined: the distractor filter in drills.js has to
// use the very same rule, or a "wrong" answer can grade as correct. See the
// comment on normalizeAnswer there.
export { normalizeAnswer as normalize } from "./drills";

export function PrimaryButton({ onClick, children, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "var(--shell-raised)" : "var(--accent)", color: disabled ? "var(--on-shell-muted)" : "var(--shell-bg)",
      border: "none", borderRadius: 10, padding: "14px 22px", minHeight: 48,
      fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15.5,
      display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
      opacity: disabled ? 0.6 : 1, WebkitTapHighlightColor: "transparent", ...style,
    }}>{children}</button>
  );
}

// Given an href it is a real link rather than a button that navigates: the
// download it is used for wants the browser's own handling — the long-press
// menu, "save link as", and a middle click that doesn't leave the app.
export function GhostButton({ onClick, children, style, href, download, ...rest }) {
  const look = {
    background: "transparent", color: "#EDE6D3", border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10, padding: "13px 20px", minHeight: 48, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15.5,
    display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
    WebkitTapHighlightColor: "transparent",
  };
  if (href) {
    // inline-flex so a link shrink-wraps to its label the way the <button>
    // does; a block-level flex container would stretch across the column and
    // sit oddly next to its neighbours.
    return (
      <a href={href} download={download} rel="noopener" onClick={onClick}
        style={{ ...look, display: "inline-flex", textDecoration: "none", boxSizing: "border-box", ...style }}
        {...rest}>{children}</a>
    );
  }
  return <button onClick={onClick} style={{ ...look, ...style }} {...rest}>{children}</button>;
}

export function TextField({ value, onChange, placeholder, area, style, ...rest }) {
  const common = {
    width: "100%", background: "var(--shell-bg-deep)", border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 8, color: "#FBF7EC", padding: "13px 14px", fontFamily: "Inter, sans-serif",
    fontSize: 16, outline: "none", ...style,
  };
  return area
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ ...common, resize: "vertical" }} {...rest} />
    : <input value={value} onChange={onChange} placeholder={placeholder} style={common} {...rest} />;
}

export function Label({ children, style }) {
  return <p style={{
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
    ...style,
  }}>{children}</p>;
}

export function IndexCardTab({ color, label }) {
  return (
    <div style={{
      // The tab hangs 10px above the card but its box overlaps the card's top
      // edge. Both are positioned, so without this the card — which comes
      // later in the DOM — paints over the tab and clips the label in half.
      position: "absolute", top: -10, left: 18, zIndex: 1,
      background: color, color: "#FBF7EC",
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600,
      padding: "3px 10px", borderRadius: "3px 3px 0 0",
      letterSpacing: 0.6, textTransform: "uppercase",
      boxShadow: "0 -1px 3px rgba(0,0,0,0.15)",
    }}>{label}</div>
  );
}

export function PunchHole() {
  return (
    <div style={{
      position: "absolute", left: 14, bottom: 14, width: 10, height: 10,
      borderRadius: "50%", background: "var(--shell-bg)",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
    }} />
  );
}

// `fill` is for the two faces of a flip card: the shell stretches to the full
// height of the flip container (so both faces are exactly the same size, which
// is what sells the turn) and gives up its own entrance animation, since the
// flip wrapper plays that once for the pair.
export function CardShell({ children, tabLabel, tabColor, fill }) {
  return (
    <div style={{ position: "relative", animation: fill ? undefined : "popIn 0.25s ease-out", height: fill ? "100%" : undefined }}>
      {tabLabel && <IndexCardTab color={tabColor || "var(--brand)"} label={tabLabel} />}
      <div style={{
        background: "var(--card-bg)", borderRadius: "2px 12px 12px 12px", padding: "28px 22px 22px",
        minHeight: 220, boxShadow: "0 6px 20px rgba(0,0,0,0.3)", position: "relative",
        ...(fill ? { height: "100%", display: "flex", flexDirection: "column" } : null),
      }}>
        {children}
        <PunchHole />
      </div>
    </div>
  );
}

export function CardFace({ text, imageId, size }) {
  const src = imageId ? imageStore.getImage(imageId) : null;
  if (imageId) {
    return src
      ? <img src={src} alt={text || ""} style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain" }} />
      : <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "var(--text-faint)", margin: 0 }}>Picture not available on this device</p>;
  }
  return (
    <p style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: size || 21, color: "var(--text-strong)", margin: 0, lineHeight: 1.4 }}>
      {/* Every card face goes through the renderer, so a formula or a code
          snippet reads correctly wherever a card is shown — study, previews,
          the test review — rather than only in the places wired up one by one.
          isRich() keeps ordinary text on the plain path, which is almost all
          text and would otherwise pay for a parse on every render. */}
      {isRich(text) ? <RichText text={text} /> : text}
    </p>
  );
}
