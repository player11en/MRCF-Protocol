---
title: MRCF Format Specification
version: 1.0
created: 2026-03-12
author: Developer 1 — Core Format & Parser
status: active
tags:
  - spec
  - format
  - parser
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

MRCF defines five standard sections.  All five are **required** for a valid document.

```
# VISION
# CONTEXT
# STRUCTURE
# PLAN
# TASKS
```

Sections are written as Markdown level-1 headings (`#`).
The name must be **uppercase ASCII** (A-Z, 0-9, underscore, space).

### Section Semantics

| Section   | Purpose                                          |
|-----------|--------------------------------------------------|
| VISION    | Problem statement, goal, success criteria        |
| CONTEXT   | Audience, constraints, environment               |
| STRUCTURE | Architecture, modules, data model                |
| PLAN      | Phases, milestones, roadmap                      |
| TASKS     | Concrete work items (Markdown checkboxes)        |

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

Tasks in the `TASKS` section use Markdown checkboxes:

```
- [ ] incomplete task
- [x] completed task
```

Optional inline metadata (indented 2+ spaces immediately after the task):

```
- [ ] implement parser
  owner: dev1
  priority: high
```

Supported metadata keys: `owner` (string), `priority` (`low` | `medium` | `high`).

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

## 11. Validation Rules

| Code  | Severity | Rule                                               |
|-------|----------|----------------------------------------------------|
| V-001 | error    | All five standard sections must be present         |
| V-002 | warning  | Standard sections should appear in canonical order |
| V-003 | error    | `version` must match `major.minor` pattern         |
| V-004 | error    | `created` / `updated` must be ISO 8601 dates       |
| V-005 | warning  | `status` must be draft / active / archived         |
| V-006 | warning  | TASKS section should contain at least one task     |
| V-007 | error    | Section names must be uppercase ASCII              |

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

## 17. Non-normative future extensions

The following topics are **not part of MRCF 1.0**, but are recognized as important directions for future versions and tooling:

- **Agent writeback & merge semantics** — how human and AI edits are tracked, merged, and attributed over time.
- **Confidence & provenance** — richer structures for the `source` field and per-section metadata to indicate whether sections/plans were AI‑generated and with what confidence (e.g. structured JSON with `tool`, `version`, `timestamp`).
- **Task relationships** — optional task IDs and dependency metadata (e.g. `depends:`) for richer execution planning.
- **Role & ownership model** — conventions for mapping people and agents to sections and tasks.

These are intentionally left out of the core 1.0 spec to keep documents simple and widely adoptable, but implementers are encouraged to experiment and feed results back into future revisions.
