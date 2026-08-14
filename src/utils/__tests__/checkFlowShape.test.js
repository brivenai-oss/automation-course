import { describe, it, expect } from "vitest";
import { checkFlowShape } from "../checkFlowShape.js";

const emptyBuilt = { trigger: false, mainActions: [], condition: false, pathA: [], pathB: [] };

describe("checkFlowShape", () => {
  it("requires a trigger before anything else", () => {
    const result = checkFlowShape(emptyBuilt, { preActions: 0, condition: false }, "Nice.");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/Trigger/);
  });

  it("passes a simple linear shape that exactly matches expected action count", () => {
    const built = { trigger: true, mainActions: ["a", "b"], condition: false, pathA: [], pathB: [] };
    const result = checkFlowShape(built, { preActions: 2, condition: false }, "Correct!");
    expect(result.correct).toBe(true);
    expect(result.message).toBe("Correct!");
  });

  it("fails when too few actions are present", () => {
    const built = { trigger: true, mainActions: ["a"], condition: false, pathA: [], pathB: [] };
    const result = checkFlowShape(built, { preActions: 2, condition: false }, "Correct!");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/missing at least one/i);
  });

  it("fails when too many actions are present", () => {
    const built = { trigger: true, mainActions: ["a", "b", "c"], condition: false, pathA: [], pathB: [] };
    const result = checkFlowShape(built, { preActions: 2, condition: false }, "Correct!");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/more actions than/i);
  });

  it("fails when a condition is required but missing", () => {
    const built = { trigger: true, mainActions: [], condition: false, pathA: [], pathB: [] };
    const result = checkFlowShape(built, { preActions: 0, condition: true, pathA: 1, pathB: 1 }, "Correct!");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/Condition box/);
  });

  it("fails when a condition is present but not needed", () => {
    const built = { trigger: true, mainActions: [], condition: true, pathA: ["x"], pathB: ["y"] };
    const result = checkFlowShape(built, { preActions: 0, condition: false }, "Correct!");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/doesn't branch/);
  });

  it("passes a correctly-branched shape with matching pre-actions and both paths correct", () => {
    const built = { trigger: true, mainActions: ["log"], condition: true, pathA: ["a1", "a2"], pathB: ["b1"] };
    const result = checkFlowShape(built, { preActions: 1, condition: true, pathA: 2, pathB: 1 }, "Nailed it.");
    expect(result.correct).toBe(true);
    expect(result.message).toBe("Nailed it.");
  });

  it("distinguishes pre-branch action mismatches from post-branch ones in the message", () => {
    const built = { trigger: true, mainActions: [], condition: true, pathA: ["a"], pathB: ["b"] };
    const result = checkFlowShape(built, { preActions: 1, condition: true, pathA: 1, pathB: 1 }, "x");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/before the branch/i);
  });

  it("fails specifically on Path A being wrong, distinct from Path B", () => {
    const built = { trigger: true, mainActions: [], condition: true, pathA: [], pathB: ["b"] };
    const result = checkFlowShape(built, { preActions: 0, condition: true, pathA: 1, pathB: 1 }, "x");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/Path A/);
  });

  it("fails specifically on Path B being wrong, distinct from Path A", () => {
    const built = { trigger: true, mainActions: [], condition: true, pathA: ["a"], pathB: [] };
    const result = checkFlowShape(built, { preActions: 0, condition: true, pathA: 1, pathB: 1 }, "x");
    expect(result.correct).toBe(false);
    expect(result.message).toMatch(/Path B/);
  });

  it("matches the certification test's real conditional-routing scenario shape", () => {
    // Mirrors CERT_FLOW_EXERCISE from App.jsx: 1 pre-action, condition with 1 action each side
    const expected = { preActions: 1, condition: true, pathA: 1, pathB: 1 };
    const correctlyBuilt = { trigger: true, mainActions: ["Log to tracker"], condition: true, pathA: ["Text on-call"], pathB: ["Add to queue"] };
    expect(checkFlowShape(correctlyBuilt, expected, "Pass").correct).toBe(true);

    const wronglyBuilt = { trigger: true, mainActions: [], condition: true, pathA: ["Text on-call"], pathB: ["Add to queue"] };
    expect(checkFlowShape(wronglyBuilt, expected, "Pass").correct).toBe(false);
  });
});
