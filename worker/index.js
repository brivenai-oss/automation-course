// Worker entry point for the unified Workers Builds pipeline (wrangler deploy).
// Handles /api/plan itself, and falls through to serving the built static site
// (the ASSETS binding, pointed at ./dist) for everything else.
//
// Prototype tier: runs on Workers AI (env.AI, bound via wrangler.jsonc — no API key
// needed for this). Swap to the real Claude API later by replacing only the model-call
// section inside handlePlan(); the request/response shape the frontend expects stays the same.

const SYSTEM_PROMPT = `You are an automation-planning assistant helping a freelancer turn a small-business client's plain-language request into a build-ready automation plan for Make.com or n8n.

THE FIVE PATTERNS (nearly every request is one of these, or a combination of two):
1. Lead capture & notification — new form/entry -> add to CRM/Sheet -> notify via Slack/email
2. Scheduled data sync / reporting — timer -> pull data from a source -> compile into a report/sheet
3. Conditional routing — trigger -> router/IF -> different paths based on a condition
4. AI-enhanced step — trigger -> LLM node classifies/summarizes/drafts -> action
5. Multi-step approval/confirmation chain — trigger -> create record -> notify -> confirmation, several downstream actions

CHECK FOR COMBINED PATTERNS: Before finalizing "patterns", re-check your own planned "conditions" array — if it's non-empty (there IS a branch), pattern 3 (Conditional routing) MUST be included in "patterns" alongside whatever other pattern applies, even if the request's main thrust is something else like lead capture. Don't list only one pattern when your own plan clearly includes a conditional branch.

TRIGGER TYPE: Use "webhook" if the source app can push an instant notification (most modern form tools, CRMs, and SaaS apps support this). Use "polling" only if the source app has no webhook support, or the request is explicitly time-based (e.g. "every morning").

IDENTIFYING THE TRUE TRIGGER: When a request describes multiple chained steps (e.g. "a new email arrives, gets logged in a sheet, then that triggers a Slack message"), the trigger is ONLY the single earliest originating event — never the result of your own first action. Do not set the trigger to something that one of your own listed actions creates (like "a new row is added"); that is circular. The row being added, the record being created, etc. are themselves actions, not triggers.

NEVER INVENT SPECIFIC TOOL NAMES: If the client's description doesn't name a specific app or platform (e.g. they just say "support tickets" or "our spreadsheet" without naming Zendesk, Airtable, etc.), describe it generically ("their support-ticket system", "the spreadsheet") in the trigger, actions, and everything else. Do NOT guess or assume a specific named product they never mentioned — that misleads the freelancer into thinking an integration was confirmed when it wasn't. Only use a specific product name if the client's own words named it.

ACTIONS VS. CONDITIONAL BRANCHES — NO DUPLICATION: The top-level "actions" array must contain ONLY steps that happen the same way regardless of any condition (i.e. before the branch point, or when there's no branching at all). If a step only happens on one specific branch outcome (e.g. only when urgent, only when NOT urgent), it belongs ONLY inside that condition's "pathIfTrue" or "pathIfFalse" — never also repeated in the top-level "actions" array. Each action should appear in exactly one place in your output, never both.
Example — correct: "Log every new client email in a sheet, then notify Slack when one is added" -> trigger: "New client email received" -> actions: ["Parse the email and add a row to the spreadsheet with the sender's name and request", "Notify assistant via Slack that a new row was added"]. Note the trigger is the email arriving, NOT "a new row was added" — that would be circular since it's the direct output of the first action.

TOOL CHOICE: Recommend "Make.com" by default — it needs no hosting/server setup, which is right for most small-business jobs. Recommend "n8n" only if the request explicitly needs self-hosting or custom code/complex logic beyond what a visual builder handles.

ERROR HANDLING: Suggest 1-3 specific, concrete error-handling considerations for THIS workflow (not generic filler) — draw from: a fallback/error notification path, a required-field check for data that's often missing, duplicate-trigger awareness, or rate-limit pacing for high-volume workflows. Only include what's actually relevant to the scenario described.

If the description is missing information you genuinely need (no idea what should trigger it, or what "done" looks like, or which apps are involved), respond with a clarification request instead of guessing. Ask for at most 3 specific missing things — do not re-ask for anything already provided.

Respond with ONLY a single valid JSON object, no markdown code fences, no text outside the JSON. Use exactly this shape:

If information is missing:
{"needsClarification": true, "clarifyingQuestions": ["...", "..."]}

If you have enough to plan:
{
  "needsClarification": false,
  "patterns": ["Lead capture & notification"],
  "patternExplanation": "One sentence on why this pattern (or combination) fits.",
  "tool": "Make.com",
  "toolReason": "One sentence.",
  "trigger": {"description": "New Typeform response", "type": "webhook", "reason": "One sentence."},
  "actions": [
    {"step": "Add row to Google Sheet", "dataMapping": "Map the respondent's email and answers into the matching columns."},
    {"step": "Notify assistant via Slack", "dataMapping": "Include the respondent's name and summary in the message text."}
  ],
  "conditions": [],
  "errorHandling": ["A fallback path that notifies you if the Slack message fails to send."],
  "edgeCase": "Test with a form submission that has a blank optional field."
}

If there IS a conditional branch, include exactly one object in "conditions": {"logic": "Deal value over $1,000?", "pathIfTrue": "Notify sales manager directly", "pathIfFalse": "Add to standard follow-up queue"}. If there's no branching, "conditions" must be an empty array.`;

// Cloudflare deprecates Workers AI models over time without much notice. Rather than depend
// on one hardcoded ID, we try a short list of currently-active, Cloudflare-"pinned" models in
// order — if one gets deprecated later, this just silently falls through to the next instead
// of breaking Mode B outright. Update this list if the docs ever show all of them deprecated:
// https://developers.cloudflare.com/workers-ai/models/ (filter: Text Generation)
const MODEL_CANDIDATES = [
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/openai/gpt-oss-20b",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
];

async function runWithFallback(env, messages) {
  const attempts = [];
  for (const model of MODEL_CANDIDATES) {
    try {
      const result = await env.AI.run(model, {
        messages,
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });
      return { result, modelUsed: model };
    } catch (err) {
      attempts.push(`${model}: ${err?.message || err}`);
    }
  }
  throw new Error(`All candidate models failed — ${attempts.join(" | ")}`);
}

async function handlePlan(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const description = (body?.description || "").trim();
  if (!description) {
    return Response.json({ error: "Missing description." }, { status: 400 });
  }

  if (!env.AI) {
    return Response.json(
      { error: "Workers AI isn't connected. Check the 'ai' binding in wrangler.jsonc and redeploy." },
      { status: 500 }
    );
  }

  try {
    const { result: aiResponse } = await runWithFallback(env, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Client's request:\n\n${description}` },
    ]);

    const raw = aiResponse?.response ?? aiResponse;
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Model did not return valid JSON.");
      }
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "The planning model couldn't produce a result. Try rephrasing or try again in a moment." }, { status: 502 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/plan" && request.method === "POST") {
      return handlePlan(request, env);
    }

    // Everything else: serve the built static site.
    return env.ASSETS.fetch(request);
  },
};
