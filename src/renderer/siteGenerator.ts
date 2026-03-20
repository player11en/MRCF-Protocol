/**
 * Site Generator — Developer 4
 *
 * Generates a multi-page static documentation website from a MrcfDocument.
 * Similar in concept to MkDocs or Docusaurus but tailored for .mrcf files.
 */

import type { MrcfDocument, MrcfSection } from '@mrcf/parser';
import { markdownToHtml, escapeHtml } from './markdownTransformer';
import { toAnchor } from './renderCore';
import { DEFAULT_THEME_CSS } from './theme';

export interface SiteGeneratorResult {
    /** Map of filename → HTML content */
    pages: Map<string, string>;
    /** Client-side search index (JSON string) */
    searchIndex: string;
}

/**
 * Generate a static site from a MrcfDocument.
 * Returns a map of filename → HTML content (caller writes to disk).
 */
export function generateSite(doc: MrcfDocument): SiteGeneratorResult {
    const pages = new Map<string, string>();
    const searchEntries: Array<{ title: string; url: string; content: string }> = [];

    // Build navigation data
    const navItems = doc.sections.map((s) => ({
        name: s.name,
        slug: toAnchor(s.name),
    }));

    // Landing page (index.html)
    pages.set('index.html', renderLandingPage(doc, navItems));
    searchEntries.push({
        title: doc.metadata.title,
        url: 'index.html',
        content: doc.sections.find((s) => s.name === 'VISION')?.content.slice(0, 200) || '',
    });

    // One page per section
    for (let i = 0; i < doc.sections.length; i++) {
        const section = doc.sections[i];
        const slug = toAnchor(section.name);
        const filename = `${slug}.html`;
        const prevSection = i > 0 ? navItems[i - 1] : null;
        const nextSection = i < doc.sections.length - 1 ? navItems[i + 1] : null;

        pages.set(
            filename,
            renderSectionPage(doc, section, navItems, prevSection, nextSection),
        );

        searchEntries.push({
            title: section.name,
            url: filename,
            content: section.content.slice(0, 300),
        });

        // Add subsections to search index
        for (const sub of section.subsections) {
            searchEntries.push({
                title: `${section.name} > ${sub.name}`,
                url: `${filename}#${toAnchor(sub.name)}`,
                content: sub.content.slice(0, 200),
            });
        }
    }

    // 404 page
    pages.set('404.html', render404Page(doc, navItems));

    // Search index
    const searchIndex = JSON.stringify(searchEntries, null, 2);
    pages.set('search-index.json', searchIndex);

    return { pages, searchIndex };
}

interface NavItem {
    name: string;
    slug: string;
}

/**
 * Render the site shell (head, sidebar, content area).
 */
function renderSiteShell(
    doc: MrcfDocument,
    navItems: NavItem[],
    activeSlug: string,
    title: string,
    content: string,
): string {
    const sidebarHtml = navItems
        .map((item) => {
            const active = item.slug === activeSlug ? ' class="active"' : '';
            return `<li${active}><a href="${item.slug}.html">${escapeHtml(item.name)}</a></li>`;
        })
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — ${escapeHtml(doc.metadata.title)}</title>
<meta name="description" content="${escapeHtml(title)} — ${escapeHtml(doc.metadata.title)}">
${doc.metadata.author ? `<meta name="author" content="${escapeHtml(doc.metadata.author)}">` : ''}
<style>${DEFAULT_THEME_CSS}${SITE_CSS}</style>
</head>
<body>
<div class="site-layout">
  <nav class="site-sidebar" aria-label="Section navigation">
    <div class="site-logo">
      <a href="index.html">${escapeHtml(doc.metadata.title)}</a>
    </div>
    <ul class="site-nav">
      ${sidebarHtml}
    </ul>
  </nav>
  <main class="site-content kdoc-container">
    ${content}
  </main>
</div>
</body>
</html>`;
}

/**
 * Render the landing page.
 */
function renderLandingPage(doc: MrcfDocument, navItems: NavItem[]): string {
    const visionSection = doc.sections.find((s) => s.name === 'VISION');
    const visionHtml = visionSection
        ? markdownToHtml(visionSection.content)
        : '<p>No VISION section found.</p>';

    const content = `
<header class="kdoc-header">
  <h1>${escapeHtml(doc.metadata.title)}</h1>
  <div class="kdoc-header-meta">
    <span>v${escapeHtml(doc.metadata.version)}</span>
    ${doc.metadata.author ? `<span>${escapeHtml(doc.metadata.author)}</span>` : ''}
    <span>${escapeHtml(doc.metadata.created)}</span>
  </div>
  ${doc.metadata.tags?.length ? `<div style="margin-top: 0.5rem;">${doc.metadata.tags.map((t) => `<span class="kdoc-tag">${escapeHtml(t)}</span>`).join(' ')}</div>` : ''}
</header>
<section class="kdoc-section kdoc-section-vision">
  <h2>Vision</h2>
  <div class="kdoc-section-content">${visionHtml}</div>
</section>
<nav class="site-section-list">
  <h2>Sections</h2>
  <ul>
    ${navItems.map((item) => `<li><a href="${item.slug}.html">${escapeHtml(item.name)}</a></li>`).join('\n')}
  </ul>
</nav>`;

    return renderSiteShell(doc, navItems, '', doc.metadata.title, content);
}

/**
 * Render a section page.
 */
function renderSectionPage(
    doc: MrcfDocument,
    section: MrcfSection,
    navItems: NavItem[],
    prev: NavItem | null,
    next: NavItem | null,
): string {
    let content = `
<section class="kdoc-section kdoc-section-${toAnchor(section.name)}">
  <h2>${escapeHtml(section.name)}</h2>
  <div class="kdoc-section-content">${markdownToHtml(section.content)}</div>`;

    // Render subsections
    for (const sub of section.subsections) {
        content += `
  <div id="${toAnchor(sub.name)}" class="kdoc-subsection">
    <h3>${escapeHtml(sub.name)}</h3>
    ${markdownToHtml(sub.content)}
  </div>`;
    }

    content += '</section>';

    // Prev/Next navigation
    content += `<nav class="site-prev-next" aria-label="Page navigation">`;
    if (prev) {
        content += `<a href="${prev.slug}.html" class="prev">← ${escapeHtml(prev.name)}</a>`;
    } else {
        content += '<span></span>';
    }
    if (next) {
        content += `<a href="${next.slug}.html" class="next">${escapeHtml(next.name)} →</a>`;
    } else {
        content += '<span></span>';
    }
    content += '</nav>';

    return renderSiteShell(doc, navItems, toAnchor(section.name), section.name, content);
}

/**
 * Render a 404 page.
 */
function render404Page(doc: MrcfDocument, navItems: NavItem[]): string {
    const content = `
<div style="text-align: center; padding: 4rem 0;">
  <h1 style="font-size: 4rem; color: #9ca3af;">404</h1>
  <p style="font-size: 1.2rem; color: #6b7280;">Page not found</p>
  <a href="index.html" style="display: inline-block; margin-top: 1rem; color: #2563eb;">← Back to home</a>
</div>`;

    return renderSiteShell(doc, navItems, '', '404', content);
}

/** Additional CSS for the site layout */
const SITE_CSS = `
.site-layout {
  display: flex;
  min-height: 100vh;
}

.site-sidebar {
  width: 260px;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
  padding: 1.5rem;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  overflow-y: auto;
}

.site-logo {
  margin-bottom: 1.5rem;
}

.site-logo a {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1a1a2e;
  text-decoration: none;
}

.site-nav {
  list-style: none;
  padding: 0;
}

.site-nav li {
  margin: 0.3rem 0;
}

.site-nav a {
  display: block;
  padding: 0.5rem 0.8rem;
  color: #374151;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.95rem;
}

.site-nav a:hover {
  background: #e5e7eb;
}

.site-nav .active a {
  background: #2563eb;
  color: white;
}

.site-content {
  margin-left: 260px;
  flex: 1;
  padding: 2rem 3rem;
}

.site-prev-next {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.site-prev-next a {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.95rem;
}

.site-prev-next a:hover {
  text-decoration: underline;
}

.site-section-list ul {
  list-style: none;
  padding: 0;
}

.site-section-list li {
  margin: 0.5rem 0;
}

.site-section-list a {
  color: #2563eb;
  text-decoration: none;
  font-size: 1.05rem;
}

@media (max-width: 768px) {
  .site-sidebar {
    position: static;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .site-content {
    margin-left: 0;
    padding: 1rem;
  }
}
`;
