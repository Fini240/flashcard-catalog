import { describe, it, expect } from "vitest";
import { parseBackup, buildBackupPayload } from "./backup";
import { emptyGame } from "./gamification";

const subject = { id: "s1", name: "Biology", children: [], speech: { frontLang: "de-DE" } };
const card = { id: "c1", subjectId: "s1", nodeId: "s1", front: "Frage", back: "Antwort", fsrsReps: 12, srsDue: 1234 };
const parse = data => parseBackup(JSON.stringify(data));

describe("backup validation", () => {
  it("round trips a current backup with schedules, images and pronunciation settings", () => {
    const payload = buildBackupPayload({ subjects: [subject], cards: [{ ...card, frontImageId: "pic", tags: ["prüfung"] }], game: emptyGame() });
    const result = parse(payload);
    expect(result.ok).toBe(true);
    expect(result.backup.subjects).toEqual(payload.subjects);
    expect(result.backup.cards).toEqual(payload.cards);
    expect(result.backup.game).toEqual(payload.game);
  });
  it("accepts untagged legacy categories and legacy card locations", () => {
    expect(parse({ subjects: [{ id: "s1", name: "Biology", categories: [{ id: "n1", name: "Cells" }] }], cards: [{ ...card, nodeId: undefined, categoryId: "n1" }] }).ok).toBe(true);
  });
  it("allows empty catalogs and raw cards-only recovery files", () => {
    expect(parse({ subjects: [], cards: [] }).ok).toBe(true);
    expect(parse({ cards: [card] }).ok).toBe(true);
  });
  it.each([
    { subjects: [], cards: [null] },
    { subjects: [null], cards: [card] },
    { subjects: [{ ...subject, children: [null] }], cards: [card] },
    { subjects: [{ ...subject, children: "broken" }], cards: [card] },
    { subjects: "broken", cards: [card] },
    { subjects: [subject], cards: "broken" },
    { subjects: [subject], cards: [{ ...card, front: {} }] },
    { subjects: [subject], cards: [{ ...card, tags: [null] }] },
    { subjects: [subject], cards: [card, card] },
    { subjects: [subject, subject], cards: [card] },
    { subjects: [subject], cards: [card], game: { reviewLog: [null] } },
    { subjects: [subject], cards: [card], game: { quests: [null] } },
    { subjects: [subject], cards: [card], game: { history: { today: null } } },
    { subjects: [subject], cards: [card], game: "broken" },
  ])("rejects malformed catalog data before it can reach app state: %j", data => {
    expect(parse(data).ok).toBe(false);
  });
});
