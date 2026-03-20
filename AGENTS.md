# AGENTS.md — MRCF Agent Integration Guide

This file tells AI agents how to read, interpret, and update `.mrcf` files in this repository.

---

## What is MRCF?

MRCF (Machine-Readable Context Format) is a plain-text document standard for AI-native project context. Every `.mrcf` file contains five required sections that give an AI agent a complete picture of a project:

| Section | What it contains |
|---|---|
| `# VISION` | Why this project exists. Problem, goal, success criteria. |
| `# CONTEXT` | Who it's for. Audience, constraints, technical environment. |
| `# STRUCTURE` | How it works. Architecture, modules, design decisions. |
| `# PLAN` | How it gets done. Phases, milestones, roadmap. |
| `# TASKS` | What's next. Markdown checkboxes with optional owner/priority. |

Custom sections (e.g. `# DECISIONS`, `# AGENT`, `# CHECKLIST`) are allowed and preserved.

---

## How to Read a .mrcf File

1. **Parse the YAML frontmatter** (between `---` delimiters) to get `title`, `version`, `status`, and metadata.
2. **Read sections in order:** VISION → CONTEXT → STRUCTURE → PLAN → TASKS.
3. **VISION + CONTEXT = why and for whom.** Use these as the stable anchor. Do not modify them unless the user explicitly asks.
4. **STRUCTURE + PLAN = how.** These are the design and roadmap. AI can propose updates here.
5. **TASKS = what's next.** Unchecked `- [ ]` items are pending work. Checked `- [x]` items are done.

---

## How to Write / Update a .mrcf File

### Default behavior (no `sections:` block in frontmatter)

- **VISION** and **CONTEXT**: treat as human-authored. Propose changes as comments, do not overwrite.
- **STRUCTURE**, **PLAN**, **TASKS**: AI can write directly when explicitly instructed.

### With writeback permissions

If the frontmatter contains a `sections:` block, respect these permission levels:

```yaml
sections:
  - VISION: human-only        # never write
  - CONTEXT: human-only       # never write
  - STRUCTURE: ai-assisted    # wrap suggestions in proposal blocks
  - PLAN: ai-primary          # write directly; human reviews via git diff
  - TASKS: ai-primary         # write directly
defaultPermission: ai-assisted
```

**Permission levels:**

| Level | Behavior |
|---|---|
| `human-only` | Do not write or propose changes to this section. |
| `ai-assisted` | Wrap proposed changes in `<!-- proposal: ... -->` blocks. Do not overwrite existing content. |
| `ai-primary` | Write directly. The human reviews changes via Git diff. |

### Proposal block format

When writing a proposal to an `ai-assisted` section:

```markdown
<!-- proposal: claude | 2026-03-19T10:00:00Z | confidence:0.85
Replace Phase 2 timeline with:
Phase 2: API layer (weeks 3–5, extended for auth)
-->
```

The human can accept by removing the comment wrapper, or reject by deleting the block.

---

## Task Format

```markdown
# TASKS
- [ ] pending task
- [x] completed task
- [ ] task with metadata
  owner: dev1
  priority: high
  id: T-001
  depends: T-000
```

When generating tasks, prefer:
- One task per checkbox
- Concrete, actionable descriptions (verb + noun)
- `id:` field for tasks that other tasks depend on

---

## ADK Agent Skill Patterns

MRCF supports all 5 Google ADK agent skill patterns. See `templates/` for ready-to-use starters:

| Pattern | Template |
|---|---|
| Tool Wrapper | `templates/pattern-tool-wrapper.mrcf` |
| Generator | `templates/pattern-generator.mrcf` |
| Reviewer | `templates/pattern-reviewer.mrcf` |
| Inversion | `templates/pattern-inversion.mrcf` |
| Pipeline | `templates/pattern-pipeline.mrcf` |

Each template includes a `# AGENT` custom section with `pattern:` and `interaction:` metadata.

---

## Validation Rules

A valid `.mrcf` file must have:

| Rule | Requirement |
|---|---|
| V-001 | All five standard sections present (VISION, CONTEXT, STRUCTURE, PLAN, TASKS) |
| V-002 | Sections in canonical order (warning if not) |
| V-003 | `version` matches `major.minor` pattern |
| V-004 | `created`/`updated` are ISO 8601 dates |
| V-005 | `status` is `draft`, `active`, or `archived` (warning if other) |
| V-006 | TASKS section contains at least one task (warning if empty) |
| V-007 | Section names are uppercase ASCII |

---

## Quick Reference

```bash
# Validate a file
npx ts-node -e "const {parse,validate}=require('./parser/src');const r=parse(require('fs').readFileSync('my.mrcf','utf8'));console.log(validate(r.document))"

# Smoke test (parse → validate → render all formats)
npm run smoke -- example-full.mrcf

# Review writeback proposals
npm run review -- example-writeback.mrcf
```

For full spec details, see [docs/mrcf-spec.md](docs/mrcf-spec.md) and [docs/writeback-spec.md](docs/writeback-spec.md).
