// AI output shape can't be fully trusted — coerce every field to the type the
// renderer expects so a malformed response degrades gracefully instead of crashing.
// (This is the fix for the white-screen crash we hit stress-testing Mode B — a
// missing/wrong-typed field from the model used to throw straight through to the UI.)

export function sanitizeResult(data) {
  const conditionsRaw = Array.isArray(data?.conditions) ? data.conditions : [];
  return {
    patterns: Array.isArray(data?.patterns) ? data.patterns.filter((p) => typeof p === "string") : [],
    patternExplanation: typeof data?.patternExplanation === "string" ? data.patternExplanation : "",
    tool: typeof data?.tool === "string" && data.tool ? data.tool : "Not specified",
    toolReason: typeof data?.toolReason === "string" ? data.toolReason : "",
    trigger: {
      description: typeof data?.trigger?.description === "string" ? data.trigger.description : "Trigger",
      type: data?.trigger?.type === "polling" ? "polling" : "webhook",
      reason: typeof data?.trigger?.reason === "string" ? data.trigger.reason : "",
    },
    actions: Array.isArray(data?.actions)
      ? data.actions
          .filter((a) => a && typeof a === "object")
          .map((a) => ({
            step: typeof a.step === "string" ? a.step : "Action",
            dataMapping: typeof a.dataMapping === "string" ? a.dataMapping : "",
          }))
      : [],
    conditions: conditionsRaw
      .filter((c) => c && typeof c === "object")
      .map((c) => ({
        logic: typeof c.logic === "string" ? c.logic : "Condition",
        pathIfTrue: typeof c.pathIfTrue === "string" ? c.pathIfTrue : "",
        pathIfFalse: typeof c.pathIfFalse === "string" ? c.pathIfFalse : "",
      })),
    errorHandling: Array.isArray(data?.errorHandling) ? data.errorHandling.filter((e) => typeof e === "string") : [],
    edgeCase: typeof data?.edgeCase === "string" ? data.edgeCase : "",
    _raw: data,
  };
}
