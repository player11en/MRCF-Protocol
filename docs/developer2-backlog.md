# Developer 2 – VS Code Extension | Full Backlog

**Role:** Editor Integration  
**Scope:** KDOC Editor Extension, Document Navigation, Inline Task Management, AI Panel Integration  
**Dependencies:** Developer 1 – Parser + Document Model (consumes `Document`, `Section`, `metadata`, `sections[]`)  
**Tech:** VS Code Extension API, TypeScript

---

## Overview

Developer 2 delivers the **editor experience** for `.kdoc` files: recognition, syntax, navigation, task management, and an AI panel hook. All features assume the Parser (Dev 1) provides a `Document` model; the extension uses it for outline, validation hints, and AI context.

---

# EPIC 1 – KDOC Editor Extension

**Goal:** Users can open, recognize, and edit `.kdoc` files in VS Code with basic language support and structure visibility.

**Dependencies:** None (can start in parallel with Dev 1; deeper features later use Parser).

---

## User Story 1.1 – .kdoc file recognition

**As a** user  
**I want** VS Code to treat `.kdoc` files as KDOC documents  
**So that** I get the right editor behavior and language features.

### Acceptance criteria

- [ ] Opening a file with extension `.kdoc` opens in the KDOC editor (no generic plain-text only).
- [ ] File icon and language mode are associated with `kdoc` (e.g. language id `kdoc`).
- [ ] "Reopen Editor With…" can select "KDOC" for `.kdoc` files.
- [ ] Optional: `files.associations` can map other extensions to `kdoc` (e.g. `"*.kplan": "kdoc"`).

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 1.1.1 | Create VS Code extension scaffold (package.json, activation events, extension.ts). | Use `onLanguage:kdoc` and/or `onCustomEditor:kdoc` as needed. |
| 1.1.2 | Register language contribution: `id: "kdoc"`, name "KDOC", extensions `["kdoc"]`. | In `package.json` under `contributes.languages`. |
| 1.1.3 | Register default `kdoc` language for `.kdoc` files. | So every `.kdoc` opens as kdoc without user action. |
| 1.1.4 | Add file icon for `.kdoc` (optional). | `contributes.icons` or built-in file icon. |
| 1.1.5 | Document in README how to associate other extensions with kdoc. | User-facing. |

---

## User Story 1.2 – Syntax highlighting

**As a** user  
**I want** VISION, CONTEXT, STRUCTURE, PLAN, TASKS and metadata to be highlighted  
**So that** I can scan the document structure quickly.

### Acceptance criteria

- [ ] Level-1 section headers `# VISION`, `# CONTEXT`, etc. are highlighted distinctly.
- [ ] Metadata block (YAML between `---`) is highlighted (key/value, strings).
- [ ] Task lines `- [ ]` and `- [x]` are visually distinct (e.g. checkbox vs completed).
- [ ] Nested headers (`##`, `###`) have consistent, readable styling.
- [ ] Highlighting works in real time as the user types.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 1.2.1 | Define TextMate grammar for KDOC (sections, metadata, tasks). | `.tmLanguage.json` or embedded in package. |
| 1.2.2 | Register grammar in package.json: `scopeName`, `path`, language `kdoc`. | `contributes.grammars`. |
| 1.2.3 | Add theme rules for section headers, metadata, task checkboxes. | Can extend existing theme or provide snippet. |
| 1.2.4 | Test with light and dark themes. | No broken contrast. |

---

## User Story 1.3 – Section folding

**As a** user  
**I want** to fold and unfold sections (VISION, CONTEXT, STRUCTURE, PLAN, TASKS)  
**So that** I can focus on one part of the document.

### Acceptance criteria

- [ ] Each top-level section (`# SECTION_NAME`) has a fold range.
- [ ] Nested subsections (`##`, `###`) are foldable and nest correctly.
- [ ] Folding is based on header hierarchy, not just indentation.
- [ ] Fold state is preserved when switching tabs (VS Code default behavior).

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 1.3.1 | Implement `FoldingRangeProvider` for kdoc: detect `#`, `##`, `###` and compute ranges. | From section header to next same-or-higher level header or EOF. |
| 1.3.2 | Register provider for `documentSelector` language `kdoc`. | `vscode.languages.registerFoldingRangeProvider`. |
| 1.3.3 | Handle edge cases: no trailing content, single section, metadata block (optional fold). | Avoid invalid ranges. |
| 1.3.4 | Add unit tests for fold range boundaries. | Sample .kdoc snippets. |

---

## User Story 1.4 – Outline view

**As a** user  
**I want** an outline (document structure) in the sidebar  
**So that** I can see and jump to all sections and subsections.

### Acceptance criteria

- [ ] Outline shows hierarchy: VISION, CONTEXT, STRUCTURE (with children if any), PLAN, TASKS.
- [ ] Custom sections (unknown standard names) also appear in outline.
- [ ] Clicking an outline entry moves the cursor to that section in the editor.
- [ ] Outline updates when the document is edited.
- [ ] Optional: show simple task count per section (e.g. "TASKS (3)").

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 1.4.1 | Implement `DocumentSymbolProvider` for kdoc: parse headers and build symbol tree. | Use line-by-line scan or integrate with Dev 1 Parser when available. |
| 1.4.2 | Map each `#` / `##` / `###` to a `DocumentSymbol` with name, range, and children. | Kind: SymbolKind.Module or similar for sections. |
| 1.4.3 | Register provider for language `kdoc`. | `vscode.languages.registerDocumentSymbolProvider`. |
| 1.4.4 | Optional: add task count in TASKS section symbol (e.g. "TASKS (5)"). | Parse `- [ ]` / `- [x]` in TASKS body. |
| 1.4.5 | Test with nested sections and long documents. | Performance and correctness. |

---

# EPIC 2 – Document Navigation

**Goal:** Users can move quickly between VISION, CONTEXT, STRUCTURE, PLAN, and TASKS and see at a glance which sections exist and their status.

**Dependencies:** EPIC 1 (language, outline); Parser (Dev 1) optional for “section status” (e.g. valid/incomplete).

---

## User Story 2.1 – Sidebar navigation

**As a** user  
**I want** a dedicated KDOC view in the sidebar  
**So that** I can open and navigate my document without using the generic outline only.

### Acceptance criteria

- [ ] A view container (e.g. "KDOC") appears in the Activity Bar or under an existing container.
- [ ] When a .kdoc file is active, the view shows the list of standard sections (VISION, CONTEXT, STRUCTURE, PLAN, TASKS) and any custom sections.
- [ ] Sections that exist in the document are listed; missing required sections can be marked (e.g. "STRUCTURE (missing)").
- [ ] Clicking a section focuses the editor and scrolls to that section.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 2.1.1 | Create a TreeDataProvider for the KDOC sidebar view. | Consume open .kdoc document (active editor). |
| 2.1.2 | Register view in package.json: id, name, type tree, visibility. | `contributes.views`. |
| 2.1.3 | Implement tree nodes: one node per section, label = section name. | Optional: icon per section type. |
| 2.1.4 | On node click, execute `vscode.commands.executeCommand('editor.action.goToLocations')` or open editor and reveal range. | Use section range from parser or symbol provider. |
| 2.1.5 | Detect “missing” required sections (VISION, CONTEXT, STRUCTURE, PLAN, TASKS) and show them in tree with “(missing)” or dimmed. | Compare required set vs. parsed sections. |

---

## User Story 2.2 – Section jump (commands)

**As a** user  
**I want** commands or shortcuts to jump to the next/previous section or to a specific section  
**So that** I don’t have to scroll.

### Acceptance criteria

- [ ] Command "Go to Next Section" moves cursor to the start of the next `# SECTION`.
- [ ] Command "Go to Previous Section" moves cursor to the start of the previous section.
- [ ] Command "Go to Section…" shows a quick pick list of sections; choosing one jumps to it.
- [ ] Commands are only enabled when the active editor is a .kdoc file.
- [ ] Optional: keybindings in package.json (e.g. Ctrl+Alt+Down/Up).

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 2.2.1 | Implement "Go to Next Section": find current section, then next `# ...` line. | Handle cursor in metadata or last section. |
| 2.2.2 | Implement "Go to Previous Section". | Handle first section. |
| 2.2.3 | Implement "Go to Section…" with QuickPick filled from document sections. | Use same parsing as outline/sidebar. |
| 2.2.4 | Register commands in package.json and enable when `editorLangId == 'kdoc'`. | `contributes.commands`, `when` clause. |
| 2.2.5 | Add default keybindings (optional). | `contributes.keybindings`. |

---

## User Story 2.3 – Section status indicator

**As a** user  
**I want** to see at a glance whether required sections are present and optionally valid  
**So that** I can fix structure before exporting or using AI.

### Acceptance criteria

- [ ] In the sidebar or status bar, show a short status (e.g. "KDOC: 5/5 sections" or "KDOC: STRUCTURE missing").
- [ ] Optional: icon or color for “all required present” vs “missing”.
- [ ] Clicking the status can focus the KDOC view or run “Go to Section…”.
- [ ] Status updates when the document is edited or when switching to another .kdoc tab.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 2.3.1 | Define required sections (VISION, CONTEXT, STRUCTURE, PLAN, TASKS) in a shared constant. | Align with spec_v1. |
| 2.3.2 | On active editor change (and on document change), re-parse and count present required sections. | Reuse section detection from outline/sidebar. |
| 2.3.3 | Add StatusBarItem: text like "KDOC: 5/5" or "KDOC: 3/5 (STRUCTURE, PLAN missing)". | Show only when active editor is kdoc. |
| 2.3.4 | On status bar click, open Quick Pick "Go to Section…" or focus KDOC tree view. | UX choice. |
| 2.3.5 | Dispose status bar item when extension deactivates or when no kdoc is open. | No leaks. |

---

# EPIC 3 – Inline Task Management

**Goal:** Users can manage task checkboxes inside the TASKS section with visual feedback and simple filtering.

**Dependencies:** EPIC 1 (syntax, outline). Parser (Dev 1) optional for strict task parsing.

---

## User Story 3.1 – Task checkbox parsing and toggling

**As a** user  
**I want** to toggle task checkboxes (`- [ ]` ↔ `- [x]`) by click or command  
**So that** I can track progress without editing raw text.

### Acceptance criteria

- [ ] In the TASKS section, lines that match `- [ ]` or `- [x]` are recognized as tasks.
- [ ] Command "Toggle KDOC Task" toggles the checkbox under the cursor (or the line under cursor).
- [ ] Optional: inlay or gutter icon that toggles on click (if VS Code supports it for the language).
- [ ] Toggling preserves the rest of the line and leading/trailing whitespace per spec.
- [ ] Works only when cursor is on a task line in a .kdoc file.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 3.1.1 | Implement task line detection: regex or parser for `- [ ]` and `- [x]` (with optional leading whitespace). | Spec: `- [ ] task` / `- [x] task`. |
| 3.1.2 | Implement "Toggle KDOC Task" command: get current line, if task then replace `[ ]`↔`[x]`. | Use `TextEdit` or `editor.edit`. |
| 3.1.3 | Register command; enable when `editorLangId == 'kdoc'` and cursor is on a task line. | `when` clause can check document + position. |
| 3.1.4 | Optional: CodeLens or gutter decoration for "Toggle" on task lines. | If available for custom editors. |
| 3.1.5 | Add unit tests for toggle logic (various line formats, optional metadata after task). | Per spec optional `owner:`, `priority:`. |

---

## User Story 3.2 – Task progress indicator

**As a** user  
**I want** to see progress (e.g. 2/5 tasks done) for the current document  
**So that** I know how much is left.

### Acceptance criteria

- [ ] Somewhere (status bar or KDOC view) show "Tasks: 2/5" or "2 of 5 completed".
- [ ] Count only lines in the TASKS section that match the task format.
- [ ] Count updates when the document or the active editor changes.
- [ ] Optional: progress bar or percentage in the KDOC sidebar.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 3.2.1 | Implement task counting: find TASKS section, then count `- [ ]` and `- [x]` lines. | Reuse task line regex; scope to TASKS section only. |
| 3.2.2 | Expose count in KDOC tree view (e.g. "TASKS (2/5)") or in status bar. | Prefer one consistent place. |
| 3.2.3 | Subscribe to document changes and refresh count. | Debounce if needed. |
| 3.2.4 | Handle documents with no TASKS section or no tasks (show 0/0 or "No tasks"). | Avoid NaN or errors. |

---

## User Story 3.3 – Task filter

**As a** user  
**I want** to filter the view to show only open or only completed tasks  
**So that** I can focus on what’s left or review what’s done.

### Acceptance criteria

- [ ] In the KDOC sidebar or a dedicated "Tasks" view, list all tasks with a short label (task text).
- [ ] Filter options: All / Open only / Completed only.
- [ ] Clicking a task in the list jumps to that line in the editor.
- [ ] List updates when the document changes.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 3.3.1 | Add a "Tasks" tree or list inside KDOC view (or separate view): nodes = task lines, label = trimmed task text. | Reuse TASKS section + task line parsing. |
| 3.3.2 | Add filter dropdown or buttons: All, Open, Completed. | Persist last choice in workspace state if desired. |
| 3.3.3 | On task node click, reveal line in editor. | Same as section jump. |
| 3.3.4 | Refresh task list on document change. | Debounce. |

---

# EPIC 4 – AI Panel Integration

**Goal:** Users can select a section (or the whole document) and use an AI panel to send it to an LLM (e.g. “generate PLAN from this VISION”). The extension provides the UI and context; the actual LLM call can be implemented by Dev 3.

**Dependencies:** EPIC 1 (sections, outline). Dev 3 (AI Service) for full flow; this Epic can deliver panel + section selection + prompt building first, with a placeholder or simple API call.

---

## User Story 4.1 – AI sidebar panel

**As a** user  
**I want** a panel where I can ask AI to work on my KDOC  
**So that** I don’t leave the editor.

### Acceptance criteria

- [ ] A panel (view) is available, e.g. "KDOC AI" or "AI" under the KDOC view container.
- [ ] Panel shows an input (multiline) for the user prompt and a "Send" or "Run" action.
- [ ] Panel shows a result area (read-only) for AI output.
- [ ] Panel is visible when a .kdoc file is open; can be empty or disabled when no kdoc is active.
- [ ] Optional: history of last N prompts/responses (stored in workspace or memory).

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 4.1.1 | Create a Webview or Tree/Webview hybrid for the AI panel. | Webview allows rich input/output. |
| 4.1.2 | Register the view in package.json (side panel or panel). | `contributes.views`. |
| 4.1.3 | Implement UI: prompt text area, Send button, result area. | Minimal styling; match VS Code theme if possible. |
| 4.1.4 | When no kdoc is active, show message "Open a .kdoc file to use AI." and disable Send. | Context-aware. |
| 4.1.5 | Optional: store last prompt/response in workspace state for session. | No persistence to disk required for MVP. |

---

## User Story 4.2 – Section selection for AI

**As a** user  
**I want** to choose which section(s) to send as context to the AI  
**So that** I can ask "generate PLAN from VISION" or "improve STRUCTURE".

### Acceptance criteria

- [ ] In the AI panel, a control (dropdown or checkboxes) lists VISION, CONTEXT, STRUCTURE, PLAN, TASKS and any custom sections.
- [ ] User can select one or more sections; selected content is included in the context sent to the AI.
- [ ] Option "Full document" includes all sections (and metadata if desired).
- [ ] Selected section content is passed to the prompt builder (and later to Dev 3 API) as structured text (e.g. "## VISION\n...\n## CONTEXT\n...").

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 4.2.1 | Parse current document into sections (use same logic as outline or call Dev 1 Parser if available). | Section name + content text. |
| 4.2.2 | Build section selector UI: list of section names, multi-select. | Checkboxes or multi-select dropdown. |
| 4.2.3 | Implement "context builder": concatenate selected sections with clear labels (e.g. `# VISION\n...\n# CONTEXT\n...`). | So LLM sees structure. |
| 4.2.4 | Add "Full document" option that includes all sections in order. | Optional: include metadata block. |
| 4.2.5 | Pass built context to the prompt (e.g. "Context:\n{context}\n\nUser prompt:\n{userInput}"). | Template format agreed with Dev 3. |

---

## User Story 4.3 – Prompt builder

**As a** user  
**I want** preset actions like "Generate PLAN from VISION" or "Generate TASKS from PLAN"  
**So that** I don’t have to write the same prompts every time.

### Acceptance criteria

- [ ] Preset dropdown or buttons: e.g. "Generate PLAN from VISION", "Generate TASKS from PLAN", "Analyze document", "Custom".
- [ ] When a preset is chosen, the prompt text area is pre-filled (and section selection can be auto-set, e.g. VISION for "Generate PLAN from VISION").
- [ ] "Custom" allows free-form prompt; section selection still applies.
- [ ] Preset prompts are documented and use placeholders like {{VISION}} if needed, or rely on context builder.

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 4.3.1 | Define preset list: id, label, default sections, template prompt. | E.g. "Generate PLAN from VISION" → sections [VISION], template "Generate a PLAN section for this project based on the following VISION:\n\n{{CONTEXT}}". |
| 4.3.2 | Implement preset selector in AI panel UI. | Dropdown or buttons. |
| 4.3.3 | On preset select: set section selection and pre-fill prompt from template. | Replace {{CONTEXT}} with actual context when sending. |
| 4.3.4 | "Custom" preset: clear template, leave section selection as user configured. | |
| 4.3.5 | Document presets in extension README and optionally in a small in-editor help. | User-facing. |

---

## User Story 4.4 – Send to AI and show result (integration point)

**As a** user  
**I want** to send my prompt and selected context to the AI and see the result  
**So that** I can use the output (e.g. paste into PLAN section).

### Acceptance criteria

- [ ] "Send" calls an AI API (or extension API provided by Dev 3). If Dev 3 not ready, a placeholder (e.g. echo or mock) is acceptable.
- [ ] Result is shown in the panel; if error (network, API key), show a clear message.
- [ ] Optional: "Insert into document" button that inserts the result at cursor or into a chosen section (e.g. PLAN). Requires careful UX (replace vs append, which section).

### Tasks

| ID   | Task | Notes |
|------|------|--------|
| 4.4.1 | Define interface for "AI service": `sendPrompt(context: string, userPrompt: string): Promise<string>`. | Dev 3 implements; Dev 2 calls. |
| 4.4.2 | Implement "Send": build context from section selection, merge with user prompt, call AI service. | Handle async and errors. |
| 4.4.3 | Display response in result area; support long output (scroll, maybe markdown preview). | |
| 4.4.4 | Optional: "Insert into section" – show Quick Pick of sections, then insert at end of section. | Use `TextEdit` or `editor.edit`. |
| 4.4.5 | If Dev 3 not available, implement mock that returns a short message. | So Dev 2 can test UI end-to-end. |

---

# Cross-cutting

## Testing (Developer 2)

- **Unit:** Task line regex, section detection, context builder, fold ranges (with sample .kdoc strings).
- **Integration:** Open .kdoc → outline updates, sidebar shows sections, toggle task, status bar updates.
- **E2E (optional):** Playwright or VS Code extension E2E: install extension, open .kdoc, run "Go to Section", toggle task.

## Performance

- Parsing for outline, sidebar, tasks: debounce on document change (e.g. 150–300 ms).
- Reuse a single parser or lightweight line scan; avoid re-parsing entire doc on every keystroke.

## Documentation

- README: how to install, what commands and views are available, how to use AI panel and presets.
- Contributes: commands, keybindings, views, languages, grammars documented in package.json.

---

# Summary – Deliverables (Developer 2)

| Epic | Deliverable |
|------|-------------|
| 1 | .kdoc recognition, syntax highlighting, folding, outline view |
| 2 | KDOC sidebar, section jump commands, section status indicator |
| 3 | Task toggle command, task progress, task list with filter |
| 4 | AI panel with section selection, prompt presets, send/result and insert (or mock until Dev 3 ready) |

**Definition of done per user story:** Acceptance criteria met, relevant tasks implemented, no regressions in existing behavior, README updated if user-facing.
