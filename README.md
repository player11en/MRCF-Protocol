# MRCF-Protocol

**Machine-Readable Context Format — The AI-native methodology and document standard for structured work.**

MRCF is **first a project methodology, then a file format**. The 5-section structure gives humans and AI a shared way to think about any project; the `.mrcf` plain‑text format makes that structure easy to parse, version, and render.

You can apply the methodology in **plain Markdown** (using the same headings), and use `.mrcf` when you want tighter tooling and validation.

Think of it as: **Markdown is to text. Git is to code. MRCF is a shared interface for humans and AI agents.**

---

## Format at a glance

```mrcf
---
title: My Project
version: 1.0
created: 2026-03-12
author: Your Name
status: draft
---

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
- [x] Define schema
- [ ] Build ingestion pipeline
- [ ] Write API docs
```

That's the whole format. Open it in any text editor. Commit it to Git. Let an LLM read it and immediately know what to generate next.

---

## The 5-section methodology (method first, format second)

| Section | Purpose |
|---------|---------|
| **VISION** | Why this exists. The problem, goal, and success criteria. |
| **CONTEXT** | Who it's for. Audience, constraints, technical environment. |
| **STRUCTURE** | How it works. Architecture, modules, design decisions. |
| **PLAN** | How it gets done. Phases, milestones, roadmap. |
| **TASKS** | What's next. Markdown checkboxes with optional owner + priority. |

This structure works for **any project** — software, research, book outlines, business plans, event planning, personal OKRs. The methodology forces clear thinking; the format (whether `.mrcf` or disciplined `.md`) lets LLMs act on it automatically.

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

MRCF is designed for an iterative loop where humans set the strategy and AI handles the execution:

1. **Human** writes the `# VISION` and `# CONTEXT` in a `.mrcf` file.
2. **AI** reads the vision and generates the `# PLAN` and `# TASKS`.
3. **Human** reviews the plan, adds `# ASSETS`, and checks off initial tasks.
4. **AI** executes tasks (drafting chapters, writing code) and updates the file.
5. **Human** uses `@mrcf/renderer` to export a finalized **PDF** or **Website**.

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
| [`@mrcf/parser`](parser/) | Parse `.mrcf` files into typed objects. Validate against 7 rules. Resolve asset references. |
| [`@mrcf/ai`](src/ai/) | Generate PLAN from VISION. Generate TASKS from PLAN. Analyze consistency. Supports OpenAI, Anthropic, Google. |
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
git clone https://github.com/playerelevenstudios/mrcf.git && cd mrcf && npm install

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

---

## Who is it for?

**Developers and architects** — Write `.mrcf` files in VS Code. Push to GitHub for version history and team collaboration. Use `@mrcf/parser` and `@mrcf/renderer` programmatically in your own tooling.

**Technical writers and project managers** — The methodology works for any structured document. Import your existing Word/Markdown content, restructure with AI assistance, export to HTML or a static site.

**LLM pipelines and agents** — MRCF is machine-readable by design. Parse a document, extract sections, feed to any LLM provider, inject the generated content back. No custom training or complex prompting required.

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
│   ├── mrcf-spec.md Full format specification
│   └── ...
├── example.mrcf     Minimal example
└── example-full.mrcf Full demo document
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
