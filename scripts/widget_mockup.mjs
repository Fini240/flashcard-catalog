// Draws the home-screen widget as a picture, at the size a real cell is.
//
//   node scripts/widget_mockup.mjs                  # 4x2, happy, fox
//   node scripts/widget_mockup.mjs --mood worried --mascot owl --size 324x225
//   node scripts/widget_mockup.mjs --out /tmp/card.png
//
// Why this exists: the widget cannot be seen without a phone. There is no
// emulator on this machine, `previewLayout` only shows up in the launcher's
// widget picker, and every pass over the design was decided by putting this
// card next to a screenshot of Duolingo's — which is a thing you can only do
// if you can render one on demand.
//
// It is a *mock-up*: a copy of android/.../layout/widget_streak.xml written in
// CSS, at 1 CSS px per dp, screenshotted at deviceScaleFactor 3 so the output
// is device pixels on an xxhdpi phone. Nothing builds from it and nothing
// tests it, so it is only worth as much as its agreement with the layout —
// **change both together, in the same commit, or throw this away.** The
// numbers that have to match are marked MIRRORS below.
//
// The default size is the whole 4x2 *cell* on the user's phone (324x225dp,
// measured off a home-screen screenshot), with the card centred in it the way
// the launcher will place it. The card itself wraps its content at ~152dp.
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

const [W, H] = arg("size", "324x225").split("x").map(Number);
const mood = arg("mood", "happy");
const mascot = arg("mascot", "fox");
const streak = arg("streak", "5 days");
const message = arg("message", "All done for today");
// Five days as met(1)/unmet(0)/frozen(f), oldest first, with their labels.
// The last one is today.
const days = arg("days", "Fri:0,Sat:0,Sun:f,Mon:1,Tue:1")
  .split(",").map(d => d.split(":"));
const out = arg("out", join(process.cwd(), `widget-${mood}-${W}x${H}.png`));

// MIRRORS res/drawable/widget_bg_<mood>.xml — start, centre, end.
const BG = {
  happy:   ["#17703A", "#23864A", "#5FD08A"],
  neutral: ["#1B47A8", "#3165CF", "#79AAFA"],
  waiting: ["#0F5A73", "#237F9B", "#58C1DB"],
  worried: ["#7C3F05", "#A55C0C", "#F09C34"],
  sad:     ["#651530", "#8C2541", "#D6566F"],
  sleepy:  ["#29296F", "#43439C", "#8B8BDD"],
};
const [c0, cc, c1] = BG[mood] ?? BG.happy;
// MIRRORS StreakWidgetProvider: the headline turns gold once today is done.
const lit = mood === "happy";

const art = readFileSync(`android/app/src/main/res/drawable-nodpi/mascot_${mascot}_${mood}.png`);
const mascotSrc = `data:image/png;base64,${art.toString("base64")}`;

// MIRRORS res/drawable/widget_day_*.xml, widget_flame_*.xml, widget_sparkle.xml.
const tick = `<svg class="tick" viewBox="0 0 24 24"><path d="M6.8,12.4 L10.4,16 L17.2,8.8"
  fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const pin = `<svg class="tick" viewBox="0 0 24 24">
  <path d="M7.2,17.4 L12,24 L16.8,17.4 Z" fill="#7CC4F2"/>
  <path d="M12,0.4 a11,11 0 1,0 0,22 a11,11 0 1,0 0,-22 Z" fill="#7CC4F2"/>
  <path d="M6.9,11.7 L10.4,15.2 L16.9,8.2" fill="none" stroke="#fff" stroke-width="2.6"
    stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const FLAME = "M12,23.2 C7.3,23.2 4,19.9 4,15.4 C4,11.7 6.1,9.3 7.9,7.4 C8.1,9.4 9.1,10.7 10.2,11.1 C9.9,7.5 11.6,3.8 15.1,1.2 C14.9,5.1 20,8.7 20,15.4 C20,19.9 16.7,23.2 12,23.2 Z";
const CORE = "M12,21.4 C9.7,21.4 8.1,19.7 8.1,17.6 C8.1,15.4 9.8,14.1 11,12.4 C11.3,14.2 12.6,15 13.4,15.6 C13.8,14.8 14,14 14,13.2 C15.4,14.5 15.9,16 15.9,17.6 C15.9,19.7 14.3,21.4 12,21.4 Z";
const flame = lit
  ? `<svg class="flame" viewBox="0 0 24 24"><defs><linearGradient id="f" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#FF4D1C"/><stop offset="1" stop-color="#FFA530"/></linearGradient></defs>
      <path d="${FLAME}" fill="url(#f)"/><path d="${CORE}" fill="#FFE07A"/></svg>`
  : `<svg class="flame" viewBox="0 0 24 24"><path d="${FLAME}" fill="rgba(255,255,255,.55)"/>
      <path d="${CORE}" fill="rgba(255,255,255,.28)"/></svg>`;
const sparkle = (cls) => `<svg class="sparkle ${cls}" viewBox="0 0 24 24"><path
  d="M12,0 C12.8,7 17,11.2 24,12 C17,12.8 12.8,17 12,24 C11.2,17 7,12.8 0,12 C7,11.2 11.2,7 12,0 Z"
  fill="rgba(255,255,255,.9)"/></svg>`;

const met = (d) => d[1] === "1";
const last = days.length - 1;
const html = `<!doctype html><meta charset="utf-8"><style>
  /* MIRRORS res/layout/widget_streak.xml. 1 CSS px == 1dp. */
  html,body{margin:0;background:#8a8f8a}
  body{font-family:Roboto,"Helvetica Neue",Arial,sans-serif}
  .cell{width:${W}px;height:${H}px;margin:10px;display:flex;align-items:center}
  .card{width:100%;position:relative;border-radius:22px;overflow:hidden;
    background:linear-gradient(90deg,${c0},${cc} 50%,${c1})}
  /* MIRRORS widget_sheen.xml: glow behind the mascot, top light, bottom shade, rim. */
  .sheen{position:absolute;inset:0;border-radius:22px;box-sizing:border-box;
    border:1px solid rgba(255,255,255,.16);
    background:
      radial-gradient(circle at 80% 52%, rgba(255,255,255,.30), rgba(255,255,255,0) 72px),
      linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,0) 50%, rgba(0,0,0,.14))}
  .sparkle{position:absolute;display:block}
  .s1{width:12px;height:12px;top:16px;right:116px}
  .s2{width:7px;height:7px;top:24px;right:12px}
  .s3{width:9px;height:9px;bottom:20px;right:14px}
  .row{position:relative;display:flex;padding:14px 8px 14px 16px}
  .left{flex:1 1 auto;min-width:0}
  .head{display:flex;align-items:center;height:38px}
  .flame{width:30px;height:30px;display:block;margin-right:6px;flex:none;
    filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.2))}
  .streak{font-size:31px;font-weight:900;color:${lit ? "#FFD66B" : "#fff"};letter-spacing:-.4px;
    line-height:1;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.22)}
  .msg{margin-top:8px;font-size:15px;font-weight:500;color:rgba(255,255,255,.92);line-height:18px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,.18)}
  .strip{margin-top:14px}
  .labels{display:flex}
  .labels span{width:34px;text-align:center;font-size:13px;line-height:15px;
    color:rgba(255,255,255,.78);white-space:nowrap}
  .labels span.now{color:#fff;font-weight:700}
  .marks{position:relative;height:28px;margin-top:5px;width:${days.length * 34}px}
  .links{position:absolute;left:17px;top:0;display:flex}
  .link{width:34px;height:28px}
  .link.on{background:#F2874E}
  .dots{position:absolute;inset:0;display:flex}
  .dot{width:28px;height:28px;margin:0 3px;flex:none;position:relative;box-sizing:border-box}
  .met{background:#F2874E;border-radius:50%}
  .todo{background:rgba(0,0,0,.20);border-radius:50%}
  .today{background:rgba(255,255,255,.14);border:2.4px solid rgba(255,255,255,.92);border-radius:50%}
  .tick{position:absolute;inset:0}
  .mascot{width:116px;flex:none;object-fit:contain;margin-top:6px;align-self:stretch;
    min-height:0;height:auto;max-height:140px}
</style>
<div class="cell"><div class="card">
  <div class="sheen"></div>
  ${sparkle("s1")}${sparkle("s2")}${sparkle("s3")}
  <div class="row">
    <div class="left">
      <div class="head">${flame}<div class="streak">${streak}</div></div>
      <div class="msg">${message}</div>
      <div class="strip">
        <div class="labels">${days.map((d, i) =>
          `<span class="${i === last ? "now" : ""}">${d[0]}</span>`).join("")}</div>
        <div class="marks">
          <div class="links">${days.slice(0, -1).map((d, i) =>
            `<div class="link ${met(d) && met(days[i + 1]) ? "on" : ""}"></div>`).join("")}</div>
          <div class="dots">${days.map((d, i) => d[1] === "f"
            ? `<div class="dot">${pin}</div>`
            : met(d) ? `<div class="dot met">${tick}</div>`
            : `<div class="dot ${i === last ? "today" : "todo"}"></div>`).join("")}</div>
        </div>
      </div>
    </div>
    <img class="mascot" src="${mascotSrc}">
  </div>
</div></div>`;

const page = join(mkdtempSync(join(tmpdir(), "widget-mockup-")), "card.html");
writeFileSync(page, html);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const tab = await browser.newPage();
await tab.setViewport({ width: W + 20, height: H + 20, deviceScaleFactor: 3 });
await tab.goto(`file://${page}`);
await tab.screenshot({ path: out });
await browser.close();
console.log(`${out}  (${W}x${H}dp, ${mood}, ${mascot})`);
