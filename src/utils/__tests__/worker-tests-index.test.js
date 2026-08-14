import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseModelJSON, callModel, callWorkersAI, callClaude, handlePlan, handleDocument, handleDebugChat } from "../index.js";

describe("parseModelJSON", () => {
  it("parses clean valid JSON", () => {
    expect(parseModelJSON('{"a": 1, "b": "two"}')).toEqual({ a: 1, b: "two" });
  });

  it("salvages JSON wrapped in stray text (small models sometimes add commentary despite instructions)", () => {
    const text = 'Sure, here is the plan:\n{"a": 1}\nHope that helps!';
    expect(parseModelJSON(text)).toEqual({ a: 1 });
  });

  it("throws a clear error on genuinely non-JSON text", () => {
    expect(() => parseModelJSON("This is just a sentence with no braces at all.")).toThrow(/valid JSON/i);
  });

  it("throws on empty string", () => {
    expect(() => parseModelJSON("")).toThrow();
  });
});

describe("callModel — provider routing (the Claude switch)", () => {
  const messages = [
    { role: "system", content: "You are a test." },
    { role: "user", content: "Hello" },
  ];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes to Workers AI when no ANTHROPIC_API_KEY secret is present", async () => {
    const env = { AI: { run: vi.fn().mockResolvedValue({ response: '{"ok":true}' }) } };
    const result = await callModel(env, messages);
    expect(env.AI.run).toHaveBeenCalled();
    expect(result.provider).toBe("workers-ai");
  });

  it("routes to Claude the moment ANTHROPIC_API_KEY is present — no other config needed", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: '{"ok":true}' }] }),
    });
    const env = { ANTHROPIC_API_KEY: "sk-test-key", AI: { run: vi.fn() } };
    const result = await callModel(env, messages);

    expect(global.fetch).toHaveBeenCalledWith("https://api.anthropic.com/v1/messages", expect.any(Object));
    expect(env.AI.run).not.toHaveBeenCalled(); // must NOT fall through to Workers AI once Claude is configured
    expect(result.provider).toBe("claude");
  });
});

describe("callClaude", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("splits the system message out of the messages array into Claude's top-level 'system' field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "response text" }] }),
    });
    const env = { ANTHROPIC_API_KEY: "sk-test" };
    await callClaude(env, [
      { role: "system", content: "SYSTEM PROMPT HERE" },
      { role: "user", content: "user message" },
    ]);

    const callArgs = global.fetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.system).toBe("SYSTEM PROMPT HERE");
    expect(body.messages).toEqual([{ role: "user", content: "user message" }]);
    expect(body.messages.some((m) => m.role === "system")).toBe(false);
  });

  it("sends the API key in the x-api-key header, not in the body or URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: "text", text: "x" }] }) });
    const env = { ANTHROPIC_API_KEY: "sk-secret-value" };
    await callClaude(env, [{ role: "user", content: "hi" }]);
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers["x-api-key"]).toBe("sk-secret-value");
  });

  it("throws with a descriptive error on a non-ok HTTP response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "invalid api key" });
    const env = { ANTHROPIC_API_KEY: "bad-key" };
    await expect(callClaude(env, [{ role: "user", content: "hi" }])).rejects.toThrow(/401/);
  });

  it("throws if Claude returns no text content", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) });
    const env = { ANTHROPIC_API_KEY: "sk-test" };
    await expect(callClaude(env, [{ role: "user", content: "hi" }])).rejects.toThrow(/empty/i);
  });
});

describe("callWorkersAI", () => {
  it("falls through to the next candidate model if the first one fails", async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error("model deprecated")).mockResolvedValueOnce({ response: '{"ok":true}' });
    const env = { AI: { run } };
    const result = await callWorkersAI(env, [{ role: "user", content: "hi" }]);
    expect(run).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('{"ok":true}');
  });

  it("throws a combined error if every candidate model fails", async () => {
    const run = vi.fn().mockRejectedValue(new Error("unavailable"));
    const env = { AI: { run } };
    await expect(callWorkersAI(env, [{ role: "user", content: "hi" }])).rejects.toThrow(/failed/i);
  });
});

describe("handlePlan — request validation", () => {
  it("returns 400 when the description is missing", async () => {
    const request = { json: async () => ({}) };
    const env = { AI: { run: vi.fn() } };
    const res = await handlePlan(request, env);
    expect(res.status).toBe(400);
  });

  it("returns 500 when no model provider is configured at all", async () => {
    const request = { json: async () => ({ description: "A real client request" }) };
    const env = {}; // no AI binding, no ANTHROPIC_API_KEY
    const res = await handlePlan(request, env);
    expect(res.status).toBe(500);
  });

  it("returns the parsed plan on success", async () => {
    const request = { json: async () => ({ description: "Log form entries to a sheet" }) };
    const planJson = JSON.stringify({ needsClarification: false, patterns: ["Lead capture & notification"] });
    const env = { AI: { run: vi.fn().mockResolvedValue({ response: planJson }) } };
    const res = await handlePlan(request, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patterns).toEqual(["Lead capture & notification"]);
  });
});

describe("handleDocument — request validation", () => {
  it("returns 400 when the plan is missing", async () => {
    const request = { json: async () => ({}) };
    const env = { AI: { run: vi.fn() } };
    const res = await handleDocument(request, env);
    expect(res.status).toBe(400);
  });
});

describe("handleDebugChat — request validation", () => {
  it("returns 400 when the conversation history is empty", async () => {
    const request = { json: async () => ({ history: [] }) };
    const env = { AI: { run: vi.fn() } };
    const res = await handleDebugChat(request, env);
    expect(res.status).toBe(400);
  });

  it("returns 400 when history is missing entirely", async () => {
    const request = { json: async () => ({}) };
    const env = { AI: { run: vi.fn() } };
    const res = await handleDebugChat(request, env);
    expect(res.status).toBe(400);
  });
});
