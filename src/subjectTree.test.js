import { describe, expect, it } from "vitest";
import { migrateSubjects } from "./subjectTree";

describe("subject upgrades preserve pronunciation settings", () => {
  it("retains per-side languages, voice preferences and speed through repeated loads", () => {
    const speech = { enabled: false, frontLang: "es-ES", backLang: "de-DE", frontVoice: "Spanish", rate: 0.8 };
    const subjects = [{ id: "s", name: "Spanish", speech,
      children: [{ id: "folder", name: "Unit 1", speech: { frontLang: "es-MX" }, children: [] }] }];
    expect(migrateSubjects(migrateSubjects(subjects))).toEqual(subjects);
    expect(subjects[0].speech).toEqual(speech);
  });
  it("upgrades nested legacy categories while retaining settings and other metadata", () => {
    const raw = [{ id: "s", name: "Spanish", speech: { backLang: "de-DE" }, color: "gold",
      categories: [{ id: "f", name: "Unit", categories: [] }] }];
    expect(migrateSubjects(raw)).toEqual([{ id: "s", name: "Spanish", speech: { backLang: "de-DE" }, color: "gold",
      children: [{ id: "f", name: "Unit", children: [] }] }]);
    expect(raw[0].categories).toHaveLength(1);
  });
});
