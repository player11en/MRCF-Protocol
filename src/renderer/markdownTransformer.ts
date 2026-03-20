/**
 * Markdown Transformer — Developer 4
 *
 * Built-in Markdown-to-HTML converter with sanitization.
 * Supports the subset of Markdown used in .mrcf files.
 * No external dependencies — keeps the renderer self-contained.
 */

/**
 * Convert Markdown text to safe HTML.
 * Handles: headings, bold, italic, code blocks, inline code, lists,
 * links, images, tables, blockquotes, horizontal rules, task checkboxes.
 */
export function markdownToHtml(markdown: string): string {
    if (!markdown || markdown.trim() === '') return '';

    let html = markdown;

    // First: extract and process fenced code blocks (to avoid processing their content)
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
        const escaped = escapeHtml(code.trimEnd());
        const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
        codeBlocks.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
        return placeholder;
    });

    // Horizontal rules (before list processing)
    html = html.replace(/^---+$/gm, '<hr>');
    html = html.replace(/^\*\*\*+$/gm, '<hr>');

    // Blockquotes
    html = processBlockquotes(html);

    // Tables
    html = processTables(html);

    // Headings (## through ######; # is handled at section level)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');

    // Task checkboxes
    html = html.replace(
        /^(\s*)- \[x\]\s+(.+)$/gm,
        '$1<li class="kdoc-task kdoc-task-done"><input type="checkbox" checked disabled> $2</li>',
    );
    html = html.replace(
        /^(\s*)- \[ \]\s+(.+)$/gm,
        '$1<li class="kdoc-task kdoc-task-open"><input type="checkbox" disabled> $2</li>',
    );

    // Unordered lists (lines starting with - or *)
    html = processLists(html);

    // Images and media (before links, since ![alt](url) contains [])
    html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_match, alt, src) => mediaTag(alt, src),
    );

    // Links
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_match, text, href) => {
            const safeHref = sanitizeUrl(href);
            return `<a href="${escapeAttr(safeHref)}">${escapeHtml(text)}</a>`;
        },
    );

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code (after code blocks are extracted)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Paragraphs: wrap remaining bare text lines
    html = wrapParagraphs(html);

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
        html = html.replace(`%%CODEBLOCK_${i}%%`, block);
    });

    // Final sanitization: strip any remaining script tags
    html = sanitizeHtml(html);

    return html.trim();
}

/**
 * Escape HTML special characters.
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Escape a value for use in an HTML attribute.
 */
function escapeAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'ogv']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac']);

/**
 * Render an ![alt](src) reference as the appropriate HTML media element.
 * Videos → <video>, audio → <audio>, everything else → <img>.
 */
function mediaTag(alt: string, src: string): string {
    const ext = src.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
    if (VIDEO_EXTS.has(ext)) {
        return (
            `<video controls class="kdoc-asset" aria-label="${escapeAttr(alt)}">` +
            `<source src="${escapeAttr(src)}">` +
            `<p>Video: <a href="${escapeAttr(src)}">${escapeHtml(alt || src)}</a></p>` +
            `</video>`
        );
    }
    if (AUDIO_EXTS.has(ext)) {
        return (
            `<audio controls class="kdoc-asset" aria-label="${escapeAttr(alt)}">` +
            `<source src="${escapeAttr(src)}">` +
            `<p>Audio: <a href="${escapeAttr(src)}">${escapeHtml(alt || src)}</a></p>` +
            `</audio>`
        );
    }
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" class="kdoc-asset">`;
}

/**
 * Sanitize a URL: block javascript: and data: protocols.
 */
function sanitizeUrl(url: string): string {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
        return '#blocked';
    }
    return url;
}

/**
 * Strip dangerous HTML from rendered output.
 */
export function sanitizeHtml(html: string): string {
    // Remove script tags and their content
    let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove onclick, onerror, onload etc. event handlers
    safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    // Remove javascript: in href/src attributes
    safe = safe.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, '$1="#blocked"');
    return safe;
}

/**
 * Process blockquotes (lines starting with >).
 */
function processBlockquotes(html: string): string {
    const lines = html.split('\n');
    const result: string[] = [];
    let inBlockquote = false;

    for (const line of lines) {
        if (line.startsWith('> ')) {
            if (!inBlockquote) {
                result.push('<blockquote>');
                inBlockquote = true;
            }
            result.push(line.slice(2));
        } else {
            if (inBlockquote) {
                result.push('</blockquote>');
                inBlockquote = false;
            }
            result.push(line);
        }
    }
    if (inBlockquote) result.push('</blockquote>');

    return result.join('\n');
}

/**
 * Process simple Markdown tables.
 */
function processTables(html: string): string {
    const lines = html.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
        // Detect a table: line with |, followed by a separator line with |---|
        if (
            lines[i]?.includes('|') &&
            i + 1 < lines.length &&
            /^\|?[\s-:|]+\|/.test(lines[i + 1])
        ) {
            const headerCells = parseTableRow(lines[i]);
            i++; // skip header
            i++; // skip separator

            let table = '<table>\n<thead>\n<tr>';
            for (const cell of headerCells) {
                table += `<th>${cell.trim()}</th>`;
            }
            table += '</tr>\n</thead>\n<tbody>\n';

            while (i < lines.length && lines[i].includes('|')) {
                const cells = parseTableRow(lines[i]);
                table += '<tr>';
                for (const cell of cells) {
                    table += `<td>${cell.trim()}</td>`;
                }
                table += '</tr>\n';
                i++;
            }
            table += '</tbody>\n</table>';
            result.push(table);
        } else {
            result.push(lines[i]);
            i++;
        }
    }

    return result.join('\n');
}

/**
 * Parse a table row into cells.
 */
function parseTableRow(line: string): string[] {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|');
}

/**
 * Process unordered lists (simple, non-nested for MVP).
 */
function processLists(html: string): string {
    const lines = html.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const line of lines) {
        const isTaskItem = line.includes('kdoc-task');
        const isListItem = /^\s*[-*]\s+/.test(line) && !isTaskItem;

        if (isListItem) {
            if (!inList) {
                result.push('<ul>');
                inList = true;
            }
            const content = line.replace(/^\s*[-*]\s+/, '');
            result.push(`<li>${content}</li>`);
        } else if (isTaskItem) {
            if (!inList) {
                result.push('<ul class="kdoc-task-list">');
                inList = true;
            }
            // Task items are already wrapped in <li> by earlier processing
            result.push(line.replace(/^\s*/, ''));
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(line);
        }
    }
    if (inList) result.push('</ul>');

    return result.join('\n');
}

/**
 * Wrap remaining bare text lines in <p> tags.
 * Skips lines that are already wrapped in HTML elements.
 */
function wrapParagraphs(html: string): string {
    const lines = html.split('\n');
    const result: string[] = [];
    let paragraphBuffer: string[] = [];

    const flushParagraph = () => {
        if (paragraphBuffer.length > 0) {
            result.push(`<p>${paragraphBuffer.join(' ')}</p>`);
            paragraphBuffer = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines (flush paragraph)
        if (trimmed === '') {
            flushParagraph();
            continue;
        }

        // Skip lines that already contain block-level HTML or placeholders
        if (
            /^<(h[1-6]|p|div|pre|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|hr|nav|section|article|header|footer|img)[\s>]/i.test(trimmed) ||
            /^<\/(ul|ol|table|blockquote|thead|tbody)>/i.test(trimmed) ||
            trimmed.startsWith('%%CODEBLOCK_')
        ) {
            flushParagraph();
            result.push(line);
            continue;
        }

        // Regular text — add to paragraph buffer
        paragraphBuffer.push(trimmed);
    }

    flushParagraph();

    return result.join('\n');
}
