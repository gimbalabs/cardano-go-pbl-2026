# Delegation Map: Cardano Go PBL

**Generated:** 2026-03-06
**Source:** `04-readiness-assessment.md`, existing `lessons/` content

## Summary


| Responsibility            | Count | SLTs                                                                                                                                         |
| ------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent builds now (Ready)  | 7     | 099.1, 099.2, 099.3, 099.4, 100.1, 204.5, 301.2                                                                                              |
| Agent builds with context | 32    | 100.2-100.7, 101.1-101.4, 102.3-102.6, 201.1-201.3, 202.1, 202.2, 202.4, 202.5, 203.1, 203.2, 203.5, 203.6, 204.1-204.4, 204.6, 301.1, 301.3 |
| Human co-authors required | 5     | 102.1, 102.2, 202.3, 203.3, 203.4                                                                                                            |


---

## Build Status Snapshot

- Existing lesson drafts are present for: `100.3`, `100.4`, `102.1`, `102.2`, `102.3`, `201.1`-`201.6`, `202.1`, `202.2`.
- No markdown lessons currently found in module `101` (directory appears to contain images/assets only).
- Highest risk lessons (Apollo/Bursa/Adder-heavy) should be reviewed before reuse.
- `201.4` to `201.6` files exist in `lessons/` but are not represented in current `00-course.md` SLTs and should be reconciled during lesson build.
- Duplicate lesson path exists for `100.3` under `lessons/100/100.4/100.3/` and should be cleaned up.

## Current Lesson Coverage (from `lessons/`)


| SLT   | Coverage Status                     | Notes                                         |
| ----- | ----------------------------------- | --------------------------------------------- |
| 099.4 | Draft exists, ready to finalize     | Fiber API lesson aligned with readiness state |
| 100.3 | Draft exists                        | Also duplicated in nested path                |
| 100.4 | Draft exists                        | In expected module path                       |
| 102.1 | Draft exists, needs expert review   | Marked Needs Human in readiness               |
| 102.2 | Draft exists, needs expert review   | Marked Needs Human in readiness               |
| 102.3 | Draft exists                        | Marked Needs Context in readiness             |
| 201.1 | Draft exists, needs screenshot pass | Placeholder markers remain                    |
| 201.2 | Draft exists                        | No placeholder markers found                  |
| 201.3 | Draft exists, needs screenshot pass | Placeholder markers remain                    |
| 201.4 | Draft exists, out-of-outline        | Not currently in `00-course.md`               |
| 201.5 | Draft exists, out-of-outline        | Not currently in `00-course.md`               |
| 201.6 | Draft exists, out-of-outline        | Not currently in `00-course.md`               |
| 202.1 | Draft exists                        | Marked Needs Context in readiness             |
| 202.2 | Draft exists                        | Marked Needs Context in readiness             |


---

## Agent Responsibilities

### Build Now (No Additional Context Needed)


| SLT   | Module | Suggested Lesson Type   | What Agent Does                                                           |
| ----- | ------ | ----------------------- | ------------------------------------------------------------------------- |
| 099.1 | 099    | How To Guide            | Build Go debugging workflow lesson with `delve`, `go test`, `race`, `vet` |
| 099.2 | 099    | Developer Documentation | Explain type system patterns with hands-on exercises                      |
| 099.3 | 099    | How To Guide            | Build multi-command Cobra CLI lesson with structured practice             |
| 099.4 | 099    | How To Guide            | Build and verify a minimal Fiber API with clean project structure         |
| 100.1 | 100    | Exploration             | Explain Cardano fundamentals and differentiation clearly                  |
| 204.5 | 204    | Developer Documentation | Teach protobuf spec reading and mapping to Go data structures             |
| 301.2 | 301    | How To Guide            | Build practical profiling/debugging lesson (`pprof`, tracing, benchmarks) |


### Build With Context

Focus context collection on high-leverage dependencies first:

1. Apollo docs/examples
2. gOuroboros docs/examples
3. Adder docs/examples
4. Bursa docs/examples


| Module | SLTs                       | Context Needed                                                         |
| ------ | -------------------------- | ---------------------------------------------------------------------- |
| 100    | 100.2-100.7                | Ouroboros explainer, Blink Labs tool READMEs, course setup docs        |
| 101    | 101.1-101.4                | gOuroboros starter kit + protocol usage examples                       |
| 102    | 102.3-102.6                | Apollo signing/metadata/validity APIs + gOuroboros submission examples |
| 201    | 201.1-201.3                | Adder starter kit + configuration and filter docs                      |
| 202    | 202.1, 202.2, 202.4, 202.5 | Query provider comparison + Adder capability boundaries                |
| 203    | 203.1, 203.2, 203.5, 203.6 | Aiken-to-Go mapping + Apollo script interaction APIs                   |
| 204    | 204.1-204.4, 204.6         | Cardano CBOR/CDDL references + Go examples                             |
| 301    | 301.1, 301.3               | Cross-stack troubleshooting playbooks + current community channels     |


---

## Human Responsibilities (Co-Author Required)


| SLT   | Why Human Needed                            | Human Does                                                                        | Agent Does                                       |
| ----- | ------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| 102.1 | Bursa API unknown for code-quality coaching | Review existing draft against canonical wallet-creation flow; provide corrections | Revise current lesson draft with expert feedback |
| 102.2 | Apollo tx builder API unknown               | Review existing draft against canonical simple tx flow; provide corrections       | Revise current lesson draft with expert feedback |
| 202.3 | Adder storage model/API unknown             | Provide storage/retrieval patterns and reference implementation                   | Convert to learner-friendly lesson format        |
| 203.3 | Script minting has fund-safety risk         | Provide validated script-minting flow and safety constraints                      | Draft instructional flow and checkpoints         |
| 203.4 | Script spending has fund-safety risk        | Provide validated unlock flow and failure-mode guidance                           | Draft lesson framing and practice rubric         |


---

## Build Sequence

### Wave 1: Immediate Build (Tier 1 Ready)

- 099.1, 099.2, 099.3
- 099.4
- 100.1
- 204.5
- 301.2

### Wave 2: Context Build and Draft Validation

- Build missing context-dependent lessons: 100.2, 100.5-100.7, 101.1-101.4, 102.4-102.6, 202.4, 202.5, 203.1, 203.2, 203.5, 203.6, 204.1-204.4, 204.6, 301.1, 301.3
- Validate and revise existing context-dependent drafts: 100.3, 100.4, 102.3, 201.1-201.3, 202.1, 202.2
- Reconcile out-of-outline drafts: 201.4-201.6 (either map to SLTs or archive)

### Wave 3: Human Co-Author Lessons

- 102.1 (expert review + revise existing draft)
- 102.2 (expert review + revise existing draft)
- 202.3
- 203.3
- 203.4

---

## Notes

- This delegation map follows the readiness tiers directly to minimize rework.
- Phase 6 should now prioritize creating `assets/code-examples/README.md` first, since this course is heavily Developer Documentation / How To Guide oriented.
- Product Demo screenshot needs should be decided during lesson-type classification backfill (`03-lesson-type-classification.md`), since that artifact is currently missing.

