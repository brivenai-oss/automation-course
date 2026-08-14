// n8n workflow skeleton generator (deterministic — no AI call).
// Deliberately NOT AI-generated: a small model inventing n8n's internal node "type"
// strings from scratch risks producing a file that won't import at all. Instead we
// keyword-match the plan's own text (already generated) against a small table of
// known-real n8n node types, and fall back to a clearly-marked placeholder node
// wherever we're not confident. Every node gets a "verify before running" note —
// this is a draft starting point, never presented as finished.

export const N8N_NODE_TYPE_MAP = [
  { keywords: ["sheet", "spreadsheet", "excel", "airtable"], type: "n8n-nodes-base.googleSheets" },
  { keywords: ["slack"], type: "n8n-nodes-base.slack" },
  { keywords: ["email", "gmail", "mail"], type: "n8n-nodes-base.emailSend" },
  { keywords: ["sms", "text message", "twilio"], type: "n8n-nodes-base.twilio" },
  { keywords: ["calendar", "event"], type: "n8n-nodes-base.googleCalendar" },
  { keywords: ["summar", "classif", "categor", "openai", "chatgpt", "gpt", "llm", "ai-powered", "ai step", "ai node", "use ai"], type: "n8n-nodes-base.openAi" },
  { keywords: ["crm", "hubspot", "salesforce", "invoice", "quickbooks", "stripe"], type: "n8n-nodes-base.httpRequest" },
];

export function matchN8nNodeType(label) {
  const lower = (label || "").toLowerCase();
  for (const entry of N8N_NODE_TYPE_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.type;
  }
  return "n8n-nodes-base.noOp";
}

export function buildN8nSkeleton(result) {
  const nodes = [];
  const connections = {};
  const usedNames = new Set();
  let x = 240;
  const y = 300;
  const stepX = 260;

  const uniqueName = (base) => {
    let name = base || "Step";
    let i = 2;
    while (usedNames.has(name)) {
      name = `${base} (${i})`;
      i++;
    }
    usedNames.add(name);
    return name;
  };

  const addNode = (label, type, position, note) => {
    const name = uniqueName(label);
    nodes.push({
      id: `node_${nodes.length + 1}`,
      name,
      type,
      typeVersion: 1,
      position,
      parameters: {},
      notes: note || "⚠️ Draft — verify field mappings, credentials, and this node's exact configuration before running.",
    });
    return name;
  };

  const connect = (fromName, toName, outputIndex = 0) => {
    if (!connections[fromName]) connections[fromName] = { main: [] };
    while (connections[fromName].main.length <= outputIndex) connections[fromName].main.push([]);
    connections[fromName].main[outputIndex].push({ node: toName, type: "main", index: 0 });
  };

  const triggerType = result.trigger?.type === "polling" ? "n8n-nodes-base.scheduleTrigger" : "n8n-nodes-base.webhook";
  let prevName = addNode(
    result.trigger?.description || "Trigger",
    triggerType,
    [x, y],
    "⚠️ Draft — connect this to the real trigger source and set up credentials before running."
  );
  x += stepX;

  (result.actions || []).forEach((a) => {
    const name = addNode(a.step, matchN8nNodeType(a.step), [x, y]);
    connect(prevName, name);
    prevName = name;
    x += stepX;
  });

  if (result.conditions && result.conditions.length > 0) {
    const cond = result.conditions[0];
    const ifName = addNode(cond.logic || "Condition", "n8n-nodes-base.if", [x, y], "⚠️ Draft — set the actual condition expression here.");
    connect(prevName, ifName);
    x += stepX;

    if (cond.pathIfTrue) {
      const trueName = addNode(cond.pathIfTrue, matchN8nNodeType(cond.pathIfTrue), [x, y - 90]);
      connect(ifName, trueName, 0);
    }
    if (cond.pathIfFalse) {
      const falseName = addNode(cond.pathIfFalse, matchN8nNodeType(cond.pathIfFalse), [x, y + 90]);
      connect(ifName, falseName, 1);
    }
  }

  return {
    name: "Draft workflow — generated from Mode B plan (unverified)",
    nodes,
    connections,
    active: false,
    settings: {},
    meta: {
      note: "This is a rough, unverified starting skeleton — not a finished, ready-to-run workflow. Every node still needs real credentials and field mappings configured before it will run correctly.",
    },
  };
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
