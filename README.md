# MRCF-Protocol

**Machine-Readable Context Format — The AI-native methodology and document standard for structured work.**

MRCF is **first a project methodology, then a file format**. The structured section model gives humans and AI a shared way to think about any project; the `.mrcf` plain‑text format makes that structure easy to parse, version, and render.

You can apply the methodology in **plain Markdown** (using the same headings), and use `.mrcf` when you want tighter tooling, validation, and the v2 memory layer features (INSIGHTS, DECISIONS, SUMMARY).

Think of it as: **Markdown is to text. Git is to code. MRCF is a shared memory layer for humans and AI agents.**

## TL;DR

MRCF is a structured plain-text document format and methodology that acts as a **persistent memory layer** for human-AI collaboration.

One `.mrcf` file holds:
- **what** to build (VISION, PLAN, TASKS)
- **why** decisions were made (DECISIONS)
- **what was learned** (INSIGHTS)
- **where things stand right now** (SUMMARY)

Open it in any editor. Commit it to Git. Every AI session picks up exactly where the last one left off.

---

## Format at a glance

```mrcf
---
title: My Project
version: 3.0
created: 2026-03-25
author: Your Name
status: active
---

# SUMMARY

[SUMMARY]
as_of: 2026-03-25
phase: Development
health: on-track
next: Build ingestion pipeline
open_tasks: 2

# VISION
Build a knowledge platform for research teams.
Goal: reduce duplication, enable AI collaboration.

# CONTEXT
Target: software teams of 5–20 people.
Constraint: must remain human-readable without tooling.

# STRUCTURE
Three components: ingestion, storage, retrieval.
Uses vector embeddings for semantic search.

# PLAN
Phase 1: Core data model (weeks 1–2)
Phase 2: API layer (weeks 3–4)
Phase 3: UI + export (weeks 5–6)

# TASKS

[TASK-1]
description: Build ingestion pipeline
status: in_progress
owner: dev1
priority: high
id: T-001

[TASK-2]
description: Write API docs
status: planned
owner: dev2
priority: medium
id: T-002
depends_on: T-001
```

Open it in any text editor. Commit it to Git. Let an LLM read it and immediately know the project state — and write INSIGHTS when tasks complete so the next session picks up where you left off.

---

## Section model (v3: 5 required + 5 optional)

### Required sections (must be present)

| Section | Purpose |
|---------|---------|
| **VISION** | Why this exists. The problem, goal, and success criteria. |
| **CONTEXT** | Who it’s for. Audience, constraints, technical environment. |
| **STRUCTURE** | How it works. Architecture, modules, design decisions. |
| **PLAN** | How it gets done. Phases, milestones, roadmap. |
| **TASKS** | What’s next. v1 checkboxes or v2 `[TASK-N]` blocks with status, owner, priority. |

### Optional sections (v3 memory layer)

| Section | Purpose |
|---------|---------|
| **SUMMARY** | Snapshot of current state — phase, health, next action, open tasks. AI reads this first on re-entry. |
| **INSIGHTS** | Learnings from completed tasks — success, failure, or observation, with confidence score. |
| **DECISIONS** | Architectural and process decisions with rationale and alternatives considered. |
| **REFERENCES** | Typed links between TASKS, INSIGHTS, and DECISIONS (`derives_from`, `contradicts`, `depends_on`, `validates`). |
| **ARCHIVE** | Links to external or older `.mrcf` files to prevent the master document from growing too large (solving the infinite scroll problem). |

This structure works for **any project** — software, research, book outlines, business plans, event planning, personal OKRs. The methodology forces clear thinking; the v3 optional sections turn a project document into a **persistent memory layer** that AI agents improve on every session.

---

## What's new in v3.0 (Enterprise Ready)

After extensive field testing with autonomous AI agents, MRCF v3.0 introduces three major features to solve long-term AI context management:

1. **Strict Graph Integrity (No Dangling Pointers):** The `mrcf validate` CLI now throws a hard error if a `REFERENCE` points to a deleted task or decision. This guarantees the AI maintains a perfect Directed Acyclic Graph (DAG) of the project's logic over time.
2. **Code Anchors:** Tasks, Insights, and Decisions can now strictly bind to specific source files via `anchor: @[file/path.js]`. This allows AI agents to instantly open the relevant code when reading a historical decision.
3. **Archiving (The Infinite Scroll Fix):** Long-running projects accumulate hundreds of decisions. The new `ARCHIVE` section allows a master `project.mrcf` to link out to `sprint-1.mrcf` and `sprint-2.mrcf`, keeping the active memory footprint small while retaining perfect history.

---

## Use Cases

Because MRCF provides a structured semantic model for work, it is inherently domain-independent. An AI agent can use this single source of truth to manage projects across diverse fields:

| Field | Example Workflow |
|-------|------------------|
| **Book & Content Creation** | Define audience, length, and chapter structure. AI agents can generate outlines, draft chapters, and optimize phrasing. |
| **Software Development** | Describe stack, architecture, and feature roadmap. Code agents can scaffold the app, write DB schemas, and implement API endpoints. |
| **Project Planning** | Outline product launches, conference organization, or research. The AI can manage schedules, analyze risks, and track tasks. |
| **Learning & Knowledge** | Define a learning goal. The LLM can generate reading material, create exercises, and test your progress piece by piece. |
| **Concept Engineering** | Document game mechanics, story worlds, or product ideas. The LLM can generate variations, spot logical gaps, and compare concepts. |

In every case, the `.mrcf` document remains the **shared source of truth**. You outline the vision; the AI works on the tasks.

---

## Why not Markdown / DOCX / Notion?

| Format | Human-readable | AI-parseable | Versionable (Git) | Open | Role |
|--------|:--------------:|:------------:|:-----------------:|:----:|------|
| Markdown | ✅ | ⚠️ No structure | ✅ | ✅ | General Text |
| DOCX (Word) | ⚠️ Needs app | ❌ Binary | ❌ | ❌ | Office Docs |
| Notion | ✅ | ❌ Proprietary | ❌ | ❌ | Team Wiki |
| PDF | ✅ | ❌ | ❌ | ⚠️ | **Final Output** |
| **MRCF** | ✅ | ✅ Semantic | ✅ | ✅ MIT | **AI Workflow** |

---

## MRCF in the AI Ecosystem

MRCF occupies a specific, complementary layer alongside the major AI development frameworks.

### The Three Layers

```
┌────────────────────────────────────────────────────────┐
│  ORCHESTRATION   BMAD Method, AutoGen, CrewAI          │
│  (agent teams, lifecycles, personas)                   │
├────────────────────────────────────────────────────────┤
│  PROCESS         GitHub Spec Kit, BMAD workflows       │
│  (CLI, slash commands, SDD workflows)                  │
├────────────────────────────────────────────────────────┤
│  FORMAT ★        MRCF (.mrcf)                          │
│  (structured, parseable, versionable project context)  │
└────────────────────────────────────────────────────────┘
```

MRCF is the **format layer** — the shared context document that process tools generate and orchestration agents read. It is not competing with Spec Kit or BMAD; it is the document standard they produce and consume.

### Comparison

| Dimension | **MRCF** | **GitHub Spec Kit** | **BMAD Method** |
| :--- | :--- | :--- | :--- |
| **Type** | Format standard + toolchain | Workflow CLI + slash commands | Agent orchestration framework |
| **Core output** | `.mrcf` document | Spec/plan/task Markdown files | Agent personas + workflows |
| **AI agent support** | Via `@mrcf/ai` (OpenAI/Anthropic/Google) | 30+ agents via `AGENTS.md` | 12+ specialized agent personas |
| **Unique value** | Structured, parseable project context | Spec-Driven Development process | Multi-agent lifecycle management |
| **Git-native** | ✅ Plain text, diff-friendly | ✅ | ✅ |
| **Renderer** | ✅ HTML, slides, site, ZIP | ❌ | ❌ |
| **Writeback protocol** | ✅ | ❌ | ❌ |

**Integration example:** Use Spec Kit's `/speckit.specify` to generate your spec → store it in a `.mrcf` file → let BMAD agents read the VISION + CONTEXT sections → track tasks in the TASKS section. Each tool does what it does best.

MRCF works well alongside the **Model Context Protocol (MCP)**:

- **MRCF** provides human-authored, versioned **project memory** (why, for whom, how, when, what next) in a single, parseable document.
- **MCP** handles runtime **context plumbing** — pulling live data from APIs, databases, and tools.

Used together, an agent reads the `.mrcf` file for intent and structure, then uses MCP tools to fetch live data while executing tasks.

---

## Asset Handling (Images & Media)

MRCF remains versionable and lightweight because it is **plain text**. Binary data like images or datasets are **not embedded directly**. Instead, they are referenced using standard Markdown syntax:

```text
# STRUCTURE

## Project Cover
![Ebook Cover](assets/cover.png)

## Data Analysis
![Sales Forecast Chart](assets/charts/sales_2026.svg)
```

The `@mrcf/parser` automatically resolves these local paths, allowing the renderer to embed them into final HTML exports or presentation slides.

---

## Human-AI Workflow

MRCF is designed for an iterative loop where humans set the strategy and AI maintains the memory layer:

1. **Human** writes `# VISION` and `# CONTEXT` — the intent and constraints only a human can define.
2. **AI suggests** `# PLAN` and `# TASKS`; **human reviews, edits, and approves** before any work starts.
3. **Human** drives execution; AI assists with drafting, code generation, and research on request.
4. **Human marks tasks done**; AI generates `# INSIGHTS` from outcomes — capturing what worked and what didn’t.
5. **AI proposes** `# DECISIONS` with rationale and alternatives; **human accepts, edits, or rejects** each one via the writeback protocol.
6. **AI updates** `# SUMMARY` as a compact re-entry snapshot — so the next session starts informed, not blank.

The INSIGHTS → DECISIONS → SUMMARY loop is what makes MRCF a **memory layer**: structured knowledge accumulates across sessions, and humans stay in control at every step.

---

## Tool ecosystem

```
your-project.mrcf
        ↓
@mrcf/parser   ← parse, validate, resolve assets
        ↓            ↓
@mrcf/ai      @mrcf/renderer
 (OpenAI /      (HTML, slides,
  Anthropic /    static site,
  Google)        ZIP export)
        ↓            ↓
    VS Code Extension
 (edit · navigate · AI panel · tasks)
```

| Package | What it does |
|---------|-------------|
| [`@mrcf/parser`](parser/) | Parse `.mrcf` files into typed objects. Validate against 9 rules (V-001–V-009). Resolve asset references. |
| [`@mrcf/ai`](src/ai/) | Generate PLAN, TASKS, INSIGHTS, DECISIONS, and SUMMARY. Analyze consistency. Supports OpenAI, Anthropic, Google. |
| [`@mrcf/renderer`](src/renderer/) | Render to HTML (responsive, dark mode, sticky TOC), presentation slides, multi-page static site, or ZIP bundle. |
| [VS Code Extension](extension/) | Syntax highlighting, section folding, outline view, task explorer, AI panel, keyboard navigation. |

### Companion tool: PDF to IDE (`pdf-to-mrcf`)

For PDF-first workflows, use **PDF to IDE** (repository: `pdf-to-mrcf`) to convert PDFs into an MRCF-ready sidecar package.

Output includes:
- `index.md` for human navigation
- `manifest.json` for machine metadata
- `*.mrcf` document aligned with MRCF Protocol v2
- per-page images and extracted text files

Repository: https://github.com/player11en/pdf-to-mrcf

---

## Writeback protocol (optional, MVP)

For projects where AI agents are allowed to update the `.mrcf` file, the **writeback protocol** adds:

- **Section permissions** (`sections:` + `defaultPermission` in frontmatter) to control which sections are human-only, ai-assisted (proposals only), or ai-primary (AI can write directly).
- **Proposal blocks** so AI suggestions are wrapped in a structured `<!-- proposal: ... -->` block instead of silently overwriting content.
- A lightweight **`HISTORY`** section format (`YYYY-MM-DD | actor | summary`) that records human + AI changes.

See `docs/writeback-spec.md` for the full spec and `example-writeback.mrcf` for a minimal example document using permissions, proposals, HISTORY, and task dependencies.

To try it end-to-end:

```bash
# 1) Run the renderer smoke test on the full example
npm run smoke -- example-full.mrcf

# 2) Inspect proposals in a writeback-aware document
npm run review -- example-writeback.mrcf
```

---

## Quick start

> **Requirements:** Node.js 18+ must be installed. Check with `node --version`.

### Option 1 — Clone and run in 3 commands

```bash
git clone https://github.com/player11en/MRCF-Protocol.git
cd MRCF-Protocol
npm install
```

Then verify everything works:

```bash
# Full end-to-end smoke test: parse → validate → render → export all formats
npm run smoke -- example-full.mrcf
```

### Option 2 — Use the CLI

After installing, use the `mrcf` CLI via `npm run mrcf -- <command>`:

```bash
# Validate an .mrcf file
npm run mrcf -- validate my-project.mrcf

# Render to HTML
npm run mrcf -- render my-project.mrcf --out ./output

# Render to slides, site, or zip
npm run mrcf -- render my-project.mrcf --format slides --out ./output

# End-to-end smoke test
npm run mrcf -- smoke my-project.mrcf

# Review AI proposals in a writeback document
npm run mrcf -- review my-project.mrcf
npm run mrcf -- review my-project.mrcf --accept-all
```

**CLI commands:**

| Command | Description |
|---------|-------------|
| `validate <file>` | Parse + validate, print all issues. Exits 1 on errors. |
| `render <file>` | Render to HTML, slides, site, or ZIP (`--format`, `--out`). |
| `smoke <file>` | Full pipeline test: parse → validate → all 4 export formats. |
| `review <file>` | List AI proposals. Use `--accept-all` or `--reject-all` to process. |

### Option 3 — VS Code extension (local install)

The extension compiles and packages as a `.vsix` for local install:

```bash
npm install                       # installs all deps including vsce
```

Then in VS Code: **Extensions → ⋯ → Install from VSIX** → select the `.vsix` file.

Features: syntax highlighting, section folding, outline view, task explorer, AI panel.

**Keybindings (when editing a `.mrcf` file):**

| Key | Action |
|-----|--------|
| `Ctrl+Alt+Down` | Go to next section |
| `Ctrl+Alt+Up` | Go to previous section |
| `Ctrl+Alt+Space` | Toggle task checkbox |

### Option 4 — Use as a library

```ts
import { parse, validate } from '@mrcf/parser';
import { renderHtml, exportDocument } from '@mrcf/renderer';

const result = parse(source);
if (result.ok) {
    const html = renderHtml(result.document!);
    // or export to zip:
    const zip = await exportDocument(result.document!, 'zip', { assetBasePath: './assets' });
}
```

### Option 5 — Import from an existing document

Convert a Word document, PDF, or Markdown file into `.mrcf` in one command:

```bash
# Import from DOCX (Word)
npm run import -- my-document.docx output.mrcf

# Import from PDF
npm run import -- report.pdf output.mrcf

# Import from Markdown (Notion export, README, etc.)
npm run import -- notes.md output.mrcf
```

The importer maps your existing headings to MRCF sections automatically and warns you about anything it couldn't map.

---

## Export formats

From a `.mrcf` file you can generate:

| Format | What you get |
|--------|-------------|
| **HTML** | Single self-contained page — responsive layout, dark mode, sticky TOC, scroll-spy. All local images are base64-embedded. |
| **Slides** | HTML5 presentation deck — one slide per section, keyboard navigation. |
| **Static site** | Multi-page documentation site with global navigation, search index, and per-section pages. |
| **ZIP** | Everything above packaged together with your asset files. Ready to deploy or send. |
| **PDF** | Via `@media print` CSS on the HTML output, or a headless browser (Puppeteer) for server-side generation. |

```bash
# Smoke test: parse → validate → render → export all formats
npm run smoke -- example-full.mrcf
```

Validation rules are defined in detail in `docs/mrcf-spec.md` under “Validation Rules” (codes `V-001`–`V-009`).

---

## Who is it for?

**Developers and architects** — Write `.mrcf` files in VS Code. Push to GitHub for version history and team collaboration. Use `@mrcf/parser` and `@mrcf/renderer` programmatically in your own tooling.

**Technical writers and project managers** — The methodology works for any structured document. Import your existing Word/Markdown content, restructure with AI assistance, export to HTML or a static site.

**LLM pipelines and agents** — MRCF is machine-readable by design. Parse a document, extract sections, feed to any LLM provider, inject the generated content back. No custom training or complex prompting required.

**Ecosystem compatibility** — MRCF maps cleanly to other AI-driven spec frameworks. For example:
- Spec Kit (GitHub/spec-kit): `specify`/`plan`/`tasks` can be generated from `# VISION`/`# PLAN`/`# TASKS`.
- BMAD Method: phase-based workflows and review checklists can be stored in MRCF sections (`# STRUCTURE`, `# TASKS`, custom `# REVIEW`).

**Example files** — Current samples are `.mrcf` source documents (`example-full.mrcf`, `example-writeback.mrcf`, `example.mrcf`). HTML/slide/site outputs are generated at runtime through `npm run smoke` or `npm run render`, not checked in.

**Non-technical users** *(roadmap)* — A web-based editor that lets anyone create and edit `.mrcf` documents in the browser — no VS Code, no terminal, no Git required. On the roadmap. See below.

---

## Roadmap

- [ ] **Web editor** — Browser-based MRCF editor (think Notion-style). Create, edit, and export `.mrcf` files without VS Code or a terminal. The primary path for non-technical users.
- [ ] **ChatGPT-style interface** — Describe your project in conversation; the AI builds the structured `.mrcf` with you iteratively. MRCF's semantic structure makes this especially effective.
- [ ] **GitHub Action** — Auto-render `.mrcf` → HTML on every push, deploy to GitHub Pages. Non-technical readers see a formatted page; collaborators edit the plain-text source.
- [ ] **Obsidian plugin** — Edit `.mrcf` files inside Obsidian with full section navigation and AI panel.
- [ ] **npm publish** — Publish `@mrcf/parser` and `@mrcf/renderer` as open-source npm packages.
- [ ] **VS Code Marketplace** — Publish the extension publicly.
- [ ] **Project template library** — Starter templates for software projects, research papers, books, business plans.

---

## Repository structure

```
mrcf/
├── parser/          @mrcf/parser — parse, validate, types
├── src/
│   ├── ai/          @mrcf/ai — LLM providers, generation, diff
│   └── renderer/    @mrcf/renderer — HTML, slides, site, export
├── extension/       VS Code extension
├── scripts/
│   ├── smoke.ts     End-to-end smoke test
│   └── import.ts    DOCX/PDF/Markdown → .mrcf converter
├── docs/
│   ├── mrcf-spec.md       Full format specification
│   ├── writeback-spec.md  Writeback protocol (permissions, proposals, HISTORY)
│   └── ...
├── example.mrcf           Minimal example
├── example-full.mrcf      Full demo document
├── example-writeback.mrcf Writeback demo document
└── templates/             Starter templates (software project, book outline)
```

---

## Contributing

1. Read the [format specification](docs/mrcf-spec.md) to understand the `.mrcf` standard
2. Each package is independently testable:
   ```bash
   npm run test:parser     # parser tests (31)
   npm run test:ai         # AI package tests (87)
   npm run test:renderer   # renderer tests (63)
   npm run test:all        # everything
   ```
3. File bugs and feature requests as GitHub Issues
4. Pull requests welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for details

---

## License

MIT — see [LICENSE](LICENSE).

The `.mrcf` format specification ([docs/mrcf-spec.md](docs/mrcf-spec.md)) is published as an open standard. Anyone can implement a parser, editor, or renderer without restriction.
