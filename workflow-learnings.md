# Workflow Learnings

Insights captured during course development that improve the process over time.

## 2026-03-13 - cardano-go-pbl - Lesson Build

**What happened:** Revised lesson `099.2` from an abstract explanation of Go's type system into a problem-driven lesson built around one Cardano balance-calculation example.

**Friction:** The original lesson was technically correct but taught design rules before giving the learner a concrete problem, so the code samples felt arbitrary and the generics example felt detached from the course domain.

**Improvement idea:** When revising or drafting developer-documentation lessons, require a `problem -> first attempt -> limitation -> improved design -> rule -> practice` sequence before accepting the draft.

**Heuristic:** A lesson about program design should not open with philosophy or rules. It should open with a realistic task in the course domain, then introduce each type-system concept only when the learner can see the problem it solves.

## Phase-Specific Learnings

### Lesson Build
- Prefer a single running example over disconnected snippets.
- Show the weaker design before the improved one so the abstraction has a visible reason to exist.
- Replace vague terms like "behavior contracts" with direct explanations of what a component must do.
- Use domain examples for generics; avoid generic utility examples unless the utility itself is the subject of the lesson.
- Start from the real builder mistake, not the abstract concept.
- Simplify terminology before simplifying mechanism.
- When a system has different rules for different contexts, teach the split explicitly.
- Treat "good enough to teach" and "factually precise" as separate checks.
- Add expected-answer notes when a prompt intentionally uses simplified language.
