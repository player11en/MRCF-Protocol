# Developer 4 – Renderer & Views | Full Backlog

**Role:** Render Pipeline & Output Formats  
**Scope:** HTML Document Renderer, Presentation Generator, Static Website Generator, Export System, Security/Accessibility, Test Automation  
**Dependencies:** Developer 1 – Parser + Document Model (consumes `KDocDocument`, `KDocSection`, `KDocMetadata`, `sections[]`, `assets[]`)  
**Tech:** TypeScript, Node.js, HTML/CSS

---

## Overview

Developer 4 delivers the **rendering and output layer** for `.kdoc` files. All renderers consume the parsed `KDocDocument` model from Dev 1's `@kdoc/parser`. The core responsibility is transforming a structured document into multiple output formats: HTML, presentation slides, static websites, and packaged exports — while maintaining the semantic consistency of `VISION`, `CONTEXT`, `STRUCTURE`, `PLAN`, and `TASKS` across all views.

### Technical Focus

- **Input:** Parser output (`KDocDocument { metadata, sections[], assets[] }`)
- **Core:** Render Pipeline + View Abstraction
- **Output:** HTML, Slides, Static Website, Exports

### Dependencies on other Developers

| Dependency | From | What |
|------------|------|------|
| Document Model | Dev 1 | `KDocDocument`, `KDocSection`, `KDocMetadata` types + `parse()` API |
| Editor triggers | Dev 2 | Optional: "Preview" command could invoke renderer later |
| AI content | Dev 3 | AI-generated content must be renderer-compatible (standard section format) |

### Definition of Done (Dev 4, global)

- Every View can render a valid `.kdoc` without manual post-processing.
- Required sections are visually consistent and clearly identifiable.
- Assets are resolved robustly (incl. error state / fallback).
- Snapshot / golden tests exist for core render outputs.

---

# EPIC 1 – Renderer Foundation & HTML Document View

**Goal:** Build the core render pipeline and the primary HTML document renderer that turns a `KDocDocument` into a complete, styled HTML page.

**Dependencies:** Dev 1 `@kdoc/parser` types (can stub if parser not built yet).

---

## User Story 1.1 – Render Core (Normalize & Transform)

**As a** system  
**I want** a render pipeline that normalizes a `KDocDocument` into intermediate render nodes  
**So that** multiple output formats can share the same transformation logic.

### Acceptance Criteria

- [ ] A `renderDocument(doc: KDocDocument)` function produces a normalized `RenderTree`.
- [ ] `RenderTree` includes metadata node, ordered section nodes, and asset references.
- [ ] The core handles unknown/custom sections without breaking.
- [ ] The pipeline is output-format-agnostic (no HTML specifics in the core).

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 1.1.1 | Define `RenderNode`, `RenderTree`, and `RenderContext` interfaces | Output-agnostic intermediate representation |
| 1.1.2 | Implement `normalize(doc: KDocDocument): RenderTree` | Maps sections → nodes, preserves order and hierarchy |
| 1.1.3 | Handle custom/unknown sections as generic nodes | Spec §12.2: treat as custom sections |
| 1.1.4 | Unit test normalization with standard + custom sections | At least 3 fixture documents |

---

## User Story 1.2 – HTML Renderer

**As a** user  
**I want** to render a `.kdoc` file as a complete HTML page  
**So that** I can view the document in a browser or share it as a standalone file.

### Acceptance Criteria

- [ ] A valid KDOC renders to a complete, well-formed HTML page without errors.
- [ ] Section order (VISION → CONTEXT → STRUCTURE → PLAN → TASKS) is preserved.
- [ ] Markdown elements (lists, tables, code blocks, links, images) render correctly.
- [ ] Missing assets don't break the build — they show a warning placeholder.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 1.2.1 | Implement `HtmlRenderer` class consuming `RenderTree` | Outputs full HTML string |
| 1.2.2 | Markdown-to-HTML transformation with safe sanitization | Use a lightweight Markdown library or built-in |
| 1.2.3 | Standard layout: metadata header + ordered sections | `<header>`, `<main>`, `<section>` elements |
| 1.2.4 | Generate section anchors (`#vision`, `#context`, etc.) | For in-page navigation |
| 1.2.5 | Generate Table of Contents (TOC) from sections/subsections | `<nav>` with internal links |
| 1.2.6 | Asset resolver integration: resolve `assets/...` paths, broken-asset placeholder | `<img>` with fallback alt text |
| 1.2.7 | Base theme (light) + semantic CSS classes per section | `.kdoc-section-vision`, `.kdoc-section-tasks` etc. |
| 1.2.8 | Error rendering: show validation warnings as visible alert boxes | For invalid structure |

---

## User Story 1.3 – CSS Theme Foundation

**As a** user  
**I want** rendered HTML to look professional with a clean, readable layout  
**So that** documents are presentation-ready out of the box.

### Acceptance Criteria

- [ ] A default light theme is bundled with the HTML renderer.
- [ ] Each standard section has a distinct, subtle visual identity (color accent or icon).
- [ ] Typography is clean and readable (system fonts or embedded web font).
- [ ] Responsive: readable on mobile screens.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 1.3.1 | Design CSS variables for colors, typography, spacing | `:root` custom properties |
| 1.3.2 | Section-specific accent colors or left-border markers | Visual section identity |
| 1.3.3 | Responsive layout (max-width container, mobile stack) | Media queries |
| 1.3.4 | Task list styling: checkbox visuals for `- [ ]` / `- [x]` | CSS-only checkboxes |

---

# EPIC 2 – Presentation Generator (Slides View)

**Goal:** Automatically generate a slide deck from a `.kdoc` document by mapping standard sections to slide types.

**Dependencies:** EPIC 1 (render core).

---

## User Story 2.1 – Slide Mapping Engine

**As a** user  
**I want** each KDOC section to automatically map to a slide type  
**So that** I get a presentation without manual formatting.

### Acceptance Criteria

- [ ] Each required section produces at least one slide.
- [ ] Mapping: VISION → Intro, CONTEXT → Problem, STRUCTURE → Architecture, PLAN → Roadmap, TASKS → Next Steps.
- [ ] Long sections are chunked into multiple slides.
- [ ] A standard theme is applied consistently to all slides.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 2.1.1 | Define `Slide`, `SlideDeck`, and `SpeakerNotes` data model | TypeScript interfaces |
| 2.1.2 | Implement `SlideMapper`: section → slide type mapping | `VISION` → `intro`, `CONTEXT` → `problem`, etc. |
| 2.1.3 | Implement content chunking for long sections | Max N lines/characters per slide |
| 2.1.4 | Auto-generate slide titles from section name + subtitle from content | First sentence or heading |
| 2.1.5 | Optional: derive speaker notes from original text | Trimmed version of section content |

---

## User Story 2.2 – Slides HTML Export

**As a** user  
**I want** to export slides as an HTML deck  
**So that** I can present directly in the browser.

### Acceptance Criteria

- [ ] Exported HTML deck is navigable with arrow keys or click.
- [ ] Standard slide layout templates for each slide type.
- [ ] Images/diagrams scale within slides; fallback for missing assets.
- [ ] Deck is self-contained (embedded CSS/JS).

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 2.2.1 | Layout templates: Intro, Problem, Architecture, Roadmap, Next Steps | HTML/CSS per type |
| 2.2.2 | Slide navigation: arrow keys, click prev/next | Minimal JS |
| 2.2.3 | Asset scaling in slides + broken-asset fallback | `max-width`/`max-height` |
| 2.2.4 | Export to single HTML file (embedded CSS + JS) | No external dependencies |

---

# EPIC 3 – Static Website Generator (Docs Site)

**Goal:** Generate a navigable static documentation website from a single `.kdoc` file, similar to MkDocs or Docusaurus.

**Dependencies:** EPIC 1 (render core, HTML renderer).

---

## User Story 3.1 – Site Build Pipeline

**As a** user  
**I want** a single command to build a complete docs site from my `.kdoc` file  
**So that** I can deploy it as project documentation.

### Acceptance Criteria

- [ ] A single `.kdoc` produces a navigable static website.
- [ ] All required sections are reachable as separate pages.
- [ ] Build is reproducible and CI-ready.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 3.1.1 | Site build pipeline: read `.kdoc` → parse → generate pages → write to output dir | Single entry point |
| 3.1.2 | Routing: one page per section, optionally per subsection | `/vision.html`, `/plan.html`, etc. |
| 3.1.3 | Navigation builder: sidebar + prev/next links | Auto-generated from sections |
| 3.1.4 | Landing page from metadata + VISION summary | `index.html` |
| 3.1.5 | Error page + 404 for static output | `404.html` |

---

## User Story 3.2 – Search & SEO

**As a** user  
**I want** basic search and SEO on the generated site  
**So that** content is discoverable.

### Acceptance Criteria

- [ ] Client-side JSON search index finds terms from titles and content.
- [ ] SEO meta tags (title, description) are set per page.
- [ ] Canonical URLs follow a defined naming convention.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 3.2.1 | Build client-side search index (JSON) from sections/subsections | Lightweight search |
| 3.2.2 | SEO meta tags per page (title, description from section content) | `<meta>` tags |
| 3.2.3 | Canonical URL convention: `/vision`, `/context`, etc. | Consistent slugs |
| 3.2.4 | Cross-linking between PLAN and TASKS where applicable | Auto-detect references |

---

# EPIC 4 – Export System & Packaging

**Goal:** Provide a unified export API for generating PDF, HTML, and slides bundles from a `.kdoc` document.

**Dependencies:** EPIC 1 (HTML), EPIC 2 (slides).

---

## User Story 4.1 – Export Orchestrator

**As a** user  
**I want** a single API/CLI to export my document in multiple formats  
**So that** I don't have to learn separate tools for each format.

### Acceptance Criteria

- [ ] All export targets run through a single orchestrator.
- [ ] Export includes traceable metadata (manifest with version, timestamp, source hash).
- [ ] Errors are reported clearly and don't crash the process.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 4.1.1 | Build `ExportOrchestrator` with unified API for all targets | `export(doc, format)` |
| 4.1.2 | PDF export from HTML (print CSS + pagination rules) | CSS `@media print` |
| 4.1.3 | Single-file HTML export (embedded CSS, optional embedded assets) | Self-contained |
| 4.1.4 | Slides export (HTML deck + optional PDF handout) | From EPIC 2 |
| 4.1.5 | Output packaging as ZIP (assets + manifest) | `manifest.json` |
| 4.1.6 | Export manifest: version, timestamp, source hash | Traceability |
| 4.1.7 | CLI commands: `export html|pdf|slides|all` | Entry points |

---

# EPIC 5 – Rendering Quality, Accessibility & Security

**Goal:** Ensure rendered outputs are robust, accessible, and safe from XSS or injection attacks.

**Dependencies:** EPIC 1 (HTML renderer).

---

## User Story 5.1 – Security & Sanitization

**As a** user  
**I want** rendered output to be safe from script injection  
**So that** I can trust sharing rendered documents.

### Acceptance Criteria

- [ ] No unfiltered script rendering from KDOC content.
- [ ] HTML sanitization policy is defined and enforced.
- [ ] XSS-relevant content in markdown/links/images is sanitized.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 5.1.1 | Define and implement HTML sanitization policy | Allowlist-based |
| 5.1.2 | Sanitize markdown output (strip `<script>`, `javascript:` URLs, etc.) | Per spec §18 |
| 5.1.3 | Validate asset paths (no directory traversal) | Security |

---

## User Story 5.2 – Accessibility

**As a** user  
**I want** rendered output to be accessible  
**So that** all users can consume the content.

### Acceptance Criteria

- [ ] Semantic HTML elements used throughout.
- [ ] Proper heading hierarchy maintained.
- [ ] Keyboard navigation works for website and slides.
- [ ] Alt text on images, sufficient color contrast.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 5.2.1 | Semantic HTML: `<article>`, `<section>`, `<nav>`, `<header>` | Throughout all renderers |
| 5.2.2 | Heading hierarchy: single `<h1>`, proper nesting | Per page |
| 5.2.3 | Keyboard navigation for slides (arrow keys, tab) | Focus management |
| 5.2.4 | Alt text from asset references; contrast check | WCAG basics |

---

## User Story 5.3 – Performance

**As a** developer  
**I want** rendering to perform well on large documents  
**So that** the tool remains usable at scale.

### Acceptance Criteria

- [ ] Rendering stays within defined time limits for large files (500+ tasks).
- [ ] Custom sections render without layout breaks.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 5.3.1 | Performance budget for large documents | Define acceptable render time |
| 5.3.2 | Benchmarks + profiling for large `.kdoc` files | Measure and report |
| 5.3.3 | Fallback behavior for unknown/custom sections | Stable rendering |

---

# EPIC 6 – Test Automation & CI for Renderer Stack

**Goal:** Ensure rendering changes can be safely deployed without breaking existing views.

**Dependencies:** All previous EPICs.

---

## User Story 6.1 – Unit & Snapshot Tests

**As a** developer  
**I want** automated tests for all renderer logic  
**So that** regressions are caught before merge.

### Acceptance Criteria

- [ ] Every merge triggers automatic renderer tests.
- [ ] Breaking UI/output changes are detected via snapshot/golden tests.
- [ ] Reference KDOCs cover: required sections, nested, custom, asset errors.

### Tasks

| ID | Task | Notes |
|----|------|-------|
| 6.1.1 | Unit tests for render core (normalization, node mapping) | Jest |
| 6.1.2 | Snapshot/golden tests for HTML output | Compare against reference |
| 6.1.3 | Snapshot tests for slides output | Compare against reference |
| 6.1.4 | Integration tests: parser → renderer with reference KDOCs | End-to-end rendering |
| 6.1.5 | Test fixtures: create reference `.kdoc` files | `/fixtures/kdoc/` |
| 6.1.6 | CI workflow for renderer packages | GitHub Actions or similar |

---

# Summary – Deliverables (Developer 4)

| Epic | Deliverable |
|------|-------------|
| 1 | `render-core` module, `html-renderer` module, base CSS + template, snapshot tests |
| 2 | `slides-generator` module, standard slide templates, example deck |
| 3 | `site-generator` module, build command, example site output |
| 4 | `export-service` module, CLI export commands, golden files for regression |
| 5 | Security guidelines, a11y checklist, benchmark report |
| 6 | CI workflow, test fixtures, documented release checklist |

**Definition of done per user story:** Acceptance criteria met, relevant tasks implemented, no regressions in existing behavior, snapshot tests green.
