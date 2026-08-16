// ---------------------------------------------------------------------------
// Formulas and code on cards.
//
// Without this, maths, physics, chemistry and computer science are all badly
// served: "x^2 + y_1" reads as literal carets and underscores, and a code
// snippet loses its whitespace to HTML collapsing. That rules out a large part
// of what a 17-year-old actually has to revise.
//
// The deliberate decision here is NOT to add KaTeX or MathJax. Both are large
// (KaTeX is ~280KB with its fonts), both want to load font files, and this app
// works offline and ships as a single bundle. What is actually needed on a
// flashcard is narrower than "render arbitrary LaTeX": superscripts,
// subscripts, fractions, roots, Greek letters and the common operators. All of
// those exist in Unicode and in two lines of CSS, and they render in any font
// the device already has.
//
// So: a small subset renderer. `$…$` for inline maths, ```…``` for code.
// Anything it cannot render is shown as written rather than as an error — a
// card is still readable with a stray \oint in it, and is not readable at all
// if the renderer throws.
// ---------------------------------------------------------------------------

import React from "react";

// ---------- symbols ----------

// Greek plus the operators that actually turn up on school and undergraduate
// cards. Longer names must be replaced before shorter ones that prefix them
// (\Gamma before \gamma is handled by case; \int before \in is not, hence the
// length sort in the regex build below).
const SYMBOLS = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
  lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ",
  tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  times: "×", div: "÷", pm: "±", mp: "∓", cdot: "·", ast: "∗",
  leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", approx: "≈",
  equiv: "≡", propto: "∝", sim: "∼", cong: "≅",
  infty: "∞", partial: "∂", nabla: "∇", forall: "∀", exists: "∃",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", supset: "⊃", cup: "∪", cap: "∩",
  emptyset: "∅", varnothing: "∅",
  // No \sqrt or \frac here on purpose: both take arguments and are handled
  // structurally by parseMath. Listing \sqrt as a plain symbol replaced it
  // before the parser ever saw it, so "\sqrt{2}" rendered as "√2" with the
  // braces silently dropped and no radical bar over the 2.
  sum: "∑", prod: "∏", int: "∫", oint: "∮",
  rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔",
  Rightarrow: "⇒", Leftarrow: "⇐", Leftrightarrow: "⇔", mapsto: "↦",
  degree: "°", circ: "∘", angle: "∠", perp: "⊥", parallel: "∥",
  ldots: "…", cdots: "⋯", quad: " ", qquad: "  ",
  hbar: "ℏ", ell: "ℓ", Re: "ℜ", Im: "ℑ", aleph: "ℵ",
  land: "∧", lor: "∨", lnot: "¬", oplus: "⊕", otimes: "⊗",
};

// Longest first, so \Leftrightarrow isn't eaten by \Leftarrow and \int isn't
// eaten by \in.
//
// The trailing lookahead is LaTeX's own rule for where a command name ends: at
// the first character that is not a letter. It is what keeps "\integral" from
// rendering as "∫egral" while still letting "\alpha2" render as "α2" — a word
// boundary would get the first case right and the second wrong.
const SYMBOL_RE = new RegExp(
  `\\\\(${Object.keys(SYMBOLS).sort((a, b) => b.length - a.length).join("|")})(?![a-zA-Z])`,
  "g"
);

// Unicode has a full set of superscript digits but an incomplete set of
// subscripts; where a character is missing the renderer falls back to real
// markup, which is why applySymbols only handles the simple single-character
// case and the parser below handles the rest.
const SUPERSCRIPTS = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ" };
const SUBSCRIPTS = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", i: "ᵢ", o: "ₒ", x: "ₓ", n: "ₙ" };

export const applySymbols = (text) =>
  String(text ?? "").replace(SYMBOL_RE, (whole, name) => SYMBOLS[name] ?? whole);

// ---------- inline maths ----------

// Splits a maths expression into renderable pieces. Returns nodes rather than
// a string because ^{...} and \frac need real markup; a plain string could only
// express the single-character cases.
export function parseMath(expr) {
  const src = applySymbols(expr);
  const nodes = [];
  let text = "";
  let i = 0;

  const flush = () => {
    if (text) {
      nodes.push({ type: "text", value: text });
      text = "";
    }
  };

  // Reads either {a group} or a single character — the two forms LaTeX accepts
  // after ^ and _.
  const readGroup = () => {
    if (src[i] === "{") {
      let depth = 1;
      let out = "";
      i++;
      while (i < src.length && depth > 0) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
          depth--;
          if (!depth) break;
        }
        out += src[i++];
      }
      i++; // closing brace
      return out;
    }
    return src[i++] ?? "";
  };

  while (i < src.length) {
    const ch = src[i];

    if (ch === "^" || ch === "_") {
      i++;
      const body = readGroup();
      const table = ch === "^" ? SUPERSCRIPTS : SUBSCRIPTS;
      // Prefer real Unicode when every character has one: it copies, searches
      // and reads aloud correctly, which <sup> does not.
      if (body && [...body].every((c) => table[c])) {
        text += [...body].map((c) => table[c]).join("");
      } else {
        flush();
        nodes.push({ type: ch === "^" ? "sup" : "sub", value: body });
      }
      continue;
    }

    if (src.startsWith("\\frac", i)) {
      i += 5;
      const num = readGroup();
      const den = readGroup();
      flush();
      nodes.push({ type: "frac", num, den });
      continue;
    }

    if (src.startsWith("\\sqrt", i)) {
      i += 5;
      const body = readGroup();
      flush();
      nodes.push({ type: "sqrt", value: body });
      continue;
    }

    // A brace that isn't part of a command is grouping and shouldn't be shown.
    if (ch === "{" || ch === "}") {
      i++;
      continue;
    }

    text += ch;
    i++;
  }
  flush();
  return nodes;
}

// ---------- block segmentation ----------

// Splits a card side into code blocks, maths spans and plain text. Code is
// found first: a `$` inside a code block is a shell variable, not maths.
export function segment(text) {
  const src = String(text ?? "");
  const out = [];
  let rest = src;
  let guard = 0;

  while (rest && guard++ < 1000) {
    const fence = rest.match(/```(\w+)?\n?([\s\S]*?)```/);
    const inlineCode = rest.match(/`([^`\n]+)`/);
    const math = rest.match(/\$([^$\n]+)\$/);

    // Whichever comes first in the string wins.
    const candidates = [
      fence && { at: fence.index, len: fence[0].length, node: { type: "code", value: fence[2].replace(/\n$/, ""), lang: fence[1] || null, block: true } },
      inlineCode && { at: inlineCode.index, len: inlineCode[0].length, node: { type: "code", value: inlineCode[1], block: false } },
      math && { at: math.index, len: math[0].length, node: { type: "math", value: math[1] } },
    ].filter(Boolean);

    if (!candidates.length) break;
    const next = candidates.sort((a, b) => a.at - b.at)[0];
    if (next.at > 0) out.push({ type: "text", value: rest.slice(0, next.at) });
    out.push(next.node);
    rest = rest.slice(next.at + next.len);
  }
  if (rest) out.push({ type: "text", value: rest });
  // Symbols outside maths too, so "\alpha" written in prose still renders.
  return out.map((n) => (n.type === "text" ? { ...n, value: applySymbols(n.value) } : n));
}

// True if a string contains anything this renderer would treat specially —
// lets the card list skip the renderer entirely for ordinary text.
export const isRich = (text) => {
  const s = String(text ?? "");
  return /\$[^$\n]+\$|`|\\[a-zA-Z]+|[_^]/.test(s);
};

// Plain-text form, for search, export and text-to-speech. Reading "\frac{a}{b}"
// aloud is worse than reading "a/b".
export function toPlainText(text) {
  return segment(text)
    .map((n) => {
      if (n.type === "code") return n.value;
      if (n.type !== "math") return n.value;
      return parseMath(n.value)
        .map((m) =>
          m.type === "frac" ? `${m.num}/${m.den}` :
          m.type === "sqrt" ? `√(${m.value})` :
          m.type === "sup" ? `^${m.value}` :
          m.type === "sub" ? `_${m.value}` :
          m.value
        )
        .join("");
    })
    .join("");
}

// ---------- rendering ----------

const fracStyle = {
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  verticalAlign: "middle",
  // Two stacked lines inside a line of text need their own leading, or the
  // card's line-height pushes the numerator into the row above.
  lineHeight: 1.1,
  margin: "0 0.15em",
  fontSize: "0.95em",
};

const codeStyle = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "0.9em",
  background: "var(--shell-raised)",
  borderRadius: 4,
  padding: "0.1em 0.35em",
};

function MathNodes({ nodes }) {
  return nodes.map((n, i) => {
    if (n.type === "sup") return <sup key={i}>{n.value}</sup>;
    if (n.type === "sub") return <sub key={i}>{n.value}</sub>;
    if (n.type === "sqrt") {
      return (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          √<span style={{ borderTop: "1px solid currentColor", paddingTop: 1 }}>{n.value}</span>
        </span>
      );
    }
    if (n.type === "frac") {
      return (
        <span key={i} style={fracStyle}>
          <span>{n.num}</span>
          <span style={{ borderTop: "1px solid currentColor", width: "100%", textAlign: "center" }}>{n.den}</span>
        </span>
      );
    }
    return <span key={i}>{n.value}</span>;
  });
}

// Renders a card side. Falls back to the raw string if anything at all goes
// wrong: an unrenderable formula must never cost the user the card.
export function RichText({ text, style }) {
  let nodes;
  try {
    nodes = segment(text);
  } catch {
    return <span style={style}>{String(text ?? "")}</span>;
  }

  return (
    <span style={style}>
      {nodes.map((n, i) => {
        if (n.type === "code" && n.block) {
          return (
            <pre
              key={i}
              style={{
                ...codeStyle,
                display: "block",
                padding: "0.6em 0.8em",
                // Long lines scroll inside the block rather than stretching the
                // card off the side of a phone.
                overflowX: "auto",
                textAlign: "left",
                whiteSpace: "pre",
                margin: "0.4em 0",
              }}
            >
              {n.value}
            </pre>
          );
        }
        if (n.type === "code") return <code key={i} style={codeStyle}>{n.value}</code>;
        if (n.type === "math") {
          try {
            return <MathNodes key={i} nodes={parseMath(n.value)} />;
          } catch {
            return <span key={i}>{n.value}</span>;
          }
        }
        return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{n.value}</span>;
      })}
    </span>
  );
}
