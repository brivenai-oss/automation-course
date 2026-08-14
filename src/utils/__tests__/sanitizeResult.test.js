import { describe, it, expect } from "vitest";
import { sanitizeResult } from "../sanitizeResult.js";

describe("sanitizeResult", () => {
  it("passes through a well-formed response unchanged (aside from adding _raw)", () => {
    const good = {
      patterns: ["Lead capture & notification"],
      patternExplanation: "Because reasons.",
      tool: "Make.com",
      toolReason: "No hosting needed.",
      trigger: { description: "New form", type: "webhook", reason: "Instant." },
      actions: [{ step: "Add row", dataMapping: "Map fields." }],
      conditions: [],
      errorHandling: ["Add a fallback path."],
      edgeCase: "Test with a blank field.",
    };
    const result = sanitizeResult(good);
    expect(result.patterns).toEqual(["Lead capture & notification"]);
    expect(result.tool).toBe("Make.com");
    expect(result.actions).toHaveLength(1);
    expect(result._raw).toBe(good);
  });

  it("never throws, no matter what garbage is passed in", () => {
    const garbageInputs = [
      null,
      undefined,
      {},
      [],
      "just a string",
      42,
      { patterns: "not an array" },
      { actions: "not an array" },
      { actions: [null, undefined, "string", 42, { step: 123 }] },
      { conditions: "not an array" },
      { conditions: [null, { logic: 123, pathIfTrue: null }] },
      { trigger: null },
      { trigger: "not an object" },
      { trigger: { type: "some-invalid-type" } },
      { errorHandling: [1, 2, null, "valid string"] },
    ];
    for (const input of garbageInputs) {
      expect(() => sanitizeResult(input)).not.toThrow();
    }
  });

  it("defaults trigger.type to webhook unless it's exactly 'polling'", () => {
    expect(sanitizeResult({ trigger: { type: "polling" } }).trigger.type).toBe("polling");
    expect(sanitizeResult({ trigger: { type: "webhook" } }).trigger.type).toBe("webhook");
    expect(sanitizeResult({ trigger: { type: "something-else" } }).trigger.type).toBe("webhook");
    expect(sanitizeResult({ trigger: {} }).trigger.type).toBe("webhook");
  });

  it("filters out non-object entries from actions and coerces bad fields to safe strings", () => {
    const result = sanitizeResult({ actions: [{ step: "Real action", dataMapping: "Map it" }, null, "garbage", 42, { step: 123, dataMapping: null }] });
    expect(result.actions).toHaveLength(2); // the real one + the malformed-but-object one
    expect(result.actions[0].step).toBe("Real action");
    expect(result.actions[1].step).toBe("Action"); // fallback since original was not a string
    expect(result.actions[1].dataMapping).toBe("");
  });

  it("filters non-string entries out of patterns and errorHandling arrays", () => {
    const result = sanitizeResult({ patterns: ["Valid pattern", 42, null, "Another valid"], errorHandling: ["Valid", 99, undefined] });
    expect(result.patterns).toEqual(["Valid pattern", "Another valid"]);
    expect(result.errorHandling).toEqual(["Valid"]);
  });

  it("coerces malformed condition objects to safe defaults instead of dropping the branch entirely", () => {
    const result = sanitizeResult({ conditions: [{ logic: 123, pathIfTrue: null, pathIfFalse: undefined }] });
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].logic).toBe("Condition");
    expect(result.conditions[0].pathIfTrue).toBe("");
    expect(result.conditions[0].pathIfFalse).toBe("");
  });

  it("always returns every expected top-level field, even from a totally empty input", () => {
    const result = sanitizeResult({});
    expect(result).toHaveProperty("patterns");
    expect(result).toHaveProperty("patternExplanation");
    expect(result).toHaveProperty("tool");
    expect(result).toHaveProperty("toolReason");
    expect(result).toHaveProperty("trigger");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("conditions");
    expect(result).toHaveProperty("errorHandling");
    expect(result).toHaveProperty("edgeCase");
    expect(Array.isArray(result.patterns)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.conditions)).toBe(true);
    expect(Array.isArray(result.errorHandling)).toBe(true);
  });
});
