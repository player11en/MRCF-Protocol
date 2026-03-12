# MRCF – VS Code Extension

Editor support for `.mrcf` structured documents (VISION, CONTEXT, STRUCTURE, PLAN, TASKS).

## Features

- **Language**: Files with extension `.mrcf` are recognized as MRCF.
- **Syntax highlighting**: Section headers, metadata block, task checkboxes.
- **Folding**: Fold sections by `#` / `##` / `###` headers.
- **Outline**: Document outline and breadcrumbs from section structure.
- **MRCF sidebar**: In the Explorer, a "MRCF" view lists sections (VISION, CONTEXT, STRUCTURE, PLAN, TASKS and any custom sections). Missing required sections show "(missing)". Click a section to jump to it.
- **Go to section**: Command **Go to Section…** (`mrcf.goToSection`) opens a quick pick to jump to any section. **Go to Next Section** / **Go to Previous Section** move between sections (default keybindings: Ctrl+Alt+Down / Ctrl+Alt+Up when a .mrcf file is active).
- **Status bar**: When a .mrcf file is active, the status bar shows e.g. "MRCF: 5/5 sections" or "MRCF: 3/5 (STRUCTURE, PLAN missing)". Click it to run Go to Section….
- **Task toggle**: Command **Toggle MRCF Task** (`mrcf.toggleTask`, default `Ctrl+Alt+Space`) toggles `- [ ]` ↔ `- [x]` on the current task line in the TASKS section.
- **Task progress**: The MRCF sidebar shows `TASKS (done/total)` when tasks exist, e.g. `TASKS (2/5)`.
- **MRCF Tasks view**: A separate **MRCF Tasks** view lists tasks with filters **All / Open / Completed** and clicking a task jumps to its line.
- **MRCF AI panel**: A dedicated MRCF activity bar icon opens a view with **AI**, where you can choose presets (e.g. *Generate PLAN from VISION*), select sections or full document, write a prompt, and see the result. Currently wired to a mock AI service; plug in a real LLM via the `AiService` interface.

## Associating other extensions with MRCF

To treat other file types as MRCF (e.g. `.mplan`), add to your VS Code `settings.json`:

```json
"files.associations": {
  "*.mplan": "mrcf"
}
```

Then use **Reopen Editor With…** and choose **MRCF** when needed.

## Integration

- This extension uses a **lightweight local parse** for outline/folding. For full validation and a single source of truth, the app can wire in `@mrcf/parser` and replace the local parse where appropriate.
- AI panel will call an **AI service interface**; the extension only provides the UI and section selection.
