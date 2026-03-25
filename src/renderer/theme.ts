/**
 * Theme — MRCF v2
 *
 * Fully responsive CSS theme for rendered .mrcf documents.
 * Three breakpoints: mobile (<640px), tablet (640-1023px), desktop (≥1024px).
 * Desktop shows sticky sidebar TOC + main content.
 * Respects system dark mode via prefers-color-scheme.
 * Print-safe with proper page-break rules.
 * Includes v2 block styles: SUMMARY, INSIGHTS, DECISIONS, REFERENCES.
 */

export const DEFAULT_THEME_CSS = `
/* ─── MRCF Theme — Mobile-first, 3 breakpoints ───────────────── */

/* ── Variables ── */
:root {
  --mrcf-font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mrcf-font-mono: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
  --mrcf-color-bg: #ffffff;
  --mrcf-color-surface: #f9fafb;
  --mrcf-color-text: #111827;
  --mrcf-color-text-muted: #6b7280;
  --mrcf-color-border: #e5e7eb;
  --mrcf-color-link: #2563eb;
  --mrcf-color-code-bg: #f3f4f6;
  --mrcf-color-summary: #0f766e;
  --mrcf-color-vision: #6366f1;
  --mrcf-color-context: #8b5cf6;
  --mrcf-color-structure: #0891b2;
  --mrcf-color-plan: #059669;
  --mrcf-color-tasks: #d97706;
  --mrcf-color-insights: #db2777;
  --mrcf-color-decisions: #7c3aed;
  --mrcf-color-references: #0369a1;
  --mrcf-color-custom: #9ca3af;
  --mrcf-sidebar-width: 248px;
  --mrcf-content-max: 780px;
  --mrcf-radius: 8px;
  --mrcf-spacing: 1.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --mrcf-color-bg: #0d1117;
    --mrcf-color-surface: #161b22;
    --mrcf-color-text: #e6edf3;
    --mrcf-color-text-muted: #8b949e;
    --mrcf-color-border: #30363d;
    --mrcf-color-link: #58a6ff;
    --mrcf-color-code-bg: #1c2128;
    --mrcf-color-summary: #2dd4bf;
    --mrcf-color-vision: #818cf8;
    --mrcf-color-context: #a78bfa;
    --mrcf-color-structure: #22d3ee;
    --mrcf-color-plan: #34d399;
    --mrcf-color-tasks: #fbbf24;
    --mrcf-color-insights: #f472b6;
    --mrcf-color-decisions: #a78bfa;
    --mrcf-color-references: #38bdf8;
  }
}

/* ── Reset ── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--mrcf-font-body);
  color: var(--mrcf-color-text);
  background: var(--mrcf-color-bg);
  line-height: 1.7;
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

/* ── Layout ── */

/* Mobile & tablet: single column */
.mrcf-layout {
  max-width: calc(var(--mrcf-content-max) + 2 * var(--mrcf-spacing));
  margin: 0 auto;
  padding: 1.25rem var(--mrcf-spacing);
}

.mrcf-sidebar { display: none; }

/* Desktop (≥1024px): sidebar + content side-by-side */
@media (min-width: 1024px) {
  .mrcf-layout {
    display: grid;
    grid-template-columns: var(--mrcf-sidebar-width) 1fr;
    grid-template-rows: auto 1fr;
    gap: 0 2.5rem;
    max-width: calc(var(--mrcf-sidebar-width) + var(--mrcf-content-max) + 4rem + 2.5rem);
    padding: 2rem 2.5rem;
    align-items: start;
  }

  /* Header spans full width */
  .mrcf-layout > header { grid-column: 1 / -1; }
  .mrcf-layout > .mrcf-warning { grid-column: 1 / -1; }

  /* Sidebar: sticky nav */
  .mrcf-sidebar {
    display: block;
    grid-column: 1;
    position: sticky;
    top: 1.5rem;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
    padding-right: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: var(--mrcf-color-border) transparent;
  }

  /* Main content */
  .mrcf-main { grid-column: 2; min-width: 0; }

  /* Inline TOC hidden on desktop */
  .mrcf-toc-inline { display: none; }
}

/* ── Metadata Header ── */
.mrcf-header {
  border-bottom: 2px solid var(--mrcf-color-border);
  padding-bottom: 1.25rem;
  margin-bottom: 1.75rem;
}

.mrcf-header h1 {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.mrcf-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  color: var(--mrcf-color-text-muted);
  font-size: 0.875rem;
  margin-top: 0.4rem;
}

.mrcf-tag {
  display: inline-block;
  background: var(--mrcf-color-code-bg);
  color: var(--mrcf-color-text-muted);
  padding: 0.15rem 0.55rem;
  border-radius: 12px;
  font-size: 0.78rem;
  border: 1px solid var(--mrcf-color-border);
}

.mrcf-status-badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.mrcf-status-draft   { background: #fef9c3; color: #713f12; }
.mrcf-status-active  { background: #dcfce7; color: #14532d; }
.mrcf-status-archived{ background: var(--mrcf-color-code-bg); color: var(--mrcf-color-text-muted); }
@media (prefers-color-scheme: dark) {
  .mrcf-status-draft   { background: #422006; color: #fef08a; }
  .mrcf-status-active  { background: #052e16; color: #86efac; }
}

/* ── Sidebar Nav (desktop sticky TOC) ── */
.mrcf-sidebar-nav {
  background: var(--mrcf-color-surface);
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  padding: 1rem 1.1rem;
}

.mrcf-sidebar-nav h2 {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mrcf-color-text-muted);
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.mrcf-sidebar-nav ul { list-style: none; }
.mrcf-sidebar-nav li { margin: 0; }

.mrcf-sidebar-nav a {
  display: block;
  color: var(--mrcf-color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  padding: 0.28rem 0.4rem;
  border-radius: 4px;
  border-left: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mrcf-sidebar-nav a:hover {
  color: var(--mrcf-color-text);
  background: var(--mrcf-color-code-bg);
}

.mrcf-sidebar-nav .nav-sub { padding-left: 0.9rem; }
.mrcf-sidebar-nav .nav-sub a { font-size: 0.8rem; }
.mrcf-sidebar-nav .nav-sub2 { padding-left: 1.8rem; }
.mrcf-sidebar-nav .nav-sub2 a { font-size: 0.75rem; }

.mrcf-sidebar-nav a.active {
  color: var(--mrcf-color-link);
  border-left-color: var(--mrcf-color-link);
  font-weight: 500;
}

/* Progress bar at top of sidebar */
.mrcf-progress-bar {
  width: 100%;
  height: 3px;
  background: var(--mrcf-color-border);
  border-radius: 2px;
  margin-bottom: 1rem;
  overflow: hidden;
}
.mrcf-progress-fill {
  height: 100%;
  background: var(--mrcf-color-plan);
  border-radius: 2px;
  transition: width 0.3s;
}

/* ── Inline TOC (mobile / tablet) ── */
.mrcf-toc-inline {
  background: var(--mrcf-color-surface);
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
}

.mrcf-toc-inline h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mrcf-color-text-muted);
  margin-bottom: 0.7rem;
  font-weight: 600;
}

.mrcf-toc-inline ul { list-style: none; }
.mrcf-toc-inline li { margin: 0.25rem 0; }

.mrcf-toc-inline a {
  color: var(--mrcf-color-link);
  text-decoration: none;
  font-size: 0.9rem;
}
.mrcf-toc-inline a:hover { text-decoration: underline; }
.mrcf-toc-inline .toc-level-1 { padding-left: 1rem; }
.mrcf-toc-inline .toc-level-2 { padding-left: 2rem; font-size: 0.83rem; }

/* ── Sections ── */
.mrcf-section {
  margin-bottom: 2.5rem;
  padding-left: 0.9rem;
  border-left: 4px solid var(--mrcf-color-custom);
  scroll-margin-top: 1.5rem;
}

.mrcf-section h2 {
  font-size: clamp(1.2rem, 3vw, 1.6rem);
  font-weight: 700;
  margin-bottom: 1rem;
}

.mrcf-section-summary    { border-left-color: var(--mrcf-color-summary); }
.mrcf-section-vision     { border-left-color: var(--mrcf-color-vision); }
.mrcf-section-context    { border-left-color: var(--mrcf-color-context); }
.mrcf-section-structure  { border-left-color: var(--mrcf-color-structure); }
.mrcf-section-plan       { border-left-color: var(--mrcf-color-plan); }
.mrcf-section-tasks      { border-left-color: var(--mrcf-color-tasks); }
.mrcf-section-insights   { border-left-color: var(--mrcf-color-insights); }
.mrcf-section-decisions  { border-left-color: var(--mrcf-color-decisions); }
.mrcf-section-references { border-left-color: var(--mrcf-color-references); }

.mrcf-section-summary h2    { color: var(--mrcf-color-summary); }
.mrcf-section-vision h2     { color: var(--mrcf-color-vision); }
.mrcf-section-context h2    { color: var(--mrcf-color-context); }
.mrcf-section-structure h2  { color: var(--mrcf-color-structure); }
.mrcf-section-plan h2       { color: var(--mrcf-color-plan); }
.mrcf-section-tasks h2      { color: var(--mrcf-color-tasks); }
.mrcf-section-insights h2   { color: var(--mrcf-color-insights); }
.mrcf-section-decisions h2  { color: var(--mrcf-color-decisions); }
.mrcf-section-references h2 { color: var(--mrcf-color-references); }

/* ── Content ── */
.mrcf-section-content p { margin-bottom: 0.8rem; }

.mrcf-section h3 {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  margin: 1.5rem 0 0.5rem;
  scroll-margin-top: 1.5rem;
}

.mrcf-section h4 {
  font-size: 1rem;
  margin: 1.1rem 0 0.4rem;
  color: var(--mrcf-color-text-muted);
}

.mrcf-section ul,
.mrcf-section ol { margin: 0.7rem 0; padding-left: 1.6rem; }
.mrcf-section li { margin-bottom: 0.25rem; }

/* ── Code ── */
.mrcf-section code {
  font-family: var(--mrcf-font-mono);
  background: var(--mrcf-color-code-bg);
  padding: 0.12rem 0.35rem;
  border-radius: 4px;
  font-size: 0.875em;
  word-break: break-word;
}

.mrcf-section pre {
  background: var(--mrcf-color-code-bg);
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  padding: 1rem 1.1rem;
  overflow-x: auto;
  margin: 1rem 0;
  -webkit-overflow-scrolling: touch;
}

.mrcf-section pre code {
  background: none;
  padding: 0;
  font-size: 0.82rem;
  line-height: 1.55;
  word-break: normal;
}

/* ── Tables ── */
.mrcf-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1rem 0;
  border-radius: var(--mrcf-radius);
  border: 1px solid var(--mrcf-color-border);
}

.mrcf-section table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 360px;
}

.mrcf-section th,
.mrcf-section td {
  border-bottom: 1px solid var(--mrcf-color-border);
  padding: 0.55rem 0.8rem;
  text-align: left;
  white-space: nowrap;
}
.mrcf-section td { white-space: normal; }

.mrcf-section th {
  background: var(--mrcf-color-surface);
  font-weight: 600;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--mrcf-color-text-muted);
}
.mrcf-section tr:last-child td { border-bottom: none; }
.mrcf-section tr:hover td { background: var(--mrcf-color-surface); }

/* ── Task List ── */
.mrcf-task-list { list-style: none; }

.mrcf-task {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--mrcf-color-border);
  line-height: 1.5;
}

.mrcf-task:last-child { border-bottom: none; }

.mrcf-task input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--mrcf-color-plan);
  flex-shrink: 0;
  margin-top: 0.2rem;
  cursor: default;
}

.mrcf-task-done {
  color: var(--mrcf-color-text-muted);
  text-decoration: line-through;
}

/* ── Blockquotes ── */
.mrcf-section blockquote {
  border-left: 3px solid var(--mrcf-color-border);
  padding-left: 1rem;
  color: var(--mrcf-color-text-muted);
  margin: 1rem 0;
  font-style: italic;
}

/* ── Images / Video / Audio ── */
.mrcf-section img,
.mrcf-section video,
.mrcf-section audio {
  max-width: 100%;
  height: auto;
  border-radius: var(--mrcf-radius);
  margin: 0.75rem 0;
  display: block;
}
.mrcf-section video { background: #000; }
.mrcf-section audio { width: 100%; }

.mrcf-asset-missing {
  display: inline-block;
  background: #fef3c7;
  border: 2px dashed #f59e0b;
  border-radius: var(--mrcf-radius);
  padding: 0.75rem 1.25rem;
  color: #92400e;
  font-size: 0.875rem;
  margin: 0.75rem 0;
}

/* ── Links ── */
.mrcf-section a { color: var(--mrcf-color-link); text-decoration: none; }
.mrcf-section a:hover { text-decoration: underline; }

/* ── Warnings ── */
.mrcf-warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: var(--mrcf-radius);
  padding: 0.75rem 1.1rem;
  margin-bottom: 1.25rem;
  color: #78350f;
  font-size: 0.9rem;
}
@media (prefers-color-scheme: dark) {
  .mrcf-warning { background: #1c1006; border-color: #92400e; color: #fcd34d; }
}

/* ── Subsections ── */
.mrcf-subsection { margin-top: 1.5rem; }
.mrcf-subsection h3 { scroll-margin-top: 1.5rem; }

/* ── Footer ── */
.mrcf-footer {
  margin-top: 3rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--mrcf-color-border);
  color: var(--mrcf-color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

/* ── Scroll-spy active indicator ── */
.mrcf-sidebar-nav a[data-section].active {
  color: var(--mrcf-color-link);
  border-left-color: var(--mrcf-color-link);
}

/* ─── v2 Block Styles ──────────────────────────────────────────── */

/* ── SUMMARY ── */
.mrcf-summary {
  background: var(--mrcf-color-surface);
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.mrcf-summary-row {
  display: grid;
  grid-template-columns: 1.5rem 8rem 1fr;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.9rem;
}

.mrcf-summary-icon {
  color: var(--mrcf-color-summary);
  font-size: 0.85rem;
  text-align: center;
}

.mrcf-summary-label {
  color: var(--mrcf-color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mrcf-summary-value {
  color: var(--mrcf-color-text);
}

/* ── INSIGHTS ── */
.mrcf-insights {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mrcf-insight {
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  padding: 0.9rem 1.1rem;
  background: var(--mrcf-color-surface);
  border-left-width: 4px;
}

.mrcf-insight-success     { border-left-color: #16a34a; }
.mrcf-insight-failure     { border-left-color: #dc2626; }
.mrcf-insight-observation { border-left-color: #0891b2; }

.mrcf-insight-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.mrcf-insight-id {
  font-family: var(--mrcf-font-mono);
  font-size: 0.78rem;
  color: var(--mrcf-color-text-muted);
  background: var(--mrcf-color-code-bg);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.mrcf-insight-type {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.55rem;
  border-radius: 10px;
}

.mrcf-insight-success .mrcf-insight-type   { background: #dcfce7; color: #15803d; }
.mrcf-insight-failure .mrcf-insight-type   { background: #fee2e2; color: #b91c1c; }
.mrcf-insight-observation .mrcf-insight-type { background: #e0f2fe; color: #0369a1; }
@media (prefers-color-scheme: dark) {
  .mrcf-insight-success .mrcf-insight-type   { background: #052e16; color: #86efac; }
  .mrcf-insight-failure .mrcf-insight-type   { background: #450a0a; color: #fca5a5; }
  .mrcf-insight-observation .mrcf-insight-type { background: #082f49; color: #7dd3fc; }
}

.mrcf-insight-source {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--mrcf-color-text-muted);
  font-family: var(--mrcf-font-mono);
}

.mrcf-insight-description {
  font-size: 0.9rem;
  margin-bottom: 0.6rem;
}

.mrcf-confidence-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 6px;
  background: var(--mrcf-color-border);
  border-radius: 3px;
  overflow: visible;
  position: relative;
  margin-top: 0.4rem;
}

.mrcf-confidence-fill {
  height: 100%;
  background: var(--mrcf-color-plan);
  border-radius: 3px;
  transition: width 0.3s;
}

.mrcf-confidence-label {
  font-size: 0.72rem;
  color: var(--mrcf-color-text-muted);
  white-space: nowrap;
  position: absolute;
  right: -2.5rem;
}

/* ── DECISIONS ── */
.mrcf-decisions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mrcf-decision {
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  padding: 0.9rem 1.1rem;
  background: var(--mrcf-color-surface);
  border-left: 4px solid var(--mrcf-color-decisions);
}

.mrcf-decision-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.mrcf-decision-id {
  font-family: var(--mrcf-font-mono);
  font-size: 0.78rem;
  color: var(--mrcf-color-text-muted);
  background: var(--mrcf-color-code-bg);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.mrcf-impact {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.55rem;
  border-radius: 10px;
  margin-left: auto;
}

.mrcf-impact-low    { background: #f0fdf4; color: #166534; }
.mrcf-impact-medium { background: #fefce8; color: #854d0e; }
.mrcf-impact-high   { background: #fef2f2; color: #991b1b; }
@media (prefers-color-scheme: dark) {
  .mrcf-impact-low    { background: #052e16; color: #86efac; }
  .mrcf-impact-medium { background: #422006; color: #fde68a; }
  .mrcf-impact-high   { background: #450a0a; color: #fca5a5; }
}

.mrcf-decision-choice {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  color: var(--mrcf-color-text);
}

.mrcf-decision-reason {
  font-size: 0.875rem;
  color: var(--mrcf-color-text-muted);
  margin-bottom: 0.35rem;
}

.mrcf-decision-alts {
  font-size: 0.8rem;
  color: var(--mrcf-color-text-muted);
  font-style: italic;
}

/* ── REFERENCES ── */
.mrcf-references {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--mrcf-color-border);
  border-radius: var(--mrcf-radius);
  font-size: 0.9rem;
  overflow: hidden;
}

.mrcf-references thead tr {
  background: var(--mrcf-color-surface);
}

.mrcf-references th {
  padding: 0.55rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mrcf-color-text-muted);
  border-bottom: 1px solid var(--mrcf-color-border);
  text-align: left;
}

.mrcf-references td {
  padding: 0.5rem 0.9rem;
  border-bottom: 1px solid var(--mrcf-color-border);
}

.mrcf-references tr:last-child td { border-bottom: none; }
.mrcf-references tr:hover td { background: var(--mrcf-color-surface); }

.mrcf-ref-id {
  font-family: var(--mrcf-font-mono);
  font-size: 0.82rem;
  color: var(--mrcf-color-link);
}

.mrcf-ref-rel {
  font-size: 0.8rem;
  color: var(--mrcf-color-text-muted);
  font-style: italic;
}

/* ─── Tablet (640px – 1023px) ─────────────────────────────────── */
@media (min-width: 640px) {
  .mrcf-layout { padding: 1.75rem 2rem; }
  .mrcf-section { padding-left: 1.1rem; }
  .mrcf-section pre { font-size: 0.9rem; }
  .mrcf-summary-row { grid-template-columns: 1.5rem 10rem 1fr; }
}

/* ─── Desktop (≥1024px) ───────────────────────────────────────── */
@media (min-width: 1024px) {
  .mrcf-layout {
    display: grid;
    grid-template-columns: var(--mrcf-sidebar-width) 1fr;
    gap: 0 2.5rem;
    max-width: calc(var(--mrcf-sidebar-width) + var(--mrcf-content-max) + 2.5rem + 4rem);
    padding: 2rem 2.5rem;
    align-items: start;
  }

  .mrcf-layout > .mrcf-header  { grid-column: 1 / -1; }
  .mrcf-layout > .mrcf-warning { grid-column: 1 / -1; }
  .mrcf-layout > .mrcf-footer  { grid-column: 1 / -1; }

  .mrcf-sidebar {
    display: block;
    grid-column: 1;
    position: sticky;
    top: 1.5rem;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--mrcf-color-border) transparent;
  }

  .mrcf-main { grid-column: 2; min-width: 0; }
  .mrcf-toc-inline { display: none; }
}

/* ─── Print ───────────────────────────────────────────────────── */
@media print {
  .mrcf-sidebar,
  .mrcf-toc-inline { display: none !important; }

  .mrcf-layout {
    display: block;
    max-width: 100%;
    padding: 0;
  }

  .mrcf-section { break-inside: avoid; border-left-width: 3px; }
  .mrcf-section h2 { break-after: avoid; }
  .mrcf-insight,
  .mrcf-decision { break-inside: avoid; }

  pre, table { break-inside: avoid; }

  a { color: inherit; text-decoration: none; }
  a[href]::after { content: " (" attr(href) ")"; font-size: 0.8em; color: #666; }
}
`;
