import React, { useState, useEffect } from "react";
import { Lock, CheckCircle2, X, BookOpen, Radio } from "lucide-react";

// ---------- Design tokens ----------
const T = {
  graphite: "#1E2229",
  graphiteLine: "#2C313A",
  parchment: "#EFEAD9",
  parchmentDim: "#E4DEC9",
  ink: "#2B2822",
  inkSoft: "#5B5748",
  copper: "#C97C3D",
  wire: "#4C8BF5",
  signal: "#4CAF6D",
};

const FONTS = {
  display: "'Space Grotesk', 'Segoe UI', sans-serif",
  body: "'Source Serif 4', Georgia, serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

const STORAGE_KEY = "automation-course-progress-v1";

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private browsing etc) — fail silently, app still works
  }
}

// ---------- Content ----------
const LESSONS = [
  { id: 1, title: "Positioning", subtitle: "What you're actually selling" },
  { id: 2, title: "Vocabulary", subtitle: "Trigger, action, node, webhook…" },
  { id: 3, title: "n8n vs. Make.com", subtitle: "Which tool, and when" },
  { id: 4, title: "Triggers", subtitle: "Webhook vs. polling" },
  { id: 5, title: "The Five Patterns", subtitle: "The backbone of every job" },
  { id: 6, title: "Build & Test Discipline", subtitle: "The actual craft" },
  { id: 7, title: "Error Handling", subtitle: "Fallbacks & duplicate risk" },
  { id: 8, title: "Documentation", subtitle: "Delivering to a real client" },
];

const GLOSSARY = [
  { term: "Trigger", def: "The event that starts a workflow — new form entry, new row, scheduled time, incoming email." },
  { term: "Action", def: "What happens in response — add a CRM row, send a Slack message, create a calendar event." },
  { term: "Node / Module", def: "One step on the visual canvas (n8n calls it a node, Make.com a module)." },
  { term: "Workflow / Scenario", def: "The full chain from trigger to final action (n8n / Make.com terms)." },
  { term: "Webhook", def: "A URL that lets one app instantly notify another the moment something happens." },
  { term: "Polling trigger", def: "Checks a source on a schedule (e.g. every 15 min) instead of being notified instantly." },
  { term: "API", def: "The set of actions an app exposes for other software to use on its behalf." },
  { term: "Data mapping / variables", def: "Passing a specific field's value from one step into the next." },
  { term: "Router / IF / conditional branch", def: "Sends the workflow down different paths based on a condition." },
  { term: "Iterator / loop", def: "Repeats an action once per item in a list." },
  { term: "OAuth vs. API key", def: "The two ways a workflow gets permission to act on an app — never the client's actual password." },
];

const PATTERNS = [
  { name: "Lead capture & notification", shape: "New form/entry → add to CRM/Sheet → notify via Slack/email" },
  { name: "Scheduled data sync / reporting", shape: "Timer → pull data from a source → compile into a report/sheet" },
  { name: "Conditional routing", shape: "Trigger → router/IF → different paths based on a condition" },
  { name: "AI-enhanced step", shape: "Trigger → LLM node classifies/summarizes/drafts → action" },
  { name: "Multi-step approval/confirmation chain", shape: "Trigger → create record → notify → confirmation, several downstream actions" },
];

const QUIZ = [
  {
    q: "Your buyer for this gig is best described as…",
    options: [
      "A developer who needs help scaling infrastructure",
      "A solo operator or small business owner manually repeating a task",
      "A large enterprise IT department",
      "Someone who wants a mobile app built from scratch",
    ],
    correct: 1,
    explain: "They're doing repetitive manual work — copying form entries into a sheet, forwarding emails — and assume automation means hiring a developer. It doesn't.",
  },
  {
    q: "What keeps this category from getting flooded with low-effort sellers, the way $5-article gigs did?",
    options: [
      "Fiverr caps how many sellers can list the gig",
      "It requires a coding bootcamp certificate",
      "A broken automation is immediately, visibly broken — there's a real technical floor",
      "It isn't actually in demand, so nobody bothers",
    ],
    correct: 2,
    explain: "You can't fake competence past the first delivery. That real floor is exactly why it stays low-competition while high-demand.",
  },
  {
    q: "Which best captures your actual role in this gig?",
    options: [
      "Programmer writing custom software from scratch",
      "Translator between a business owner's manual task and a visual canvas of connected boxes",
      "IT support fixing broken computers",
      "Marketing consultant advising on growth strategy",
    ],
    correct: 1,
    explain: "You're not becoming a programmer. Nearly everything in this course is about that translation step.",
  },
];

// Lesson 2 quiz data — mixes match-the-term, scenario judgment, and multiple choice
const MATCH_PAIRS = [
  { term: "Webhook", def: "A URL that lets one app instantly push a notification to another the moment something happens." },
  { term: "Node / Module", def: "One step on the visual canvas — one box representing one app or operation." },
  { term: "Router / IF", def: "Sends the workflow down different paths depending on a condition." },
];

const LESSON2_SCENARIO = {
  q: "A client wants a Slack message sent every time a new Typeform response comes in. Is this best built as a webhook trigger or a polling trigger?",
  options: [
    "Webhook trigger — Typeform can push an instant notification the moment a response arrives",
    "Polling trigger — you should check Typeform every 15 minutes for new responses",
    "Neither — Typeform can't be connected to an automation platform",
    "It doesn't matter, both behave identically for the client",
  ],
  correct: 0,
  explain: "Most modern form tools support webhooks, so the workflow fires instantly instead of on a delay. Polling is the fallback for tools that don't expose one.",
};

const LESSON2_MC = {
  q: "Why does this vocabulary matter beyond just passing a quiz?",
  options: [
    "It's required to pass an official n8n/Make.com certification exam",
    "It's what you'll use in every client conversation and every AI-assisted planning prompt",
    "Clients expect you to use technical jargon to sound credible",
    "It's only relevant once you're building complex, enterprise-scale workflows",
  ],
  correct: 1,
  explain: "This exact vocabulary is how you'll describe plans to clients and how you'll prompt Claude/ChatGPT to help you build — it's working language, not trivia.",
};

// ---------- Small UI pieces ----------
function LessonBadge({ n, state }) {
  const bg = state === "current" ? T.copper : state === "done" ? T.signal : "transparent";
  const border = state === "locked" ? T.graphiteLine : bg;
  const color = state === "locked" ? T.inkSoft : "#fff";
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: `1.5px solid ${border}`,
        background: bg,
        color: state === "locked" ? "#6b7280" : color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.mono,
        fontSize: 12,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {state === "done" ? <CheckCircle2 size={15} /> : state === "locked" ? <Lock size={12} /> : n}
      {state === "current" && (
        <span
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: T.wire,
            boxShadow: `0 0 0 2px ${T.graphite}`,
          }}
        />
      )}
    </div>
  );
}

function GlossaryDrawer({ open, onClose }) {
  const [tab, setTab] = useState("glossary");
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20,18,14,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(380px, 92vw)",
          background: T.parchment,
          borderLeft: `1px solid ${T.parchmentDim}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 0 20px",
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: T.ink, letterSpacing: 0.3 }}>
            REFERENCE
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: T.inkSoft,
              padding: 4,
            }}
            aria-label="Close reference panel"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "14px 20px 0 20px" }}>
          {["glossary", "patterns"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "7px 12px",
                border: "none",
                borderBottom: tab === t ? `2px solid ${T.copper}` : "2px solid transparent",
                background: "transparent",
                color: tab === t ? T.ink : T.inkSoft,
                cursor: "pointer",
              }}
            >
              {t === "glossary" ? "Glossary" : "5 Patterns"}
            </button>
          ))}
        </div>

        <div style={{ overflowY: "auto", padding: "16px 20px 28px 20px", flex: 1 }}>
          {tab === "glossary" &&
            GLOSSARY.map((g) => (
              <div key={g.term} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 12.5,
                    color: T.copper,
                    background: "rgba(201,124,61,0.1)",
                    display: "inline-block",
                    padding: "2px 7px",
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                >
                  {g.term}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, lineHeight: 1.5 }}>{g.def}</div>
              </div>
            ))}
          {tab === "patterns" &&
            PATTERNS.map((p, i) => (
              <div
                key={p.name}
                style={{
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: i < PATTERNS.length - 1 ? `1px solid ${T.parchmentDim}` : "none",
                }}
              >
                <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 14, color: T.ink, marginBottom: 3 }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>{p.shape}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

function Quiz({ savedScore, onComplete }) {
  const [answers, setAnswers] = useState(Array(QUIZ.length).fill(null));
  const [submitted, setSubmitted] = useState(savedScore !== undefined);

  const allAnswered = answers.every((a) => a !== null);
  const score = submitted && savedScore !== undefined ? savedScore : answers.filter((a, i) => a === QUIZ[i].correct).length;

  const handleSubmit = () => {
    const s = answers.filter((a, i) => a === QUIZ[i].correct).length;
    setSubmitted(true);
    onComplete?.(s);
  };

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.parchmentDim}`,
        borderRadius: 10,
        padding: "26px 28px",
        marginTop: 36,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Radio size={16} color={T.wire} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.8, color: T.wire, textTransform: "uppercase" }}>
          Check your understanding
        </span>
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.inkSoft, marginTop: 6, marginBottom: 22 }}>
        Three quick questions before you move on. No pressure — you can retry.
      </p>

      {QUIZ.map((item, qi) => (
        <div key={qi} style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15.5, color: T.ink, marginBottom: 10 }}>
            {qi + 1}. {item.q}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {item.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = oi === item.correct;
              let borderColor = T.parchmentDim;
              let bg = "transparent";
              if (submitted) {
                if (isCorrect) {
                  borderColor = T.signal;
                  bg = "rgba(76,175,109,0.08)";
                } else if (isSelected && !isCorrect) {
                  borderColor = "#D1554A";
                  bg = "rgba(209,85,74,0.06)";
                }
              } else if (isSelected) {
                borderColor = T.wire;
                bg = "rgba(76,139,245,0.06)";
              }
              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => {
                    const next = [...answers];
                    next[qi] = oi;
                    setAnswers(next);
                  }}
                  style={{
                    textAlign: "left",
                    fontFamily: FONTS.body,
                    fontSize: 14.5,
                    color: T.ink,
                    padding: "10px 14px",
                    borderRadius: 7,
                    border: `1.5px solid ${borderColor}`,
                    background: bg,
                    cursor: submitted ? "default" : "pointer",
                    lineHeight: 1.4,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && (
            <div
              style={{
                marginTop: 10,
                fontFamily: FONTS.body,
                fontSize: 13.5,
                color: T.inkSoft,
                borderLeft: `2.5px solid ${answers[qi] === item.correct ? T.signal : "#D1554A"}`,
                paddingLeft: 12,
              }}
            >
              {item.explain}
            </div>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          disabled={!allAnswered}
          onClick={handleSubmit}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12.5,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "11px 22px",
            borderRadius: 7,
            border: "none",
            background: allAnswered ? T.copper : "#D8D2BE",
            color: "#fff",
            cursor: allAnswered ? "pointer" : "not-allowed",
          }}
        >
          Submit answers
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 15,
            color: score === QUIZ.length ? T.signal : T.copper,
          }}
        >
          <CheckCircle2 size={18} />
          {score} / {QUIZ.length} correct
        </div>
      )}
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchQuestion({ pairs, submitted, selections, onSelect }) {
  const [shuffledDefs] = useState(() => shuffle(pairs.map((p) => p.def)));

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15.5, color: T.ink, marginBottom: 4 }}>
        1. Match each term to its definition
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 13.5, color: T.inkSoft, marginTop: 0, marginBottom: 14 }}>
        Pick the correct definition for each term from the dropdown.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pairs.map((p, i) => {
          const selected = selections[i];
          const isCorrect = selected === p.def;
          let borderColor = T.parchmentDim;
          if (submitted) borderColor = isCorrect ? T.signal : "#D1554A";
          return (
            <div
              key={p.term}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 7,
                padding: "10px 14px",
                background: submitted ? (isCorrect ? "rgba(76,175,109,0.06)" : "rgba(209,85,74,0.05)") : "transparent",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 12.5,
                  color: T.copper,
                  background: "rgba(201,124,61,0.1)",
                  padding: "4px 9px",
                  borderRadius: 4,
                  flexShrink: 0,
                  minWidth: 110,
                }}
              >
                {p.term}
              </div>
              <select
                disabled={submitted}
                value={selected || ""}
                onChange={(e) => onSelect(i, e.target.value)}
                style={{
                  flex: 1,
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: T.ink,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${T.parchmentDim}`,
                  background: "#fff",
                }}
              >
                <option value="" disabled>
                  Choose a definition…
                </option>
                {shuffledDefs.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceQuestion({ index, item, submitted, selected, onSelect }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15.5, color: T.ink, marginBottom: 10 }}>
        {index}. {item.q}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {item.options.map((opt, oi) => {
          const isSelected = selected === oi;
          const isCorrect = oi === item.correct;
          let borderColor = T.parchmentDim;
          let bg = "transparent";
          if (submitted) {
            if (isCorrect) {
              borderColor = T.signal;
              bg = "rgba(76,175,109,0.08)";
            } else if (isSelected && !isCorrect) {
              borderColor = "#D1554A";
              bg = "rgba(209,85,74,0.06)";
            }
          } else if (isSelected) {
            borderColor = T.wire;
            bg = "rgba(76,139,245,0.06)";
          }
          return (
            <button
              key={oi}
              disabled={submitted}
              onClick={() => onSelect(oi)}
              style={{
                textAlign: "left",
                fontFamily: FONTS.body,
                fontSize: 14.5,
                color: T.ink,
                padding: "10px 14px",
                borderRadius: 7,
                border: `1.5px solid ${borderColor}`,
                background: bg,
                cursor: submitted ? "default" : "pointer",
                lineHeight: 1.4,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && (
        <div
          style={{
            marginTop: 10,
            fontFamily: FONTS.body,
            fontSize: 13.5,
            color: T.inkSoft,
            borderLeft: `2.5px solid ${selected === item.correct ? T.signal : "#D1554A"}`,
            paddingLeft: 12,
          }}
        >
          {item.explain}
        </div>
      )}
    </div>
  );
}

function Quiz2({ savedScore, onComplete }) {
  const TOTAL = MATCH_PAIRS.length + 2; // 3 match pairs + scenario + mc
  const [matchSel, setMatchSel] = useState(Array(MATCH_PAIRS.length).fill(null));
  const [scenarioSel, setScenarioSel] = useState(null);
  const [mcSel, setMcSel] = useState(null);
  const [submitted, setSubmitted] = useState(savedScore !== undefined);

  const allAnswered = matchSel.every((s) => s !== null) && scenarioSel !== null && mcSel !== null;

  const computeScore = () => {
    const matchCorrect = matchSel.filter((s, i) => s === MATCH_PAIRS[i].def).length;
    const scenarioCorrect = scenarioSel === LESSON2_SCENARIO.correct ? 1 : 0;
    const mcCorrect = mcSel === LESSON2_MC.correct ? 1 : 0;
    return matchCorrect + scenarioCorrect + mcCorrect;
  };

  const score = submitted && savedScore !== undefined ? savedScore : computeScore();

  const handleSubmit = () => {
    const s = computeScore();
    setSubmitted(true);
    onComplete?.(s);
  };

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.parchmentDim}`,
        borderRadius: 10,
        padding: "26px 28px",
        marginTop: 36,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Radio size={16} color={T.wire} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.8, color: T.wire, textTransform: "uppercase" }}>
          Check your understanding
        </span>
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.inkSoft, marginTop: 6, marginBottom: 22 }}>
        A mix of formats this time — matching, a real scenario call, and a quick check.
      </p>

      <MatchQuestion
        pairs={MATCH_PAIRS}
        submitted={submitted}
        selections={matchSel}
        onSelect={(i, val) => {
          const next = [...matchSel];
          next[i] = val;
          setMatchSel(next);
        }}
      />
      <ChoiceQuestion
        index={2}
        item={LESSON2_SCENARIO}
        submitted={submitted}
        selected={scenarioSel}
        onSelect={setScenarioSel}
      />
      <ChoiceQuestion index={3} item={LESSON2_MC} submitted={submitted} selected={mcSel} onSelect={setMcSel} />

      {!submitted ? (
        <button
          disabled={!allAnswered}
          onClick={handleSubmit}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12.5,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "11px 22px",
            borderRadius: 7,
            border: "none",
            background: allAnswered ? T.copper : "#D8D2BE",
            color: "#fff",
            cursor: allAnswered ? "pointer" : "not-allowed",
          }}
        >
          Submit answers
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 15,
            color: score === TOTAL ? T.signal : T.copper,
          }}
        >
          <CheckCircle2 size={18} />
          {score} / {TOTAL} correct
        </div>
      )}
    </div>
  );
}

// ---------- Lesson 1 content ----------
function Lesson1({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 1 — POSITIONING
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        What you're actually selling
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>~6 min read</div>

      <div
        style={{
          background: "rgba(76,139,245,0.08)",
          borderLeft: `3px solid ${T.wire}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 6, textTransform: "uppercase" }}>
          Why this matters for a real client
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          Before you touch a single tool, you need to know who you're talking to and why they're paying you.
          Get this wrong and you'll pitch a stranger's problem — get it right and every conversation with a
          client gets shorter and more confident.
        </p>
      </div>

      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 20 }}>
        Your buyer is a small business owner or solo operator doing the same repetitive task by hand, over
        and over: copying a new form submission into a spreadsheet, forwarding an email to the right person,
        checking a database for updates. They know it's wasted time and a source of human error — but they
        assume "automation" means hiring a developer or learning to code.
      </p>

      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 20 }}>
        You're selling the fact that it doesn't. A visual, no-code tool can connect the exact apps they
        already use, running quietly in the background forever after you build it once.
      </p>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginTop: 34, marginBottom: 12 }}>
        Why this category isn't saturated
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 20 }}>
        Unlike writing or basic design, you genuinely can't fake competence here past the first delivery — a
        broken automation is immediately, visibly broken. That real technical floor keeps out the casual
        seller flood that hit $5-article and logo-design gigs, which is exactly why it stays low-competition
        despite rising demand.
      </p>

      <div
        style={{
          background: T.parchmentDim,
          borderRadius: 8,
          padding: "18px 20px",
          margin: "28px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <BookOpen size={16} color={T.copper} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.6, color: T.copper, textTransform: "uppercase" }}>
            Key mindset shift
          </span>
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 16, color: T.ink, margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>
          You are not "a developer." You are a translator between a business owner's repetitive manual task
          and a visual canvas of connected boxes that does it for them automatically. Nearly everything in
          this course is about that translation — not about becoming a programmer.
        </p>
      </div>

      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75 }}>
        Hold onto that sentence. Every lesson from here on — vocabulary, the five patterns, build discipline,
        error handling — is just giving that translation instinct more tools to work with.
      </p>

      <Quiz savedScore={savedScore} onComplete={onQuizComplete} />
    </div>
  );
}

function TermCard({ term, def }) {
  return (
    <div style={{ padding: "12px 16px", background: T.parchmentDim, borderRadius: 8 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12.5, color: T.copper, marginBottom: 4 }}>{term}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{def}</div>
    </div>
  );
}

function Lesson2({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 2 — VOCABULARY
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        The words every workflow is built from
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>~8 min read</div>

      <div
        style={{
          background: "rgba(76,139,245,0.08)",
          borderLeft: `3px solid ${T.wire}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 6, textTransform: "uppercase" }}>
          Why this matters for a real client
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          This is the exact vocabulary you'll use in every client conversation and every AI-assisted planning
          prompt from here on. It's working language, not trivia — get comfortable with it now and every
          later lesson moves faster.
        </p>
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginTop: 6, marginBottom: 12 }}>
        The core idea, in one sentence
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 18 }}>
        An automation platform watches for something to happen (a <em>trigger</em>), then automatically
        performs one or more <em>actions</em> in response — without a human doing it manually each time.
      </p>

      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 15,
          color: T.copper,
          background: T.graphite,
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 30,
          textAlign: "center",
          letterSpacing: 0.5,
        }}
      >
        TRIGGER → ACTION 1 → ACTION 2 → …
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 14 }}>
        Core vocabulary
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 30 }}>
        <TermCard term="Trigger" def="The event that starts the automation — a new form submission, a new row, a scheduled time, an incoming email." />
        <TermCard term="Action" def="Something the automation does in response — adding a CRM row, sending a Slack message, creating a calendar event." />
        <TermCard term="Node (n8n) / Module (Make.com)" def="A single step in the workflow — one box on the visual canvas." />
        <TermCard term="Workflow (n8n) / Scenario (Make.com)" def="The full chain of connected nodes/modules from trigger to final action." />
        <TermCard term="Execution / Run" def="One completed pass of the workflow, triggered once." />
        <TermCard term="Webhook" def="A URL that lets one app instantly notify another the moment something happens." />
        <TermCard term="API" def="The 'menu' of actions an app allows outside software to perform on its behalf." />
        <TermCard term="Data mapping / variables" def="Passing a specific field's value from one step into the next." />
        <TermCard term="Router / IF" def="Sends the workflow down different paths depending on a condition." />
        <TermCard term="Iterator / loop" def="Repeating the same action once for each item in a list." />
      </div>

      <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, lineHeight: 1.7, marginBottom: 8 }}>
        You don't need to memorize this list — it's pinned in the{" "}
        <strong style={{ color: T.ink }}>Glossary & cheat sheet</strong> panel, open it from anywhere while
        you work.
      </p>

      <Quiz2 savedScore={savedScore} onComplete={onQuizComplete} />
    </div>
  );
}

// ---------- App shell ----------
export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState(1);
  const [completed, setCompleted] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load saved progress once on mount
  useEffect(() => {
    setCompleted(loadProgress());
    setLoaded(true);
  }, []);

  // Persist whenever progress changes (after initial load)
  useEffect(() => {
    if (loaded) saveProgress(completed);
  }, [completed, loaded]);

  const isUnlocked = (l) => l.id === 1 || completed[l.id - 1] !== undefined;

  const lessonState = (l) => {
    if (completed[l.id] !== undefined) return "done";
    if (l.id === activeLesson) return "current";
    if (!isUnlocked(l)) return "locked";
    return "todo";
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.graphite,
        fontFamily: FONTS.body,
      }}
    >
      {/* Left rail */}
      <div
        style={{
          width: 250,
          flexShrink: 0,
          borderRight: `1px solid ${T.graphiteLine}`,
          padding: "22px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 6px", marginBottom: 26 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.2, color: T.wire, marginBottom: 4 }}>
            MODE A · LEARN
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16.5, color: "#fff", lineHeight: 1.3 }}>
            Automation Fundamentals
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          {LESSONS.map((l) => {
            const state = lessonState(l);
            const clickable = isUnlocked(l);
            return (
              <button
                key={l.id}
                disabled={!clickable}
                onClick={() => setActiveLesson(l.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "9px 8px",
                  borderRadius: 7,
                  border: "none",
                  background: state === "current" ? T.graphiteLine : "transparent",
                  cursor: clickable ? "pointer" : "default",
                  textAlign: "left",
                }}
              >
                <LessonBadge n={l.id} state={state} />
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 600,
                      fontSize: 13.5,
                      color: clickable ? "#fff" : "#5b6270",
                    }}
                  >
                    {l.title}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: "#7c8290" }}>{l.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 7,
            border: `1px solid ${T.graphiteLine}`,
            background: "transparent",
            color: T.copper,
            fontFamily: FONTS.mono,
            fontSize: 11.5,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          <BookOpen size={14} />
          Glossary & cheat sheet
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, background: T.parchment, padding: "48px 56px", overflowY: "auto" }}>
        {activeLesson === 1 && (
          <Lesson1
            savedScore={completed[1]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 1: score }))}
          />
        )}
        {activeLesson === 2 && (
          <Lesson2
            savedScore={completed[2]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 2: score }))}
          />
        )}
      </div>

      <GlossaryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
