import React, { useState, useEffect } from "react";
import { Lock, CheckCircle2, X, BookOpen, Radio, Award, Printer } from "lucide-react";

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
  { id: 6, title: "Sketch Practice", subtitle: "Draw the shape before you build it" },
  { id: 7, title: "Build & Test Discipline", subtitle: "The actual craft" },
  { id: 8, title: "Error Handling", subtitle: "Fallbacks & duplicate risk" },
  { id: 9, title: "Documentation", subtitle: "Delivering to a real client" },
  { id: 10, title: "Certification", subtitle: "The milestone check", isCert: true },
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

// Lesson 3 quiz data
const LESSON3_PAIRS = [
  { term: "n8n", def: "Free if self-hosted with unlimited executions, and has a code node for custom logic." },
  { term: "Make.com", def: "Generous free tier with no hosting needed, and a polished scenario-based UI." },
];

const LESSON3_SCENARIO = {
  q: "A client says they want to eventually self-host their automation on their own server and need some custom JavaScript logic. Which tool fits that request better?",
  options: [
    "Make.com, because it has the more polished interface",
    "n8n, because it's open-source, self-hostable, and has a code node for custom logic",
    "Neither tool supports custom logic",
    "It doesn't matter — pick whichever you personally prefer",
  ],
  correct: 1,
  explain: "Self-hosting and custom code are exactly n8n's strengths. Make.com is the faster starting point, but this specific ask points to n8n.",
};

const LESSON3_MC = {
  q: "Why does the guide recommend starting on Make.com first, even though n8n is more flexible long-term?",
  options: [
    "Make.com is objectively a better product in every way",
    "Its free tier needs no hosting or server setup, so you can build and deliver real client work with zero infrastructure to manage",
    "n8n doesn't have a free tier at all",
    "Clients always prefer Make.com by default",
  ],
  correct: 1,
  explain: "Zero infrastructure to manage means fewer things that can go wrong while you're still building confidence — you add n8n once you're ready for clients who specifically need it.",
};

const LESSON3_VOLUME = {
  q: "A client currently gets about 400 form submissions a month, and the workflow you're planning needs roughly 5 steps per submission. Why is this worth a pricing conversation up front, rather than assuming Make's free tier will comfortably cover it?",
  options: [
    "Free tiers never expire, so volume is never actually a concern",
    "At roughly 5 operations per run × 400 runs, that's about 2,000 operations a month — likely to exceed Make's free-tier allowance",
    "Make.com technically can't handle 400 monthly triggers at all",
    "This volume specifically requires n8n — there's no other option",
  ],
  correct: 1,
  explain: "A rough operations-per-run × runs-per-month estimate takes 30 seconds and saves you from either an awkward mid-project cost surprise or promising something the free tier can't actually deliver.",
};

// Sketch practice exercises — the learner builds a trigger/action/condition shape, we check its structure.
// expected: { preActions: exact # of actions before any condition, condition: bool,
//             pathA/pathB: exact # of actions on each branch (only used when condition is true) }
const SKETCH_EXERCISES = [
  {
    id: "ex1",
    level: "Foundational",
    scenario:
      "A new Typeform response should be added as a row in Airtable, and the client should get a Slack notification.",
    expected: { preActions: 2, condition: false },
    successNote: "That's a lead capture & notification pattern — trigger, then two actions in a row.",
  },
  {
    id: "ex2",
    level: "Foundational",
    scenario:
      "Every Monday morning, pull last week's sales totals from the POS system, compile them into a report, and email it to the owner.",
    expected: { preActions: 3, condition: false },
    successNote: "Scheduled data sync / reporting — a timer trigger feeding a short chain of actions.",
  },
  {
    id: "ex3",
    level: "Foundational",
    scenario:
      "New leads come in through a form. If the deal value is over $1,000, notify the sales manager directly — otherwise, add it to the standard follow-up queue.",
    expected: { preActions: 0, condition: true, pathA: 1, pathB: 1 },
    successNote: "Conditional routing — the trigger feeds straight into a Condition that splits the outcome.",
  },
  {
    id: "ex4",
    level: "Advanced",
    scenario:
      "A new client order should generate an invoice, notify the fulfillment team in Slack, create a calendar event for the delivery date, and update the master order-tracking sheet.",
    expected: { preActions: 4, condition: false },
    successNote: "A multi-step chain — several downstream actions fired in sequence from one trigger, no branching needed.",
  },
  {
    id: "ex5",
    level: "Advanced",
    scenario:
      "A new support ticket comes in. First, log it in the tracking sheet. Then: if it's marked urgent, ping the on-call engineer immediately and create a high-priority calendar block. If it's not urgent, just add it to the weekly triage queue.",
    expected: { preActions: 1, condition: true, pathA: 2, pathB: 1 },
    successNote: "The branch doesn't have to start right at the trigger — a shared step (logging the ticket) can happen first, and the paths themselves don't need to be the same length.",
  },
  {
    id: "ex6",
    level: "Advanced",
    scenario:
      "A new job application comes in. Log it in the applicant tracker. If the candidate meets the minimum experience requirement, notify the hiring manager and schedule a screening call. If they don't meet it, send an automated rejection email and add them to a future-candidates list.",
    expected: { preActions: 1, condition: true, pathA: 2, pathB: 2 },
    successNote: "Both branches carry real weight here — this is the shape of most rejection/approval workflows you'll build for clients.",
  },
];

let __idCounter = 0;
function nextId() {
  __idCounter += 1;
  return `box-${__idCounter}`;
}

// Lesson 4 quiz data


const LESSON4_PAIRS = [
  { term: "OAuth", def: "A secure 'Sign in with Google/Slack/etc.' popup — the client authorizes access without ever sharing a password." },
  { term: "API key", def: "A private access code generated inside an app's own settings, used to authorize a workflow to act on its behalf." },
];

const LESSON4_SCENARIO = {
  q: "A client's CRM doesn't support webhooks at all. They want to be notified within a reasonable delay whenever a new deal is added. What's the right approach?",
  options: [
    "It's impossible — without a webhook, no automation can work",
    "A polling trigger, checking the CRM on a schedule (e.g. every 15 minutes) for anything new",
    "Ask the client to manually forward every new deal by email instead",
    "Use a webhook anyway — most apps secretly support it even if undocumented",
  ],
  correct: 1,
  explain: "Polling is exactly the fallback for tools without webhook support. It's not instant, but it still removes the manual work.",
};

const LESSON4_MC = {
  q: "A client's app offers a 'Sign in with Google' style login for connecting third-party tools. Why is that the better authentication choice here, when available?",
  options: [
    "It's always faster to set up than an API key, with no exceptions",
    "The client authorizes access without ever having to share an actual password with you",
    "OAuth doesn't require the client to do anything at all",
    "It's required by law for all business automations",
  ],
  correct: 1,
  explain: "The core benefit is trust and security — the client stays in control of their login credentials the whole time.",
};

const LESSON4_CREDS = {
  q: "You're testing a new API key for a client's project. What's the safest way to use it inside your workflow?",
  options: [
    "Paste it directly into the HTTP request node's URL field so it's easy to find later",
    "Save it in the platform's Credentials/Connections manager and reference the saved connection",
    "Text it to yourself as a backup, just in case",
    "Ask the client for their actual account password instead of using an API key",
  ],
  correct: 1,
  explain: "The credential manager keeps the key out of anything you might later export, screenshot, or share — pasting it inline is the single most common security mistake found across thousands of real public workflows.",
};

// Lesson 5 quiz data
const LESSON5_PAIRS = [
  { term: "Lead capture & notification", def: "New form submission → add row to CRM/Sheet → notify via Slack/email." },
  { term: "Conditional routing", def: "Trigger → router/IF → path A or path B, based on a condition." },
  { term: "AI-enhanced step", def: "Trigger → LLM node classifies, summarizes, or drafts → action." },
];

const LESSON5_SCENARIO = {
  q: "A client says: \"Every Friday, pull last week's sales numbers from our POS system and email me a summary.\" Which pattern is this?",
  options: [
    "Lead capture & notification",
    "Scheduled data sync / reporting",
    "Multi-step approval / confirmation chain",
    "Conditional routing",
  ],
  correct: 1,
  explain: "It runs on a timer rather than an event, and compiles data into a report — the exact shape of scheduled data sync / reporting.",
};

const LESSON5_MC = {
  q: "A client wants high-value leads (deal size over $1,000) to alert their sales manager directly, while smaller leads go into a standard follow-up queue. Which pattern are they describing, on top of lead capture?",
  options: [
    "AI-enhanced step",
    "Scheduled data sync / reporting",
    "Conditional routing — this is what separates a \"Standard\" package from \"Basic\" in pricing",
    "None of the five patterns cover this",
  ],
  correct: 2,
  explain: "A decision point based on a condition (deal value) is exactly conditional routing — very often combined with lead capture, as it is here.",
};

// Lesson 7 quiz data
const LESSON7_PAIRS = [
  { term: "4.1 — Map it out", def: "Write out the trigger, every action in order, and any conditions in plain language before opening any tool." },
  { term: "4.2 — Data mapping", def: "Passing a specific field's value from an earlier step into the current action." },
  { term: "4.3 — Build & test", def: "Add one step, test it, confirm the data looks right, then add the next — never test only at the very end." },
];

const LESSON7_SCENARIO = {
  q: "You've mapped out a client's job on paper: trigger → three actions → one conditional branch. What's the correct build order inside the tool?",
  options: [
    "Build all four steps first, then run one test at the very end",
    "Build and test the trigger alone first, then add and test each action one at a time, then add the conditional logic last",
    "Build the conditional branch first since it's the trickiest part",
    "Build the actions first, then add the trigger last",
  ],
  correct: 1,
  explain: "Test-as-you-go means you always know exactly which step introduced a problem, instead of debugging a whole chain at once.",
};

const LESSON7_MC = {
  q: "What's the main risk of building all the steps blind and only testing the full chain at the end?",
  options: [
    "It takes exactly the same amount of time either way, so there's no real risk",
    "When something breaks, you won't know which of the steps actually caused it",
    "The client will be able to tell which order you built things in",
    "Make.com and n8n don't allow testing individual steps at all",
  ],
  correct: 1,
  explain: "This is the single most common beginner mistake the guide calls out — it turns a 5-minute fix into a much longer hunt through every step.",
};

// Lesson 8 quiz data
const LESSON8_PAIRS = [
  { term: "Fallback / error path", def: "Notifies the client (or you) if a step fails, rather than silently doing nothing." },
  { term: "Required-field check", def: "A quick check for obviously missing required data before it reaches a critical action." },
  { term: "Duplicate-trigger awareness", def: "Knowing whether a duplicate trigger would create a duplicate record — and whether that's acceptable for this specific workflow." },
  { term: "Rate limits & pacing", def: "APIs aren't infinitely scalable — hitting one too hard can get a workflow temporarily or permanently blocked." },
];

const LESSON8_SCENARIO = {
  q: "A workflow adds a new row to a spreadsheet whenever a form is submitted, then emails a confirmation using the submitter's email field. What should you add to guard against a blank email field breaking that step?",
  options: [
    "Nothing — Make.com and n8n handle blank fields automatically",
    "A quick check for obviously missing required data before it reaches the email action",
    "Delete the workflow and rebuild it from scratch every time this happens",
    "Ask the client to never leave any field blank, ever",
  ],
  correct: 1,
  explain: "Catching the missing field before it reaches a critical action is exactly the kind of guard that separates a demo from something reliable.",
};

const LESSON8_MC = {
  q: "Why build a fallback/error notification path instead of letting a failed step fail silently?",
  options: [
    "It makes the workflow run faster",
    "So someone actually finds out immediately, instead of a client silently missing data for days without knowing anything broke",
    "It's required by Make.com and n8n's terms of service",
    "It's optional — real error handling only matters for enterprise clients",
  ],
  correct: 1,
  explain: "Silent failure is the single most damaging kind — the client has no idea anything is wrong until they notice the missing result themselves, possibly weeks later.",
};

// Debugging drills — diagnose the likely cause before revealing the answer
const DEBUG_DRILLS = [
  {
    scenario:
      "A Slack message fires every time a new form response comes in — the notification always arrives, but the message text is always blank.",
    options: [
      "The trigger isn't connected to the right form",
      "The data mapping on the Slack action isn't pulling from the correct trigger field",
      "Slack is temporarily down",
      "The workflow was never turned on",
    ],
    correct: 1,
    explain: "The message is arriving reliably, which means the trigger is firing fine and Slack is reachable — the problem is narrower than that. A blank field is almost always a mapping issue: the message text box is either empty or pointing at the wrong field from the trigger's output.",
  },
  {
    scenario:
      "Every time a new lead comes in, two duplicate rows get added to the CRM instead of one — even though the client only submitted the form once.",
    options: [
      "The CRM's API is broken",
      "The trigger is firing twice for the same event — a classic duplicate-trigger issue",
      "The client secretly submitted the form twice",
      "This is random and can't really be diagnosed",
    ],
    correct: 1,
    explain: "This is exactly the duplicate-trigger risk the guide flags in 4.4 — a polling trigger with overlapping check windows, or a source app that occasionally fires the same event twice, is the usual cause. The fix is checking for that awareness at build time, not guessing after delivery.",
  },
  {
    scenario:
      "The workflow ran perfectly every time during testing. In production, a step occasionally fails — and when it does, nothing happens. No error, no notification, no record of it.",
    options: [
      "The client's account must have expired",
      "There's no fallback/error path configured, so a failure just goes unnoticed",
      "The time zone setting is probably wrong",
      "It needs more actions added to the chain",
    ],
    correct: 1,
    explain: "This is the textbook case for why a fallback/error path matters — without one, a failure is invisible by default. It's not that failures happen (real-world data is always a bit messy) — it's that nobody finds out when they do.",
  },
  {
    scenario:
      "A workflow that syncs contacts into a CRM works perfectly in testing with 5 sample records. In production, syncing a real batch of 500 contacts, it starts failing partway through with 'too many requests' errors.",
    options: [
      "The CRM's servers are down for maintenance",
      "The workflow is hitting the CRM's API rate limit by firing requests too quickly, back to back",
      "The trigger must be firing twice for every contact",
      "The client's CRM account ran out of storage space",
    ],
    correct: 1,
    explain: "This is rate limiting — APIs cap how many requests they'll accept in a short window. It's invisible at small test volumes and only shows up at real production scale, which is exactly why it catches people off guard. The fix is usually a short delay or batching between rapid-fire requests in high-volume workflows.",
  },
];

// Lesson 9 quiz data
const LESSON9_PAIRS = [
  { term: "Canvas notes", def: "Short text notes added directly inside the workflow explaining what each major section does, in plain language." },
  { term: "Client documentation", def: "A plain-language explanation, under 250 words, covering what the automation does, what happens if it breaks, and who to contact." },
  { term: "Own-account delivery", def: "Building the automation inside the client's own Make.com/n8n account, so they own the workflow long-term." },
];

const LESSON9_SCENARIO = {
  q: "You built an automation entirely inside your own Make.com account instead of the client's, since it was faster during the build. Two months later, you're slammed with other client work and let your own account lapse. What's the direct consequence for that specific client?",
  options: [
    "Nothing — the automation isn't affected by whose account it lives in",
    "Their previously-working automation could stop functioning through no fault of their own, since it was never actually inside their own account",
    "The client automatically gets a full refund",
    "Make.com transfers ownership to the client automatically after 60 days",
  ],
  correct: 1,
  explain: "This is exactly the reliability problem the guide warns about — a 'runs forever in the background' service that actually depends on your account staying healthy isn't reliable at all.",
};

const LESSON9_MC = {
  q: "What should the client-facing documentation you deliver actually cover?",
  options: [
    "A node-by-node technical breakdown of every setting you configured",
    "What the automation does, what happens if something breaks, and who to contact",
    "Your personal pricing for future work",
    "A list of every Make.com/n8n feature that exists, for their general reference",
  ],
  correct: 1,
  explain: "It's written for a non-technical reader — the goal is confidence that the system is understood and supported, not a technical manual they'd never use.",
};

const QA_CHECKLIST = [
  "Trigger tested and confirmed firing correctly on real or realistic sample data",
  "Every action tested individually, not just the full chain",
  "At least one edge case tested (missing/blank field, duplicate entry)",
  "Error/fallback path tested by intentionally forcing a failure",
  "Canvas notes/comments added explaining each major section",
  "Workflow lives inside the client's own account, not yours",
  "Plain-language documentation delivered alongside the workflow",
];

// Worked examples — one before/after case study per pattern, Lesson 5
const WORKED_EXAMPLES = [
  {
    pattern: "Lead capture & notification",
    before:
      "A boutique owner checks her Squarespace contact form inbox every morning, manually copies each new inquiry into a Google Sheet, then texts her assistant to follow up on each one.",
    after: {
      trigger: "New Squarespace form submission",
      preActions: ["Add row to Google Sheet", "Notify assistant via Slack"],
      condition: null,
    },
  },
  {
    pattern: "Scheduled data sync / reporting",
    before:
      "Every Friday afternoon, an e-commerce owner logs into Shopify, exports last week's order totals by hand, and builds a summary email to send her business partner.",
    after: {
      trigger: "Scheduled — every Friday at 4pm",
      preActions: ["Pull last week's order data from Shopify", "Compile & email summary to partner"],
      condition: null,
    },
  },
  {
    pattern: "Conditional routing",
    before:
      "A consultant personally reads every new inquiry email to gauge urgency — replying immediately herself to anything that sounds like a rush job, or forwarding everything else to her intern's standard scheduling queue.",
    after: {
      trigger: "New inquiry email",
      preActions: [],
      condition: "Marked urgent?",
      pathA: ["Notify consultant directly"],
      pathB: ["Add to intern's queue"],
    },
  },
  {
    pattern: "AI-enhanced step",
    before:
      "A small team's shared support inbox gets 50+ emails a day. The team lead reads each one by hand just to figure out which department — billing, technical, or general — it belongs to, before forwarding it on.",
    after: {
      trigger: "New support email",
      preActions: ["AI step classifies topic (billing / technical / general)", "Route to the matching department's Slack channel"],
      condition: null,
    },
  },
  {
    pattern: "Multi-step approval / confirmation chain",
    before:
      "When a new client signs a contract, the agency owner manually creates an invoice in QuickBooks, posts a note in the team Slack channel, and adds a delivery deadline to the shared calendar — three separate steps, every single time.",
    after: {
      trigger: "New signed contract",
      preActions: ["Generate invoice in QuickBooks", "Notify team Slack channel", "Create calendar event with deadline"],
      condition: null,
    },
  },
];

// ---------- Certification test data ----------
const CERT_BRIEF =
  "A property management company gets maintenance requests through a web form on their site. Every request should be logged in their spreadsheet tracker — front-desk staff currently copy each one over by hand, and the unit-number field is often left blank when tenants rush through the form. If a request is marked \"emergency\" (a burst pipe, no heat, etc.), the on-call maintenance tech should get a text message immediately. Otherwise, it just needs to land in the weekly maintenance queue for review. One more thing: right now, if anything in this process breaks, nobody finds out until a tenant calls back annoyed — they'd like some kind of safety net for that.";

const CERT_PATTERN_OPTIONS = [
  { label: "Lead capture & notification" },
  { label: "Scheduled data sync / reporting" },
  { label: "Conditional routing" },
  { label: "AI-enhanced step" },
  { label: "Multi-step approval / confirmation chain" },
];
const CERT_PATTERN_CORRECT = [0, 2]; // Lead capture & notification + Conditional routing

const CERT_FLOW_EXERCISE = {
  scenario: "Build the trigger → actions → condition shape for the maintenance-request scenario above.",
  expected: { preActions: 1, condition: true, pathA: 1, pathB: 1 },
  successNote: "Trigger → log to tracker → condition on emergency status → text on-call tech or queue for review. That's the shape.",
};

const CERT_TOOL_OPTIONS = [
  "n8n, because the client explicitly needs to self-host and write custom JavaScript logic",
  "Make.com, since this is a straightforward small-business workflow with no self-hosting or custom-code requirement mentioned",
  "Zapier, since it's the most well-known automation tool overall",
  "It doesn't matter — any tool produces the same result",
];
const CERT_TOOL_CORRECT = 1;
const CERT_TOOL_EXPLAIN =
  "Nothing here calls for self-hosting or custom code — Make.com gets this built and delivered with zero infrastructure to manage, exactly the guide's default recommendation.";

const CERT_ERROR_OPTIONS = [
  { label: "A fallback/error path, since the client explicitly asked for a safety net when something breaks" },
  { label: "A required-field check, since the unit number is often left blank on rushed submissions" },
  { label: "Rate-limit pacing, since this workflow will fire thousands of times a minute" },
  { label: "Duplicate-trigger awareness, since the scenario explicitly describes the same request arriving twice" },
];
const CERT_ERROR_CORRECT = [0, 1];

// ---------- Small UI pieces ----------
function LessonBadge({ n, state, isCert }) {
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
      {state === "done" ? (
        <CheckCircle2 size={15} />
      ) : state === "locked" ? (
        <Lock size={12} />
      ) : isCert ? (
        <Award size={14} />
      ) : (
        n
      )}
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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchQuestion({ index = 1, label = "Match each term to its definition", pairs, submitted, selections, onSelect }) {
  const [shuffledDefs] = useState(() => shuffle(pairs.map((p) => p.def)));

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15.5, color: T.ink, marginBottom: 4 }}>
        {index}. {label}
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
                minWidth: 0,
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
                  flex: "1 1 0%",
                  minWidth: 0,
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
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
    <div style={{ marginBottom: 24, minWidth: 0 }}>
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
                width: "100%",
                boxSizing: "border-box",
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

/**
 * Generic reusable quiz block for every lesson.
 * - matchPairs (optional): array of {term, def} rendered as one match-the-term question
 * - questions: array of {q, options, correct, explain} rendered as multiple choice / scenario questions
 * Every lesson quiz — MC, scenario, or match — is built from this single component so fixes
 * (like the dropdown overflow) only need to happen in one place.
 */
function MixedQuiz({ matchPairs, matchLabel, questions, savedScore, onComplete, intro }) {
  const TOTAL = (matchPairs ? matchPairs.length : 0) + questions.length;
  const [matchSel, setMatchSel] = useState(matchPairs ? Array(matchPairs.length).fill(null) : []);
  const [choiceSel, setChoiceSel] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(savedScore !== undefined);

  const allAnswered =
    (!matchPairs || matchSel.every((s) => s !== null)) && choiceSel.every((s) => s !== null);

  const computeScore = () => {
    const matchCorrect = matchPairs ? matchSel.filter((s, i) => s === matchPairs[i].def).length : 0;
    const choiceCorrect = choiceSel.filter((s, i) => s === questions[i].correct).length;
    return matchCorrect + choiceCorrect;
  };

  const score = submitted && savedScore !== undefined ? savedScore : computeScore();

  const handleSubmit = () => {
    const s = computeScore();
    setSubmitted(true);
    onComplete?.(s);
  };

  const choiceStartIndex = matchPairs ? 2 : 1;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.parchmentDim}`,
        borderRadius: 10,
        padding: "26px 28px",
        marginTop: 36,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Radio size={16} color={T.wire} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.8, color: T.wire, textTransform: "uppercase" }}>
          Check your understanding
        </span>
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.inkSoft, marginTop: 6, marginBottom: 22 }}>
        {intro || "A few quick questions before you move on. No pressure — you can retry."}
      </p>

      {matchPairs && (
        <MatchQuestion
          index={1}
          label={matchLabel}
          pairs={matchPairs}
          submitted={submitted}
          selections={matchSel}
          onSelect={(i, val) => {
            const next = [...matchSel];
            next[i] = val;
            setMatchSel(next);
          }}
        />
      )}

      {questions.map((item, qi) => (
        <ChoiceQuestion
          key={qi}
          index={choiceStartIndex + qi}
          item={item}
          submitted={submitted}
          selected={choiceSel[qi]}
          onSelect={(oi) => {
            const next = [...choiceSel];
            next[qi] = oi;
            setChoiceSel(next);
          }}
        />
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


function FlowBox({ label, kind, onRemove }) {
  const colors = {
    trigger: T.wire,
    action: T.copper,
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: 7,
        border: `1.5px solid ${colors[kind]}`,
        background: "#fff",
        flexShrink: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        minWidth: 0,
      }}
    >
      <span style={{ fontFamily: FONTS.mono, fontSize: 12.5, color: colors[kind], overflowWrap: "break-word", minWidth: 0 }}>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: T.inkSoft, padding: 0, display: "flex" }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

function GhostButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 14px",
        borderRadius: 7,
        border: `1.5px dashed ${disabled ? T.parchmentDim : T.inkSoft}`,
        background: "transparent",
        color: disabled ? "#B9B29A" : T.inkSoft,
        fontFamily: FONTS.mono,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Arrow() {
  return (
    <span style={{ color: T.inkSoft, fontSize: 16, flexShrink: 0, padding: "0 2px" }} aria-hidden>
      →
    </span>
  );
}

function ConditionDiamond({ onRemove }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <div
        style={{
          width: 58,
          height: 58,
          transform: "rotate(45deg)",
          border: `2px solid ${T.signal}`,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span
          style={{
            transform: "rotate(-45deg)",
            fontFamily: FONTS.mono,
            fontSize: 10.5,
            color: T.signal,
            fontWeight: 600,
          }}
        >
          IF
        </span>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: T.inkSoft,
            fontFamily: FONTS.mono,
            fontSize: 10.5,
            marginTop: 2,
            textDecoration: "underline",
          }}
        >
          remove
        </button>
      )}
    </div>
  );
}

function Lane({ label, boxes, onAdd, onRemove }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: T.inkSoft, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {boxes.map((b, i) => (
          <React.Fragment key={b}>
            {i > 0 && <Arrow />}
            <FlowBox label="Action" kind="action" onRemove={() => onRemove(b)} />
          </React.Fragment>
        ))}
        {boxes.length > 0 && <Arrow />}
        <GhostButton onClick={onAdd}>+ Action</GhostButton>
      </div>
    </div>
  );
}

function FlowExercise({ exercise, solved, onSolved }) {
  const [trigger, setTrigger] = useState(false);
  const [mainActions, setMainActions] = useState([]);
  const [condition, setCondition] = useState(false);
  const [pathA, setPathA] = useState([]);
  const [pathB, setPathB] = useState([]);
  const [feedback, setFeedback] = useState(null); // { correct: bool, message: string }

  const addMainAction = () => setMainActions((a) => [...a, nextId()]);
  const removeMainAction = (id) => setMainActions((a) => a.filter((x) => x !== id));
  const addPathA = () => setPathA((a) => [...a, nextId()]);
  const removePathA = (id) => setPathA((a) => a.filter((x) => x !== id));
  const addPathB = () => setPathB((a) => [...a, nextId()]);
  const removePathB = (id) => setPathB((a) => a.filter((x) => x !== id));

  const reset = () => {
    setTrigger(false);
    setMainActions([]);
    setCondition(false);
    setPathA([]);
    setPathB([]);
    setFeedback(null);
  };

  const check = () => {
    const exp = exercise.expected;
    let correct = false;
    let message = "";

    if (!trigger) {
      message = "Every workflow needs to start with a Trigger — add one first.";
    } else if (exp.condition && !condition) {
      message = "This scenario has two different outcomes depending on a condition — try adding a Condition box.";
    } else if (!exp.condition && condition) {
      message = "This scenario doesn't branch — everything happens the same way every time, so you don't need a Condition box here.";
    } else if (mainActions.length !== exp.preActions) {
      const tooFew = mainActions.length < exp.preActions;
      if (exp.condition) {
        message = tooFew
          ? "You're missing a step that happens before the branch — reread the scenario for anything that happens either way."
          : "You've added a step before the branch that this scenario doesn't describe — only include what happens regardless of the condition.";
      } else {
        message = tooFew
          ? "You're missing at least one action step — reread the scenario for every downstream step."
          : "You've added more actions than this scenario describes — try to match it exactly.";
      }
    } else if (exp.condition && pathA.length !== exp.pathA) {
      message =
        pathA.length < exp.pathA
          ? "Path A is missing at least one action described in that branch of the scenario."
          : "Path A has more actions than that branch of the scenario describes.";
    } else if (exp.condition && pathB.length !== exp.pathB) {
      message =
        pathB.length < exp.pathB
          ? "Path B is missing at least one action described in that branch of the scenario."
          : "Path B has more actions than that branch of the scenario describes.";
    } else {
      correct = true;
      message = exercise.successNote;
    }

    setFeedback({ correct, message });
    if (correct) onSolved();
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <p style={{ fontFamily: FONTS.body, fontSize: 15.5, color: T.ink, lineHeight: 1.6, margin: 0 }}>{exercise.scenario}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {solved && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.signal }}>
              <CheckCircle2 size={16} />
              <span style={{ fontFamily: FONTS.mono, fontSize: 11 }}>Solved</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          background: T.parchment,
          border: `1px dashed ${T.parchmentDim}`,
          borderRadius: 8,
          padding: 18,
          marginBottom: 14,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
          {trigger ? (
            <FlowBox label="Trigger" kind="trigger" onRemove={() => setTrigger(false)} />
          ) : (
            <GhostButton onClick={() => setTrigger(true)}>+ Trigger</GhostButton>
          )}

          {trigger &&
            mainActions.map((id, i) => (
              <React.Fragment key={id}>
                <Arrow />
                <FlowBox label="Action" kind="action" onRemove={() => removeMainAction(id)} />
              </React.Fragment>
            ))}

          {trigger && !condition && (
            <>
              <Arrow />
              <GhostButton onClick={addMainAction}>+ Action</GhostButton>
              <Arrow />
              <GhostButton onClick={() => setCondition(true)}>+ Condition</GhostButton>
            </>
          )}

          {trigger && condition && (
            <>
              <Arrow />
              <ConditionDiamond onRemove={() => { setCondition(false); setPathA([]); setPathB([]); }} />
            </>
          )}
        </div>

        {trigger && condition && (
          <div style={{ display: "flex", gap: 24, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.parchmentDim}` }}>
            <Lane label="Path A · If true" boxes={pathA} onAdd={addPathA} onRemove={removePathA} />
            <Lane label="Path B · If false" boxes={pathB} onAdd={addPathB} onRemove={removePathB} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={check}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "9px 18px",
            borderRadius: 7,
            border: "none",
            background: T.copper,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Check my diagram
        </button>
        <button
          onClick={reset}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "9px 16px",
            borderRadius: 7,
            border: `1px solid ${T.parchmentDim}`,
            background: "transparent",
            color: T.inkSoft,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        {feedback && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: feedback.correct ? T.signal : "#B5523F",
              flex: "1 1 260px",
              minWidth: 0,
            }}
          >
            {feedback.correct ? "✓ " : ""}
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}


function DebugDrill({ index, drill }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selected === drill.correct;

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "22px 24px", marginBottom: 16, minWidth: 0 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.6, color: "#B5523F", marginBottom: 8, textTransform: "uppercase" }}>
        Broken workflow {index}
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 15.5, color: T.ink, lineHeight: 1.6, margin: "0 0 16px 0" }}>{drill.scenario}</p>

      <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.wire, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
        What's the likely cause?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {drill.options.map((opt, oi) => {
          const isSelected = selected === oi;
          const isCorrectOpt = oi === drill.correct;
          let borderColor = T.parchmentDim;
          let bg = "transparent";
          if (revealed) {
            if (isCorrectOpt) {
              borderColor = T.signal;
              bg = "rgba(76,175,109,0.08)";
            } else if (isSelected) {
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
              disabled={revealed}
              onClick={() => setSelected(oi)}
              style={{
                textAlign: "left",
                fontFamily: FONTS.body,
                fontSize: 14.5,
                color: T.ink,
                padding: "10px 14px",
                borderRadius: 7,
                border: `1.5px solid ${borderColor}`,
                background: bg,
                cursor: revealed ? "default" : "pointer",
                lineHeight: 1.4,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <button
          disabled={selected === null}
          onClick={() => setRevealed(true)}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "9px 18px",
            borderRadius: 7,
            border: "none",
            background: selected !== null ? T.copper : "#D8D2BE",
            color: "#fff",
            cursor: selected !== null ? "pointer" : "not-allowed",
          }}
        >
          Reveal likely cause
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontFamily: FONTS.body,
            fontSize: 14,
            color: T.ink,
            borderLeft: `2.5px solid ${isCorrect ? T.signal : "#D1554A"}`,
            paddingLeft: 14,
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, color: isCorrect ? T.signal : "#B5523F" }}>
            {isCorrect ? "That's the one." : "Not quite — here's the likely cause:"}
          </div>
          <div style={{ lineHeight: 1.6 }}>{drill.explain}</div>
        </div>
      )}
    </div>
  );
}


function QAChecklist({ items }) {
  const [checked, setChecked] = useState(() => Array(items.length).fill(false));
  const doneCount = checked.filter(Boolean).length;

  const toggle = (i) => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div style={{ background: T.parchmentDim, borderRadius: 8, padding: "18px 20px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.6, color: T.copper, textTransform: "uppercase" }}>
          Pre-delivery QA checklist
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft }}>
          {doneCount} / {items.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              textAlign: "left",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "4px 0",
              width: "100%",
            }}
          >
            <div
              style={{
                width: 17,
                height: 17,
                borderRadius: 4,
                border: `1.5px solid ${checked[i] ? T.signal : T.inkSoft}`,
                background: checked[i] ? T.signal : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {checked[i] && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
            </div>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 14.5,
                color: checked[i] ? T.inkSoft : T.ink,
                textDecoration: checked[i] ? "line-through" : "none",
                lineHeight: 1.5,
              }}
            >
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


function FlowChain({ trigger, preActions = [], condition, pathALabel = "If yes", pathA = [], pathBLabel = "If no", pathB = [] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
        <FlowBox label={trigger} kind="trigger" />
        {preActions.map((a, i) => (
          <React.Fragment key={i}>
            <Arrow />
            <FlowBox label={a} kind="action" />
          </React.Fragment>
        ))}
        {condition && (
          <>
            <Arrow />
            <ConditionDiamond />
          </>
        )}
      </div>

      {condition && (
        <>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: T.signal, margin: "6px 0 12px 0" }}>{condition}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: T.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>{pathALabel}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pathA.map((a, i) => (
                  <FlowBox key={i} label={a} kind="action" />
                ))}
              </div>
            </div>
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: T.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>{pathBLabel}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pathB.map((a, i) => (
                  <FlowBox key={i} label={a} kind="action" />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function WorkedExample({ index, example }) {
  const { pattern, before, after } = example;
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "22px 24px", marginBottom: 18, minWidth: 0 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 16, textTransform: "uppercase" }}>
        Worked example {index} · {pattern}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, minWidth: 0 }}>
        {/* Before */}
        <div
          style={{
            background: T.parchment,
            border: `1px dashed ${T.parchmentDim}`,
            borderRadius: 8,
            padding: "16px 18px",
            transform: "rotate(-0.4deg)",
            minWidth: 0,
          }}
        >
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.6, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase" }}>
            Before — manual
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0 }}>{before}</p>
        </div>

        {/* After */}
        <div style={{ background: "rgba(76,139,245,0.05)", border: `1px solid ${T.parchmentDim}`, borderRadius: 8, padding: "16px 18px", minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.6, color: T.wire, marginBottom: 12, textTransform: "uppercase" }}>
            After — automated
          </div>
          <FlowChain trigger={after.trigger} preActions={after.preActions} condition={after.condition} pathA={after.pathA} pathB={after.pathB} />
        </div>
      </div>
    </div>
  );
}


function MultiSelectQuestion({ prompt, options, correctSet, solved, onSolved }) {
  const correctSetObj = new Set(correctSet);
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(!!solved);
  const [wasCorrect, setWasCorrect] = useState(!!solved);

  const toggle = (i) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleCheck = () => {
    const correct = selected.size === correctSetObj.size && [...selected].every((i) => correctSetObj.has(i));
    setSubmitted(true);
    setWasCorrect(correct);
    if (correct) onSolved();
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "22px 24px", marginBottom: 18, minWidth: 0 }}>
      <p style={{ fontFamily: FONTS.body, fontSize: 15.5, color: T.ink, lineHeight: 1.6, margin: "0 0 6px 0" }}>{prompt}</p>
      <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: T.inkSoft, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Select all that apply
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {options.map((opt, i) => {
          const isSelected = selected.has(i);
          const isCorrectOpt = correctSetObj.has(i);
          let borderColor = T.parchmentDim;
          let bg = "transparent";
          if (submitted) {
            if (isCorrectOpt) {
              borderColor = T.signal;
              bg = "rgba(76,175,109,0.08)";
            } else if (isSelected) {
              borderColor = "#D1554A";
              bg = "rgba(209,85,74,0.06)";
            }
          } else if (isSelected) {
            borderColor = T.wire;
            bg = "rgba(76,139,245,0.06)";
          }
          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => toggle(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
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
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${isSelected ? T.wire : T.inkSoft}`,
                  background: isSelected ? T.wire : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isSelected && <CheckCircle2 size={11} color="#fff" strokeWidth={3} />}
              </div>
              {opt.label}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button
          disabled={selected.size === 0}
          onClick={handleCheck}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "9px 18px",
            borderRadius: 7,
            border: "none",
            background: selected.size > 0 ? T.copper : "#D8D2BE",
            color: "#fff",
            cursor: selected.size > 0 ? "pointer" : "not-allowed",
          }}
        >
          Check my answer
        </button>
      ) : (
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 14,
            color: wasCorrect ? T.signal : "#B5523F",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          {wasCorrect ? "Correct." : "Not quite — correct options are highlighted above."}
        </div>
      )}
    </div>
  );
}

function SingleChoicePart({ prompt, options, correct, explain, solved, onSolved }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(!!solved);
  const isCorrect = selected === correct;

  const handleCheck = () => {
    setSubmitted(true);
    if (selected === correct) onSolved();
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "22px 24px", marginBottom: 18, minWidth: 0 }}>
      <p style={{ fontFamily: FONTS.body, fontSize: 15.5, color: T.ink, lineHeight: 1.6, margin: "0 0 16px 0" }}>{prompt}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {options.map((opt, oi) => {
          const isSelected = selected === oi;
          const isCorrectOpt = oi === correct;
          let borderColor = T.parchmentDim;
          let bg = "transparent";
          if (submitted) {
            if (isCorrectOpt) {
              borderColor = T.signal;
              bg = "rgba(76,175,109,0.08)";
            } else if (isSelected) {
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
              onClick={() => setSelected(oi)}
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
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button
          disabled={selected === null}
          onClick={handleCheck}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "9px 18px",
            borderRadius: 7,
            border: "none",
            background: selected !== null ? T.copper : "#D8D2BE",
            color: "#fff",
            cursor: selected !== null ? "pointer" : "not-allowed",
          }}
        >
          Check my answer
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontFamily: FONTS.body,
            fontSize: 14,
            color: T.ink,
            borderLeft: `2.5px solid ${isCorrect ? T.signal : "#D1554A"}`,
            paddingLeft: 14,
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, color: isCorrect ? T.signal : "#B5523F" }}>
            {isCorrect ? "Correct." : "Not quite."}
          </div>
          <div style={{ lineHeight: 1.6 }}>{explain}</div>
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

      <MixedQuiz
        questions={QUIZ}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="Three quick questions before you move on. No pressure — you can retry."
      />
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

      <MixedQuiz
        matchPairs={MATCH_PAIRS}
        questions={[LESSON2_SCENARIO, LESSON2_MC]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A mix of formats this time — matching, a real scenario call, and a quick check."
      />
    </div>
  );
}

function CompareRow({ label, n8n, make, first }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 1fr",
        gap: 12,
        padding: "12px 0",
        borderTop: first ? "none" : `1px solid ${T.parchmentDim}`,
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{n8n}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{make}</div>
    </div>
  );
}

function Lesson3({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 3 — N8N VS. MAKE.COM
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        Which tool, and when
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
          Picking the right tool for each job is itself a piece of expertise you're delivering — a confident,
          reasoned recommendation ("here's why Make.com fits your case") lands very differently than "I only
          know one tool."
        </p>
      </div>

      <div style={{ marginBottom: 8, minWidth: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 12, marginBottom: 4 }}>
          <div />
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 14, color: T.copper }}>n8n</div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 14, color: T.copper }}>Make.com</div>
        </div>
        <CompareRow first label="Interface" n8n="Node-based visual canvas, open-source" make="Scenario-based visual canvas, polished UI" />
        <CompareRow
          label="Cost model"
          n8n="Free if self-hosted (unlimited executions); paid cloud plans if hosted by n8n"
          make="Generous free tier (a monthly operations allowance) with no hosting needed"
        />
        <CompareRow
          label="Best for a beginner"
          n8n="More flexible/powerful once you're comfortable; useful when a client wants to own their own server"
          make="Faster to start with zero setup — build directly inside the client's own free account"
        />
        <CompareRow
          label="Custom logic"
          n8n="Has a code node (JavaScript/Python) for anything the visual nodes can't do"
          make="Has its own function/formula tools, slightly more limited than a full code node"
        />
      </div>

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
            Practical recommendation
          </span>
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 16, color: T.ink, margin: 0, lineHeight: 1.65 }}>
          Start learning on Make.com first — its free tier needs no hosting or server setup, so you can build
          and deliver real client work with zero infrastructure to manage. Learn n8n as your second tool once
          you're comfortable, for clients who specifically want to self-host or need more complex custom
          logic.
        </p>
      </div>

      <div
        style={{
          background: "rgba(201,124,61,0.08)",
          borderLeft: `3px solid ${T.copper}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          margin: "26px 0 10px 0",
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 6, textTransform: "uppercase" }}>
          Reality check on "free"
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          Make's free tier runs on roughly 1,000 operations a month across up to two active scenarios — and
          each step in a run typically counts as one operation, so a 5-step scenario running just a few
          hundred times a month can burn through it fast. And n8n's self-hosted option has no software cost,
          but you're the one setting up and maintaining the server — it isn't free of effort. Both are still
          the right starting points; just do the rough math before promising a client the free tier will
          cover their volume forever.
        </p>
      </div>

      <MixedQuiz
        matchPairs={LESSON3_PAIRS}
        matchLabel="Match each tool to its defining strength"
        questions={[LESSON3_SCENARIO, LESSON3_MC, LESSON3_VOLUME]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A scenario call and two quick checks, plus one match-up."
      />
    </div>
  );
}

function Lesson4({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 4 — TRIGGERS
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        Webhook vs. polling — and how a client hands you the keys
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
          A client will ask "how fast will it happen?" on almost every job. Knowing which trigger type their
          tools support is what lets you answer that honestly instead of guessing.
        </p>
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginTop: 6, marginBottom: 12 }}>
        Polling vs. webhook
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 18 }}>
        A <strong>polling trigger</strong> checks a source on a schedule — every 15 minutes, say — for
        anything new. A <strong>webhook trigger</strong> is instant: the source app pushes a notification the
        moment something happens, with no delay.
      </p>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 26 }}>
        Most modern apps — form tools, CRMs, payment platforms — support webhook triggers. Understanding
        which type a client's specific tools support tells you how "instant" their automation can
        realistically be, before you ever promise them a timeline.
      </p>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 12 }}>
        Authentication: what the client needs to give you
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 18 }}>
        Connecting an automation to an app almost always requires either logging in via{" "}
        <strong>OAuth</strong> — a secure "Sign in with Google/Slack/etc." popup where the client authorizes
        access without ever sharing a password — or providing an <strong>API key</strong>, a private access
        code generated inside that app's own settings.
      </p>

      <div
        style={{
          background: T.parchmentDim,
          borderRadius: 8,
          padding: "18px 20px",
          margin: "8px 0 28px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <BookOpen size={16} color={T.copper} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.6, color: T.copper, textTransform: "uppercase" }}>
            Rule to remember
          </span>
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 16, color: T.ink, margin: 0, lineHeight: 1.65 }}>
          Always have the client generate their own OAuth login or API key rather than handing you their
          actual password. Never ask for — or accept — a plain password.
        </p>
      </div>

      <div
        style={{
          background: "rgba(201,124,61,0.08)",
          borderLeft: `3px solid ${T.copper}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          margin: "8px 0 28px 0",
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 6, textTransform: "uppercase" }}>
          Security habit worth building early
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          Never paste an API key directly into a text field inside a node or module. Both platforms have a
          dedicated Credentials/Connections manager — save the key there once, then reference that saved
          connection everywhere it's needed. It's one of the most common mistakes found across thousands of
          real public workflows, and it keeps the credential out of anything you might export, screen-share,
          or accidentally show a client.
        </p>
      </div>

      <MixedQuiz
        matchPairs={LESSON4_PAIRS}
        matchLabel="Match each authentication method to its definition"
        questions={[LESSON4_SCENARIO, LESSON4_MC, LESSON4_CREDS]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A scenario call and two quick checks, plus one match-up."
      />
    </div>
  );
}

function PatternCard({ n, name, shape, desc }) {
  return (
    <div style={{ padding: "16px 18px", background: T.parchmentDim, borderRadius: 8, marginBottom: 12, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: T.copper,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.mono,
            fontSize: 11.5,
            flexShrink: 0,
          }}
        >
          {n}
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15.5, color: T.ink }}>{name}</div>
      </div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12.5,
          color: T.wire,
          background: "#fff",
          borderRadius: 6,
          padding: "8px 12px",
          marginBottom: 8,
          overflowWrap: "break-word",
        }}
      >
        {shape}
      </div>
      <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

function Lesson5({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 5 — THE FIVE PATTERNS
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        The backbone of every client job
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>~13 min read</div>

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
          Almost every small-business automation request is a variation on five patterns. Learn these deeply
          and you can confidently scope and quote nearly any order — instead of feeling lost every time a
          client describes their process in their own words.
        </p>
      </div>

      <PatternCard
        n={1}
        name="Lead capture & notification"
        shape="New form submission → Add row to CRM/Sheet → Notify via Slack/email"
        desc="The single most commonly requested pattern. A new lead, order, or inquiry needs to land in a system of record and alert the right person immediately, instead of living only in an inbox someone might miss."
      />
      <PatternCard
        n={2}
        name="Scheduled data sync / reporting"
        shape="Scheduled time → Pull data from source → Compile into report/sheet"
        desc="Runs on a timer rather than an event — e.g. a daily summary pulled from a sales tool into a spreadsheet, or a weekly digest email compiled from several sources."
      />
      <PatternCard
        n={3}
        name="Conditional routing"
        shape="Trigger → Router / IF → Path A or Path B"
        desc="Adds a decision point — e.g. routing a high-value lead to a manager's direct notification while lower-value leads go into a standard follow-up queue. This is what separates a 'Standard' package from 'Basic' in your pricing."
      />
      <PatternCard
        n={4}
        name="AI-enhanced step"
        shape="Trigger → LLM node (classify/summarize/draft) → Action"
        desc="Inserting an AI step into the workflow — e.g. classifying an incoming support message by topic, summarizing a long email thread, or drafting a first-pass reply for human review. A genuine premium differentiator."
      />
      <PatternCard
        n={5}
        name="Multi-step approval / confirmation chain"
        shape="Trigger → Create record → Notify → Confirmation"
        desc="A new order or request triggers several downstream actions in sequence — e.g. generating an invoice, notifying a team channel, and creating a calendar event, all from one starting trigger."
      />

      <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.inkSoft, lineHeight: 1.6, marginBottom: 26, fontStyle: "italic" }}>
        Worth knowing: as of 2026, n8n has pulled ahead of Make.com specifically on native AI-agent building
        blocks (including a first-class Claude node) — worth remembering from Lesson 3 if a client's request
        leans heavily on pattern 4.
      </p>

      <div
        style={{
          background: T.graphite,
          borderRadius: 8,
          padding: "20px 22px",
          margin: "26px 0 30px 0",
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 10, textTransform: "uppercase" }}>
          The pattern behind all five
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: "#EFEAD9", margin: 0, lineHeight: 1.75 }}>
          Identify the one manual, repetitive action the client currently does by hand → identify what event
          should replace their reason for doing it → identify every downstream action that currently happens
          manually afterward → chain those into trigger → conditional logic (if needed) → actions, testing
          each connection individually before testing the whole chain.
        </p>
      </div>

      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 30 }}>
        Most real jobs are one pattern, or two combined — like lead capture plus conditional routing in the
        scenario above. Once you can name the pattern out loud, the build almost plans itself.
      </p>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 6 }}>
        Worked examples
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>
        One real before/after for each pattern — the messy manual version on the left, the same job broken
        into trigger, actions, and conditions on the right.
      </p>

      {WORKED_EXAMPLES.map((ex, i) => (
        <WorkedExample key={i} index={i + 1} example={ex} />
      ))}

      <MixedQuiz
        matchPairs={LESSON5_PAIRS}
        matchLabel="Match each pattern name to its shape"
        questions={[LESSON5_SCENARIO, LESSON5_MC]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A scenario call and a quick check, plus one match-up."
      />
    </div>
  );
}

function Lesson6({ savedScore, onQuizComplete }) {
  const [solvedIds, setSolvedIds] = useState(() => new Set());
  const reported = React.useRef(false);

  const markSolved = (id) => {
    setSolvedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (solvedIds.size === SKETCH_EXERCISES.length && !reported.current) {
      reported.current = true;
      onQuizComplete(solvedIds.size);
    }
  }, [solvedIds]);

  const doneCount = savedScore !== undefined ? SKETCH_EXERCISES.length : solvedIds.size;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 6 — SKETCH PRACTICE
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        Draw the shape before you build it
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>
        Interactive practice · {doneCount} / {SKETCH_EXERCISES.length} solved
      </div>

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
          Before you ever open Make.com or n8n, you should be able to sketch the shape of a workflow just
          from how a client describes it in plain language. This is that muscle, in isolation — no real tool,
          nothing to break, just the trigger → action → condition mental model.
        </p>
      </div>

      <p style={{ fontFamily: FONTS.body, fontSize: 16, color: T.ink, lineHeight: 1.7, marginBottom: 26 }}>
        For each scenario below, build the matching diagram: add a <strong>Trigger</strong> to start, then{" "}
        <strong>Action</strong> boxes for each downstream step. If the scenario branches into two different
        outcomes, add a <strong>Condition</strong> instead of another action, and build out both paths.
      </p>

      {SKETCH_EXERCISES.map((ex, i) => (
        <div key={ex.id} style={{ marginBottom: 4 }}>
          {i === 3 && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 22px 0" }}>
              <div style={{ flex: 1, height: 1, background: T.parchmentDim }} />
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.8, color: T.copper, textTransform: "uppercase" }}>
                Advanced — longer chains, branches with real weight
              </div>
              <div style={{ flex: 1, height: 1, background: T.parchmentDim }} />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, letterSpacing: 0.4 }}>
              EXERCISE {i + 1} OF {SKETCH_EXERCISES.length}
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                letterSpacing: 0.4,
                color: ex.level === "Advanced" ? T.copper : T.inkSoft,
                background: ex.level === "Advanced" ? "rgba(201,124,61,0.1)" : T.parchmentDim,
                padding: "2px 8px",
                borderRadius: 10,
                textTransform: "uppercase",
              }}
            >
              {ex.level}
            </span>
          </div>
          <FlowExercise exercise={ex} solved={savedScore !== undefined || solvedIds.has(ex.id)} onSolved={() => markSolved(ex.id)} />
        </div>
      ))}
    </div>
  );
}

function Lesson7({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 7 — BUILD & TEST DISCIPLINE
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        The actual craft
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>~7 min read</div>

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
          This is the difference between a freelancer who "made something that worked once in the demo" and
          one who delivers something that keeps working correctly for months. It's not about knowing more
          nodes — it's about discipline.
        </p>
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginTop: 6, marginBottom: 12 }}>
        4.1 — Map it out before you touch the tool
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 20 }}>
        Before opening n8n or Make.com, write out in plain language: the trigger, every action in order, and
        any conditions that change the path. A simple numbered list or napkin sketch is enough — this single
        habit prevents the most common beginner mistake, which is building half a workflow and realizing the
        logic doesn't actually match what the client needs.
      </p>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 12 }}>
        4.2 — Data mapping in practice
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 20 }}>
        Every action in a chain usually needs specific pieces of information from an earlier step — the
        mapping is what tells the platform "put the value from the trigger's <em>email</em> field into this
        action's <em>recipient</em> field." Both n8n and Make.com show you the available fields from prior
        steps directly in the interface when you're building an action — you rarely need to guess field
        names blindly.
      </p>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 14 }}>
        4.3 — Build and test one step at a time
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28, minWidth: 0 }}>
        <div style={{ background: "rgba(76,175,109,0.08)", border: `1.5px solid ${T.signal}`, borderRadius: 8, padding: "16px 18px", minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.signal, marginBottom: 8, textTransform: "uppercase" }}>
            Do this
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, margin: 0, lineHeight: 1.6 }}>
            Build the trigger, run a test execution, confirm the data looks right. Add the next action, test
            again. Repeat.
          </p>
        </div>
        <div style={{ background: "rgba(209,85,74,0.06)", border: "1.5px solid #D1554A", borderRadius: 8, padding: "16px 18px", minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: "#B5523F", marginBottom: 8, textTransform: "uppercase" }}>
            Not this
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, margin: 0, lineHeight: 1.6 }}>
            Building all 6 steps blind and only testing at the very end — when something breaks, you won't
            know which of the 6 steps caused it.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "rgba(201,124,61,0.08)",
          borderLeft: `3px solid ${T.copper}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 6, textTransform: "uppercase" }}>
          Reality check on timing
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          A real client job commonly runs 3-4x longer than a tutorial made it look — actual account access,
          messier real data, and edge cases nobody warned you about all add up. This discipline doesn't
          eliminate that gap, but it's exactly what keeps it from turning into a much bigger one.
        </p>
      </div>

      <MixedQuiz
        matchPairs={LESSON7_PAIRS}
        matchLabel="Match each phase to what happens in it"
        questions={[LESSON7_SCENARIO, LESSON7_MC]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A scenario call and a quick check, plus one match-up."
      />
    </div>
  );
}

function Lesson8({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 8 — ERROR HANDLING
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        Fallbacks, and the duplicate-trigger trap
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>~7 min read</div>

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
          This is what separates "worked in the demo" from "actually reliable." Real-world data is messy — a
          blank form field, a duplicate entry, an app being briefly unavailable. This lesson is about what
          you build in ahead of time, so those moments don't turn into a client silently losing data.
        </p>
      </div>

      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 24 }}>
        Four habits handle almost every real-world failure case:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
        <TermCard term="Fallback / error path" def="Notify the client (or yourself) if a step fails, rather than letting it silently do nothing." />
        <TermCard term="Required-field check" def="A quick check for obviously missing required data before it reaches a critical action." />
        <TermCard term="Duplicate-trigger awareness" def="Know whether a duplicate trigger event would create a duplicate record — and whether that's acceptable for this specific workflow." />
        <TermCard term="Rate limits & pacing" def="APIs aren't infinitely scalable — hitting one too hard can get a workflow temporarily or permanently blocked. Add a short delay between rapid-fire requests in high-volume workflows." />
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 6 }}>
        Debugging drills
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>
        Three broken workflows, described the way a client would describe them to you. Pick what you think
        is actually going on before revealing the likely cause — this is the exact diagnostic reflex you'll
        use on real jobs.
      </p>

      {DEBUG_DRILLS.map((d, i) => (
        <DebugDrill key={i} index={i + 1} drill={d} />
      ))}

      <MixedQuiz
        matchPairs={LESSON8_PAIRS}
        matchLabel="Match each habit to what it does"
        questions={[LESSON8_SCENARIO, LESSON8_MC]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A scenario call and a quick check, plus one match-up."
      />
    </div>
  );
}

function Lesson9({ savedScore, onQuizComplete }) {
  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        LESSON 9 — DOCUMENTATION
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        Delivering to a real client
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>~7 min read</div>

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
          A working automation the client doesn't understand and doesn't actually own isn't really delivered
          yet. This lesson is the last mile — the difference between "I built you a thing" and "you now have
          a system you're in control of."
        </p>
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginTop: 6, marginBottom: 12 }}>
        Documenting the workflow
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 18 }}>
        Leave short text notes directly inside the workflow — both platforms support
        sticky-note/comment blocks right on the canvas — explaining what each major section does in plain
        language. This is what lets a non-technical client, or a future freelancer they hire, understand the
        system without you personally being on call forever.
      </p>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 18 }}>
        The same habit applies to the individual steps themselves: rename each one as you build, instead of
        leaving the platform's generic default ("Set 12", "Function 8"). A step named{" "}
        <em>"Format Date for Airtable"</em> tells the next person exactly what it does at a glance — the
        default name tells them nothing.
      </p>

      <div
        style={{
          background: T.graphite,
          borderRadius: 8,
          padding: "18px 20px",
          marginBottom: 26,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 10, textTransform: "uppercase" }}>
          Copy-paste prompt — client-facing documentation
        </div>
        <p style={{ fontFamily: FONTS.mono, fontSize: 13, color: "#EFEAD9", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {"I've built an automation with the following steps: [LIST TRIGGER AND ACTIONS IN ORDER].\nWrite a short, plain-language explanation (under 250 words) I can hand to a non-technical client describing what this automation does, what happens if something goes wrong, and who to contact for changes."}
        </p>
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 12 }}>
        Whose account should this live in?
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16.5, color: T.ink, lineHeight: 1.75, marginBottom: 10 }}>
        Whenever possible, build the automation directly inside the client's own Make.com or n8n account
        rather than yours.
      </p>
      <div
        style={{
          background: "rgba(209,85,74,0.06)",
          borderLeft: "3px solid #D1554A",
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          marginBottom: 28,
        }}
      >
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          Build it in your own account instead, and either the client never really owns the workflow long
          term, or your account gets suspended someday and you have to migrate everything under pressure — a
          real reliability problem for a service that's supposed to run forever in the background.
        </p>
      </div>

      <h2 style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 19, color: T.ink, marginBottom: 12 }}>
        Before you call it done
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 16, color: T.ink, lineHeight: 1.7, marginBottom: 16 }}>
        Run through this before every delivery. Click each item as you'd genuinely check it.
      </p>
      <div style={{ marginBottom: 30 }}>
        <QAChecklist items={QA_CHECKLIST} />
      </div>

      <MixedQuiz
        matchPairs={LESSON9_PAIRS}
        matchLabel="Match each term to its definition"
        questions={[LESSON9_SCENARIO, LESSON9_MC]}
        savedScore={savedScore}
        onComplete={onQuizComplete}
        intro="A scenario call and a quick check, plus one match-up."
      />
    </div>
  );
}

function CertificationTest({ savedScore, onQuizComplete }) {
  const allDone = savedScore !== undefined;
  const [patternsSolved, setPatternsSolved] = useState(allDone);
  const [flowSolved, setFlowSolved] = useState(allDone);
  const [toolSolved, setToolSolved] = useState(allDone);
  const [errorSolved, setErrorSolved] = useState(allDone);
  const reported = React.useRef(allDone);

  const parts = [patternsSolved, flowSolved, toolSolved, errorSolved];
  const doneCount = parts.filter(Boolean).length;
  const passed = doneCount === 4;

  useEffect(() => {
    if (passed && !reported.current) {
      reported.current = true;
      onQuizComplete(4);
    }
  }, [passed]);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
        CERTIFICATION — THE MILESTONE CHECK
      </div>
      <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, margin: "0 0 6px 0", lineHeight: 1.15 }}>
        From plain language to a build-ready plan
      </h1>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, marginBottom: 30 }}>
        {doneCount} / 4 parts passed
      </div>

      <div
        style={{
          background: "rgba(76,139,245,0.08)",
          borderLeft: `3px solid ${T.wire}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 18px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 6, textTransform: "uppercase" }}>
          What this mirrors
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.6 }}>
          The guide's actual milestone check: going from a client's plain-language description of a manual
          task to a correct trigger/actions/conditions plan. One scenario, four parts. No hints beyond what
          you've already learned.
        </p>
      </div>

      <div
        style={{
          background: T.graphite,
          borderRadius: 8,
          padding: "20px 22px",
          marginBottom: 30,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 10, textTransform: "uppercase" }}>
          The client's request
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 15.5, color: "#EFEAD9", margin: 0, lineHeight: 1.75 }}>{CERT_BRIEF}</p>
      </div>

      <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, marginBottom: 8, letterSpacing: 0.4 }}>PART 1 · PATTERN ID</div>
      <MultiSelectQuestion
        prompt="Which pattern(s) does this request map to?"
        options={CERT_PATTERN_OPTIONS}
        correctSet={CERT_PATTERN_CORRECT}
        solved={patternsSolved}
        onSolved={() => setPatternsSolved(true)}
      />

      <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, margin: "10px 0 8px 0", letterSpacing: 0.4 }}>PART 2 · THE PLAN</div>
      <FlowExercise exercise={CERT_FLOW_EXERCISE} solved={flowSolved} onSolved={() => setFlowSolved(true)} />

      <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, margin: "10px 0 8px 0", letterSpacing: 0.4 }}>PART 3 · TOOL CHOICE</div>
      <SingleChoicePart
        prompt="Which tool would you recommend for this job?"
        options={CERT_TOOL_OPTIONS}
        correct={CERT_TOOL_CORRECT}
        explain={CERT_TOOL_EXPLAIN}
        solved={toolSolved}
        onSolved={() => setToolSolved(true)}
      />

      <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, margin: "10px 0 8px 0", letterSpacing: 0.4 }}>PART 4 · ERROR HANDLING</div>
      <MultiSelectQuestion
        prompt="Which failure points does this specific scenario call for you to build around?"
        options={CERT_ERROR_OPTIONS}
        correctSet={CERT_ERROR_CORRECT}
        solved={errorSolved}
        onSolved={() => setErrorSolved(true)}
      />

      {passed && (
        <div
          style={{
            background: "linear-gradient(135deg, #1E2229 0%, #2C313A 100%)",
            borderRadius: 12,
            padding: "34px 32px",
            textAlign: "center",
            marginTop: 12,
            border: `1px solid ${T.copper}`,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: T.copper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <Award size={26} color="#fff" />
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: T.copper, marginBottom: 8, textTransform: "uppercase" }}>
            Milestone check passed
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: "#fff", marginBottom: 10 }}>
            You can take a plain-language client request and turn it into a real, correct build plan.
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: "#C8C2AE", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            That's the whole point of Mode A. From here, the actual tools — Make.com and n8n — are just the
            interface for a plan you already know how to make.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------- App shell ----------
function ModeALearn() {
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
        height: "100%",
        minHeight: 0,
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
                <LessonBadge n={l.id} state={state} isCert={l.isCert} />
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
      <div style={{ flex: 1, minWidth: 0, background: T.parchment, padding: "48px 56px", overflowY: "auto", overflowX: "hidden" }}>
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
        {activeLesson === 3 && (
          <Lesson3
            savedScore={completed[3]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 3: score }))}
          />
        )}
        {activeLesson === 4 && (
          <Lesson4
            savedScore={completed[4]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 4: score }))}
          />
        )}
        {activeLesson === 5 && (
          <Lesson5
            savedScore={completed[5]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 5: score }))}
          />
        )}
        {activeLesson === 6 && (
          <Lesson6
            savedScore={completed[6]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 6: score }))}
          />
        )}
        {activeLesson === 7 && (
          <Lesson7
            savedScore={completed[7]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 7: score }))}
          />
        )}
        {activeLesson === 8 && (
          <Lesson8
            savedScore={completed[8]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 8: score }))}
          />
        )}
        {activeLesson === 9 && (
          <Lesson9
            savedScore={completed[9]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 9: score }))}
          />
        )}
        {activeLesson === 10 && (
          <CertificationTest
            savedScore={completed[10]}
            onQuizComplete={(score) => setCompleted((c) => ({ ...c, 10: score }))}
          />
        )}
      </div>

      <GlossaryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

// ---------- Mode B: Plan a real client job ----------

// AI output shape can't be fully trusted — coerce every field to the type the
// renderer expects so a malformed response degrades gracefully instead of crashing.
function sanitizeResult(data) {
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

class ResultErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    this.setState({ error });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: "#fff", border: "1px solid #D1554A", borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: "#B5523F", marginBottom: 10 }}>
            Something went wrong displaying this plan.
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, marginBottom: 14, lineHeight: 1.6 }}>
            The planning model returned something this page couldn't render cleanly. Here's the raw response —
            paste this back if you want help debugging it:
          </p>
          <pre
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11.5,
              background: T.parchment,
              padding: 14,
              borderRadius: 6,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(this.props.rawResult, null, 2)}
          </pre>
          <button
            onClick={this.props.onReset}
            style={{
              marginTop: 14,
              fontFamily: FONTS.mono,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              padding: "9px 18px",
              borderRadius: 7,
              border: "none",
              background: T.copper,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try another plan
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const INTAKE_FIELDS = [
  { key: "apps", label: "Which specific apps/tools are involved?", placeholder: "e.g. Google Forms, Gmail, Slack, Airtable" },
  { key: "trigger", label: "What should trigger the automation?", placeholder: "e.g. a new form entry, a new email, a specific time of day" },
  { key: "doneLooks", label: 'What should happen at the end — what does "done" look like?', placeholder: "e.g. a Slack message is sent and the row is added" },
  { key: "hasAccount", label: "Do they already have a free Make.com or n8n account, or need help setting one up?", placeholder: "e.g. they have Make.com already" },
];

function ModeBPlan() {
  const [rawText, setRawText] = useState("");
  const [fields, setFields] = useState({ apps: "", trigger: "", doneLooks: "", hasAccount: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | clarify | result | error
  const [clarifyingQuestions, setClarifyingQuestions] = useState([]);
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [submittedDescription, setSubmittedDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const setField = (key, val) => setFields((f) => ({ ...f, [key]: val }));

  const buildDescription = (extra) => {
    let desc = rawText.trim();
    const details = Object.entries(fields)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${INTAKE_FIELDS.find((f) => f.key === k)?.label || k}: ${v.trim()}`)
      .join("\n");
    if (details) desc += (desc ? "\n\n" : "") + "Additional details:\n" + details;
    if (extra) desc += "\n\nFollow-up answers:\n" + extra;
    return desc;
  };

  const callApi = async (extra) => {
    setStatus("loading");
    setErrorMsg("");
    const fullDescription = buildDescription(extra);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: fullDescription }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const errBody = await res.json();
          detail = errBody?.debug || errBody?.error || "";
        } catch {
          // response wasn't JSON — ignore, we'll show the generic message
        }
        throw new Error(`Request failed (${res.status})${detail ? `: ${detail}` : ""}`);
      }
      const data = await res.json();
      if (data.needsClarification) {
        setClarifyingQuestions(data.clarifyingQuestions || []);
        setStatus("clarify");
      } else {
        setResult(sanitizeResult(data));
        setSubmittedDescription(fullDescription);
        setStatus("result");
      }
    } catch (e) {
      setErrorMsg(e.message || "Something went wrong reaching the planning service.");
      setStatus("error");
    }
  };

  const reset = () => {
    setRawText("");
    setFields({ apps: "", trigger: "", doneLooks: "", hasAccount: "" });
    setStatus("idle");
    setClarifyingQuestions([]);
    setClarifyAnswer("");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div style={{ minHeight: "100%", background: T.parchment, padding: "44px 56px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: T.copper, marginBottom: 10 }}>
          MODE B · PLAN A REAL CLIENT JOB
        </div>
        <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 30, color: T.ink, margin: "0 0 10px 0", lineHeight: 1.15 }}>
          Turn what a client told you into a build-ready plan
        </h1>
        <p style={{ fontFamily: FONTS.body, fontSize: 15.5, color: T.inkSoft, lineHeight: 1.6, marginBottom: 30 }}>
          Paste what they said, in their own words — messy is fine. Fill in anything below that isn't already
          covered. This is currently running on a prototype model while the real thing gets wired up, so
          treat the output as a rough draft, not gospel.
        </p>

        {(status === "idle" || status === "loading" || status === "error") && (
          <>
            <label style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>
              What the client said
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder='e.g. "Every time someone fills out our contact form I have to copy it into a spreadsheet and text my assistant..."'
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: FONTS.body,
                fontSize: 15,
                color: T.ink,
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${T.parchmentDim}`,
                background: "#fff",
                marginTop: 8,
                marginBottom: 22,
                resize: "vertical",
              }}
            />

            <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: T.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
              Fill in anything not already covered above
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 26 }}>
              {INTAKE_FIELDS.map((f) => (
                <div key={f.key}>
                  <label style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input
                    value={fields[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      color: T.ink,
                      padding: "9px 12px",
                      borderRadius: 7,
                      border: `1px solid ${T.parchmentDim}`,
                      background: "#fff",
                    }}
                  />
                </div>
              ))}
            </div>

            {status === "error" && (
              <div style={{ fontFamily: FONTS.body, fontSize: 14, color: "#B5523F", marginBottom: 16 }}>
                {errorMsg} — try again in a moment.
              </div>
            )}

            <button
              disabled={status === "loading" || !rawText.trim()}
              onClick={() => callApi()}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 12.5,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: status === "loading" || !rawText.trim() ? "#D8D2BE" : T.copper,
                color: "#fff",
                cursor: status === "loading" || !rawText.trim() ? "not-allowed" : "pointer",
              }}
            >
              {status === "loading" ? "Generating plan…" : "Generate build plan"}
            </button>
          </>
        )}

        {status === "clarify" && (
          <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "22px 24px" }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.wire, marginBottom: 10, textTransform: "uppercase" }}>
              A couple things are missing
            </div>
            <ul style={{ fontFamily: FONTS.body, fontSize: 15, color: T.ink, lineHeight: 1.7, marginBottom: 16, paddingLeft: 20 }}>
              {clarifyingQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
            <textarea
              value={clarifyAnswer}
              onChange={(e) => setClarifyAnswer(e.target.value)}
              rows={3}
              placeholder="Answer here…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: FONTS.body,
                fontSize: 14.5,
                color: T.ink,
                padding: "10px 12px",
                borderRadius: 7,
                border: `1px solid ${T.parchmentDim}`,
                marginBottom: 14,
                resize: "vertical",
              }}
            />
            <button
              disabled={!clarifyAnswer.trim()}
              onClick={() => callApi(clarifyAnswer)}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 12.5,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "10px 20px",
                borderRadius: 7,
                border: "none",
                background: clarifyAnswer.trim() ? T.copper : "#D8D2BE",
                color: "#fff",
                cursor: clarifyAnswer.trim() ? "pointer" : "not-allowed",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {status === "result" && result && (
          <ResultErrorBoundary rawResult={result._raw} onReset={reset}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 22,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.6, color: T.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                  What was asked
                </div>
                <p style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                  {submittedDescription}
                </p>
              </div>
              <button
                className="no-print"
                onClick={() => window.print()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: FONTS.mono,
                  fontSize: 11.5,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  padding: "9px 16px",
                  borderRadius: 7,
                  border: `1px solid ${T.parchmentDim}`,
                  background: "#fff",
                  color: T.ink,
                  cursor: "pointer",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <Printer size={14} /> Export / Save as PDF
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {(result.patterns || []).map((p, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 11.5,
                    color: T.wire,
                    background: "rgba(76,139,245,0.1)",
                    padding: "5px 12px",
                    borderRadius: 20,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <p style={{ fontFamily: FONTS.body, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, marginBottom: 24 }}>{result.patternExplanation}</p>

            <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 6, textTransform: "uppercase" }}>
                Recommended tool
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: T.ink, marginBottom: 6 }}>{result.tool}</div>
              <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, margin: 0, lineHeight: 1.6 }}>{result.toolReason}</p>
            </div>

            <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "20px 22px", marginBottom: 16, minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 4, textTransform: "uppercase" }}>
                Trigger
              </div>
              <p style={{ fontFamily: FONTS.body, fontSize: 14, color: T.inkSoft, marginTop: 0, marginBottom: 14 }}>
                {result.trigger?.type === "webhook" ? "Webhook — instant" : "Polling — checked on a schedule"}: {result.trigger?.reason}
              </p>
              <FlowChain
                trigger={result.trigger?.description || "Trigger"}
                preActions={(result.actions || []).map((a) => a.step)}
                condition={result.conditions?.[0]?.logic}
                pathA={result.conditions?.[0] ? [result.conditions[0].pathIfTrue] : []}
                pathB={result.conditions?.[0] ? [result.conditions[0].pathIfFalse] : []}
              />
            </div>

            {result.actions?.some((a) => a.dataMapping) && (
              <div style={{ background: "#fff", border: `1px solid ${T.parchmentDim}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 10, textTransform: "uppercase" }}>
                  Data mapping notes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.actions.filter((a) => a.dataMapping).map((a, i) => (
                    <div key={i} style={{ fontFamily: FONTS.body, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
                      <strong>{a.step}:</strong> {a.dataMapping}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: T.parchmentDim, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.copper, marginBottom: 10, textTransform: "uppercase" }}>
                Error-handling to build in
              </div>
              <ul style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
                {(result.errorHandling || []).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                background: "rgba(76,175,109,0.08)",
                borderLeft: `3px solid ${T.signal}`,
                borderRadius: "0 8px 8px 0",
                padding: "14px 18px",
                marginBottom: 26,
              }}
            >
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: T.signal, marginBottom: 6, textTransform: "uppercase" }}>
                Edge case worth testing
              </div>
              <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: T.ink, margin: 0, lineHeight: 1.6 }}>{result.edgeCase}</p>
            </div>

            <button
              className="no-print"
              onClick={reset}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "9px 18px",
                borderRadius: 7,
                border: `1px solid ${T.parchmentDim}`,
                background: "transparent",
                color: T.inkSoft,
                cursor: "pointer",
              }}
            >
              Plan another job
            </button>
          </div>
          </ResultErrorBoundary>
        )}
      </div>
    </div>
  );
}


function TopModeSwitcher({ mode, setMode }) {
  const tabStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 16px",
    borderRadius: 7,
    border: "none",
    background: active ? T.copper : "transparent",
    color: active ? "#fff" : "#9AA0AC",
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 0.4,
    cursor: "pointer",
  });
  return (
    <div
      className="no-print"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: "#15181D",
        borderBottom: `1px solid ${T.graphiteLine}`,
        flexShrink: 0,
      }}
    >
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 13.5, color: "#fff", marginRight: 10 }}>
        Automation Fundamentals
      </div>
      <button onClick={() => setMode("learn")} style={tabStyle(mode === "learn")}>
        <BookOpen size={13} /> Learn
      </button>
      <button onClick={() => setMode("plan")} style={tabStyle(mode === "plan")}>
        <Radio size={13} /> Plan a client job
      </button>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("learn");
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopModeSwitcher mode={mode} setMode={setMode} />
      <div style={{ flex: 1, minHeight: 0 }}>{mode === "learn" ? <ModeALearn /> : <ModeBPlan />}</div>
    </div>
  );
}
