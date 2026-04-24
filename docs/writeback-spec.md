---
title: MRCF Writeback Protocol
version: 1.0
status: active
author: Dev 3 — AI Integration
---

# VISION

Define a **minimal, human-readable protocol** that governs how AI agents write back
changes into `.mrcf` documents:

- What sections an agent may touch
- How proposed changes are represented
- How locks and conflicts are signalled
- How history and provenance are recorded

The goal is to make every AI change **auditable, attributable, and reversible**
without complex infrastructure.

---

# CONTEXT

MRCF documents already provide:

- A stable 5-section methodology (VISION, CONTEXT, STRUCTURE, PLAN, TASKS)
- A parse/validate pipeline (`@mrcf/parser`)
- An AI generation layer (`@mrcf/ai`)

What is missing is a shared convention for:

- Section-level permissions (human-only vs AI-writable)
- In-document locks to avoid accidental concurrent edits
- A standard way for AI to *propose* rather than silently overwrite sections
- A simple in-doc changelog for human and AI changes

This protocol is intentionally **lightweight** and implemented as plain text
conventions that the parser can recognise.

---

# STRUCTURE

## 1. Section permissions (frontmatter)

Section-level permissions are declared in the metadata block using a `sections`
list:

```text
---
title: My Project
version: 1.2
created: 2026-03-13
sections:
  - VISION:human-only
  - CONTEXT:human-only
  - STRUCTURE:ai-assisted
  - PLAN:ai-primary
  - TASKS:ai-primary
defaultPermission:ai-assisted
---
```

### 1.1 Permission levels

- `human-only` – AI **must not** write to this section
- `ai-assisted` – AI may only create **proposals**; human approves/rejects
- `ai-primary` – AI may write directly; human may still review via Git / diff

The parser normalises this into:

- `metadata.sectionPermissions: Record<string, 'human-only' | 'ai-assisted' | 'ai-primary'>`
- `metadata.defaultPermission?: 'human-only' | 'ai-assisted' | 'ai-primary'`

If a section has no explicit entry, `defaultPermission` applies (if present),
otherwise the effective default is `ai-assisted`.

## 2. Section locks

When an agent is actively editing a section, it may place a lock comment as the
first non-blank line in the section body:

```text
# PLAN
<!-- lock: ai:claude | 2026-03-13T14:22:00Z -->
...section content...
<!-- unlock -->
```

- `lock:` header: `actor | ISO-8601 timestamp`
- `unlock` marker ends the lock scope.

The parser extracts this into:

- `section.lock?: { actor: string; timestamp: string }`

Tools **should not** enforce strong distributed locking. This is a **hint**
primarily for humans and cooperative agents.

## 3. Proposal blocks (AI suggestions)

In `ai-assisted` sections, the AI **must not** overwrite content directly.
Instead it appends a proposal block:

```text
<!-- proposal: ai:claude | 2026-03-13T14:30:00Z | confidence:high
...proposed markdown content...
reason: derived from PLAN phase 2 milestones
-->
```

Header format:

- `proposal: <actor> | <ISO-8601 timestamp> | confidence:<low|medium|high>`

Footer:

- A single line starting with `reason:` (optional but recommended)

The parser extracts proposals per section as:

```ts
interface MrcfProposal {
  id: string;                // stable identifier
  sectionName: string;
  actor: string;             // e.g. "ai:claude", "ai:gpt-4o"
  timestamp: string;         // ISO-8601
  confidence?: 'low' | 'medium' | 'high';
  reason?: string;
  content: string;           // raw proposed markdown
}
```

and attaches them to:

- `section.proposals: MrcfProposal[]`

The raw `<!-- ... -->` block remains in `section.content` for backward
compatibility.

## 4. CHANGELOG / HISTORY section

Long-running projects SHOULD maintain a simple history section:

```text
# HISTORY
2026-03-13 | human | updated VISION — narrowed target audience
2026-03-13 | ai:claude | proposed TASKS from PLAN
2026-03-14 | human | accepted TASKS proposal, checked 3 items
```

The writeback protocol standardises only the **line format**:

```text
YYYY-MM-DD | <actor> | <summary>
```

`@mrcf/ai` automatically appends entries when it:

- Creates a proposal (`ai-assisted`)
- Writes directly to a section (`ai-primary`)

If `HISTORY` does not exist, tools may create it as a custom section.

## 5. Task semantics (IDs & dependencies)

Tasks keep the existing checkbox syntax plus optional metadata:

```text
- [ ] implement parser
  id: T-001
  owner: dev1
  priority: high
  depends: T-000, T-002
```

The parser maps this to:

- `task.id?: string`
- `task.dependsOn?: string[]`

This enables dependency-aware tooling without changing the basic markdown form.

## 6. Roles & actors

Actors are free-form strings, but the following conventions are recommended:

- Humans: `human` or `human:<name>` (e.g. `human:alice`)
- AI models: `ai:<provider>` or `ai:<model>` (e.g. `ai:claude`, `ai:gpt-4o`)

These values appear in:

- Locks (`section.lock.actor`)
- Proposals (`proposal.actor`)
- HISTORY lines (`<actor>` column)

---

# PLAN

## Phase 1 — Spec & Parser

- [x] Document permission / lock / proposal / history rules
- [x] Extend parser types (`MrcfMetadata`, `MrcfSection`, `MrcfTask`)
- [x] Parse `sections:` + `defaultPermission` into typed fields
- [x] Detect locks and proposals into structured fields
- [x] Parse task IDs and dependencies

## Phase 2 — AI Integration

- [x] Enforce section permissions in `@mrcf/ai` injections
- [x] Wrap `ai-assisted` edits as proposals instead of direct writes
- [x] Append HISTORY entries on AI changes

## Phase 3 — Review CLI

- [ ] Implement `scripts/review.ts` to:
  - [ ] list proposals per section
  - [ ] show diffs vs current content
  - [ ] allow accept/reject (in-place document modifications)

Future phases may extend this with richer confidence/provenance metadata and
multi-agent workflows.

