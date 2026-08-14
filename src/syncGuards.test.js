import { describe, it, expect } from "vitest";
import { refusesParentPush, refusesLegacyPush, shouldHealFromRemote } from "./syncGuards";

const tree = [{ id: "s1", name: "Biology", children: [] }, { id: "s2", name: "¡Adelante 1!", children: [] }];
const remote = { subjects: tree, cards: [{ id: "k1" }, { id: "k2" }] };

describe("refusesParentPush", () => {
  // 2026-08-12, 09:08 UTC: a phone opened the web app, signed in, and wrote
  // its own empty subject tree over an account holding two subjects.
  it("refuses an empty tree from a client that didn't empty it", () => {
    expect(refusesParentPush({ subjects: [], remote, emptiedLocally: false })).toBe(true);
  });

  // 11:25 UTC the same day: the same client, now with the wipe cached in its
  // own localStorage, did it again — and the first version of this guard let
  // it through, because that client *had* read the account. Holding an empty
  // tree is not permission to publish one, however you came to hold it.
  it("still refuses when the emptiness is what the client woke up holding", () => {
    expect(refusesParentPush({ subjects: [], remote, emptiedLocally: false })).toBe(true);
  });

  it("allows a delete the person actually made here", () => {
    expect(refusesParentPush({ subjects: [], remote, emptiedLocally: true })).toBe(false);
  });

  it("allows a first push when the server has nothing to lose", () => {
    expect(refusesParentPush({ subjects: [], remote: { subjects: [] }, emptiedLocally: false })).toBe(false);
    expect(refusesParentPush({ subjects: [], remote: null, emptiedLocally: false })).toBe(false);
  });

  it("never stands in the way of a push that carries subjects", () => {
    expect(refusesParentPush({ subjects: tree, remote, emptiedLocally: false })).toBe(false);
    expect(refusesParentPush({ subjects: [tree[0]], remote, emptiedLocally: false })).toBe(false);
  });
});

describe("refusesLegacyPush", () => {
  it("refuses a whole-document overwrite that drops the subject tree", () => {
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [{ id: "k1" }] }, remote, emptiedLocally: false })).toBe(true);
  });

  it("refuses one that drops the cards array", () => {
    expect(refusesLegacyPush({ payload: { subjects: tree, cards: [] }, remote, clearedCardsLocally: false })).toBe(true);
  });

  it("allows both when the person did them here", () => {
    expect(refusesLegacyPush({
      payload: { subjects: [], cards: [] }, remote,
      emptiedLocally: true, clearedCardsLocally: true,
    })).toBe(false);
  });

  it("allows the first write to an account with no document yet", () => {
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [] }, remote: null })).toBe(false);
  });
});

describe("shouldHealFromRemote", () => {
  // The repair path: a device that was wiped earlier is holding nothing and
  // carries the newer timestamp, so nothing else will ever hand it the truth.
  it("adopts a real catalog over an empty local one", () => {
    expect(shouldHealFromRemote({ subjects: [], remote, emptiedLocally: false })).toBe(true);
  });

  it("leaves a deliberate delete deleted", () => {
    expect(shouldHealFromRemote({ subjects: [], remote, emptiedLocally: true })).toBe(false);
  });

  it("does nothing when this device has subjects of its own", () => {
    expect(shouldHealFromRemote({ subjects: tree, remote, emptiedLocally: false })).toBe(false);
  });

  it("does nothing when the server is empty too", () => {
    expect(shouldHealFromRemote({ subjects: [], remote: { subjects: [] }, emptiedLocally: false })).toBe(false);
    expect(shouldHealFromRemote({ subjects: [], remote: null, emptiedLocally: false })).toBe(false);
  });
});
