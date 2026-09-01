// Draws the home-screen widget as a picture, at the size a real cell is.
//
//   node scripts/widget_mockup.mjs                  # 4x2, happy, fox
//   node scripts/widget_mockup.mjs --mood worried --mascot owl --size 324x232
//   node scripts/widget_mockup.mjs --out /tmp/card.png
//
// Why this exists: the widget cannot be seen without a phone. There is no
// emulator on this machine, `previewLayout` only shows up in the launcher's
// widget picker, and the last three passes over the design were all decided by
// putting this card next to a screenshot of Duolingo's — which is a thing you
// can only do if you can render one on demand.
//
// It is a *mock-up*: a copy of android/.../layout/widget_streak.xml written in
// CSS, at 1 CSS px per dp, screenshotted at deviceScaleFactor 3 so the output
// is device pixels on an xxhdpi phone. Nothing builds from it and nothing
// tests it, so it is only worth as much as its agreement with the layout —
// **change both together, in the same commit, or throw this away.** The
// numbers that have to match are marked MIRRORS below.
//
// Uses puppeteer-core against the installed Chrome, like scripts/screenshots.mjs.
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

// A 4x2 cell on the user's phone, measured off a home-screen screenshot.
const [W, H] = arg("size", "324x153").split("x").map(Number);
const mood = arg("mood", "happy");
const mascot = arg("mascot", "fox");
const streak = arg("streak", "5 days");
const message = arg("message", "All done for today");
// Five days as met(1)/unmet(0)/frozen(f), oldest first, with their labels.
const days = arg("days", "Fri:0,Sat:0,Sun:f,Mon:1,Tue:1")
  .split(",").map(d => d.split(":"));
const out = arg("out", join(process.cwd(), `widget-${mood}-${W}x${H}.png`));

// MIRRORS res/drawable/widget_bg_<mood>.xml — start, centre, end.
const BG = {
  happy:   ["#277744", "#399159", "#63CE8A"],
  neutral: ["#2160AE", "#3C76BF", "#7AABE8"],
  waiting: ["#266575", "#387E90", "#61B8CE"],
  worried: ["#784810", "#995F1C", "#E69436"],
  sad:     ["#5F222C", "#7D303D", "#C35164"],
  sleepy:  ["#38487E", "#4E5F95", "#8192C9"],
};
const [c0, cc, c1] = BG[mood] ?? BG.happy;

const art = readFileSync(`android/app/src/main/res/drawable-nodpi/mascot_${mascot}_${mood}.png`);
const mascotSrc = `data:image/png;base64,${art.toString("base64")}`;

const tick = `<svg class="tick" viewBox="0 0 24 24"><path d="M6.6,12.4 L10.4,16.2 L17.4,8.6"
  fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const pin = `<svg class="tick" viewBox="0 0 24 24">
  <path d="M7.2,17.4 L12,24 L16.8,17.4 Z" fill="#6FB7E8"/>
  <path d="M12,0.4 a11,11 0 1,0 0,22 a11,11 0 1,0 0,-22 Z" fill="#6FB7E8"/>
  <path d="M6.9,11.7 L10.4,15.2 L16.9,8.2" fill="none" stroke="#fff" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const flame = `<svg class="flame" viewBox="0 0 24 24">
  <path d="M12,23 C7.6,23 4,19.4 4,15 C4,10 8,6.5 10,1 C10,5.2 13,6.2 14,8.8 C15,7.2 15.4,5.6 15.4,4 C18.6,7 20,11 20,15 C20,19.4 16.4,23 12,23 Z" fill="#F2C572"/>
  <path d="M12,21.4 C9.6,21.4 7.6,19.4 7.6,17 C7.6,14.4 9.8,12.6 11,9.6 C11.4,12 13.2,13 14,14.6 C14.8,13.6 15.1,12.7 15.2,11.7 C16.1,13.3 16.4,15.3 16.4,17 C16.4,19.4 14.4,21.4 12,21.4 Z" fill="#FFE6B0"/></svg>`;

const met = (d) => d[1] === "1";
const html = `<!doctype html><meta charset="utf-8"><style>
  /* MIRRORS res/layout/widget_streak.xml. 1 CSS px == 1dp. */
  html,body{margin:0;background:#8a8f8a}
  body{font-family:"Helvetica Neue",Arial,sans-serif}
  .card{width:${W}px;height:${H}px;margin:10px;box-sizing:border-box;
    border-radius:20px;overflow:hidden;display:flex;align-items:center;
    padding:10px 10px 10px 14px;
    background:linear-gradient(90deg,${c0},${cc} 50%,${c1})}
  .left{flex:1 1 auto;min-width:0}
  .head{display:flex;align-items:center;gap:5px}
  .flame{width:24px;height:24px;display:block}
  .streak{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.3px;line-height:1}
  .msg{margin-top:7px;font-size:14px;color:rgba(255,255,255,.85);line-height:1.1;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .strip{margin-top:18px}
  .labels{display:flex}
  .labels span{width:26px;margin-right:7px;text-align:center;font-size:12.5px;
    color:rgba(255,255,255,.79);line-height:1.1;white-space:nowrap}
  .labels span:last-child{margin-right:0}
  .marks{position:relative;height:26px;margin-top:4px}
  .links{position:absolute;left:13px;top:0;display:flex}
  .link{width:33px;height:26px}
  .link.on{background:#F2874E}
  .dots{position:absolute;inset:0;display:flex}
  .dot{width:26px;height:26px;margin-right:7px;flex:none;position:relative}
  .dot:last-child{margin-right:0}
  .met{background:#F2874E;border-radius:50%}
  .todo{background:rgba(0,0,0,.18);border-radius:50%}
  .tick{position:absolute;inset:0}
  .mascot{width:96px;height:100%;flex:none;object-fit:contain;margin-top:8px}
</style>
<div class="card">
  <div class="left">
    <div class="head">${flame}<div class="streak">${streak}</div></div>
    <div class="msg">${message}</div>
    <div class="strip">
      <div class="labels">${days.map(d => `<span>${d[0]}</span>`).join("")}</div>
      <div class="marks" style="width:${days.length * 33 - 7}px">
        <div class="links">${days.slice(0, -1).map((d, i) =>
          `<div class="link ${met(d) && met(days[i + 1]) ? "on" : ""}"></div>`).join("")}</div>
        <div class="dots">${days.map(d => d[1] === "f"
          ? `<div class="dot">${pin}</div>`
          : `<div class="dot ${met(d) ? "met" : "todo"}">${met(d) ? tick : ""}</div>`).join("")}</div>
      </div>
    </div>
  </div>
  <img class="mascot" src="${mascotSrc}">
</div>`;

const page = join(mkdtempSync(join(tmpdir(), "widget-mockup-")), "card.html");
writeFileSync(page, html);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const tab = await browser.newPage();
await tab.setViewport({ width: W + 20, height: H + 20, deviceScaleFactor: 3 });
await tab.goto(`file://${page}`);
await tab.screenshot({ path: out });
await browser.close();
console.log(`${out}  (${W}x${H}dp, ${mood}, ${mascot})`);
