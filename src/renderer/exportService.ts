/**
 * Export Service — Developer 4
 *
 * Unified export orchestrator for generating output in multiple formats.
 * Single entry point for HTML, slides, site, and zip exports.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MrcfDocument } from '@mrcf/parser';
import JSZip from 'jszip';
import { renderHtml, type HtmlRenderOptions } from './htmlRenderer';
import { renderSlides } from './slidesGenerator';
import { generateSite, type SiteGeneratorResult } from './siteGenerator';
import type { ExportFormat, ExportManifest, ExportResult } from './types';

/**
 * Export a MrcfDocument in the specified format (Async).
 */
export async function exportDocument(
    doc: MrcfDocument,
    format: ExportFormat,
    options?: HtmlRenderOptions,
): Promise<ExportResult> {
    const manifest = buildManifest(doc, format);

    try {
        switch (format) {
            case 'html':
                return await exportHtml(doc, manifest, options);
            case 'slides':
                return exportSlides(doc, manifest);
            case 'site':
                return exportSite(doc, manifest);
            case 'zip':
                return await exportZip(doc, manifest, options?.assetBasePath);
            case 'pdf':
                return {
                    ok: false,
                    output: '',
                    manifest,
                    warnings: ['PDF export requires an external headless browser (e.g. Puppeteer) which is not bundled. Use the HTML output with `@media print` styling instead.'],
                };
            default:
                return {
                    ok: false,
                    output: '',
                    manifest,
                    warnings: [`Unknown export format: ${format}`],
                };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            ok: false,
            output: '',
            manifest,
            warnings: [`Export failed: ${message}`],
        };
    }
}

/** MIME types used for base64 image embedding. */
const IMAGE_MIME: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
};

/**
 * Post-process an HTML string: replace local <img src="..."> with base64 data URIs.
 * Makes the HTML file fully self-contained (no external asset dependencies).
 * Skips external URLs, data URIs, and files that cannot be read.
 */
async function embedAssetsInHtml(html: string, basePath: string): Promise<string> {
    const resolved = path.resolve(basePath);
    const srcRe = /(<img\b[^>]*?\ssrc=")([^"]+)(")/g;

    // Collect unique local src values
    const localSrcs = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = srcRe.exec(html)) !== null) {
        const src = m[2];
        if (!src.startsWith('http') && !src.startsWith('data:') && src !== '#blocked') {
            localSrcs.add(src);
        }
    }

    // Read and encode each file
    const replacements = new Map<string, string>();
    for (const src of localSrcs) {
        try {
            const fullPath = path.resolve(resolved, src);
            if (!fullPath.startsWith(resolved + path.sep) && fullPath !== resolved) continue;
            const ext = path.extname(fullPath).slice(1).toLowerCase();
            const mime = IMAGE_MIME[ext];
            if (!mime) continue;
            const data = await fs.promises.readFile(fullPath);
            replacements.set(src, `data:${mime};base64,${data.toString('base64')}`);
        } catch {
            // File unreadable — leave path reference as-is
        }
    }

    if (replacements.size === 0) return html;

    return html.replace(/(<img\b[^>]*?\ssrc=")([^"]+)(")/g, (_full, before, src, after) => {
        const dataUri = replacements.get(src);
        return dataUri ? `${before}${dataUri}${after}` : _full;
    });
}

/**
 * Export as a single HTML page.
 * When options.assetBasePath is set, local images are base64-embedded for a self-contained file.
 */
async function exportHtml(
    doc: MrcfDocument,
    manifest: ExportManifest,
    options?: HtmlRenderOptions,
): Promise<ExportResult> {
    let html = renderHtml(doc, {
        includeTheme: true,
        includeFooter: true,
        ...options,
    });

    if (options?.assetBasePath) {
        html = await embedAssetsInHtml(html, options.assetBasePath);
    }

    return {
        ok: true,
        output: html,
        manifest,
        warnings: [],
    };
}

/**
 * Export as an HTML slide deck.
 */
function exportSlides(doc: MrcfDocument, manifest: ExportManifest): ExportResult {
    const html = renderSlides(doc);

    return {
        ok: true,
        output: html,
        manifest,
        warnings: [],
    };
}

/**
 * Export as a static site (returns JSON-serialized page map).
 */
function exportSite(doc: MrcfDocument, manifest: ExportManifest): ExportResult {
    const result: SiteGeneratorResult = generateSite(doc);

    // Convert Map to serializable format
    const pagesObj: Record<string, string> = {};
    for (const [filename, content] of result.pages) {
        pagesObj[filename] = content;
    }

    return {
        ok: true,
        output: JSON.stringify(pagesObj),
        manifest,
        warnings: [],
    };
}

/**
 * Export as a ZIP package containing the static site, binary assets, and manifest.
 * When assetBasePath is provided, local asset files are read from disk and bundled
 * into the ZIP so recipients get a fully self-contained package (like DOCX/PDF).
 */
async function exportZip(
    doc: MrcfDocument,
    manifest: ExportManifest,
    assetBasePath?: string,
): Promise<ExportResult> {
    const zip = new JSZip();
    const siteResult = generateSite(doc);

    // Add site pages
    for (const [filename, content] of siteResult.pages) {
        zip.file(filename, content);
    }

    // Bundle binary asset files so the ZIP is self-contained
    if (assetBasePath && doc.assets.length > 0) {
        const resolved = path.resolve(assetBasePath);
        for (const asset of doc.assets) {
            if (asset.path.startsWith('http')) continue;
            try {
                const fullPath = path.resolve(resolved, asset.path);
                if (!fullPath.startsWith(resolved + path.sep) && fullPath !== resolved) continue;
                const data = await fs.promises.readFile(fullPath);
                zip.file(asset.path, data);
            } catch {
                // File unreadable — skip silently
            }
        }
    }

    // Add manifest
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const base64Zip = await zip.generateAsync({ type: 'base64' });

    return {
        ok: true,
        output: base64Zip,
        manifest,
        warnings: [],
    };
}

/**
 * Build an export manifest with metadata.
 */
function buildManifest(doc: MrcfDocument, format: ExportFormat): ExportManifest {
    return {
        format,
        exportedAt: new Date().toISOString(),
        title: doc.metadata.title,
        version: doc.metadata.version,
        sectionCount: doc.sections.length,
    };
}
