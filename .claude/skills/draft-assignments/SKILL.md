---
name: draft-assignments
description: Draft module assignments for the Cardano Go PBL course. Each assignment requires a working Go code artifact AND learner feedback on the lesson content.
license: MIT
compatibility: Customized for the Cardano Go PBL course (Gimbalabs x Blink Labs). Andamio import format.
metadata:
  author: Gimbalabs
  version: 1.0.0
---

# Skill: Draft Assignments (Cardano Go PBL)

## Description

Generates one assignment per course module for the **Cardano Go PBL** course. An assignment is the *assessment* unit: it asks the learner to produce a reviewable artifact that demonstrates mastery of all the module's SLTs. This skill bakes in the conventions specific to this course (below) so that drafted assignments are completable with current infrastructure, accrete toward the funded DNS CLI project, and can be graded by an agent.

This skill *authors* assignments. It does not grade submissions. Authoring is a Fist-to-Five level-4 task; grading is level-5 — keep them separate.

## Course-Specific Rules (non-negotiable)

These five constraints define every assignment in this course. They override the generic Andamio assignment model.

1. **Artifact = working Go code.** Every assignment produces a runnable Go program, CLI, or package that exercises the module's SLTs against Cardano. No essay-only or screenshot-only assignments. (Exception: the `100` background module and `302` contributing module — see "Module-type exceptions".)

2. **Build toward the DNS CLI.** Where the SLTs allow, frame the artifact as a step the learner could reuse in the Phase 2 funded DNS CLI project (e.g. a command, a chain-query helper, an indexer filter, a tx builder). State the connection explicitly in the Task so completion doubles as DNS CLI onboarding.

3. **Network & infra constraints must be stated.** Assignments run against **preprod** (network magic `1`) unless a reason demands otherwise. Demeter.run is discontinued — never reference it. Always tell the learner which node-access options are valid for that artifact:
   - Public relay (N2N) — ChainSync / BlockFetch (modules 101, 201)
   - Blockfrost / Koios (REST) — UTxO queries, tx submission (module 102)
   - Local Dolos or cardano-node — mempool access (101.4 only)
   Preview magic is `2`; mainnet is `764824073` (do not assign mainnet work).

4. **Agent-gradable evidence.** Every deliverable must be something an agent can evaluate against the SLTs without watching the learner work: a public repo/gist link, a **preprod transaction hash**, captured stdout/log output, a decoded-CBOR dump, etc. Avoid "the learner demonstrates…" phrasing that requires live observation.

5. **Course feedback is a required deliverable.** To earn each module's credential the learner must submit BOTH the code artifact AND structured feedback on that module's lessons — quality and correctness. See `[[assignments-require-feedback]]`. This is unique to this course: feedback is graded evidence, not optional. The feedback block (below) is mandatory in every assignment.

## Reference Material

Read these before drafting (skip any that are missing, note it):

- **Doctrine:** `~/projects/01-projects/coach/docs/product-course-content-structure.md` → "Assignments" section. One assignment per module; assesses all SLTs; produces one reviewable artifact.
- **Compile format:** `~/projects/01-projects/coach/skills/compile/SKILL.md` → step 7. Compiled output is `assignment.md` with `# Module Assignment / ## Task / ## Deliverables`. Source convention in `00-course.md` is an `Artifact:` line and `Assessment criteria:` bullets.
- **CLI / data model:** `~/projects/01-projects/coach/andamio-cli-context.md` → assignment commands. Student submits `.content.evidence` (Tiptap JSON); teacher grades pass/fail via `tx/course/teacher/assignments/assess`.
- **This course's SLTs:** `outline.md` and `00-course.md` (module sections). These are the targets each assignment must cover.

## Instructions

### 1. Identify the module and its SLTs

The user names a module (e.g. `201`) or says "all modules". For each, read its SLTs from `outline.md` / `00-course.md`. List them — the assignment must give coverage to every SLT in the module.

### 2. Choose the artifact

Pick one coherent Go artifact that exercises *all* the module's SLTs together (not one micro-task per SLT). Prefer something the learner can extend into the DNS CLI. Examples by module:

| Module | Candidate artifact |
|--------|--------------------|
| 099 | A small multi-command Cobra CLI with a Fiber endpoint, debugged and type-checked |
| 101 | A Go program that connects via gOuroboros, fetches a block, and reports sync tip |
| 102 | A CLI command that builds, signs, and submits a preprod tx with Bursa + Apollo |
| 201 | An Adder pipeline that filters events by address/policy/pool and logs matches |
| 202 | A query layer that stores indexed data and reconciles it with a provider query |
| 203 | A tx builder that mints/locks/unlocks with a validator and watches the result via Adder |
| 204 | A tool that decodes on-chain CBOR datums/redeemers and re-encodes a modified value |

### 3. Write the assignment

Write each assignment as a **standalone file** at `lessons/{module_code}/assignment.md`. Use this exact structure — a top-level H1 title, then the course-standard sections. Task + Deliverables map cleanly onto the compiled `assignment.md`; Assessment Criteria and the Course Feedback deliverable are the course-specific additions.

```markdown
# Assignment {module_code}: {short title}

## Artifact

{one sentence — the working Go artifact the learner submits}

## Required Task

{2–4 sentences. What the learner builds and why. Name the libraries (Bursa/Apollo/Adder/gOuroboros). State the DNS CLI connection. State the network: preprod (magic 1) and the valid node-access option(s) for this artifact. Break into short paragraphs rather than one dense block.}

## Additional Exploration

{Optional stretch goal that varies a constraint from the Required Task — a different network (Preview, magic 2), a different tool, or a harder target — and nudges the learner toward independent research. Keep it genuinely optional; the credential is earned by the Required Task + Deliverables.}

## Deliverables

1. {Code artifact — public repo or gist link to runnable Go code}
2. {Runtime evidence — preprod tx hash, captured output/logs, or decoded-CBOR dump, as appropriate}
3. {Any SLT-specific evidence not covered above}
4. **Course feedback (required):** Written feedback on this module's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, steps that were wrong or out of date (include the lesson number).

## Assessment Criteria

{For the grader/agent. One bullet per SLT, each stating the observable pass condition.}
- **SLT {module}.{n}** — pass when {observable condition in the submitted evidence}.
- ...
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

{Optional: on-chain cost/faucet reminder for preprod, common mistakes, timing.}
```

### 4. Coverage check

Before finishing, verify:

- [ ] Every SLT in the module maps to at least one Deliverable and one Assessment Criterion.
- [ ] The artifact is runnable Go code (or a justified module-type exception).
- [ ] Network is preprod (magic `1`) and valid node-access options are named; no Demeter reference.
- [ ] Every Deliverable is agent-gradable evidence (link / tx hash / output), not live observation.
- [ ] The required Course Feedback deliverable is present.
- [ ] The DNS CLI connection is stated where the SLTs allow.

### 5. Where to write it

Write the assignment to its own standalone file at `lessons/{module_code}/assignment.md` (one file per module, alongside that module's lessons). This is the source of truth — do **not** also embed the assignment in `00-course.md`. When the module is compiled, this file becomes the module's `assignment.md`; fold the Course Feedback item into the Deliverables list at compile time if a stricter `# Module Assignment / ## Task / ## Deliverables` shape is required.

### Module-type exceptions

- **099 (Intro to Go)** is pure Go — no Cardano node, network, keys, or testnet. The preprod/magic and node-access rules do **not** apply; the artifact runs against in-memory/test data.
- **100 (Prerequisites + Tools)** pairs a hands-on artifact with short written explanations. Have the learner **create a wallet with Bursa** — concrete proof the toolchain is set up (grounds 100.3 and 100.7) — alongside a brief "tools field guide" covering the explain-only SLTs (100.1, 100.2, 100.4–100.6). Never ask the learner to submit secrets: evidence is the public address + faucet funding, not the mnemonic or signing keys.
- **302 (contributing)** artifact is a real PR to a Blink Labs repository (artifact = the PR link). The Course Feedback deliverable is still required.
- **301 (debugging)** artifact is a debrief of a real bug the learner diagnosed (repro, root cause, fix), plus the fixed code.

### After drafting

Suggest the user:
1. Review the assignment with the team.
2. Run `/compile {module}` to package it for Andamio import.
3. Update the placeholder `assignment` object in `course-upload.json` (currently `"Assignment Title"` for every module) with the real title/description.
