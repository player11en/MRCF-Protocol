---
title: MRCF Format Specification
version: 2.0
created: 2026-03-12
updated: 2026-03-25
author: player11en
status: active
tags:
  - spec
  - format
  - parser
  - v2
---

# VISION

MRCF is an open, AI-native document format for structured project knowledge.
It is simultaneously human-readable, machine-parseable, and LLM-friendly.

---

# CONTEXT

Existing formats (PDF, DOCX, Markdown) either lack semantics for AI tooling
or are too complex to implement quickly.  MRCF fills the gap with a minimal
plain-text format that any tool can parse in a few hundred lines of code.

Target consumers of this specification:
- **Dev 1 (Core/Parser)** — implements the parser and validation engine
- **Dev 2 (VS Code Extension)** — uses `MrcfDocument` model for editor features
- **Dev 3 (AI Integration)** — uses `sectionIndex` to feed LLM context
- **Dev 4 (Renderer)** — uses `MrcfSection[]` to generate views

---

# STRUCTURE

## 1. File Format

### Extension

```
.mrcf
```

### Encoding

UTF-8.  Line endings: LF (`\n`) preferred; CRLF tolerated.

---

## 2. Document Structure

Every `.mrcf` file consists of three parts, in order:

```
1. Metadata block   (required)
2. Sections         (required, at least one)
3. Assets           (optional, via file system)
```

---

## 3. Metadata Block

The metadata block is a YAML-like front-matter delimited by `---`.

```
---
title: AI Knowledge Platform
version: 1.0
author: Team Alpha
created: 2026-03-12
updated: 2026-03-12
tags:
  - ai
  - documentation
status: draft
---
```

### 3.1 Required Fields

| Field   | Type   | Description                        |
|---------|--------|------------------------------------|
| title   | string | Document title                     |
| version | string | Semantic version `major.minor`     |
| created | string | ISO 8601 date `YYYY-MM-DD`         |

### 3.2 Optional Fields

| Field   | Type            | Description                              |
|---------|-----------------|------------------------------------------|
| author  | string          | Author name                              |
| updated | string          | ISO 8601 last-updated date               |
| tags    | string[]        | List of tags (YAML sequence or CSV)      |
| status  | enum            | `draft` \| `active` \| `archived`        |
| license | string          | License identifier (e.g. MIT)            |
| source  | string          | Optional provenance of this document (e.g. tool + version) |

Custom fields are allowed and preserved by the parser.

---

## 4. Standard Sections

MRCF v2 defines **five required** and **four optional** standard sections.

### 4.1 Required Sections

```
# VISION
# CONTEXT
# STRUCTURE
# PLAN
# TASKS
```

A document missing any required section fails validation (V-001).

### 4.2 Optional Sections (v2)

```
# SUMMARY
# INSIGHTS
# DECISIONS
# REFERENCES
```

Sections are written as Markdown level-1 headings (`#`).
The name must be **uppercase ASCII** (A-Z, 0-9, underscore, space).

### Section Semantics

| Section    | Required | Purpose                                              |
|------------|----------|------------------------------------------------------|
| SUMMARY    | No       | Snapshot of current project state for fast AI entry  |
| VISION     | **Yes**  | Problem statement, goal, success criteria            |
| CONTEXT    | **Yes**  | Audience, constraints, environment                   |
| STRUCTURE  | **Yes**  | Architecture, modules, data model                    |
| PLAN       | **Yes**  | Phases, milestones, roadmap                          |
| TASKS      | **Yes**  | Concrete work items (v1 checkbox or v2 block format) |
| INSIGHTS   | No       | Learnings from task outcomes (success/failure)       |
| DECISIONS  | No       | Architectural/product decisions and trade-offs       |
| REFERENCES | No       | Typed relationships between tasks, insights, decisions |

### Canonical Order

When all sections are present the canonical order is:
`SUMMARY → VISION → CONTEXT → STRUCTURE → PLAN → TASKS → INSIGHTS → DECISIONS → REFERENCES`

Out-of-order standard sections produce a V-002 warning (not an error).

---

## 5. Nested Sections

Sub-sections use Markdown headings at level 2 and below.

```
# STRUCTURE

## System Architecture

### API Layer
...
```

---

## 6. Task Format

### 6.0 v1 Checkbox Format (still supported)

```
- [ ] incomplete task
- [x] completed task
```

Optional inline metadata:

```
- [ ] implement parser
  owner: dev1
  priority: high
```

### 6.1 v2 Block Format

```
[TASK-1]
description: implement feature tracking
status: in_progress
owner: dev
depends_on: [TASK-0]
related_insights: [INSIGHT-1]
```

Supported fields:

| Field             | Type                                              | Required |
|-------------------|---------------------------------------------------|----------|
| description       | string                                            | Yes      |
| status            | `planned \| in_progress \| done \| failed \| blocked` | No   |
| owner             | string                                            | No       |
| depends_on        | comma-separated task IDs, optionally in `[...]`   | No       |
| related_insights  | comma-separated insight IDs, optionally in `[...]`| No       |
| id                | string (inferred from block header)               | Auto     |
| priority          | `low \| medium \| high`                           | No       |

### 6.1 References to external documents

Task descriptions MAY include `@ref(...)` tokens to refer to external sources such as
PDF pages or imported chunks.  The exact identifier format is left to tools, but a
common convention is:

```text
- [ ] Review summary for chapter 3 @ref(page-007)
```

Tools that understand the `@ref(...)` pattern can resolve these identifiers to their
own page/chunk naming schemes without affecting basic MRCF compliance.

---

## 7. Asset References

Assets are external files referenced with standard Markdown image syntax:

```
![architecture](assets/architecture.png)
```

Directory convention:

```
project.mrcf
assets/
  architecture.png
  diagram.svg
```

Paths are relative to the `.mrcf` file.  Path traversal outside the document
directory is not permitted.

External URLs (`http://`, `https://`) are accepted but not validated.

---

## 8. Custom Sections

Unknown section names are accepted as **custom sections** and preserved by the parser.

```
# DECISIONS
We chose TypeScript for the parser.
```

Custom sections are included in `sections[]` with `isStandard: false`.

### 8.1 Recommended custom sections

The core MRCF standard intentionally keeps only five required sections to stay simple. For long‑running, collaborative projects, the following **recommended but optional** custom sections are especially useful:

- `# DECISIONS` or `# ADR` — capture key architecture/product decisions and rejected alternatives.
- `# HISTORY` or `# STATUS` — short, human‑written milestones that explain how the project has evolved over time.
- `# ASSETS` or `# ASSET MANIFEST` — an optional manifest of important binary assets (images, diagrams, datasets), for example:

  ```text
  # ASSETS
  - id: architecture-diagram
    path: assets/architecture.svg
    type: diagram
  - id: cover-image
    path: assets/cover.png
    type: image
  ```

These sections remain custom (non‑required) and are treated like any other custom section by the parser; tools are free to provide specialized views for them.

---

## 9. Document Model (Internal)

The parser produces the following internal model (TypeScript interfaces
defined in `parser/src/types/index.ts`):

```
MrcfDocument
  ├ metadata: MrcfMetadata
  ├ sections: MrcfSection[]
  ├ assets: MrcfAssetReference[]
  └ sectionIndex: Map<string, MrcfSection>

MrcfSection
  ├ name: string
  ├ isStandard: boolean
  ├ content: string
  ├ subsections: MrcfSubsection[]
  ├ tasks: MrcfTask[]
  └ assets: MrcfAssetReference[]

MrcfTask
  ├ description: string
  ├ completed: boolean
  ├ owner?: string
  └ priority?: 'low' | 'medium' | 'high'
```

---

## 10. Parsing Rules

### 10.1 Section Detection

A section begins with a level-1 heading whose name matches `[A-Z][A-Z0-9_ ]*`:

```
# SECTION_NAME
```

### 10.2 Unknown Sections

Unknown section names are parsed as custom sections (see §8).

### 10.3 Error Handling

The parser returns a `ParseResult` with:
- `ok: boolean`
- `errors: ParseError[]`
- `document: MrcfDocument | null`

A result with `ok: true` guarantees a non-null document.

---

## 7.1 SUMMARY Section

```
# SUMMARY
current_focus: what is actively being worked on
main_risk: the single biggest risk right now
stable_parts: which parts are settled
```

All fields are optional free-text key-value pairs.  The three keys above are
recommended; additional custom keys are preserved by the parser.

## 7.2 INSIGHTS Section

```
# INSIGHTS

[INSIGHT-1]
type: success | failure | observation
description: what was learned
confidence: 0.0–1.0
source: TASK-N
```

`type` and `description` are required per block.  `confidence` is a float
`0.0–1.0` (not an enum) to allow fine-grained expression. `source` is the ID
of the task or decision this insight came from.

## 7.3 DECISIONS Section

```
# DECISIONS

[DEC-1]
choice: the chosen option
reason: why this option was chosen
alternatives: other options considered (comma-separated)
impact: low | medium | high
```

`choice` and `reason` are required per block.

## 7.4 REFERENCES Section

```
# REFERENCES
- TASK-1 → INSIGHT-1
- TASK-2 → DEC-1 [validates]
- INSIGHT-1 → DEC-1 [derives_from]
```

Arrow syntax (→ or ->).  Optional relationship qualifier in `[...]`.

Valid relationship types: `derives_from | contradicts | depends_on | validates`

If no qualifier is given, `depends_on` is assumed.

---

## 11. Validation Rules

| Code  | Severity | Rule                                               |
|-------|----------|----------------------------------------------------|
| V-001 | error    | All five **required** sections must be present     |
| V-002 | warning  | Standard sections should appear in canonical order |
| V-003 | error    | `version` must match `major.minor` pattern         |
| V-004 | error    | `created` / `updated` must be ISO 8601 dates       |
| V-005 | warning  | `status` must be draft / active / archived         |
| V-006 | warning  | TASKS section should contain at least one task     |
| V-007 | error    | Section names must be uppercase ASCII              |
| V-008 | error    | REFERENCES must use valid relationship types       |
| V-009 | warning  | REFERENCES must point to declared IDs              |

---

## 12. Versioning

MRCF uses semantic versioning `major.minor`.

| Change type     | Bumps  |
|-----------------|--------|
| Breaking change | major  |
| New features    | minor  |

---

## 13. Security Considerations

- Tools must **not** auto-execute code blocks
- Asset paths must be validated against path traversal
- External links must not be auto-fetched without user consent

---

## 14. Compliance Levels

| Level    | Requirements                      |
|----------|-----------------------------------|
| Basic    | Read .mrcf files                  |
| Standard | Parse + Validate (V-001 to V-007) |
| Advanced | AI section integration            |

---

## 15. Rendering Targets

| Section   | Document View | Presentation Slide | Website Page |
|-----------|---------------|--------------------|--------------|
| VISION    | Intro         | Title / Problem    | /vision      |
| CONTEXT   | Context       | Market / Users     | /context     |
| STRUCTURE | Architecture  | Architecture       | /structure   |
| PLAN      | Roadmap       | Roadmap            | /plan        |
| TASKS     | Task List     | Next Steps         | /tasks       |

---

## 16. Licensing

The MRCF specification is published as an open standard.
Recommended: MIT or Creative Commons.

---

## 17. What changed in v2

| Area | v1 | v2 |
|---|---|---|
| Required sections | 5 | 5 (same) |
| Optional standard sections | 0 | 4 (SUMMARY, INSIGHTS, DECISIONS, REFERENCES) |
| Task format | checkbox only | checkbox + `[TASK-N]` block format |
| Workflow status on tasks | none | `planned \| in_progress \| done \| failed \| blocked` |
| Learning capture | none | INSIGHTS with type + confidence float |
| Decision tracking | none | DECISIONS with choice/reason/alternatives/impact |
| Relationship graph | none | REFERENCES with typed relationships |
| Validation rules | V-001–V-007 | V-001–V-009 |
| CSS class prefix | `kdoc-` | `mrcf-` |

v1 documents remain fully parseable by the v2 parser.  No migration required.
