# MRCF-Protocol

**Machine-Readable Context Format — The AI-native methodology and document standard for structured work.**

MRCF is **first a project methodology, then a file format**. The structured section model gives humans and AI a shared way to think about any project; the `.mrcf` plain‑text format makes that structure easy to parse, version, and render.

You can apply the methodology in **plain Markdown** (using the same headings), and use `.mrcf` when you want tighter tooling, validation, and the v2 memory layer features (INSIGHTS, DECISIONS, SUMMARY).

Think of it as: **Markdown is to text. Git is to code. MRCF is a shared memory layer for humans and AI agents.**

---

## Format at a glance

```mrcf
---
title: My Project
version: "2.0"
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
title: Build ingestion pipeline
status: in_progress
owner: dev1
priority: high
id: T-001

[TASK-2]
title: Write API docs
status: planned
owner: dev2
priority: medium
id: T-002
depends_on: T-001
```

Open it in any text editor. Commit it to Git. Let an LLM read it and immediately know the project state — and write INSIGHTS when tasks complete so the next session picks up where you left off.

---

## Section model (v2: 5 required + 4 optional)

### Required sections (must be present)

| Section | Purpose |
|---------|---------|
| **VISION** | Why this exists. The problem, goal, and success criteria. |
| **CONTEXT** | Who it’s for. Audience, constraints, technical environment. |
| **STRUCTURE** | How it works. Architecture, modules, design decisions. |
| **PLAN** | How it gets done. Phases, milestones, roadmap. |
| **TASKS** | What’s next. v1 checkboxes or v2 `[TASK-N]` blocks with status, owner, priority. |

### Optional sections (v2 memory layer)

| Section | Purpose |
|---------|---------|
| **SUMMARY** | Snapshot of current state — phase, health, next action, open tasks. AI reads this first on re-entry. |
| **INSIGHTS** | Learnings from completed tasks — success, failure, or observation, with confidence score. |
| **DECISIONS** | Architectural and process decisions with rationale and alternatives considered. |
| **REFERENCES** | Typed links between TASKS, INSIGHTS, and DECISIONS (`derives_from`, `contradicts`, `depends_on`, `validates`). |

This structure works for **any project** — software, research, book outlines, business plans, event planning, personal OKRs. The methodology forces clear thinking; the v2 optional sections turn a project document into a **persistent memory layer** that AI agents improve on every session.

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

---

## ADK Agent Skill Pattern Support

Google's [Agent Developer Kit (ADK)](https://developers.google.com/adk) defines 5 agent skill design patterns. MRCF maps cleanly to all of them.

| ADK Pattern | What it does | MRCF sections used | Template |
| :--- | :--- | :--- | :--- |
| **Tool Wrapper** | Load library-specific conventions on demand | `# CONTEXT` → rules, `# STRUCTURE` → API conventions | `templates/pattern-tool-wrapper.mrcf` |
| **Generator** | Produce structured output from a reusable template | `# VISION` + `# PLAN` → template; `# TASKS` → fill-in steps | `templates/pattern-generator.mrcf` |
| **Reviewer** | Score artifacts against a checklist by severity | `# STRUCTURE` → checklist; `# TASKS` → findings | `templates/pattern-reviewer.mrcf` |
| **Inversion** | Agent interviews you before acting | `# VISION`/`# CONTEXT` → questions; `# PLAN` → gated synthesis | `templates/pattern-inversion.mrcf` |
| **Pipeline** | Enforce a strict multi-step workflow with checkpoints | `# PLAN` → phases; `# TASKS` → checkpoints; writeback protocol → gates | `templates/pattern-pipeline.mrcf` |

Patterns compose: a **Pipeline** skill can include a **Reviewer** step; a **Generator** can use **Inversion** to gather variables first. Because MRCF supports custom sections (`# AGENT`, `# CHECKLIST`, `# DECISIONS`), the full pattern metadata lives inside the same document.

---

## MRCF vs. The Ecosystem

How MRCF-Protocol compares to other AI-driven specification standards:

| Feature | **MRCF** | **BMAD** | **GitHub Spec Kit** | **OpenSpec** |
| :--- | :--- | :--- | :--- | :--- |
| **Core Goal** | **Project Memory (any domain)** | Project Specs & Tickets | AI-CLI Tooling | PRD Standard |
| **AI Memory** | **Semantic Sections** | File-based Specs | CLI Prompts | Lifecycle Archiving |
| **Standardized View**| **Yes (Renderer)** | No (Raw MD) | No (Raw MD) | No (Raw MD) |
| **Source of Truth** | Single `.mrcf` / structured `.md` | Many `.md` files | Many `.md` files | Multi-phase files |

MRCF and these formats are **complementary** rather than strictly competing: you can still use BMAD-style tickets or GitHub specs on top of an MRCF document that holds the higher-level vision, context, structure, and plan.

### MRCF and MCP (Model Context Protocol)

Modern AI systems increasingly use the **Model Context Protocol (MCP)** to fetch live, structured context (APIs, databases, tools) at runtime.

MRCF focuses on a different layer:

- **MRCF**: human-authored, versioned **project memory** (why, for whom, how, when, what next) in a single, parseable document.
- **MCP**: runtime **context plumbing** that lets agents pull in current data from many sources.

Used together, an agent can:

1. Read the `.mrcf` file to understand the project’s intent and structure.
2. Use MCP tools to fetch live data while executing or updating the PLAN and TASKS.

---

### The "Single Source of Truth" Philosophy
Unlike a PDF, which is a finalized "screenshot" of information, MRCF is a living document. It provides the **semantic anchors** (like `# VISION` or `# PLAN`) that allow an AI to understand context instantly. You maintain the MRCF source; the AI generates the PDF, HTML, or code from it.

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

MRCF is designed for an iterative loop where humans set the strategy and AI maintains a persistent memory layer:

1. **Human** writes `# VISION` and `# CONTEXT` in a `.mrcf` file.
2. **AI** reads VISION and generates `# PLAN` and `# TASKS`.
3. **Human** reviews the plan and kicks off work.
4. **AI** executes tasks (drafting chapters, writing code) and marks them done.
5. **AI** generates `# INSIGHTS` from completed tasks — capturing what worked, what failed, and why.
6. **AI** records key choices in `# DECISIONS` with rationale and alternatives.
7. **AI** updates `# SUMMARY` so the next session has an immediate state snapshot.
8. **Human** uses `@mrcf/renderer` to export a finalized **HTML page**, **slides**, or **static site**.

The INSIGHTS → DECISIONS → SUMMARY loop is what makes MRCF a **memory layer**: each session adds structured knowledge that makes the next session smarter.

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

### Option 1 — VS Code (recommended for developers)

1. Install the **MRCF** extension from the VS Code Marketplace
2. Create a new file: `my-project.mrcf`
3. Start typing — syntax highlighting, folding, and the section outline activate automatically
4. Open the MRCF sidebar to navigate sections, manage tasks, and run AI generation

**Keybindings:**

| Key | Action |
|-----|--------|
| `Ctrl+Alt+Down` | Go to next section |
| `Ctrl+Alt+Up` | Go to previous section |
| `Ctrl+Alt+Space` | Toggle task checkbox |

### Option 2 — npm packages (for developers / pipelines)

```bash
npm install @mrcf/parser @mrcf/renderer
```

```ts
import { parse, validate } from '@mrcf/parser';
import { renderHtml, exportDocument } from '@mrcf/renderer';

const result = parse(source);
if (result.ok) {
    const html = renderHtml(result.document);
    // or: await exportDocument(result.document, 'zip', { assetBasePath: './assets' })
}
```

### Option 3 — Import from an existing document

Convert a Word document, PDF, or Markdown file into `.mrcf` in one command:

```bash
# Clone the repo first
git clone https://github.com/player11en/MRCF-Protocol.git && cd MRCF-Protocol && npm install

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
