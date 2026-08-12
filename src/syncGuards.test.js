import { describe, it, expect } from "vitest";
import { refusesParentPush, refusesLegacyPush } from "./syncGuards";

const tree = [{ id: "s1", name: "Biology", children: [] }, { id: "s2", name: "¡Adelante 1!", children: [] }];

describe("refusesParentPush", () => {
  // 2026-08-12: a phone opened the web app, signed in, and pushed its own
  // empty subject tree over an account holding two subjects and 3034 XP.
  it("refuses an empty tree from a session that never read the account", () => {
    expect(refusesParentPush({ subjects: [], adopted: false, remote: { subjects: tree } })).toBe(true);
  });

  it("allows the same write once the session has adopted the account", () => {
    expect(refusesParentPush({ subjects: [], adopted: true, remote: { subjects: tree } })).toBe(false);
  });

  it("allows a first push when the server has nothing to lose", () => {
    expect(refusesParentPush({ subjects: [], adopted: false, remote: { subjects: [] } })).toBe(false);
    expect(refusesParentPush({ subjects: [], adopted: false, remote: null })).toBe(false);
  });

  it("allows a push that doesn't shrink the tree", () => {
    expect(refusesParentPush({ subjects: tree, adopted: false, remote: { subjects: tree } })).toBe(false);
    expect(refusesParentPush({ subjects: [...tree, { id: "s3" }], adopted: false, remote: { subjects: tree } })).toBe(false);
  });

  // The guard is about *nothing over something*, not about every shrink: a
  // deliberate delete happens on an adopted session, which is covered above.
  it("does not care about a partial shrink from an unadopted session", () => {
    expect(refusesParentPush({ subjects: [tree[0]], adopted: false, remote: { subjects: tree } })).toBe(true);
  });
});

describe("refusesLegacyPush", () => {
  const remote = { subjects: tree, cards: [{ id: "k1" }, { id: "k2" }] };

  it("refuses a whole-document overwrite with nothing", () => {
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [] }, adopted: false, remote })).toBe(true);
  });

  it("allows it once the session has adopted", () => {
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [] }, adopted: true, remote })).toBe(false);
  });

  it("allows a payload that still carries cards", () => {
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [{ id: "k1" }] }, adopted: false, remote })).toBe(false);
  });

  it("allows the first write to an account with no document yet", () => {
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [] }, adopted: false, remote: null })).toBe(false);
    expect(refusesLegacyPush({ payload: { subjects: [], cards: [] }, adopted: false, remote: { subjects: [], cards: [] } })).toBe(false);
  });
});
