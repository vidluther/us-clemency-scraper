import { describe, it, expect } from "vitest";
import {
  parseSentence,
  type ParsedSentenceComponents,
} from "../src/parsers/sentences.js";

describe("parseSentence", () => {
  it("extracts restitution amount", () => {
    const results = parseSentence(
      "$36,769,153.97 restitution (January 6, 2025) for Ozy Media Inc",
    );
    expect(results).toHaveLength(1);
    expect(results[0].restitution).toBe(36769153.97);
    expect(results[0].fine).toBeNull();
    expect(results[0].sentence_in_months).toBeNull();
  });

  it("extracts imprisonment months", () => {
    const results = parseSentence("135 months' imprisonment");
    expect(results).toHaveLength(1);
    expect(results[0].sentence_in_months).toBe(135);
  });

  it("extracts imprisonment years and converts to months", () => {
    const results = parseSentence("10 years' imprisonment");
    expect(results).toHaveLength(1);
    expect(results[0].sentence_in_months).toBe(120);
  });

  it("extracts written years", () => {
    const results = parseSentence("Two years' imprisonment");
    expect(results).toHaveLength(1);
    expect(results[0].sentence_in_months).toBe(24);
  });

  it("extracts large fine amount", () => {
    const results = parseSentence(
      "Two years' unsupervised probation, $100,000,000 fine (January 15, 2025)",
    );
    expect(results).toHaveLength(1);
    expect(results[0].fine).toBe(100000000);
    expect(results[0].restitution).toBeNull();
    expect(results[0].sentence_in_months).toBeNull();
  });

  it("extracts both restitution and fine from complex sentence", () => {
    const results = parseSentence(
      "1. 135 months' imprisonment; three years' supervised release; $37,032,337.43 restitution (as amended June 5, 2017) (February 15, 2017)",
    );
    expect(results).toHaveLength(1);
    expect(results[0].sentence_in_months).toBe(135);
    expect(results[0].restitution).toBe(37032337.43);
    expect(results[0].fine).toBeNull();
  });

  it("parses multiple counts", () => {
    const text =
      "1. 135 months' imprisonment; three years' supervised release; $37,032,337.43 restitution. " +
      "2. 173 months' imprisonment, with 60 months consecutive; three years' supervised release (concurrent); $47,785,176 restitution";

    const results = parseSentence(text);

    expect(results).toHaveLength(2);
    expect(results[0].sentence_in_months).toBe(135);
    expect(results[0].restitution).toBe(37032337.43);

    expect(results[1].sentence_in_months).toBe(173);
    expect(results[1].restitution).toBe(47785176);
  });

  it("handles single count without numbering", () => {
    const text = "$36,769,153.97 restitution (January 6, 2025)";
    const results = parseSentence(text);

    expect(results).toHaveLength(1);
    expect(results[0].restitution).toBe(36769153.97);
  });

  it("handles empty string", () => {
    const results = parseSentence("");
    expect(results).toHaveLength(0);
  });

  it("handles null", () => {
    const results = parseSentence(null as unknown as string);
    expect(results).toHaveLength(0);
  });
});
