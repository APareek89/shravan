import { describe, expect, it } from "vitest";
import {
  canUseScamModel,
  containsDistress,
  maxRisk,
  scamRuleRisk,
} from "@/lib/safety";

describe("deterministic safety layer", () => {
  it("flags the demo customs and police message as high risk", () => {
    expect(
      scamRuleRisk(
        "Aapka parcel customs me pakda gaya hai, police case se bachne ke liye is number par call karein",
      ),
    ).toBe("HIGH");
  });

  it("never lets the model lower deterministic risk", () => {
    expect(maxRisk("HIGH", "LOW")).toBe("HIGH");
    expect(maxRisk("SUSPICIOUS", "LOW")).toBe("SUSPICIOUS");
  });

  it("detects Hindi and English distress phrases", () => {
    expect(containsDistress("I fell and have chest pain")).toBe(true);
    expect(containsDistress("मेरे सीने में दर्द है")).toBe(true);
    expect(containsDistress("आज मौसम अच्छा है")).toBe(false);
  });

  it("stops scam-model calls at the daily cap", () => {
    expect(canUseScamModel(19, 20)).toBe(true);
    expect(canUseScamModel(20, 20)).toBe(false);
  });
});
