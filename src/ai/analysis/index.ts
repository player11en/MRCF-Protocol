// ─────────────────────────────────────────────
// Analysis Module – Public API
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

export { buildContext, getSection, getSectionText } from './context-builder';
export type { ContextBuilderOptions } from './context-builder';

export { extractMetadata, parseMrcfDocument, listPresentSections } from './section-extractor';

export { analyzeDocument, checkConsistency } from './consistency-checker';
