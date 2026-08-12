// Worker entry point for the unified Workers Builds pipeline (wrangler deploy).
// Handles /api/plan, /api/document, /api/debug, and falls through to serving the
// built static site (the ASSETS binding, pointed at ./dist) for everything else.
//
// MODEL PROVIDER: every handler below calls the single callModel() function instead
// of talking to Workers AI directly. callModel() checks whether an ANTHROPIC_API_KEY
// secret exists in the environment — if it does, it calls the real Claude API; if not,
// it falls back to the free Workers AI prototype tier. Switching to Claude later is
// therefore just adding one secret in the Cloudflare dashboard (Settings > Variables
// and Secrets) — no code change or redeploy needed at that moment.

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

If there IS a conditional branch, include exactly one object in "conditions": {"logic": "Deal value over $1,000?", "pathIfTrue": "Notify sales manager directly", "pathIfFalse": "Add to standard follow-up queue"}. If there's no branching, "conditions" must be an empty array. "pathIfTrue" and "pathIfFalse" must NEVER be empty strings — always describe a concrete action for each outcome, even briefly. An empty or missing path is worse than a guess.`;

// ---------- Model provider layer ----------

// Cloudflare deprecates Workers AI models over time without much notice. Rather than depend
// on one hardcoded ID, we try a short list of currently-active, Cloudflare-"pinned" models in
// order — if one gets deprecated later, this just silently falls through to the next instead
// of breaking Mode B outright. Update this list if the docs ever show all of them deprecated:
// https://developers.cloudflare.com/workers-ai/models/ (filter: Text Generation)
const WORKERS_AI_MODEL_CANDIDATES = [
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/openai/gpt-oss-20b",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
];

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

async function callWorkersAI(env, messages, { jsonMode = true, maxTokens = 1200 } = {}) {
  const attempts = [];
  for (const model of WORKERS_AI_MODEL_CANDIDATES) {
    try {
      const result = await env.AI.run(model, {
        messages,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        max_tokens: maxTokens,
      });
      const raw = result?.response ?? result;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      return { text, provider: "workers-ai", modelUsed: model };
    } catch (err) {
      attempts.push(`${model}: ${err?.message || err}`);
    }
  }
  throw new Error(`All Workers AI candidate models failed — ${attempts.join(" | ")}`);
}

async function callClaude(env, messages, { maxTokens = 1200 } = {}) {
  // Claude's Messages API takes the system prompt as a separate top-level field,
  // not as a role:"system" entry inside messages — split it out here so every
  // handler can keep writing messages in the same OpenAI-style shape either way.
  let systemPrompt = "";
  let rest = messages;
  if (messages[0]?.role === "system") {
    systemPrompt = messages[0].content;
    rest = messages.slice(1);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: rest,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data?.content || []).find((c) => c.type === "text")?.text || "";
  if (!text) throw new Error("Claude returned an empty response.");

  return { text, provider: "claude", modelUsed: CLAUDE_MODEL };
}

// The single entry point every handler uses. Swapping providers is a config change,
// not a code change — see the file header.
async function callModel(env, messages, opts = {}) {
  if (env.ANTHROPIC_API_KEY) {
    return callClaude(env, messages, opts);
  }
  return callWorkersAI(env, messages, opts);
}

function parseModelJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Model did not return valid JSON.");
  }
}

// ---------- /api/plan ----------

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

  if (!env.AI && !env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "No model provider connected. Check the 'ai' binding in wrangler.jsonc and redeploy." },
      { status: 500 }
    );
  }

  try {
    const { text } = await callModel(
      env,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Client's request:\n\n${description}` },
      ],
      { jsonMode: true, maxTokens: 1200 }
    );

    const parsed = parseModelJSON(text);
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "The planning model couldn't produce a result. Try rephrasing or try again in a moment." }, { status: 502 });
  }
}

// ---------- /api/document ----------

// Straight from the guide's own copy-paste prompt template (Part 5.5), adapted for direct AI use
// rather than a human pasting it manually.
const DOCUMENT_SYSTEM_PROMPT = `You are helping a freelancer write client-facing documentation for an automation they just built.

You will be given a build plan as JSON (trigger, actions, conditions, tool, error handling). Write a short, plain-language explanation — under 250 words — that a non-technical small-business client could read and understand. Cover exactly three things: what this automation does, what happens if something goes wrong, and who to contact for changes.

Do not use technical jargon: no "webhook", "API", "node", "JSON", "trigger" (say "when X happens" instead), "conditional branch" (say "depending on whether..." instead), or platform names like Make.com/n8n unless naturally relevant. Write it the way you'd explain it out loud to a busy shop owner.

Return ONLY the explanation text itself — no headers, no markdown formatting, no preamble like "Here's the documentation:", just the plain-language paragraphs a client would actually receive.`;

async function handleDocument(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const plan = body?.plan;
  if (!plan || typeof plan !== "object") {
    return Response.json({ error: "Missing plan." }, { status: 400 });
  }

  if (!env.AI && !env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "No model provider connected. Check the 'ai' binding in wrangler.jsonc and redeploy." },
      { status: 500 }
    );
  }

  try {
    const { text } = await callModel(
      env,
      [
        { role: "system", content: DOCUMENT_SYSTEM_PROMPT },
        { role: "user", content: `Automation plan:\n\n${JSON.stringify(plan, null, 2)}` },
      ],
      { jsonMode: false, maxTokens: 500 }
    );

    if (!text.trim()) throw new Error("Model returned an empty response.");
    return Response.json({ documentation: text.trim() });
  } catch (err) {
    return Response.json({ error: "Couldn't generate documentation. Try again in a moment." }, { status: 502 });
  }
}

// ---------- /api/debug ----------

const DEBUG_SYSTEM_PROMPT = `You are a debugging assistant helping a freelancer fix a broken step in a Make.com or n8n automation. They've described what the step is supposed to do and pasted the actual error message or symptom.

Default to a Socratic style: ask ONE focused, specific guiding question tailored to their exact error and step — not a generic one — that would help narrow down the real cause, rather than immediately diagnosing it. Keep it to 1-2 sentences.

Once the conversation has enough information — after they've answered a guiding question, or if they explicitly ask for the direct answer — give a clear, concrete diagnosis: the likely cause and a specific fix. Don't ask more than 1-2 guiding questions total before diagnosing; don't drag it out.

If the user's most recent message asks for the direct answer, or says something like "skip ahead" or "just tell me", diagnose immediately instead of asking another question.

Write conversationally, like you're actually talking to someone — a few sentences, no markdown headers, no bullet-point walls.

Respond with ONLY a JSON object: {"type": "question", "message": "..."} when asking a guiding question, or {"type": "diagnosis", "message": "..."} when giving the actual answer.`;

async function handleDebugChat(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const history = Array.isArray(body?.history)
    ? body.history.filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    : [];
  if (history.length === 0) {
    return Response.json({ error: "Missing conversation." }, { status: 400 });
  }

  if (!env.AI && !env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "No model provider connected. Check the 'ai' binding in wrangler.jsonc and redeploy." },
      { status: 500 }
    );
  }

  try {
    const messages = [{ role: "system", content: DEBUG_SYSTEM_PROMPT }, ...history];
    if (body?.skipToAnswer) {
      messages.push({ role: "user", content: "Please give the direct diagnosis and fix now — skip any further guiding questions." });
    }

    const { text } = await callModel(env, messages, { jsonMode: true, maxTokens: 500 });
    const parsed = parseModelJSON(text);

    const type = parsed?.type === "diagnosis" ? "diagnosis" : "question";
    const message =
      typeof parsed?.message === "string" && parsed.message.trim() ? parsed.message.trim() : "Could you share a bit more detail about what's happening?";

    return Response.json({ type, message });
  } catch (err) {
    return Response.json({ error: "Couldn't get a response from the debugging assistant. Try again in a moment." }, { status: 502 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/plan" && request.method === "POST") {
      return handlePlan(request, env);
    }

    if (url.pathname === "/api/document" && request.method === "POST") {
      return handleDocument(request, env);
    }

    if (url.pathname === "/api/debug" && request.method === "POST") {
      return handleDebugChat(request, env);
    }

    // Everything else: serve the built static site.
    return env.ASSETS.fetch(request);
  },
};
