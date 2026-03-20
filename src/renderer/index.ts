/**
 * @mrcf/renderer — public API (Developer 4)
 *
 * Usage:
 * ```ts
 * import { renderHtml, renderSlides, generateSite, exportDocument } from './renderer';
 *
 * const html = renderHtml(parsedDocument);
 * const slides = renderSlides(parsedDocument);
 * const site = generateSite(parsedDocument);
 * const result = exportDocument(parsedDocument, 'html');
 * ```
 */

export { normalize, toAnchor } from './renderCore';
export { renderHtml } from './htmlRenderer';
export type { HtmlRenderOptions } from './htmlRenderer';
export { renderSlides, generateSlideDeck } from './slidesGenerator';
export { generateSite } from './siteGenerator';
export type { SiteGeneratorResult } from './siteGenerator';
export { exportDocument } from './exportService';
export { markdownToHtml, escapeHtml, sanitizeHtml } from './markdownTransformer';
export { DEFAULT_THEME_CSS } from './theme';
export * from './types';
