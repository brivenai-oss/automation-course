// Validates a real, user-exported n8n workflow JSON against a scenario's expected
// structural shape (trigger present, enough action nodes, branching where required
// and both sides populated). Checks structure only, deliberately — not exact node
// names, parameters, or whether the workflow actually runs; that verification still
// happens in n8n itself.

export function validateN8nExport(jsonText, expected) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, message: "That doesn't look like valid JSON — make sure you copied the full exported workflow, not part of it." };
  }

  const nodes = Array.isArray(parsed?.nodes) ? parsed.nodes : null;
  if (!nodes) {
    return { ok: false, message: "This doesn't look like an n8n workflow export — no \"nodes\" array found. In n8n: select all (Ctrl/Cmd+A), copy, and paste the whole thing." };
  }

  const real = nodes.filter((n) => n && typeof n.type === "string" && !/stickynote/i.test(n.type));
  const isTrigger = (n) => /trigger|webhook|cron|schedule/i.test(n.type);
  const isCondition = (n) => /\.(if|switch)$/i.test(n.type);

  const triggers = real.filter(isTrigger);
  const conditions = real.filter(isCondition);
  const actions = real.filter((n) => !isTrigger(n) && !isCondition(n));

  if (triggers.length === 0) {
    return { ok: false, message: "No trigger node found — every workflow needs to start with one." };
  }
  if (actions.length < expected.minActions) {
    return {
      ok: false,
      message: `Found ${actions.length} action node(s) — this scenario needs at least ${expected.minActions}. Reread the scenario for every downstream step.`,
    };
  }
  if (expected.conditionRequired && conditions.length === 0) {
    return { ok: false, message: "This scenario branches based on a condition — add an IF (or Switch) node." };
  }
  if (!expected.conditionRequired && conditions.length > 0) {
    return { ok: false, message: "This scenario doesn't actually need a conditional branch — everything happens the same way every time." };
  }

  if (expected.conditionRequired && conditions.length > 0) {
    const ifNode = conditions[0];
    const conn = parsed?.connections?.[ifNode.name];
    const trueCount = conn?.main?.[0]?.length || 0;
    const falseCount = conn?.main?.[1]?.length || 0;
    if (trueCount < (expected.branchTrueMin || 1)) {
      return { ok: false, message: "The IF node's first (true) output doesn't connect to enough downstream steps for this scenario." };
    }
    if (falseCount < (expected.branchFalseMin || 1)) {
      return { ok: false, message: "The IF node's second (false) output doesn't connect to enough downstream steps for this scenario." };
    }
  }

  return {
    ok: true,
    message: "Structurally, this matches what the scenario needs. (This checks shape only — field mappings, credentials, and whether it actually runs correctly in n8n are still on you to verify.)",
  };
}
