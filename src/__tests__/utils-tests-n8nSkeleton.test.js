import { describe, it, expect } from "vitest";
import { matchN8nNodeType, buildN8nSkeleton } from "../n8nSkeleton.js";

describe("matchN8nNodeType", () => {
  it("matches Google Sheets from 'sheet' keyword", () => {
    expect(matchN8nNodeType("Add row to Google Sheet")).toBe("n8n-nodes-base.googleSheets");
  });

  it("matches Slack", () => {
    expect(matchN8nNodeType("Notify assistant via Slack")).toBe("n8n-nodes-base.slack");
  });

  it("matches email variants", () => {
    expect(matchN8nNodeType("Send a confirmation email")).toBe("n8n-nodes-base.emailSend");
    expect(matchN8nNodeType("Send via Gmail")).toBe("n8n-nodes-base.emailSend");
  });

  it("falls back to a generic placeholder for unrecognized text, rather than guessing", () => {
    expect(matchN8nNodeType("Extract ticket details")).toBe("n8n-nodes-base.noOp");
    expect(matchN8nNodeType("")).toBe("n8n-nodes-base.noOp");
    expect(matchN8nNodeType(undefined)).toBe("n8n-nodes-base.noOp");
  });

  it("does not false-positive-match ordinary words that merely contain the letters 'ai' (regression: 'details', 'maintain', 'again' previously mismatched to the AI node)", () => {
    expect(matchN8nNodeType("Extract ticket details")).not.toBe("n8n-nodes-base.openAi");
    expect(matchN8nNodeType("Maintain a record of the request")).not.toBe("n8n-nodes-base.openAi");
    expect(matchN8nNodeType("Try again if it fails")).not.toBe("n8n-nodes-base.openAi");
  });

  it("still correctly matches genuine AI-related action text", () => {
    expect(matchN8nNodeType("Use AI to summarize common complaints")).toBe("n8n-nodes-base.openAi");
    expect(matchN8nNodeType("AI step classifies the topic")).toBe("n8n-nodes-base.openAi");
    expect(matchN8nNodeType("Categorize the cancellation reason")).toBe("n8n-nodes-base.openAi");
  });

  it("is case-insensitive", () => {
    expect(matchN8nNodeType("POST TO SLACK CHANNEL")).toBe("n8n-nodes-base.slack");
  });
});

describe("buildN8nSkeleton", () => {
  it("builds a linear workflow with the right node count and order", () => {
    const result = {
      trigger: { description: "New form submission", type: "webhook" },
      actions: [{ step: "Add row to spreadsheet" }, { step: "Notify via Slack" }],
      conditions: [],
    };
    const skeleton = buildN8nSkeleton(result);

    expect(skeleton.nodes).toHaveLength(3); // trigger + 2 actions
    expect(skeleton.nodes[0].type).toBe("n8n-nodes-base.webhook");
    expect(skeleton.connections[skeleton.nodes[0].name]).toBeDefined();
    // linear chain: trigger -> action1 -> action2
    expect(skeleton.connections[skeleton.nodes[0].name].main[0][0].node).toBe(skeleton.nodes[1].name);
    expect(skeleton.connections[skeleton.nodes[1].name].main[0][0].node).toBe(skeleton.nodes[2].name);
  });

  it("uses the schedule trigger type for polling triggers", () => {
    const result = { trigger: { description: "Every Monday", type: "polling" }, actions: [], conditions: [] };
    const skeleton = buildN8nSkeleton(result);
    expect(skeleton.nodes[0].type).toBe("n8n-nodes-base.scheduleTrigger");
  });

  it("builds a correctly-branched IF node with both paths wired to separate outputs", () => {
    const result = {
      trigger: { description: "New support ticket", type: "webhook" },
      actions: [{ step: "Extract ticket details" }],
      conditions: [{ logic: "Is it urgent?", pathIfTrue: "Text the on-call person", pathIfFalse: "Add to review sheet" }],
    };
    const skeleton = buildN8nSkeleton(result);

    // trigger + 1 pre-action + if node + 2 branch nodes = 5
    expect(skeleton.nodes).toHaveLength(5);

    const ifNode = skeleton.nodes.find((n) => n.type === "n8n-nodes-base.if");
    expect(ifNode).toBeDefined();

    const ifConnections = skeleton.connections[ifNode.name];
    expect(ifConnections.main[0]).toHaveLength(1); // true branch
    expect(ifConnections.main[1]).toHaveLength(1); // false branch
    // true and false branches must go to two DIFFERENT nodes
    expect(ifConnections.main[0][0].node).not.toBe(ifConnections.main[1][0].node);
  });

  it("gives every node a draft/verify note", () => {
    const result = { trigger: { description: "Trigger", type: "webhook" }, actions: [{ step: "Do a thing" }], conditions: [] };
    const skeleton = buildN8nSkeleton(result);
    for (const node of skeleton.nodes) {
      expect(node.notes).toMatch(/draft|verify/i);
    }
  });

  it("deduplicates node names so connections never collide", () => {
    const result = {
      trigger: { description: "Trigger", type: "webhook" },
      actions: [{ step: "Notify assistant via Slack" }, { step: "Notify assistant via Slack" }],
      conditions: [],
    };
    const skeleton = buildN8nSkeleton(result);
    const names = skeleton.nodes.map((n) => n.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length); // no duplicate names
    expect(names).toContain("Notify assistant via Slack");
    expect(names).toContain("Notify assistant via Slack (2)");
  });

  it("handles a plan with an empty actions array without throwing", () => {
    const result = { trigger: { description: "Trigger", type: "webhook" }, actions: [], conditions: [] };
    expect(() => buildN8nSkeleton(result)).not.toThrow();
  });

  it("handles missing/undefined fields gracefully (sanitizeResult may not always run first)", () => {
    expect(() => buildN8nSkeleton({})).not.toThrow();
  });

  it("always includes a meta note flagging the workflow as an unverified draft", () => {
    const skeleton = buildN8nSkeleton({ trigger: {}, actions: [], conditions: [] });
    expect(skeleton.meta.note).toMatch(/unverified|draft/i);
    expect(skeleton.active).toBe(false);
  });
});
