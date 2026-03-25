/**
 * HTML Renderer — Developer 4
 *
 * Renders a MrcfDocument into a complete, styled HTML page.
 * Consumes the RenderTree from renderCore and transforms it to HTML.
 */

import type {
    MrcfDocument,
    MrcfInsightBlock,
    MrcfDecisionBlock,
    MrcfReferenceLink,
    MrcfSummaryBlock,
} from '@mrcf/parser';
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
    parts.push('<div class="mrcf-layout">');

    // Metadata header (spans full width on desktop via CSS grid)
    parts.push(renderMetadataHeader(tree));

    // Warnings
    if (tree.warnings.length > 0) {
        for (const warning of tree.warnings) {
            parts.push(`<div class="mrcf-warning" role="alert">⚠️ ${escapeHtml(warning)}</div>`);
        }
    }

    // Sidebar (visible on desktop ≥1024px — sticky TOC)
    if (opts.includeToc && tree.toc.length > 0) {
        parts.push('<aside class="mrcf-sidebar" aria-label="Document navigation">');
        parts.push(renderSidebarNav(tree));
        parts.push('</aside>');
    }

    // Main content column
    parts.push('<div class="mrcf-main">');

    // Inline TOC (visible on mobile/tablet, hidden on desktop via CSS)
    if (opts.includeToc && tree.toc.length > 0) {
        parts.push(renderInlineToc(tree.toc));
    }

    parts.push('<main>');
    for (const section of tree.sections) {
        parts.push(renderSection(section));
    }
    parts.push('</main>');

    parts.push('</div>'); // .mrcf-main

    // Footer
    if (opts.includeFooter) {
        parts.push(renderFooter(tree));
    }

    parts.push('</div>'); // .mrcf-layout

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

    parts.push('<header class="mrcf-header">');
    parts.push(`<h1>${escapeHtml(meta.title)}</h1>`);
    parts.push('<div class="mrcf-header-meta">');

    parts.push(`<span>v${escapeHtml(meta.version)}</span>`);

    if (meta.author) {
        parts.push(`<span>${escapeHtml(meta.author)}</span>`);
    }

    parts.push(`<span>${escapeHtml(meta.created)}</span>`);

    if (meta.status) {
        parts.push(`<span>${escapeHtml(meta.status)}</span>`);
    }

    parts.push('</div>'); // .mrcf-header-meta

    if (meta.tags && meta.tags.length > 0) {
        parts.push('<div style="margin-top: 0.5rem;">');
        for (const tag of meta.tags) {
            parts.push(`<span class="mrcf-tag">${escapeHtml(tag)}</span> `);
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

    parts.push('<nav class="mrcf-sidebar-nav" aria-label="Page sections">');
    parts.push('<div class="mrcf-progress-bar"><div class="mrcf-progress-fill" id="mrcf-progress"></div></div>');
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

    parts.push('<nav class="mrcf-toc-inline" aria-label="Table of contents">');
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
  var links = document.querySelectorAll('.mrcf-sidebar-nav a[data-section]');
  var sections = Array.from(links).map(function(a) {
    return document.getElementById(a.getAttribute('data-section'));
  }).filter(Boolean);
  var progress = document.getElementById('mrcf-progress');

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
 * v2 structured sections (SUMMARY, INSIGHTS, DECISIONS, REFERENCES) get
 * specialized renderers; all others fall through to the generic renderer.
 */
function renderSection(node: RenderNode): string {
    const parts: string[] = [];
    const sectionClass = node.isStandard
        ? `mrcf-section mrcf-section-${node.anchor}`
        : 'mrcf-section';

    parts.push(`<section id="${node.anchor}" class="${sectionClass}">`);
    parts.push(`<h2>${escapeHtml(node.label)}</h2>`);

    // v2 structured section renderers
    const v2 = node.meta?.v2 as Record<string, unknown> | undefined;

    if (node.label === 'SUMMARY' && v2?.summary) {
        parts.push(renderSummaryBlock(v2.summary as MrcfSummaryBlock));
    } else if (node.label === 'INSIGHTS' && v2?.insights) {
        parts.push(renderInsightsBlock(v2.insights as MrcfInsightBlock[]));
    } else if (node.label === 'DECISIONS' && v2?.decisions) {
        parts.push(renderDecisionsBlock(v2.decisions as MrcfDecisionBlock[]));
    } else if (node.label === 'REFERENCES' && v2?.references) {
        parts.push(renderReferencesBlock(v2.references as MrcfReferenceLink[]));
    } else {
        // Generic content renderer
        if (node.content.trim()) {
            parts.push(`<div class="mrcf-section-content">`);
            parts.push(markdownToHtml(node.content));
            parts.push('</div>');
        }
        for (const child of node.children) {
            parts.push(renderSubsection(child));
        }
    }

    parts.push('</section>');
    return parts.join('\n');
}

/** Render SUMMARY key-value snapshot as a highlighted card. */
function renderSummaryBlock(summary: MrcfSummaryBlock): string {
    const rows = [
        { key: 'current_focus', label: 'Current Focus', icon: '▶' },
        { key: 'main_risk',     label: 'Main Risk',     icon: '⚠' },
        { key: 'stable_parts',  label: 'Stable Parts',  icon: '✓' },
    ];
    const parts = ['<div class="mrcf-summary">'];
    for (const { key, label, icon } of rows) {
        const value = summary[key] ?? summary[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
        if (!value) continue;
        parts.push(`<div class="mrcf-summary-row">`);
        parts.push(`<span class="mrcf-summary-icon">${icon}</span>`);
        parts.push(`<span class="mrcf-summary-label">${escapeHtml(label)}</span>`);
        parts.push(`<span class="mrcf-summary-value">${escapeHtml(String(value))}</span>`);
        parts.push('</div>');
    }
    // Any extra custom keys
    for (const [k, v] of Object.entries(summary)) {
        if (!v || ['currentFocus','mainRisk','stableParts','current_focus','main_risk','stable_parts'].includes(k)) continue;
        parts.push(`<div class="mrcf-summary-row">`);
        parts.push(`<span class="mrcf-summary-icon">·</span>`);
        parts.push(`<span class="mrcf-summary-label">${escapeHtml(k)}</span>`);
        parts.push(`<span class="mrcf-summary-value">${escapeHtml(String(v))}</span>`);
        parts.push('</div>');
    }
    parts.push('</div>');
    return parts.join('\n');
}

/** Render INSIGHTS blocks as cards with type badge and confidence bar. */
function renderInsightsBlock(insights: MrcfInsightBlock[]): string {
    if (insights.length === 0) return '';
    const parts = ['<div class="mrcf-insights">'];
    for (const insight of insights) {
        const typeClass = `mrcf-insight-${insight.type}`;
        parts.push(`<div class="mrcf-insight ${typeClass}">`);
        parts.push(`<div class="mrcf-insight-header">`);
        parts.push(`<span class="mrcf-insight-id">${escapeHtml(insight.id)}</span>`);
        parts.push(`<span class="mrcf-insight-type">${escapeHtml(insight.type)}</span>`);
        if (insight.source) {
            parts.push(`<span class="mrcf-insight-source">← ${escapeHtml(insight.source)}</span>`);
        }
        parts.push('</div>');
        parts.push(`<p class="mrcf-insight-description">${escapeHtml(insight.description)}</p>`);
        if (insight.confidence !== undefined) {
            const pct = Math.round(insight.confidence * 100);
            parts.push(`<div class="mrcf-confidence-bar" title="Confidence: ${pct}%">`);
            parts.push(`<div class="mrcf-confidence-fill" style="width:${pct}%"></div>`);
            parts.push(`<span class="mrcf-confidence-label">${pct}%</span>`);
            parts.push('</div>');
        }
        parts.push('</div>');
    }
    parts.push('</div>');
    return parts.join('\n');
}

/** Render DECISIONS blocks as a structured list with impact badge. */
function renderDecisionsBlock(decisions: MrcfDecisionBlock[]): string {
    if (decisions.length === 0) return '';
    const parts = ['<div class="mrcf-decisions">'];
    for (const dec of decisions) {
        const impactClass = dec.impact ? `mrcf-impact-${dec.impact}` : '';
        parts.push(`<div class="mrcf-decision">`);
        parts.push(`<div class="mrcf-decision-header">`);
        parts.push(`<span class="mrcf-decision-id">${escapeHtml(dec.id)}</span>`);
        if (dec.impact) {
            parts.push(`<span class="mrcf-impact ${impactClass}">${escapeHtml(dec.impact)}</span>`);
        }
        parts.push('</div>');
        parts.push(`<div class="mrcf-decision-choice">✓ ${escapeHtml(dec.choice)}</div>`);
        parts.push(`<div class="mrcf-decision-reason">${escapeHtml(dec.reason)}</div>`);
        if (dec.alternatives) {
            parts.push(`<div class="mrcf-decision-alts">Considered: ${escapeHtml(dec.alternatives)}</div>`);
        }
        parts.push('</div>');
    }
    parts.push('</div>');
    return parts.join('\n');
}

/** Render REFERENCES as a relationship table. */
function renderReferencesBlock(references: MrcfReferenceLink[]): string {
    if (references.length === 0) return '';
    const parts = [
        '<table class="mrcf-references">',
        '<thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead>',
        '<tbody>',
    ];
    for (const ref of references) {
        const relLabel = ref.relationship.replace(/_/g, ' ');
        parts.push(`<tr>`);
        parts.push(`<td class="mrcf-ref-id">${escapeHtml(ref.from)}</td>`);
        parts.push(`<td class="mrcf-ref-rel">${escapeHtml(relLabel)}</td>`);
        parts.push(`<td class="mrcf-ref-id">${escapeHtml(ref.to)}</td>`);
        parts.push('</tr>');
    }
    parts.push('</tbody></table>');
    return parts.join('\n');
}

/**
 * Render a subsection node to HTML.
 */
function renderSubsection(node: RenderNode): string {
    const parts: string[] = [];
    const tag = `h${Math.min(node.level + 1, 6)}`;

    parts.push(`<div id="${node.anchor}" class="mrcf-subsection">`);
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
    return `<footer class="mrcf-footer">
  <p>Generated from MRCF v${escapeHtml(tree.metadata.version)} — ${escapeHtml(tree.metadata.title)}</p>
</footer>`;
}
