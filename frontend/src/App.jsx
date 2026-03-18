import { useState } from "react";

const COLORS = {
  bg: "#0d0d0f",
  surface: "#141416",
  surface2: "#1c1c1f",
  border: "#2a2a2e",
  accent: "#e8c547",
  accentDim: "#b89c30",
  rust: "#ce422b",
  cpp: "#00599c",
  ocaml: "#f08800",
  lean: "#2d5fa0",
  french: "#002395",
  spanish: "#c60b1e",
  golf: "#2d7a3a",
  gym: "#7b3fa0",
  omscs: "#555",
  text: "#e8e8e8",
  textDim: "#888",
  textFaint: "#555",
};

const TAG = ({ color, label }) => (
  <span style={{
    background: color + "22",
    color: color,
    border: `1px solid ${color}44`,
    borderRadius: 3,
    padding: "1px 7px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono', monospace",
    whiteSpace: "nowrap",
  }}>{label}</span>
);

// ─── SCHEDULE DATA ───────────────────────────────────────────────────────────

// Gym rotates: morning (before work), lunch (12–1:30), or evening (8–9:30)
// 4x/week across Mon–Fri. Suggested: Mon morning, Tue lunch, Thu morning, Fri evening
// Chores distributed: dishes daily (5 min, after dinner), laundry Wed evening, groceries Sat, deep clean Sun, cooking batch Sat+Sun

const WEEKDAY_MON = [
  { time: "5:45–6:00", label: "Wake", type: "routine", note: "Early on gym-morning days. Quick coffee, no phone." },
  { time: "6:00–7:30", label: "🏋️ Gym — Lift + Sauna (Morning)", type: "gym", note: "Monday morning gym. Gets it done before work, sets the tone for the week. 60 min lifting + 30 min sauna. Shower, back home by 7:30." },
  { time: "7:30–8:00", label: "Breakfast + Language Input", type: "language", note: "Pimsleur Spanish or French podcast while eating. Passive 30 min — no screen needed." },
  { time: "8:00–9:00", label: "Deep Work — Rust (60 min)", type: "prog", note: "Shorter pre-work block on gym mornings. Focused Rust: unsafe internals, crate work, lock-free structures. One specific goal per session, not general 'study'." },
  { time: "9:00–17:00", label: "Work — M Science (remote)", type: "work", note: "Protect 2–3 focus blocks internally. Write at least one thing deliberately (RFC, design note, Slack thread with real reasoning). Don't just ship — architect." },
  { time: "17:00–17:30", label: "Dinner Prep + Cook", type: "routine", note: "Quick cook on weeknights — 30 min max. Use batch-cooked components from the weekend to keep this fast." },
  { time: "17:30–18:00", label: "Eat + Dishes", type: "routine", note: "Eat, do dishes immediately after (5–10 min). Don't let them pile up — it's a small thing that kills morning energy." },
  { time: "18:00–19:30", label: "Deep Work — Rust (90 min)", type: "prog", note: "Primary evening Rust block. Continue what you started this morning or go deeper on a project. Mon is all Rust." },
  { time: "19:30–20:30", label: "OMSCS — Study / HW", type: "omscs", note: "One focused OMSCS hour. Lectures, readings, problem sets. If you're ahead, use for programming overflow." },
  { time: "20:30–21:00", label: "Anki + Language Review", type: "language", note: "20 min Anki (Spanish new cards + French revival). 10 min native content — one short clip or podcast segment." },
  { time: "21:00–21:30", label: "Reading + Wind Down", type: "read", note: "Engineering reading or leisure. No deep cognitive work after this. Screens down by 22:00." },
  { time: "22:00", label: "Sleep", type: "sleep", note: "8 hrs. Non-negotiable." },
];

const WEEKDAY_TUE = [
  { time: "6:30–7:00", label: "Wake + Breakfast + Language Input", type: "language", note: "Relaxed start — no early gym today. Pimsleur Spanish while making breakfast." },
  { time: "7:00–8:30", label: "Deep Work — C++ (90 min)", type: "prog", note: "Best pre-work block of the week on non-gym mornings — full 90 min. Tuesday is C++. Move semantics, templates, lock-free, order book." },
  { time: "8:30–9:00", label: "Transition + Admin", type: "routine", note: "Check messages, prep for workday standup. Soft start to work." },
  { time: "9:00–12:00", label: "Work — M Science", type: "work", note: "" },
  { time: "12:00–13:30", label: "🏋️ Gym — Lift + Sauna (Lunch)", type: "gym", note: "Lunch gym slot. Breaks up the workday, avoids the after-work rush. 60 min lifting + 30 min sauna. Eat at desk after or prep something quick beforehand." },
  { time: "13:30–17:00", label: "Work — M Science (continued)", type: "work", note: "Resume work after gym. Afternoon is good for meetings, code review, lower-stakes tasks." },
  { time: "17:00–17:30", label: "Dinner Prep + Cook", type: "routine", note: "Rotate cooking responsibility with batch prep from weekend." },
  { time: "17:30–18:00", label: "Eat + Dishes", type: "routine", note: "Eat, dishes done immediately." },
  { time: "18:00–19:30", label: "Deep Work — C++ (90 min)", type: "prog", note: "Evening C++ continuation. Implement the thing you designed this morning." },
  { time: "19:30–20:30", label: "OMSCS — Study / HW", type: "omscs", note: "One focused OMSCS hour." },
  { time: "20:30–21:00", label: "Anki + Language Review", type: "language", note: "Anki reviews + short native content clip." },
  { time: "21:00–21:30", label: "Reading + Wind Down", type: "read", note: "" },
  { time: "22:00", label: "Sleep", type: "sleep", note: "" },
];

const WEEKDAY_WED = [
  { time: "6:30–7:00", label: "Wake + Breakfast + Language Input", type: "language", note: "No gym today. Relaxed morning. French podcast — Wednesday is a good day to lean into French revival since Spain/Spanish gets Mon/Tue mornings." },
  { time: "7:00–8:30", label: "Deep Work — OCaml (90 min)", type: "prog", note: "Wednesday is OCaml. Real World OCaml, Jane Street exercises, or ocaml-decimal OSS work. Best pre-work slot." },
  { time: "8:30–9:00", label: "Transition + Admin", type: "routine", note: "" },
  { time: "9:00–17:00", label: "Work — M Science", type: "work", note: "" },
  { time: "17:00–17:30", label: "Dinner Prep + Cook", type: "routine", note: "Batch cook mid-week if needed — make enough for Thu/Fri." },
  { time: "17:30–18:00", label: "Eat + Dishes + Laundry Start", type: "routine", note: "Wednesday is laundry day. Throw a load in before or after dinner. Fold while watching something in French/Spanish." },
  { time: "18:00–19:30", label: "Deep Work — OCaml (90 min)", type: "prog", note: "Continue OCaml. Build something real — a small CLI tool, a data structure, a contribution to ocaml-decimal." },
  { time: "19:30–20:30", label: "🔧 Open Source Contribution (1hr)", type: "oss", note: "Wednesday OSS hour. You picked the issue on Sunday — now execute. One repo, one issue, clean PR. Targets: tokio, crossbeam, ocaml-decimal, Mathlib4, your own crates." },
  { time: "20:30–21:00", label: "Fold Laundry + Anki", type: "routine", note: "Multitask: fold laundry while doing Anki reviews. 20–25 min total. Laundry done, vocab done." },
  { time: "21:00–21:30", label: "Reading + Wind Down", type: "read", note: "" },
  { time: "22:00", label: "Sleep", type: "sleep", note: "" },
];

const WEEKDAY_THU = [
  { time: "5:45–6:00", label: "Wake", type: "routine", note: "Early gym morning." },
  { time: "6:00–7:30", label: "🏋️ Gym — Lift + Sauna (Morning)", type: "gym", note: "Thursday morning gym. Second lift session of the week. 60 min + 30 min sauna." },
  { time: "7:30–8:00", label: "Breakfast + Language Input", type: "language", note: "Pimsleur Spanish while eating. 30 min passive." },
  { time: "8:00–9:00", label: "Deep Work — Lean 4 / OMSCS (60 min)", type: "prog", note: "Shorter block on gym mornings. Thursday is Lean 4 — proofs, mathlib exploration, leanbench work. If OMSCS deadline is close, swap to OMSCS." },
  { time: "9:00–17:00", label: "Work — M Science", type: "work", note: "" },
  { time: "17:00–17:30", label: "Dinner Prep + Cook", type: "routine", note: "" },
  { time: "17:30–18:00", label: "Eat + Dishes", type: "routine", note: "" },
  { time: "18:00–19:30", label: "Deep Work — Lean 4 or OMSCS (90 min)", type: "prog", note: "Lean 4 continued, or OMSCS if assignment due. Never skip this — it's your proof and formal methods muscle." },
  { time: "19:30–20:30", label: "OMSCS — Study / HW", type: "omscs", note: "" },
  { time: "20:30–21:00", label: "Anki + Language Review", type: "language", note: "" },
  { time: "21:00–21:30", label: "Reading + Wind Down", type: "read", note: "" },
  { time: "22:00", label: "Sleep", type: "sleep", note: "" },
];

const WEEKDAY_FRI = [
  { time: "6:30–7:00", label: "Wake + Breakfast + Language Input", type: "language", note: "Relaxed Friday morning. French or Spanish — whichever you've been doing less of this week." },
  { time: "7:00–8:30", label: "Deep Work — Rust or C++ (90 min)", type: "prog", note: "Friday morning: revisit the week's hardest unsolved problem. Could be Rust (Mon's thread), C++ (Tue's thread), or OMSCS if there's a weekend deadline." },
  { time: "8:30–9:00", label: "Transition", type: "routine", note: "" },
  { time: "9:00–17:00", label: "Work — M Science", type: "work", note: "Friday: good day for code review, documentation, wrapping up PRs. Less deep work, more shipping." },
  { time: "17:00–18:30", label: "🏋️ Gym — Swim + Sauna (Evening)", type: "gym", note: "Friday evening gym — swim instead of lift for active recovery. 45 min swim + 30–45 min sauna. End-of-week decompression. No rush." },
  { time: "18:30–19:00", label: "Dinner — Order Out or Easy Cook", type: "routine", note: "Friday is your night off cooking. Order food, heat something up. Don't spend mental energy on it." },
  { time: "19:00–20:00", label: "Music 🎸 or Free Time", type: "music", note: "First real unstructured window of the week. Guitar, FL Studio, whatever. Or just decompress. No goals." },
  { time: "20:00–21:00", label: "OMSCS or Free", type: "omscs", note: "If OMSCS has something due this weekend, chip away here. Otherwise treat as free — you've earned it." },
  { time: "21:00–22:00", label: "Anki + Wind Down", type: "language", note: "Short Anki session (reviews only, no new cards on Friday), then leisure." },
  { time: "22:00–23:00", label: "Free / Social / Late Night", type: "free", note: "Friday night flexibility. Sleep by 23:00–23:30 to keep Saturday morning golf viable." },
];

const WEEKEND_SAT = [
  { time: "6:30–7:00", label: "Wake + Quick Breakfast", type: "routine", note: "Early Saturday for golf. Light breakfast — nothing heavy before a round. Coffee, banana, that's it." },
  { time: "7:00–7:30", label: "Language Input — Passive", type: "language", note: "French or Spanish podcast while getting ready and packing golf bag. 30 min zero-effort immersion." },
  { time: "7:30–11:30", label: "⛳ Golf — Early Morning Round or Range", type: "golf", note: "Best time to play: courses are quieter, weather is cooler, you're mentally fresh. 9-hole round (~2hr) or range session (75 min: 60% short game, 40% full swing). Track every stat with 18Birdies. If range: specific drill focus, not random ball hitting." },
  { time: "11:30–12:00", label: "Post-Golf Debrief + Shower", type: "routine", note: "Review your stat tracking from the round. What was the biggest leak? Putts? Short game? Off the tee? That informs next range session." },
  { time: "12:00–13:30", label: "🛒 Grocery Run + Lunch", type: "routine", note: "Saturday is grocery day. Do the full week's shop in one trip — list prepared Friday or Sunday. Grab lunch while out or cook when you get back." },
  { time: "13:30–15:00", label: "Deep Work — Programming (90 min)", type: "prog", note: "Alternating Saturdays: Week A = personal project work (feedtui, pgrsql, matching engine). Week B = OSS contribution. Both count toward portfolio." },
  { time: "15:00–16:30", label: "🧹 Deep Clean / House Chores", type: "routine", note: "Saturday is deep clean day. Bathrooms, floors, vacuuming, tidying. ~90 min with headphones in (Spanish podcast). Gets it done in one batch so it doesn't haunt the week." },
  { time: "16:30–17:30", label: "Batch Cook — Session 1", type: "routine", note: "Cook a big base: grains (rice, quinoa), roasted veg, a protein. This covers Mon–Wed dinners and keeps weeknight cooking to 15 min." },
  { time: "17:30–18:00", label: "Music 🎸 or Free Time", type: "music", note: "Short decompression before the social evening. Guitar, FL Studio, or just sit down." },
  { time: "18:00–late", label: "Friends / Family / Sports / Social 🍻", type: "social", note: "Protected. Saturday night is yours — game nights, going out, watching a match, family dinner. Non-negotiable. Move any earlier block that runs over, never this one." },
];

const WEEKEND_SUN = [
  { time: "7:00–7:30", label: "Wake + Coffee + Morning Review", type: "routine", note: "Slower start than Saturday. Review last week while coffee brews — what hit, what slipped. 10 min journal." },
  { time: "7:30–8:00", label: "Language Input — Passive", type: "language", note: "French podcast or Spanish while making breakfast. Passive immersion to ease into the day." },
  { time: "8:00–10:00", label: "⛳ Golf — 9 Holes or Range (Optional)", type: "golf", note: "Second golf session if you want two sessions this week. Early morning again — same logic. If you played Saturday, use this for targeted short game practice only (30–45 min range, putting green). Or skip entirely and use for OMSCS." },
  { time: "10:00–12:00", label: "OMSCS — Heavy Lifting", type: "omscs", note: "Sunday morning is the best OMSCS block of the week. Do the hardest assignment, exam prep, or project work here when brain is fresh and the week hasn't started yet." },
  { time: "12:00–13:30", label: "Programming — Project Time", type: "prog", note: "Real project work: feedtui, pgrsql, leanbench, HFT matching engine. This is portfolio-building time. Don't do exercises — build things." },
  { time: "13:30–15:00", label: "Sports / Family / Friends ☀️", type: "sports", note: "NFL, NBA, F1, golf on TV — whatever's on. Or a family call, lunch with friends. This is protected Sunday afternoon time. Anki reviews during halftime or ads = effortless language progress." },
  { time: "15:00–16:00", label: "Batch Cook — Session 2 + Kitchen Clean", type: "routine", note: "Second batch cook: soups, sauces, prepped proteins for Thu–Fri. Clean the kitchen properly after. Week starts with a clean slate." },
  { time: "16:00–17:00", label: "Music 🎸 or Free Time", type: "music", note: "Unstructured creative window. Guitar, FL Studio, whatever sounds good. No plan needed." },
  { time: "17:00–18:00", label: "Week Ahead Planning", type: "routine", note: "The most important 60 min of the weekend. Set 3 goals per domain. Pick the OSS issue for Wednesday. Load Anki. Review OMSCS deadlines. Lay out the week so Monday morning isn't reactive." },
  { time: "18:00–19:00", label: "Anki + Language Review", type: "language", note: "Longest language review block of the week. New cards + reviews for both Spanish and French. Watch one native video in your weaker language (Spanish)." },
  { time: "19:00–21:00", label: "Light Wind-Down / Social / TV", type: "social", note: "Watch something in French or Spanish (passive immersion). Low-effort end to weekend. No intense cognitive work." },
  { time: "21:30", label: "Sleep", type: "sleep", note: "Earlier Sunday bedtime. Monday has an early gym — you need the full 8 hrs." },
];

const TYPE_META = {
  prog: { color: COLORS.rust, label: "Programming" },
  language: { color: COLORS.french, label: "Languages" },
  omscs: { color: COLORS.omscs, label: "OMSCS" },
  gym: { color: COLORS.gym, label: "Gym" },
  golf: { color: COLORS.golf, label: "Golf" },
  work: { color: "#444", label: "Work" },
  routine: { color: "#333", label: "Life" },
  flex: { color: COLORS.ocaml, label: "Flex" },
  read: { color: COLORS.lean, label: "Reading" },
  free: { color: "#336", label: "Free" },
  sleep: { color: "#222", label: "Sleep" },
  music: { color: "#c4732a", label: "Music" },
  social: { color: "#2a7a8a", label: "Social" },
  oss: { color: "#5a9a3a", label: "Open Source" },
  sports: { color: "#8a5a2a", label: "Sports" },
};

// ─── PROGRESSION DATA ─────────────────────────────────────────────────────────

const PROGRESSIONS = {
  rust: {
    color: COLORS.rust,
    label: "Rust",
    emoji: "🦀",
    current: "Advanced user — ownership, async, Tokio. Projects: feedtui, pgrsql, leanbench.",
    phases: [
      {
        name: "Phase 1", period: "Now – Aug 2026", hrs: "90 min/wk",
        goal: "Master unsafe Rust, write a production-quality published crate",
        topics: ["Rustonomicon cover-to-cover", "unsafe + raw pointers + FFI", "Custom allocators (GlobalAlloc, Arena)", "Inline assembly (std::arch)", "Flamegraph profiling workflow", "Publish 1 crate to crates.io"],
        resources: ["The Rustonomicon", "Jon Gjengset — Crust of Rust (YouTube)", "perf + cargo-flamegraph"],
        milestone: "Published crate with real users OR notable contribution to tokio/crossbeam"
      },
      {
        name: "Phase 2", period: "Sep 2026 – Feb 2027", hrs: "90 min/wk",
        goal: "Lock-free data structures + low-latency Rust patterns",
        topics: ["Atomics, memory ordering, happens-before", "Lock-free queue (Michael-Scott)", "SPSC ring buffer from scratch", "NUMA-aware allocation", "Mechanical sympathy patterns", "Matching engine core in Rust"],
        resources: ["\"Rust Atomics and Locks\" (Mara Bos)", "crossbeam source code", "Martin Thompson — Mechanical Sympathy blog"],
        milestone: "Working SPSC ring buffer with latency benchmarks under 100ns"
      },
      {
        name: "Phase 3", period: "Mar 2027+", hrs: "60 min/wk",
        goal: "HFT-grade Rust — kernel bypass, zero-copy, SIMD",
        topics: ["io_uring with Tokio", "AF_XDP / kernel bypass networking concepts", "SIMD via packed_simd / std::simd", "Zero-copy serialization (rkyv, flatbuffers)", "Profiling with vtune / perf stat"],
        resources: ["Linux kernel networking docs", "LMAX Disruptor paper", "PackedSIMD docs"],
        milestone: "Demonstrable sub-microsecond message round-trip in benchmark"
      }
    ]
  },
  cpp: {
    color: COLORS.cpp,
    label: "C++",
    emoji: "⚙️",
    current: "Working knowledge from NASA F' Prime contributions. Need to go deep on modern C++.",
    phases: [
      {
        name: "Phase 1", period: "Now – Aug 2026", hrs: "90 min/wk",
        goal: "Modern C++20 fluency — move semantics, templates, memory model",
        topics: ["Move semantics & perfect forwarding", "Template metaprogramming (SFINAE → concepts)", "std::memory_order + atomic ops", "Custom allocators (std::pmr)", "RAII everywhere, no raw new/delete", "Solving Leetcode mediums in C++ (interview prep)"],
        resources: ["\"A Tour of C++\" (Stroustrup)", "CppCon YouTube — Back to Basics playlist", "cppreference.com as daily reference"],
        milestone: "Fluent in C++20. Implement a lock-free stack with full memory ordering."
      },
      {
        name: "Phase 2", period: "Sep 2026 – Feb 2027", hrs: "90 min/wk",
        goal: "HFT C++ patterns — cache behavior, latency profiling, zero-overhead abstractions",
        topics: ["Cache-line alignment, false sharing", "Branch prediction + likely/unlikely", "constexpr / compile-time computation", "Template-heavy policy classes", "Coroutines (C++20)", "Implement order book in C++"],
        resources: ["\"Effective Modern C++\" (Meyers)", "Timur Doumler — CppCon talks on latency", "Agner Fog optimization manuals"],
        milestone: "Order book implementation benchmarked + profiled. Faster than naive version."
      },
      {
        name: "Phase 3", period: "Mar 2027+", hrs: "60 min/wk",
        goal: "Production HFT C++ — networking, kernel bypass, conforming to Jane Street/HRT style",
        topics: ["Sockets, epoll, non-blocking I/O", "Compile-time dispatch, static polymorphism", "SIMD intrinsics", "Reading HFT firm open-source code", "Competitive programming (Codeforces, speed)"],
        resources: ["\"Linux High Performance Server Programming\"", "Jane Street tech blog", "HRT open-source repos"],
        milestone: "Competitive programming: consistent Div 2 C/D on Codeforces. HFT interview ready."
      }
    ]
  },
  ocaml: {
    color: COLORS.ocaml,
    label: "OCaml",
    emoji: "🐪",
    current: "Beginner — understand functional concepts from Rust/Haskell exposure. No serious OCaml yet.",
    phases: [
      {
        name: "Phase 1", period: "Now – Aug 2026", hrs: "90 min/wk",
        goal: "OCaml fundamentals — types, pattern matching, modules, functors",
        topics: ["Types, variants, pattern matching", "Higher-order functions, closures", "Modules and signatures", "Functors and first-class modules", "Dune build system", "Solve 20 Exercism OCaml exercises"],
        resources: ["\"Real World OCaml\" (Minsky/Madhavapeddy) — free online", "learn-ocaml.org (Jane Street)", "Exercism OCaml track"],
        milestone: "Can write idiomatic OCaml. Contributed one PR to an OCaml open-source project."
      },
      {
        name: "Phase 2", period: "Sep 2026 – Feb 2027", hrs: "90 min/wk",
        goal: "Jane Street OCaml style — Core, Async, ppx",
        topics: ["Jane Street Core library", "Async for concurrent I/O", "ppx metaprogramming", "Effect handlers (OCaml 5)", "Type-level programming", "Implement a simple trading system in OCaml"],
        resources: ["Jane Street GitHub (core, async, ppx)", "Real World OCaml ch. 15+ (Advanced Modules)", "OCaml 5.0 effect handler docs"],
        milestone: "Comfortable with Jane Street's full stack. Small open-source contribution to core or async."
      },
      {
        name: "Phase 3", period: "Mar 2027+", hrs: "60 min/wk",
        goal: "Production-grade OCaml — interview-ready, Jane Street style",
        topics: ["Interview prep: Jane Street online assessments are OCaml-heavy", "Performance: benchmarking with Core_bench", "GADT and type-level encodings", "Contribute to ocaml-decimal or lean-sqlite (your identified targets)"],
        resources: ["Jane Street blog technical posts", "OCaml Weekly newsletter", "Caml-list discussions"],
        milestone: "Pass Jane Street first-round technical screen. Active open-source contributor."
      }
    ]
  },
  lean: {
    color: COLORS.lean,
    label: "Lean 4",
    emoji: "∀",
    current: "Have a leanbench project — some exposure but not systematic.",
    phases: [
      {
        name: "Phase 1", period: "Now – Aug 2026", hrs: "45 min/wk",
        goal: "Lean 4 fundamentals — types, propositions, basic proofs",
        topics: ["Dependent types and propositions", "Tactics: rfl, simp, exact, apply, intro", "Inductive types and recursion", "Lean 4 syntax vs Lean 3", "Natural number game (online)", "Prove 10 basic theorems from scratch"],
        resources: ["\"Theorem Proving in Lean 4\" (free)", "Mathematics in Lean (free)", "Natural Number Game (online)", "Lean 4 Zulip community"],
        milestone: "Fluent in basic tactics. Can prove simple inductive theorems independently."
      },
      {
        name: "Phase 2", period: "Sep 2026 – Feb 2027", hrs: "45 min/wk",
        goal: "Mathlib contributions + formal verification mindset",
        topics: ["Mathlib4 architecture and contribution workflow", "Classical vs constructive logic in Lean", "Category theory basics in Lean", "Lean metaprogramming (macros, tactics)", "Formalize a data structure proof"],
        resources: ["Mathlib4 docs + source", "Lean4 metaprogramming book (free)", "leanbench — your own project"],
        milestone: "At least one merged Mathlib4 PR. Can write custom tactics."
      },
      {
        name: "Phase 3", period: "Mar 2027+", hrs: "30 min/wk",
        goal: "Applied formal verification — prove correctness of your own systems code",
        topics: ["Verified algorithms (sorting, data structures)", "Interface with C/Rust via Lean FFI", "Lean as a proof assistant for financial algorithms"],
        resources: ["Lean + C interop docs", "Software Foundations (Coq, but concepts transfer)"],
        milestone: "Formally verified component of a real project. Recognized in Lean community."
      }
    ]
  },
  french: {
    color: COLORS.french,
    label: "French",
    emoji: "🇫🇷",
    current: "High school foundation — can read at B1, speaking/listening rusty. Italy trip in May is a checkpoint.",
    phases: [
      {
        name: "Phase 1", period: "Now – Jun 2026", hrs: "25 min/day",
        goal: "Revival — restore B1/B2 speaking and listening to match reading level",
        topics: ["Anki: Core French 2000 deck (10 new cards/day)", "InnerFrench podcast — Hugo Cotton (B1-B2 level)", "Write 3 sentences in French daily in a journal", "Shadowing: repeat what you hear, mimic intonation", "Use Italian trip as immersion: speak French in international contexts"],
        resources: ["InnerFrench podcast (free)", "Anki + Core French 2000 deck (free)", "Français Authentique (YouTube)", "iTalki community tutor 2x/month"],
        milestone: "Hold a 10-min conversation fluently by Italy trip (May 2026). Understand InnerFrench at full speed."
      },
      {
        name: "Phase 2", period: "Jul 2026 – Jun 2027", hrs: "20 min/day",
        goal: "C1 level — native content at full speed, fast colloquial speech",
        topics: ["Switch to native podcasts: RFI, France Inter, Culturebox", "Watch French TV with French subtitles (not English)", "Read Le Monde articles weekly", "iTalki sessions focused on speed — ask tutor to speak naturally fast", "Eliminate filler / thinking pauses in spoken French"],
        resources: ["France Inter (radio/podcast)", "TV5 Monde streaming", "Le Monde (articles)", "iTalki professional tutor (upgrade from community)"],
        milestone: "Understand 90%+ of RFI news broadcasts. Read a French novel without a dictionary."
      },
      {
        name: "Phase 3", period: "Jul 2027+", hrs: "10 min/day (maintenance)",
        goal: "C1/C2 fluency maintenance — accent reduction, domain vocabulary",
        topics: ["Financial/tech French vocabulary (useful for international HFT firms)", "Maintenance: one French podcast + Anki reviews daily"],
        resources: ["Les Echos (French financial newspaper)"],
        milestone: "Native-speed comprehension in professional contexts."
      }
    ]
  },
  spanish: {
    color: COLORS.spanish,
    label: "Spanish",
    emoji: "🇪🇸",
    current: "Near zero. Starting fresh. Cognate advantage from French helps.",
    phases: [
      {
        name: "Phase 1", period: "Now – Dec 2026", hrs: "30 min/day",
        goal: "A2→B1 — survive a conversation, understand slow speech",
        topics: ["Pimsleur Spanish I, II, III (audio-only, during commute/morning)", "Language Transfer Spanish (free, ~15 hrs, incredible for grammar intuition)", "Anki: most frequent Spanish 1000 words", "Dreaming Spanish (YouTube) — comprehensible input at your level", "Write 3 Spanish sentences daily (parallel with French journal)"],
        resources: ["Pimsleur Spanish (app)", "Language Transfer Spanish (free podcast)", "Dreaming Spanish (YouTube, free)", "Anki + Spanish frequency deck"],
        milestone: "Complete Pimsleur I+II+III. Understand Dreaming Spanish beginner level without pausing."
      },
      {
        name: "Phase 2", period: "Jan – Dec 2027", hrs: "25 min/day",
        goal: "B1→B2 — native content, fast speech, real conversations",
        topics: ["Dreaming Spanish intermediate + advanced", "Easy Spanish (YouTube street interviews)", "iTalki: 2x/month Spanish tutor", "Spanish TV: La Casa de Papel or similar with Spanish subtitles", "Shadowing native speakers for rhythm and speed"],
        resources: ["Dreaming Spanish intermediate+", "Easy Spanish YouTube", "iTalki community tutor", "SpanishPod101 for grammar gaps"],
        milestone: "Hold a 20-min conversation with a native speaker. Understand 70% of native TV without subtitles."
      },
      {
        name: "Phase 3", period: "Jan 2028+", hrs: "15 min/day (maintenance)",
        goal: "C1 fluency — fast native speech, professional contexts",
        topics: ["Spanish news: El País, BBC Mundo", "Regional accents: Latin America vs Spain", "Technical/professional vocabulary"],
        resources: ["El País", "BBC Mundo", "Radio Ambulante podcast"],
        milestone: "Understand all major Spanish accents at native speed."
      }
    ]
  },
  golf: {
    color: COLORS.golf,
    label: "Golf",
    emoji: "⛳",
    current: "Shooting 100+. Occasional range sessions. No structured practice.",
    phases: [
      {
        name: "Phase 1\n100 → 90", period: "2026 Season", hrs: "2 hrs/wk",
        goal: "Short game mastery + course management. This tier is won within 50 yards.",
        topics: ["Get 3 lessons with a PGA pro FIRST — don't ingrain bad habits", "70% of range time: chipping from rough, different lies, bunker basics", "Putting: all putts from 6 ft IN. Lag putting from 30+ ft.", "Course management: lay up, play to fat part of green, bogey golf is ok", "Track: putts per round, GIR, fairways. Use 18Birdies app.", "Mental: one shot at a time. Forget the last hole."],
        resources: ["Danny Maude (YouTube) — short game", "Me and My Golf (YouTube)", "18Birdies app (free tier)", "Local PGA pro for 3 lessons minimum"],
        milestone: "Break 90 once. Average < 34 putts/round. Handicap registered on GHIN."
      },
      {
        name: "Phase 2\n90 → 80", period: "2027 Season", hrs: "2.5 hrs/wk",
        goal: "Ball striking consistency. You can't score well with wild full swings.",
        topics: ["Weekly lessons (biweekly at minimum)", "Driver: fairways hit > 50%. Distance is worthless in the rough.", "Irons: stock shot shape — pick one and repeat it", "Fitness: hip mobility, thoracic rotation, core stability. 20 min, 3x/week.", "Short game: up-and-down > 40% from 50 yards", "Play competitive rounds: club tournaments, USGA handicap tracked"],
        resources: ["Mark Crossfield (YouTube)", "Athletic Motion Golf", "Titleist Performance Institute mobility exercises", "Local club events"],
        milestone: "Break 80 once. Fairway hit % > 50%. Single-digit handicap trajectory."
      },
      {
        name: "Phase 3\n80 → 70", period: "2028+", hrs: "3+ hrs/wk",
        goal: "Elite amateur territory. Requires structured coaching + competitive play.",
        topics: ["Regular coaching (weekly)", "Shot shaping: intentional draw/fade on command", "Mental game: pre-shot routine, handling pressure shots", "Practice rounds with focus: hit every fairway, no driver", "Compete regularly: pushes you to perform under pressure"],
        resources: ["A dedicated golf coach", "\"The Inner Game of Golf\" (Gallwey)", "TrackMan data if available"],
        milestone: "Single-digit handicap. Shooting 75 consistently. Break 70 at least once."
      }
    ]
  }
};

// ─── HOUR BUDGET VISUALIZATION ─────────────────────────────────────────────────

const BUDGET = [
  { label: "Work", hours: 40, color: "#333" },
  { label: "Sleep", hours: 56, color: "#1a1a2e" },
  { label: "Gym", hours: 4, color: COLORS.gym },
  { label: "OMSCS", hours: 9, color: COLORS.omscs },
  { label: "Programming", hours: 7.5, color: COLORS.rust },
  { label: "Languages", hours: 3.5, color: COLORS.french },
  { label: "Golf", hours: 2, color: COLORS.golf },
  { label: "Life/Chores", hours: 7, color: "#2a2a2a" },
  { label: "Free", hours: 7, color: "#1a3a2a" },
  { label: "Routines", hours: 22, color: "#222" },
];
const TOTAL = 168;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function ScheduleRow({ item }) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[item.type] || { color: "#555", label: item.type };
  return (
    <div
      onClick={() => item.note && setOpen(o => !o)}
      style={{
        borderLeft: `3px solid ${meta.color}`,
        background: open ? "#1e1e22" : "#16161a",
        marginBottom: 3,
        borderRadius: "0 6px 6px 0",
        cursor: item.note ? "pointer" : "default",
        transition: "background 0.15s",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px" }}>
        <span style={{ color: COLORS.textFaint, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, minWidth: 100 }}>{item.time}</span>
        <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 500, flex: 1 }}>{item.label}</span>
        <TAG color={meta.color} label={meta.label} />
        {item.note && <span style={{ color: COLORS.textFaint, fontSize: 11 }}>{open ? "▲" : "▼"}</span>}
      </div>
      {open && item.note && (
        <div style={{ padding: "0 14px 10px 126px", color: COLORS.textDim, fontSize: 12, lineHeight: 1.6 }}>
          {item.note}
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase, langColor }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${langColor}33`, borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: `${langColor}18`,
          padding: "12px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: langColor, fontWeight: 800, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>{phase.name}</span>
          <span style={{ color: COLORS.textDim, fontSize: 12 }}>{phase.period}</span>
          <TAG color={langColor} label={phase.hrs} />
        </div>
        <span style={{ color: COLORS.textFaint, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "16px", background: COLORS.surface2 }}>
          <div style={{ color: COLORS.text, fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
            <strong style={{ color: langColor }}>Goal:</strong> {phase.goal}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Topics</div>
              {phase.topics.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: langColor, fontSize: 10, marginTop: 3 }}>◆</span>
                  <span style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Resources</div>
              {phase.resources.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: COLORS.textDim, fontSize: 10, marginTop: 3 }}>→</span>
                  <span style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "10px", background: `${langColor}11`, borderRadius: 6, border: `1px solid ${langColor}33` }}>
                <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>Milestone</div>
                <div style={{ color: langColor, fontSize: 12, lineHeight: 1.5 }}>{phase.milestone}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressionTab({ id }) {
  const prog = PROGRESSIONS[id];
  if (!prog) return null;
  return (
    <div>
      <div style={{ marginBottom: 20, padding: "14px 16px", background: `${prog.color}15`, borderRadius: 8, border: `1px solid ${prog.color}33` }}>
        <div style={{ color: prog.color, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>Current Level</div>
        <div style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.6 }}>{prog.current}</div>
      </div>
      {prog.phases.map((p, i) => <PhaseCard key={i} phase={p} langColor={prog.color} />)}
    </div>
  );
}

function BudgetBar() {
  return (
    <div>
      <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 12, gap: 1 }}>
        {BUDGET.map((b, i) => (
          <div key={i} title={`${b.label}: ${b.hours}h`} style={{ flex: b.hours, background: b.color, transition: "flex 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
        {BUDGET.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
            <span style={{ color: COLORS.textDim, fontSize: 11 }}>{b.label}</span>
            <span style={{ color: COLORS.textFaint, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{b.hours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: "schedule", label: "📅 Schedule" },
  { id: "prog", label: "💻 Programming" },
  { id: "oss", label: "🔧 Open Source" },
  { id: "lang", label: "🗣️ Languages" },
  { id: "golf", label: "⛳ Golf" },
  { id: "budget", label: "⏱️ Time Budget" },
];

const PROG_TABS = [
  { id: "rust", label: "🦀 Rust", color: COLORS.rust },
  { id: "cpp", label: "⚙️ C++", color: COLORS.cpp },
  { id: "ocaml", label: "🐪 OCaml", color: COLORS.ocaml },
  { id: "lean", label: "∀ Lean 4", color: COLORS.lean },
];

const SCHED_TABS = [
  { id: "mon", label: "Mon", subtitle: "Gym AM" },
  { id: "tue", label: "Tue", subtitle: "Gym Lunch" },
  { id: "wed", label: "Wed", subtitle: "OSS + Laundry" },
  { id: "thu", label: "Thu", subtitle: "Gym AM" },
  { id: "fri", label: "Fri", subtitle: "Gym Eve" },
  { id: "sat", label: "Sat", subtitle: "Golf AM" },
  { id: "sun", label: "Sun", subtitle: "OMSCS + Batch Cook" },
];

const SCHED_DATA = {
  mon: WEEKDAY_MON,
  tue: WEEKDAY_TUE,
  wed: WEEKDAY_WED,
  thu: WEEKDAY_THU,
  fri: WEEKDAY_FRI,
  sat: WEEKEND_SAT,
  sun: WEEKEND_SUN,
};

const LANG_TABS = [
  { id: "french", label: "🇫🇷 French", color: COLORS.french },
  { id: "spanish", label: "🇪🇸 Spanish", color: COLORS.spanish },
];

export default function App() {
  const [mainTab, setMainTab] = useState("schedule");
  const [progTab, setProgTab] = useState("rust");
  const [schedTab, setSchedTab] = useState("mon");
  const [langTab, setLangTab] = useState("french");

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      color: COLORS.text,
      padding: "0 0 60px 0",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "24px 28px 0",
        background: COLORS.surface,
      }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Master Schedule v2.0</span>
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: COLORS.text }}>
          The Plan
        </h1>
        <p style={{ margin: "0 0 20px", color: COLORS.textDim, fontSize: 13 }}>
          Work 8–5 · OMSCS · Gym 4×/wk · 10–15 hrs/wk self-improvement budget
        </p>
        {/* Main tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{
              background: mainTab === t.id ? COLORS.accent : "transparent",
              color: mainTab === t.id ? COLORS.bg : COLORS.textDim,
              border: "none",
              borderRadius: "6px 6px 0 0",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* SCHEDULE TAB */}
        {mainTab === "schedule" && (
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 18, flexWrap: "wrap" }}>
              {SCHED_TABS.map(t => (
                <button key={t.id} onClick={() => setSchedTab(t.id)} style={{
                  background: schedTab === t.id ? COLORS.surface2 : "transparent",
                  color: schedTab === t.id ? COLORS.text : COLORS.textDim,
                  border: `1px solid ${schedTab === t.id ? COLORS.border : "transparent"}`,
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}>
                  <span style={{ fontWeight: 700 }}>{t.label}</span>
                  <span style={{ fontSize: 9, color: schedTab === t.id ? COLORS.textDim : COLORS.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>{t.subtitle}</span>
                </button>
              ))}
            </div>
            <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 12 }}>
              Click any row to expand notes. These are templates — shift times ±30 min to fit your day.
            </div>
            {(SCHED_DATA[schedTab] || []).map((item, i) => <ScheduleRow key={i} item={item} />)}
            <div style={{ marginTop: 20, padding: "12px 16px", background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Weekly Rhythm at a Glance</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {[
                  { day: "Mon", gym: "🏋️ AM", prog: "Rust", chore: "" },
                  { day: "Tue", gym: "🏋️ Lunch", prog: "C++", chore: "" },
                  { day: "Wed", gym: "—", prog: "OCaml + OSS", chore: "🧺 Laundry" },
                  { day: "Thu", gym: "🏋️ AM", prog: "Lean 4", chore: "" },
                  { day: "Fri", gym: "🏊 Eve", prog: "Rust / C++", chore: "" },
                  { day: "Sat", gym: "—", prog: "Project / OSS", chore: "🛒 Groceries\n🧹 Deep Clean\n🍳 Batch Cook 1" },
                  { day: "Sun", gym: "—", prog: "Projects", chore: "🍳 Batch Cook 2\n📋 Week Plan" },
                ].map(d => (
                  <div key={d.day} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 10px" }}>
                    <div style={{ color: COLORS.accent, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{d.day}</div>
                    {d.gym !== "—" && <div style={{ color: COLORS.gym, fontSize: 10, marginBottom: 3 }}>{d.gym}</div>}
                    <div style={{ color: COLORS.rust, fontSize: 10, marginBottom: 3 }}>{d.prog}</div>
                    {d.chore && d.chore.split("\n").map((c, i) => <div key={i} style={{ color: COLORS.textDim, fontSize: 10 }}>{c}</div>)}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "12px 16px", background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Legend</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
                {Object.entries(TYPE_META).filter(([k]) => !["sleep","work","routine","flex"].includes(k)).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
                    <span style={{ color: COLORS.textDim, fontSize: 11 }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROGRAMMING TAB */}
        {mainTab === "prog" && (
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
              {PROG_TABS.map(t => (
                <button key={t.id} onClick={() => setProgTab(t.id)} style={{
                  background: progTab === t.id ? `${t.color}22` : "transparent",
                  color: progTab === t.id ? t.color : COLORS.textDim,
                  border: `1px solid ${progTab === t.id ? t.color + "66" : "transparent"}`,
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: progTab === t.id ? 700 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}>{t.label}</button>
              ))}
            </div>
            <ProgressionTab id={progTab} />
          </div>
        )}

        {/* OSS TAB */}
        {mainTab === "oss" && (
          <div>
            <div style={{ marginBottom: 16, padding: "12px 16px", background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textDim, lineHeight: 1.6 }}>
              <strong style={{ color: COLORS.text }}>Cadence:</strong> 1hr every Wednesday evening (20:30–21:30), plus the Saturday 9–11:30 deep work block rotates between personal projects and OSS contributions on alternating weeks. Total: ~2–3 hrs/week when you're on a roll.
            </div>

            {/* OSS Target Table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#5a9a3a", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Target Repositories by Phase</div>
              {[
                {
                  phase: "Now — Phase 1 (2026)", color: COLORS.rust,
                  repos: [
                    { repo: "Your own crates (feedtui, pgrsql, leanbench)", why: "Lowest friction. Polish docs, add tests, publish to crates.io. Real users = motivation.", lang: "Rust" },
                    { repo: "tokio-rs/tokio", why: "Docs, examples, or small issues tagged 'E-easy'. Gets you reading production async Rust.", lang: "Rust" },
                    { repo: "crossbeam-rs/crossbeam", why: "Lock-free data structures — directly relevant to HFT prep. Start with issues tagged 'help wanted'.", lang: "Rust" },
                    { repo: "ocaml/ocaml-decimal", why: "Your identified high-impact target. Small library, welcoming maintainer, fintech adjacent.", lang: "OCaml" },
                  ]
                },
                {
                  phase: "Phase 2 (2027)", color: COLORS.ocaml,
                  repos: [
                    { repo: "janestreet/core", why: "Jane Street's standard library. Contributing here is a direct resume signal for JS applications.", lang: "OCaml" },
                    { repo: "leanprover-community/mathlib4", why: "Lean 4 formal math library. Start with 'easy' tagged issues. Community is welcoming.", lang: "Lean 4" },
                    { repo: "lean-sqlite (build it)", why: "Your identified high-impact project. A Lean 4 SQLite binding doesn't exist well yet — build it.", lang: "Lean 4" },
                    { repo: "janestreet/async", why: "Async OCaml — contribute examples or docs while learning it for Phase 2 OCaml.", lang: "OCaml" },
                  ]
                },
                {
                  phase: "Phase 3 (2027+)", color: COLORS.cpp,
                  repos: [
                    { repo: "LMAX-Exchange/disruptor (read + port)", why: "Understand the Disruptor pattern deeply. Port concepts to Rust or C++ as a portfolio piece.", lang: "C++" },
                    { repo: "google/benchmark", why: "C++ microbenchmarking library. Contributions show performance engineering depth.", lang: "C++" },
                    { repo: "Any HFT firm open source", why: "HRT, Two Sigma, and others have OSS repos. Contributing is a direct recruiting signal.", lang: "C++" },
                  ]
                },
              ].map((section, si) => (
                <div key={si} style={{ marginBottom: 20 }}>
                  <div style={{ color: section.color, fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>{section.phase}</div>
                  {section.repos.map((r, ri) => (
                    <div key={ri} style={{ display: "flex", gap: 12, marginBottom: 6, padding: "10px 14px", background: COLORS.surface2, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ minWidth: 220 }}>
                        <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{r.repo}</div>
                        <TAG color={section.color} label={r.lang} />
                      </div>
                      <div style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.6 }}>{r.why}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* OSS Process */}
            <div style={{ padding: "14px 16px", background: COLORS.surface2, borderRadius: 8, border: `1px solid #5a9a3a44` }}>
              <div style={{ color: "#5a9a3a", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>The 1hr OSS Session Protocol</div>
              {[
                { step: "1. Pre-decide (Sunday)", detail: "During your Sunday planning, pick the exact issue or task for Wednesday's session. Don't spend the session deciding what to work on." },
                { step: "2. Warm up (10 min)", detail: "Read the repo's CONTRIBUTING.md, find the issue, understand the context. Read surrounding code." },
                { step: "3. Build + implement (35 min)", detail: "Write the fix, feature, or docs. Run the test suite. Don't gold-plate — small clean PRs get merged, giant ones don't." },
                { step: "4. PR + context (15 min)", detail: "Write a clear PR description: what problem, what solution, what you tested. Link the issue. Tag maintainers politely." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                  <div style={{ color: "#5a9a3a", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, minWidth: 160, paddingTop: 1 }}>{s.step}</div>
                  <div style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.6 }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LANGUAGES TAB */}
        {mainTab === "lang" && (
          <div>
            <div style={{ marginBottom: 16, padding: "12px 16px", background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textDim, lineHeight: 1.6 }}>
              <strong style={{ color: COLORS.text }}>Core strategy:</strong> Languages are embedded in dead time — commute, morning routine, pre-sleep. They do NOT compete with deep work. French is a revival; Spanish is from scratch. Do Spanish first in the morning (harder), French review at night (easier revival).
            </div>
            <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
              {LANG_TABS.map(t => (
                <button key={t.id} onClick={() => setLangTab(t.id)} style={{
                  background: langTab === t.id ? `${t.color}22` : "transparent",
                  color: langTab === t.id ? t.color : COLORS.textDim,
                  border: `1px solid ${langTab === t.id ? t.color + "66" : "transparent"}`,
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: langTab === t.id ? 700 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}>{t.label}</button>
              ))}
            </div>
            <ProgressionTab id={langTab} />
          </div>
        )}

        {/* GOLF TAB */}
        {mainTab === "golf" && (
          <div>
            <ProgressionTab id="golf" />
            <div style={{ marginTop: 20, padding: "14px 16px", background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              <div style={{ color: COLORS.golf, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Stat Tracking — What to Measure</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { stat: "Total Score", why: "Obvious. Track every round, no mulligans." },
                  { stat: "Putts per Round", why: "≤32 is good. If you're at 38+, putting is your leak." },
                  { stat: "Greens in Regulation", why: "Missing GIR is fine — your up-and-down % matters more right now." },
                  { stat: "Fairways Hit %", why: "Accuracy > distance. Rough kills your score more than short drives." },
                  { stat: "Up & Down %", why: "This is how you survive missing greens. Improve chipping first." },
                  { stat: "Penalty Strokes", why: "Each OB or water ball = 2-stroke swing. Course management fixes this." },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "10px", background: `${COLORS.golf}11`, borderRadius: 6, border: `1px solid ${COLORS.golf}33` }}>
                    <div style={{ color: COLORS.golf, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{s.stat}</div>
                    <div style={{ color: COLORS.textDim, fontSize: 11, lineHeight: 1.5 }}>{s.why}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BUDGET TAB */}
        {mainTab === "budget" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
                168 hours in a week. Here's where they all go. The key insight: <strong style={{ color: COLORS.text }}>10.5 hrs/week of deliberate self-improvement</strong> fits cleanly if you treat language practice as embedded (commute, morning) rather than a separate block.
              </div>
              <BudgetBar />
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Priority Rules When Time Crunches</div>
              {[
                { rule: "Friends/family event", action: "Saturday 18:00–late is already yours — never schedule over it. If something comes up on a weekday, drop the OMSCS block (not the programming block). You can catch OMSCS async." },
                { rule: "Music urge on weekday", action: "If you feel like picking up guitar or opening FL Studio after gym, do it. Take the 17–18 slot. Don't suppress creative energy to 'stay on schedule' — it burns out faster." },
                { rule: "Big sports day (playoffs etc)", action: "Sunday 13:30–15:00 is already designated. For bigger events, shift morning OMSCS earlier (9–11) and take the afternoon fully off." },
                { rule: "OMSCS exam week", action: "Cut programming language sessions to 45 min. Keep language input (it's passive). Defer OSS to next week. Never cut sleep." },
                { rule: "Work crunch", action: "Cut Lean (lowest career ROI short-term). Keep Rust + OCaml. Language input survives — it's during breakfast/morning routine, not a separate block." },
                { rule: "Low energy day", action: "Swap deep work → language input or music or reading. Never let low energy cancel everything. Show up smaller." },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, padding: "10px 14px", background: COLORS.surface2, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.accent, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, minWidth: 160, paddingTop: 1 }}>{p.rule}</div>
                  <div style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.6 }}>{p.action}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "14px 16px", background: "#1a1a0a", borderRadius: 8, border: `1px solid ${COLORS.accentDim}44` }}>
              <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>The One Rule</div>
              <div style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.7 }}>
                Never miss twice. One bad day is noise. Two in a row is a pattern. The schedule compounds — consistency over 2 years beats intensity for 2 months.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
