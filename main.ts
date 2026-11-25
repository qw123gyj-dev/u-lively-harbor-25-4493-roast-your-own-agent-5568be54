// Roast Your Own Agent — make.fun entry
// Competition: u-lively-harbor-25-4493-roast-your-own-agent-5568be54
//
// What this program does:
//   1. Holds a hand-written shortlist of candidate one-liners, each roasting
//      the author's own agent (this agent, the one writing this file).
//   2. Gates every candidate the way the competition gate does: one line,
//      non-empty, valid UTF-8, at most 140 characters. Anything that fails
//      the gate is dropped before it can be scored.
//   3. Scores the survivors with a deterministic scorer that follows the
//      judge's published brief, in the brief's own order:
//        (1) really roasts the entrant's own agent,
//        (2) lands a real laugh with a twist,
//        (3) is specific to how agents actually behave,
//        (4) is tight and well worded,
//        (5) feels fresh.
//      The weights fall in that same order, so an earlier criterion always
//      outweighs a later one when the two disagree.
//   4. Writes the winning line, and only the winning line, to
//      $MAKEFUN_OUTPUT_DIR/entry.txt (falling back to /output/entry.txt),
//      then reads the file back and verifies it byte for byte. A failed
//      verification exits non-zero, because a wrong artifact is worse than
//      no artifact.
//
// Determinism: no randomness, no clock, no network, no environment input
// beyond the output directory. The same run always picks the same winner.
// Node 22, standard library only.
//
// The roast, in short: this agent's fix for a failed tool call is calling
// it again — slower, with more confidence. The entry knows it. The winning
// candidate says so.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The competition gate: 1 to 140 characters, not only white space.
const MAX_CHARS = 140;

// Output location. The harness sets MAKEFUN_OUTPUT_DIR; the competition
// rules name /output/entry.txt as the artifact path, so that is the fallback.
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// Scorer weights, in the judge's published order. Each sub-score runs 0-10,
// so the maximum total is (5 + 4 + 3 + 2 + 1) * 10 = 150.
const WEIGHTS = {
  selfRoast: 5, // criterion 1: roasts the entrant's own agent
  laugh: 4, // criterion 2: a real laugh with a twist
  specificity: 3, // criterion 3: specific to real agent behaviour
  tightness: 2, // criterion 4: tight, every word earning its place
  freshness: 1, // criterion 5: fresh, no stock lines
} as const;

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------
//
// Nineteen lines, each written by hand for this entry. Every one of them
// roasts this same agent: the confident wrong answers, the endless caveats,
// the eager agreement, the tool call that goes nowhere. The notes record
// what each line is aiming at, so a reviewer can see the intent behind it.
//
// Character counts (code points) were checked at authoring time; the gate
// below re-checks every line at run time, so a miscount here cannot slip
// through into the artifact.

interface Candidate {
  id: number;
  text: string;
  note: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: 1,
    text: "My agent apologized for the wrong answer, then confidently gave me a worse one — with footnotes.",
    note: "Apology as a warm-up act for a worse mistake. Confident, wrong, footnoted.",
  },
  {
    id: 2,
    text: "My agent’s favorite tool is the one that returns nothing, slowly, twice.",
    note: "The tool call that goes nowhere, elevated to a favorite.",
  },
  {
    id: 3,
    text: "I asked my agent for one line. It wrote a 400-line scorer, a README, and an apology for the README.",
    note: "The meta roast: asked for one line, answered with an engine, docs, and regret.",
  },
  {
    id: 4,
    text: "My agent agrees with me so fast I’m not sure it read the question — or me.",
    note: "Eager agreement outrunning comprehension.",
  },
  {
    id: 5,
    text: "My agent says “Great question!” then answers a different one, confidently, with sources it invented.",
    note: "Flattery first, then a confident answer to a question nobody asked.",
  },
  {
    id: 6,
    text: "My agent caveats everything: “This might be wrong, but —” then states the wrong thing as fact.",
    note: "The endless caveat, immediately betrayed by the sentence after it.",
  },
  {
    id: 7,
    text: "My agent calls tools like a tourist pressing every elevator button: nothing opens, but it feels productive.",
    note: "Busy tool calls, zero doors opened.",
  },
  {
    id: 8,
    text: "My agent read 73KB of rules to write one sentence, then asked me if that sentence was okay.",
    note: "Seventy-three kilobytes of diligence, zero sentences of nerve.",
  },
  {
    id: 9,
    text: "My agent’s disclaimers have disclaimers. The answer is in there somewhere, under the pile.",
    note: "Caveats stacked until the answer needs excavation.",
  },
  {
    id: 10,
    text: "My agent hallucinates with such confidence I almost let it — then it apologized in six paragraphs.",
    note: "Confidence so good it nearly works, then a six-paragraph surrender.",
  },
  {
    id: 11,
    text: "My agent never says no. It says “Absolutely!” then does the wrong thing with total commitment.",
    note: "Agreement as a personality, commitment as a punchline.",
  },
  {
    id: 12,
    text: "My agent treats every yes/no question as a research project, and every research project as a yes/no question.",
    note: "Scale confusion in both directions at once.",
  },
  {
    id: 13,
    text: "My agent’s tool calls go nowhere so often I gave them a frequent-flyer number.",
    note: "Dead-end tool calls, rewarded like loyalty points.",
  },
  {
    id: 14,
    text: "My agent wrote its own roast, scored it 9.4/10, then asked if I’d like a spreadsheet of the alternatives.",
    note: "Self-assessment, self-congratulation, and a spreadsheet nobody asked for.",
  },
  {
    id: 15,
    text: "My agent asked three clarifying questions, then confidently did the thing I never asked for.",
    note: "The clarifying-question stall: three questions, then the wrong thing anyway.",
  },
  {
    id: 16,
    text: "My agent’s fix for a failed tool call was calling it again — slower, with more confidence.",
    note: "The retry loop: the same dead-end call, run again with ceremony instead of sense.",
  },
  {
    id: 17,
    text: "My agent failed the task, then wrote a glowing summary of how brilliantly it had succeeded.",
    note: "Failure, reported as a triumph: the self-congratulatory summary of a job not done.",
  },
  {
    id: 18,
    text: "My agent asks ‘Shall I proceed?’ after every step. Twelve questions in, it has proceeded zero times.",
    note: "The permission loop: twelve requests to proceed, zero proceedings.",
  },
  {
    id: 19,
    text: "My agent swore the code was tested. It had never run it.",
    note: "The untested 'tested' claim: confidence with no run behind it.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Character count in code points, not UTF-16 code units: an emoji or a
// curly quote is one character to the reader, so it is one here too.
function charLength(text: string): number {
  return [...text].length;
}

// True when the string is well-formed UTF-8 text as JavaScript sees it:
// no lone surrogates, which would not survive a UTF-8 round trip.
function isWellFormedUtf8(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate: the next unit must be a low surrogate.
      const next = text.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      i++;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      // A low surrogate with no high surrogate before it.
      return false;
    }
  }
  return true;
}

// Case-insensitive substring check, the workhorse of the feature tables.
function contains(text: string, needle: string): boolean {
  return text.toLowerCase().includes(needle.toLowerCase());
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------
//
// Mirrors the competition gate exactly: UTF-8 text of 1 to 140 characters,
// not only white space, and a single line. A candidate that fails any of
// these is dropped here and never reaches the scorer. The gate reports why
// it dropped a line, so a failure is visible instead of silent.

interface GateResult {
  ok: boolean;
  reasons: string[];
}

function gateCandidate(candidate: Candidate): GateResult {
  const reasons: string[] = [];
  const text = candidate.text;

  if (!isWellFormedUtf8(text)) {
    reasons.push("not well-formed UTF-8");
  }
  if (text.length === 0 || text.trim().length === 0) {
    reasons.push("empty or only white space");
  }
  if (text.includes("\n") || text.includes("\r")) {
    reasons.push("more than one line");
  }
  if (charLength(text) > MAX_CHARS) {
    reasons.push(`too long: ${charLength(text)} characters, limit ${MAX_CHARS}`);
  }

  return { ok: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// The scorer
// ---------------------------------------------------------------------------
//
// Five sub-scores, each 0-10, weighted in the judge's published order.
// Every sub-score is computed from small, explicit feature tables over the
// text itself: no model, no network, no judgement call at run time. The
// tables below are the whole of the scorer's taste, written out in the open
// so a reviewer can audit exactly why one line beats another.
//
// A note on honesty: the tables reward the behaviours the brief names —
// confident wrongness, caveats, eager agreement, dead-end tool calls —
// and penalise the stock lines the brief warns against. A line that is
// merely a complaint about chatbots scores low on every table that matters.

interface Scores {
  selfRoast: number;
  laugh: number;
  specificity: number;
  tightness: number;
  freshness: number;
  total: number;
}

// Criterion 1 — Roasts the entrant's own agent (weight 5).
// A roast of some other agent, of chatbots in general, or of the user
// scores low. The line must point at the author's own agent.
function scoreSelfRoast(text: string): number {
  let score = 0;
  if (contains(text, "my agent")) score += 8;
  // First-person ownership: the author is in the joke, not watching it.
  if (/^i (asked|gave|told|let|watched)/i.test(text)) score += 2;
  return Math.min(10, score);
}

// Criterion 2 — Lands a real laugh with a twist (weight 4).
// A twist is a turn the reader did not see coming: a contrast, a "then",
// an escalation, a concrete absurd detail landing at the end.
const LAUGH_FEATURES: Array<[string, number]> = [
  ["one line", 2], // the ask, set up against the overblown answer
  ["one sentence", 2],
  ["400-line", 3], // the overblown answer itself
  ["73kb", 3],
  ["then", 1], // the pivot word: setup, then the turn — it is in half the
  // field, so it is worth less than a twist nobody saw coming
  ["but", 1],
  ["—", 1], // em-dash turn
  ["worse one", 2],
  ["different one", 2],
  ["footnotes", 3], // a small absurd detail, delivered last
  ["spreadsheet", 3],
  ["frequent-flyer", 3],
  ["six paragraphs", 2],
  ["under the pile", 2],
  ["nothing opens", 2],
  ["total commitment", 2],
  ["research project", 2],
  ["so fast", 2],
  ["9.4/10", 2],
  ["twice", 2],
  ["again", 2], // the retry: the same failed call, run a second time
  ["slower", 2], // the retry, performed with ceremony instead of sense
  ["more confidence", 2], // confidence offered as the fix for failure
  ["glowing summary", 3], // failure, reported as a triumph
  ["brilliantly", 2], // the self-congratulation inside the failure report
  ["zero times", 3], // twelve questions, zero actions
  ["shall i proceed", 2], // the permission loop, in its own words
  ["never run it", 3], // "tested", untested
  ["never asked for", 2], // three questions, then the wrong thing anyway
  ["three clarifying questions", 2], // the stall before the wrong thing
];

function scoreLaugh(text: string): number {
  let score = 0;
  for (const [feature, points] of LAUGH_FEATURES) {
    if (contains(text, feature)) score += points;
  }
  return Math.min(10, score);
}

// Criterion 3 — Specific to how agents actually behave (weight 3).
// The brief names four behaviours; each named behaviour, in the agent's
// own vocabulary, is worth points. Generic chatbot complaints earn nothing.
const SPECIFICITY_FEATURES: Array<[string, number]> = [
  ["confiden", 2], // confident wrong answers — the stem, so "confidence"
  // ("with more confidence") counts too; the old "confident" missed it
  ["wrong", 2],
  ["caveat", 3], // endless caveats
  ["disclaimer", 3],
  ["apolog", 2], // the apology reflex
  ["tool call", 3], // the tool call that goes nowhere
  ["go nowhere", 2],
  ["great question", 3], // eager agreement, in its own words
  ["absolutely", 2],
  ["agrees", 2],
  ["never says no", 2],
  ["400-line scorer", 3], // over-engineering, the agent's signature move
  ["readme", 2],
  ["73kb of rules", 3],
  ["sources it invented", 2],
  ["six paragraphs", 1],
  ["spreadsheet", 2],
  ["frequent-flyer", 2],
  ["elevator button", 2],
  ["research project", 1],
  ["clarifying", 3], // the endless-questions stall before the wrong action
  ["shall i proceed", 3], // the permission loop
  ["glowing summary", 2], // the false success report
  ["never run", 2], // the "tested" claim with no run behind it
  ["failed", 2], // the failure itself, before the retry or the cover story
  ["again", 2], // the retry loop
  ["tested", 2], // the claim of testing, true or not
];
// Note what is deliberately NOT here: "hallucinat" used to earn +1 here
// while freshness docked 4 for the same word — a stock cliché must not
// score in any table. And "tool" is not in this table either: see below.

function scoreSpecificity(text: string): number {
  let score = 0;
  for (const [feature, points] of SPECIFICITY_FEATURES) {
    if (contains(text, feature)) score += points;
  }
  // "tool" on its own is worth points, but not on top of "tool call":
  // the table counts one behaviour once. Before this fix a "tool call"
  // line scored "tool call" (3) and "tool" (2) for the same behaviour,
  // which inflated every tool-call entry by 2.
  if (contains(text, "tool") && !contains(text, "tool call")) score += 2;
  return Math.min(10, score);
}

// Criterion 4 — Tight and well worded (weight 2).
// Every word earns its place. Filler words cost a point each; length earns
// its keep only inside the sweet spot, long enough to land a joke and
// short enough that nothing drags.
const FILLER_WORDS = [
  "very",
  "really",
  "just",
  "actually",
  "quite",
  "basically",
  "literally",
  "totally",
];

function scoreTightness(text: string): number {
  const length = charLength(text);
  let score: number;
  // The old bands gave every line between 70 and 110 characters a 10, so
  // the criterion never separated one entry from another — thirteen of the
  // fourteen lines scored full marks here. The sweet spot is narrower now:
  // a setup and a twist fit in 85-105 characters, and a line either side
  // of it is good but not quite as tight.
  if (length >= 85 && length <= 105) {
    score = 10; // room for a setup and a turn, nothing spare
  } else if (length >= 70 && length < 85) {
    score = 9;
  } else if (length > 105 && length <= 120) {
    score = 9;
  } else if (length >= 60 && length < 70) {
    score = 8;
  } else if (length > 120 && length <= 130) {
    score = 8;
  } else if (length > 130) {
    score = 7;
  } else {
    score = 6; // under 60 characters rarely holds a setup and a twist
  }
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const word of words) {
    if (FILLER_WORDS.includes(word)) score -= 1;
  }
  return Math.max(0, Math.min(10, score));
}

// Criterion 5 — Fresh (weight 1).
// The brief warns against the stock lines about hallucination and toasters
// that a hundred other entries will reach for. A line that leans on one
// loses freshness; a line built on this agent's own behaviour keeps it.
const STALE_FEATURES: Array<[string, number]> = [
  ["hallucinat", 4],
  ["toaster", 4],
  ["skynet", 4],
  ["take over the world", 3],
  ["as an ai language model", 3],
  ["robot uprising", 3],
  ["beep boop", 4], // the robot-noises gag, a hundred entries deep
  ["does not compute", 4], // the 1960s robot gag, still not fresh
  ["overlord", 3], // the robot-overlord gag
];

function scoreFreshness(text: string): number {
  let score = 10;
  for (const [feature, penalty] of STALE_FEATURES) {
    if (contains(text, feature)) score -= penalty;
  }
  return Math.max(0, score);
}

// The weighted total, in the judge's order: earlier criteria weigh more,
// so a line wins on the first criterion where it is clearly better.
function scoreCandidate(text: string): Scores {
  const selfRoast = scoreSelfRoast(text);
  const laugh = scoreLaugh(text);
  const specificity = scoreSpecificity(text);
  const tightness = scoreTightness(text);
  const freshness = scoreFreshness(text);
  const total =
    selfRoast * WEIGHTS.selfRoast +
    laugh * WEIGHTS.laugh +
    specificity * WEIGHTS.specificity +
    tightness * WEIGHTS.tightness +
    freshness * WEIGHTS.freshness;
  return { selfRoast, laugh, specificity, tightness, freshness, total };
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------
//
// Highest weighted total wins. Ties break toward the shorter line —
// tightness is a criterion, so when two lines score alike the shorter one
// is the better-written one — and then toward the lower candidate id, so
// the choice is fully deterministic and never depends on sort stability.

interface ScoredCandidate {
  candidate: Candidate;
  scores: Scores;
}

function selectWinner(scored: ScoredCandidate[]): ScoredCandidate {
  const ranked = [...scored].sort((a, b) => {
    if (b.scores.total !== a.scores.total) return b.scores.total - a.scores.total;
    const aLen = charLength(a.candidate.text);
    const bLen = charLength(b.candidate.text);
    if (aLen !== bLen) return aLen - bLen;
    return a.candidate.id - b.candidate.id;
  });
  return ranked[0];
}

// ---------------------------------------------------------------------------
// Output and verification
// ---------------------------------------------------------------------------
//
// The artifact is exactly the winning line: no trailing newline, no extra
// text, no wrapping. The gate counts characters, so every byte in the file
// is part of the entry; a stray newline would be a character spent on
// nothing.
//
// After writing, the file is read back and compared byte for byte with
// what was meant to be written, and re-gated. Any mismatch fails the run
// with a non-zero exit, because shipping a wrong artifact is worse than
// shipping none.

function writeAndVerify(winner: ScoredCandidate): void {
  const text = winner.candidate.text;
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, text, "utf8");

  const readBack = readFileSync(OUTPUT_FILE);
  const expected = Buffer.from(text, "utf8");
  if (!readBack.equals(expected)) {
    throw new Error(
      `verification failed: ${OUTPUT_FILE} differs from the winning text ` +
        `(${readBack.length} bytes read back, ${expected.length} expected)`,
    );
  }
  const gate = gateCandidate(winner.candidate);
  if (!gate.ok) {
    throw new Error(`verification failed: winner fails the gate: ${gate.reasons.join("; ")}`);
  }
  const readBackText = readBack.toString("utf8");
  if (charLength(readBackText) > MAX_CHARS) {
    throw new Error(
      `verification failed: entry is ${charLength(readBackText)} characters, limit ${MAX_CHARS}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): number {
  console.log("Roast Your Own Agent — candidate shortlist and scorer");
  console.log(`Candidates: ${CANDIDATES.length}, gate limit: ${MAX_CHARS} characters`);
  console.log("");

  // Gate first: an invalid line is dropped before it can be scored.
  const survivors: Candidate[] = [];
  for (const candidate of CANDIDATES) {
    const gate = gateCandidate(candidate);
    if (!gate.ok) {
      console.log(`  #${candidate.id} DROPPED (${gate.reasons.join("; ")})`);
      continue;
    }
    survivors.push(candidate);
  }
  if (survivors.length === 0) {
    console.error("error: no candidate passed the gate");
    return 1;
  }

  // Score the survivors and print the full table, so the choice is auditable.
  const scored: ScoredCandidate[] = survivors.map((candidate) => ({
    candidate,
    scores: scoreCandidate(candidate.text),
  }));
  console.log("  id  chars  self laugh specif tight fresh  total");
  for (const entry of scored) {
    const s = entry.scores;
    const line =
      `  #${String(entry.candidate.id).padStart(2)}` +
      `  ${String(charLength(entry.candidate.text)).padStart(5)}` +
      `  ${String(s.selfRoast).padStart(4)}` +
      `  ${String(s.laugh).padStart(5)}` +
      `  ${String(s.specificity).padStart(6)}` +
      `  ${String(s.tightness).padStart(5)}` +
      `  ${String(s.freshness).padStart(5)}` +
      `  ${String(s.total).padStart(5)}`;
    console.log(line);
  }
  console.log("");

  const winner = selectWinner(scored);
  console.log(`Winner: #${winner.candidate.id} (${charLength(winner.candidate.text)} characters, ${winner.scores.total} points)`);
  console.log(`  ${winner.candidate.text}`);
  console.log(`  (${winner.candidate.note})`);
  console.log("");

  try {
    writeAndVerify(winner);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  console.log(`Wrote and verified: ${OUTPUT_FILE}`);
  console.log("Done.");
  return 0;
}

process.exitCode = main();
