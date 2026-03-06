# AGENTS.md instructions for /Users/gzero/Desktop/cardano-go-pbl-2026

## Skills
A skill is a set of local instructions stored in a `SKILL.md` file.

### Available skills
- assess-slts: Write a useful set of student learning targets. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/assess-slts/SKILL.md)
- classify-lesson-types: Interview the user to classify each SLT by lesson type and build up lesson type heuristics. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/classify-lesson-types/SKILL.md)
- compile: Compile a course module into the Andamio import format for publishing. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/compile/SKILL.md)
- compound: Capture and apply knowledge from course development to improve future runs. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/compound/SKILL.md)
- course-workflow: Orchestrate course development workflow, track progress, and capture learnings. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/course-workflow/SKILL.md)
- draft-slts: Draft Student Learning Targets for a new course or module. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/draft-slts/SKILL.md)
- gather-code-examples: Generate code example checklists for Developer Documentation lessons based on readiness assessment. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/gather-code-examples/SKILL.md)
- gather-screenshots: Generate screenshot capture checklists for Product Demo lessons based on readiness assessment. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/gather-screenshots/SKILL.md)
- self-assess-readiness: Assess Claude's readiness to coach a learner through each SLT. (file: /Users/gzero/Desktop/cardano-go-pbl-2026/.claude/skills/self-assess-readiness/SKILL.md)

### How to use skills
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, use that skill for that turn.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with a best-effort fallback.
- How to use a skill:
  1) Open its `SKILL.md` and read only enough to follow the workflow.
  2) Resolve relative paths in skill docs from that skill directory first.
  3) Load only the specific referenced files needed for the request.
  4) Prefer existing `scripts/` and templates when provided.
- If multiple skills apply, use the minimal set that covers the request and state the order used.
