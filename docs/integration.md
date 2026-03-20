# Integration Architecture Plan (analysis before implementation)

This document is the **integration blueprint** for Dev 1–4 deliverables.  
Goal: align parser, extension, AI module, and renderer into one coherent system with minimal rework.

---

## 1) Current State Analysis

### What is already good

- Dev 1 parser exposes the intended public API:
  - `parse(source): ParseResult`
  - `validate(doc): ValidationResult`
  - `resolveAssets(...)`
  - canonical `KDoc*` types
- Dev 2 extension is feature-complete and already has clear AI service injection (`setAiService` / `getAiService`).
- Dev 3 AI module is modular and test-rich (providers, generation, diff, analysis).
- Dev 4 renderer is complete and tested, with `normalize/render/export` pipelines.

### Integration gaps to resolve

1. **Type duplication / drift risk**
   - AI module currently defines `KdocDocument/KdocSection/KdocMetadata` locally.
   - Parser defines canonical `KDocDocument/KDocSection/KDocMetadata`.

2. **Boundary leakage in renderer**
   - Renderer imports parser types from `../../parser/src/types/index` (source path coupling).
   - Should depend on parser package API instead of internal source paths.

3. **Extension parser split-brain**
   - Extension uses lightweight `kdocParse.ts` for navigation/folding/tasks.
   - Full parser validation not yet wired for extension workflows.

4. **AI service contract mismatch at package level**
   - Extension AI panel expects `sendPrompt(context, userPrompt, presetId?) => Promise<string>`.
   - AI module exposes provider-level and generation-level APIs, but no adapter package consumed by extension yet.

5. **Monorepo packaging not formalized**
   - Root/package setup does not yet define all modules as workspace packages with stable imports.

---

## 2) Target Architecture (single source of truth)

```
         .kdoc file
             |
             v
      @kdoc/parser  (canonical model + parse + validate + assets)
         |        \
         |         \__ @kdoc/renderer (html/slides/site/export)
         |
         \__ @kdoc/ai (analysis/generation/diff using canonical types)
               |
               v
       extension/ (VS Code UI, commands, panels)
         - fast local parsing for editor UX
         - canonical parser for validation + rich operations
         - AI adapter to @kdoc/ai
```

### Canonical contracts

- **Document model source:** `@kdoc/parser` types only.
- **Validation source:** `@kdoc/parser.validate` only.
- **AI entry for extension:** a thin adapter in extension (or shared package) that maps UI request → `@kdoc/ai` call.
- **Renderer input contract:** `KDocDocument` only.

---

## 3) Planned Integration Contracts

### 3.1 Parser public contract (already correct)

```ts
import { parse, validate, resolveAssets } from '@kdoc/parser';
import type { KDocDocument, KDocSection, KDocTask } from '@kdoc/parser';
```

### 3.2 Extension ↔ AI contract (stabilize)

Keep extension UI contract simple:

```ts
interface AiService {
  sendPrompt(context: string, userPrompt: string, presetId?: string): Promise<string>;
}
```

Add adapter implementation that internally uses `@kdoc/ai` APIs and provider factory.

### 3.3 AI module typing contract (must migrate)

- Replace all `Kdoc*` local types with imports from `@kdoc/parser`.
- Keep AI-specific result types (`AnalysisResult`, `GenerationResult`, `SectionDiff`, etc.) local to `@kdoc/ai`.

### 3.4 Renderer typing contract (must decouple)

- Replace `../../parser/src/...` imports with `@kdoc/parser` package imports.
- Renderer remains read-only consumer of parsed document model.

---

## 4) Phased Integration Plan (implementation order)

### Phase A — Type and package alignment (foundational)

1. Expose parser types cleanly from built package (`dist` exports).
2. Switch AI module to canonical parser types.
3. Switch renderer imports to parser package path.

**Exit criteria:** no direct `parser/src/...` imports outside parser package.

### Phase B — Extension integration hardening

1. Keep local parse for fast folding/outline/tasks UX.
2. Add parser-backed path for validation/section index in status + AI context creation.
3. Add AI adapter class implementing `AiService` using `@kdoc/ai`.

**Exit criteria:** extension can run with real AI backend and parser validation without losing editor responsiveness.

### Phase C — End-to-end orchestration

1. Define shared workflow commands:
   - analyze document
   - generate PLAN from VISION
   - generate TASKS from PLAN
   - render HTML/slides/site
2. Ensure AI-produced content serializes back to valid `.kdoc`.
3. Validate generated docs with parser validator before renderer/export.

**Exit criteria:** one sample `.kdoc` can complete full loop: edit → AI generate → validate → render/export.

### Phase D — CI integration gates

1. Run parser tests.
2. Run AI tests.
3. Run renderer tests.
4. Run extension compile checks.
5. Add one integration smoke test for the full chain.

**Exit criteria:** green pipeline with all module tests + integration smoke.

---

## 5) Risk Evaluation and Mitigation

### Risk: type drift between modules
- **Mitigation:** parser owns canonical model; all other modules import from it.

### Risk: extension performance regression
- **Mitigation:** keep lightweight local parser for keystroke-level UI features; use full parser for heavier operations.

### Risk: AI output breaks spec
- **Mitigation:** always parse + validate AI output before insertion/export.

### Risk: path-coupled imports in monorepo
- **Mitigation:** package-level imports only (`@kdoc/parser`, `@kdoc/ai`, `@kdoc/renderer`).

---

## 6) Build & Verification Order

1. `parser`: install, build, test
2. `ai`: install, build, test (using parser types)
3. `renderer`: build, test (using parser package import)
4. `extension`: compile with parser + AI adapter wiring
5. integration smoke: sample `.kdoc` full flow

---

## 7) Go/No-Go Checklist (before coding starts)

- [ ] Canonical type owner agreed: `@kdoc/parser`
- [ ] AI type migration approach approved
- [ ] Renderer import boundary approach approved
- [ ] Extension local-parse + parser-backed hybrid approach approved
- [ ] Real AI adapter contract approved
- [ ] CI gate sequence approved

When these are approved, implementation can start with low integration risk.
