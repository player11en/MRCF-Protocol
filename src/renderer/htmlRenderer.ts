/**
 * HTML Renderer — Developer 4
 *
 * Renders a MrcfDocument into a complete, styled HTML page.
 * Consumes the RenderTree from renderCore and transforms it to HTML.
 */

import type { MrcfDocument } from '@mrcf/parser';
import { normalize, toAnchor } from './renderCore';
import { markdownToHtml, escapeHtml } from './markdownTransformer';
import { DEFAULT_THEME_CSS } from './theme';
import type { RenderNode, RenderTree, TocEntry } from './types';

export interface HtmlRenderOptions {
    /** Include inline CSS theme (default: true) */
    includeTheme?: boolean;
    /** Include table of contents (default: true) */
    includeToc?: boolean;
    /** Include footer with generation info (default: true) */
    includeFooter?: boolean;
    /** Custom CSS to append */
    customCss?: string;
    /** Document language (default: 'en') */
    lang?: string;
    /**
     * Base directory path for resolving local asset files.
     * When set, exportDocument() will base64-embed local images into the HTML
     * so the output is a fully self-contained file (like PDF/DOCX).
     * Has no effect on renderHtml() itself — embedding is done post-render in the export pipeline.
     */
    assetBasePath?: string;
}

const DEFAULT_OPTIONS: Required<HtmlRenderOptions> = {
    includeTheme: true,
    includeToc: true,
    includeFooter: true,
    customCss: '',
    lang: 'en',
    assetBasePath: '',
};

/**
 * Render a MrcfDocument to a complete HTML page.
 */
export function renderHtml(
    doc: MrcfDocument,
    options?: HtmlRenderOptions,
): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const tree = normalize(doc);

    const parts: string[] = [];

    parts.push('<!DOCTYPE html>');
    parts.push(`<html lang="${opts.lang}">`);
    parts.push('<head>');
    parts.push(`<meta charset="UTF-8">`);
    parts.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    parts.push(`<title>${escapeHtml(tree.metadata.title)}</title>`);
    parts.push(`<meta name="description" content="MRCF: ${escapeHtml(tree.metadata.title)}">`);
    if (tree.metadata.author) {
        parts.push(`<meta name="author" content="${escapeHtml(tree.metadata.author)}">`);
    }

    if (opts.includeTheme) {
        parts.push(`<style>${DEFAULT_THEME_CSS}</style>`);
    }
    if (opts.customCss) {
        parts.push(`<style>${opts.customCss}</style>`);
    }

    parts.push('</head>');
    parts.push('<body>');
    parts.push('<div class="kdoc-layout">');

    // Metadata header (spans full width on desktop via CSS grid)
    parts.push(renderMetadataHeader(tree));

    // Warnings
    if (tree.warnings.length > 0) {
        for (const warning of tree.warnings) {
            parts.push(`<div class="kdoc-warning" role="alert">⚠️ ${escapeHtml(warning)}</div>`);
        }
    }

    // Sidebar (visible on desktop ≥1024px — sticky TOC)
    if (opts.includeToc && tree.toc.length > 0) {
        parts.push('<aside class="kdoc-sidebar" aria-label="Document navigation">');
        parts.push(renderSidebarNav(tree));
        parts.push('</aside>');
    }

    // Main content column
    parts.push('<div class="kdoc-main">');

    // Inline TOC (visible on mobile/tablet, hidden on desktop via CSS)
    if (opts.includeToc && tree.toc.length > 0) {
        parts.push(renderInlineToc(tree.toc));
    }

    parts.push('<main>');
    for (const section of tree.sections) {
        parts.push(renderSection(section));
    }
    parts.push('</main>');

    parts.push('</div>'); // .kdoc-main

    // Footer
    if (opts.includeFooter) {
        parts.push(renderFooter(tree));
    }

    parts.push('</div>'); // .kdoc-layout

    // Scroll-spy: highlight active section in sidebar as user scrolls
    parts.push(renderScrollSpy());

    parts.push('</body>');
    parts.push('</html>');

    return parts.join('\n');
}

/**
 * Render the metadata header block.
 */
function renderMetadataHeader(tree: RenderTree): string {
    const meta = tree.metadata;
    const parts: string[] = [];

    parts.push('<header class="kdoc-header">');
    parts.push(`<h1>${escapeHtml(meta.title)}</h1>`);
    parts.push('<div class="kdoc-header-meta">');

    parts.push(`<span>v${escapeHtml(meta.version)}</span>`);

    if (meta.author) {
        parts.push(`<span>${escapeHtml(meta.author)}</span>`);
    }

    parts.push(`<span>${escapeHtml(meta.created)}</span>`);

    if (meta.status) {
        parts.push(`<span>${escapeHtml(meta.status)}</span>`);
    }

    parts.push('</div>'); // .kdoc-header-meta

    if (meta.tags && meta.tags.length > 0) {
        parts.push('<div style="margin-top: 0.5rem;">');
        for (const tag of meta.tags) {
            parts.push(`<span class="kdoc-tag">${escapeHtml(tag)}</span> `);
        }
        parts.push('</div>');
    }

    parts.push('</header>');

    return parts.join('\n');
}

/**
 * Render the sticky sidebar nav (desktop only, shown via CSS).
 * Includes a read-progress bar and section links with subsections.
 */
function renderSidebarNav(tree: RenderTree): string {
    const parts: string[] = [];

    parts.push('<nav class="kdoc-sidebar-nav" aria-label="Page sections">');
    parts.push('<div class="kdoc-progress-bar"><div class="kdoc-progress-fill" id="kdoc-progress"></div></div>');
    parts.push('<h2>Contents</h2>');
    parts.push('<ul>');

    for (const entry of tree.toc) {
        parts.push(`<li><a href="#${entry.anchor}" data-section="${entry.anchor}">${escapeHtml(entry.label)}</a>`);
        if (entry.children.length > 0) {
            parts.push('<ul class="nav-sub">');
            for (const child of entry.children) {
                parts.push(`<li><a href="#${child.anchor}" data-section="${child.anchor}">${escapeHtml(child.label)}</a>`);
                if (child.children.length > 0) {
                    parts.push('<ul class="nav-sub2">');
                    for (const grand of child.children) {
                        parts.push(`<li><a href="#${grand.anchor}" data-section="${grand.anchor}">${escapeHtml(grand.label)}</a></li>`);
                    }
                    parts.push('</ul>');
                }
                parts.push('</li>');
            }
            parts.push('</ul>');
        }
        parts.push('</li>');
    }

    parts.push('</ul>');
    parts.push('</nav>');

    return parts.join('\n');
}

/**
 * Render the inline TOC (mobile/tablet only, hidden on desktop via CSS).
 */
function renderInlineToc(entries: TocEntry[]): string {
    const parts: string[] = [];

    parts.push('<nav class="kdoc-toc-inline" aria-label="Table of contents">');
    parts.push('<h2>Contents</h2>');
    parts.push('<ul>');

    for (const entry of entries) {
        parts.push(renderTocEntry(entry, 0));
    }

    parts.push('</ul>');
    parts.push('</nav>');

    return parts.join('\n');
}

/**
 * Render a single TOC entry recursively (used by inline TOC).
 */
function renderTocEntry(entry: TocEntry, level: number): string {
    const parts: string[] = [];

    parts.push(`<li class="toc-level-${level}"><a href="#${entry.anchor}">${escapeHtml(entry.label)}</a>`);

    if (entry.children.length > 0) {
        parts.push('<ul>');
        for (const child of entry.children) {
            parts.push(renderTocEntry(child, level + 1));
        }
        parts.push('</ul>');
    }

    parts.push('</li>');

    return parts.join('\n');
}

/**
 * Inline scroll-spy script — highlights active section in the sidebar nav
 * and updates the read-progress bar. Pure JS, no external deps.
 */
function renderScrollSpy(): string {
    return `<script>
(function() {
  var links = document.querySelectorAll('.kdoc-sidebar-nav a[data-section]');
  var sections = Array.from(links).map(function(a) {
    return document.getElementById(a.getAttribute('data-section'));
  }).filter(Boolean);
  var progress = document.getElementById('kdoc-progress');

  function update() {
    var scrollY = window.scrollY;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && docH > 0) {
      progress.style.width = Math.min(100, (scrollY / docH) * 100).toFixed(1) + '%';
    }
    var active = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 80) active = sections[i];
    }
    links.forEach(function(a) {
      a.classList.toggle('active', a.getAttribute('data-section') === (active && active.id));
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
</script>`;
}

/**
 * Render a section node to HTML.
 */
function renderSection(node: RenderNode): string {
    const parts: string[] = [];
    const sectionClass = node.isStandard
        ? `kdoc-section kdoc-section-${node.anchor}`
        : 'kdoc-section';

    parts.push(`<section id="${node.anchor}" class="${sectionClass}">`);
    parts.push(`<h2>${escapeHtml(node.label)}</h2>`);

    // Render section content as HTML
    if (node.content.trim()) {
        parts.push(`<div class="kdoc-section-content">`);
        parts.push(markdownToHtml(node.content));
        parts.push('</div>');
    }

    // Render subsections
    for (const child of node.children) {
        parts.push(renderSubsection(child));
    }

    parts.push('</section>');

    return parts.join('\n');
}

/**
 * Render a subsection node to HTML.
 */
function renderSubsection(node: RenderNode): string {
    const parts: string[] = [];
    const tag = `h${Math.min(node.level + 1, 6)}`;

    parts.push(`<div id="${node.anchor}" class="kdoc-subsection">`);
    parts.push(`<${tag}>${escapeHtml(node.label)}</${tag}>`);

    if (node.content.trim()) {
        parts.push(markdownToHtml(node.content));
    }

    for (const child of node.children) {
        parts.push(renderSubsection(child));
    }

    parts.push('</div>');

    return parts.join('\n');
}

/**
 * Render the footer.
 */
function renderFooter(tree: RenderTree): string {
    return `<footer class="kdoc-footer">
  <p>Generated from MRCF v${escapeHtml(tree.metadata.version)} — ${escapeHtml(tree.metadata.title)}</p>
</footer>`;
}
