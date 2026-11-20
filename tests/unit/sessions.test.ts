import { describe, it, expect } from "vitest";
import { isParticipant } from "@/lib/services/sessions";

const session = {
  request: { authorId: "auteur-1" },
  proposal: { helperId: "aidant-2" },
};

describe("participants d'une séance", () => {
  it("l'auteur de la demande est participant", () => {
    expect(isParticipant(session, "auteur-1")).toBe(true);
  });
  it("l'aidant accepté est participant", () => {
    expect(isParticipant(session, "aidant-2")).toBe(true);
  });
  it("un tiers n'est PAS participant (évaluation interdite)", () => {
    expect(isParticipant(session, "intrus-3")).toBe(false);
  });
});
