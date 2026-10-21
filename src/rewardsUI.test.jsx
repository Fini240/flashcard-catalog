// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { RewardsModal } from "./rewardsUI";
import { SessionReward } from "./gameUI";
import * as G from "./gamification";
import * as R from "./rewards";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });

const render = async (el) => { await act(async () => root.render(el)); };
const buttons = () => [...document.body.querySelectorAll("button")];
const press = async (text) => {
  const b = buttons().find((x) => x.textContent.includes(text));
  if (!b) throw new Error(`No button "${text}" in: ${buttons().map((x) => x.textContent).join(" | ")}`);
  await act(async () => b.click());
};

// The real handlers from FlashcardCatalog, minus sync side effects.
function Harness({ initial }) {
  const [game, setGame] = useState(initial);
  return (
    <RewardsModal
      game={game}
      onClose={() => {}}
      onOpenChest={(id) => { const r = R.openChest(game, id); setGame(r.game); return r.opened; }}
      onBuy={(id) => { const r = R.buy(game, id); if (r.ok) setGame(r.game); return r; }}
      onBuyEmoji={(e) => { const r = R.buyEmoji(game, e); if (r.ok) setGame(r.game); return r; }}
    />
  );
}

it("opens a chest, reveals its gems and adds them to the balance", async () => {
  const chest = { id: "daily:2026-10-21", kind: "daily", at: "2026-10-21" };
  const expected = R.rollChest(chest).gems;
  await render(<Harness initial={{ ...G.emptyGame(), chests: [chest] }} />);
  expect(host.textContent).toContain("Chests to open (1)");
  await press("Daily chest");
  // Opened in state at once, revealed after the shake.
  expect(host.textContent).toContain(String(expected));
  await act(async () => { vi.advanceTimersByTime(2000); });
  await press("Collect");
  expect(host.textContent).not.toContain("Chests to open");
  expect(document.querySelector(".fc-chest-stage")).toBeNull();
});

it("disables what can't be afforded and buys what can", async () => {
  await render(<Harness initial={{ ...G.emptyGame(), gems: 160, freezes: 3 }} />);
  const freeze = () => buttons().find(b => b.textContent.includes("150"));
  const boost = () => buttons().find(b => b.textContent.trim().endsWith("60"));
  expect(freeze().disabled).toBe(false);
  await act(async () => freeze().click());
  expect(host.textContent).toContain("Streak freeze bought.");
  expect(host.textContent).toContain("Banked: 4.");
  expect(boost().disabled).toBe(true); // 10 gems left
  // Repair only shows when there is a streak to repair.
  expect(host.textContent).not.toContain("Streak repair");
});

it("shows earned chests on the session reward screen", async () => {
  const onOpen = vi.fn();
  const award = { answered: 10, correct: 10, levelUps: 0, base: 30, bonus: 15, goalBonus: 0, questXp: 0, boostXp: 30, total: 75,
    perfect: true, streak: 3, streakUp: true, freezeEarned: false, levelUp: null, questsDone: [], newAchievements: [],
    goalMet: true, habitMet: true, cardsToday: 20, goalCards: 20, chests: [{ id: "x", kind: "perfect" }] };
  await render(<SessionReward award={award} game={G.emptyGame()} onDone={() => {}} onOpenRewards={onOpen} />);
  expect(host.textContent).toContain("Double XP boost");
  expect(host.textContent).toContain("Flawless chest earned!");
  await press("Flawless chest");
  expect(onOpen).toHaveBeenCalled();
});
