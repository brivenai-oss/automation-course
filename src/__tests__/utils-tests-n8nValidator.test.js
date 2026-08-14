import { describe, it, expect } from "vitest";
import { validateN8nExport } from "../n8nValidator.js";

const easy = { minActions: 1, conditionRequired: false };
const branching = { minActions: 0, conditionRequired: true, branchTrueMin: 1, branchFalseMin: 1 };

describe("validateN8nExport", () => {
  it("passes a valid simple workflow (trigger + required actions)", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook" },
        { name: "Add Row", type: "n8n-nodes-base.googleSheets" },
      ],
      connections: {},
    });
    expect(validateN8nExport(json, easy).ok).toBe(true);
  });

  it("fails on malformed JSON", () => {
    const result = validateN8nExport("{not valid json", easy);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/valid JSON/i);
  });

  it("fails when there's no nodes array at all", () => {
    const result = validateN8nExport(JSON.stringify({ foo: "bar" }), easy);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/n8n workflow export/i);
  });

  it("fails when there's no trigger node", () => {
    const json = JSON.stringify({ nodes: [{ name: "Add Row", type: "n8n-nodes-base.googleSheets" }], connections: {} });
    const result = validateN8nExport(json, easy);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/trigger/i);
  });

  it("fails when there aren't enough action nodes", () => {
    const json = JSON.stringify({
      nodes: [{ name: "Webhook", type: "n8n-nodes-base.webhook" }, { name: "Add Row", type: "n8n-nodes-base.googleSheets" }],
      connections: {},
    });
    const result = validateN8nExport(json, { minActions: 2, conditionRequired: false });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/action node/i);
  });

  it("fails when a condition is required but missing", () => {
    const json = JSON.stringify({
      nodes: [{ name: "Webhook", type: "n8n-nodes-base.webhook" }, { name: "Text", type: "n8n-nodes-base.twilio" }],
      connections: {},
    });
    const result = validateN8nExport(json, branching);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/branches|condition/i);
  });

  it("fails when an unnecessary IF node is present", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook" },
        { name: "Check", type: "n8n-nodes-base.if" },
        { name: "Action", type: "n8n-nodes-base.slack" },
      ],
      connections: {},
    });
    const result = validateN8nExport(json, easy);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/doesn't actually need/i);
  });

  it("passes a correctly-branched workflow with both paths populated", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook" },
        { name: "Check Value", type: "n8n-nodes-base.if" },
        { name: "Text Owner", type: "n8n-nodes-base.twilio" },
        { name: "Log Sheet", type: "n8n-nodes-base.googleSheets" },
      ],
      connections: {
        "Check Value": {
          main: [[{ node: "Text Owner", type: "main", index: 0 }], [{ node: "Log Sheet", type: "main", index: 0 }]],
        },
      },
    });
    expect(validateN8nExport(json, branching).ok).toBe(true);
  });

  it("fails when the false branch is under-populated", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook" },
        { name: "Check Value", type: "n8n-nodes-base.if" },
        { name: "Text Owner", type: "n8n-nodes-base.twilio" },
      ],
      connections: { "Check Value": { main: [[{ node: "Text Owner", type: "main", index: 0 }], []] } },
    });
    const result = validateN8nExport(json, branching);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/false.*output/i);
  });

  it("fails when the true branch is under-populated", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook" },
        { name: "Check Value", type: "n8n-nodes-base.if" },
        { name: "Log Sheet", type: "n8n-nodes-base.googleSheets" },
      ],
      connections: { "Check Value": { main: [[], [{ node: "Log Sheet", type: "main", index: 0 }]] } },
    });
    const result = validateN8nExport(json, branching);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/true.*output/i);
  });

  it("does not count sticky notes as action nodes", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook" },
        { name: "Note", type: "n8n-nodes-base.stickyNote" },
        { name: "Add Row", type: "n8n-nodes-base.googleSheets" },
      ],
      connections: {},
    });
    expect(validateN8nExport(json, easy).ok).toBe(true);
  });

  it("recognizes app-specific trigger node types (not just the generic 'webhook')", () => {
    const json = JSON.stringify({
      nodes: [
        { name: "Gmail Trigger", type: "n8n-nodes-base.gmailTrigger" },
        { name: "Add Row", type: "n8n-nodes-base.googleSheets" },
      ],
      connections: {},
    });
    expect(validateN8nExport(json, easy).ok).toBe(true);
  });

  it("recognizes cron/schedule triggers for polling scenarios", () => {
    const json = JSON.stringify({
      nodes: [{ name: "Every Monday", type: "n8n-nodes-base.scheduleTrigger" }, { name: "Pull Data", type: "n8n-nodes-base.httpRequest" }],
      connections: {},
    });
    expect(validateN8nExport(json, easy).ok).toBe(true);
  });

  it("does not throw on a completely empty nodes array", () => {
    const json = JSON.stringify({ nodes: [], connections: {} });
    expect(() => validateN8nExport(json, easy)).not.toThrow();
    expect(validateN8nExport(json, easy).ok).toBe(false);
  });
});
