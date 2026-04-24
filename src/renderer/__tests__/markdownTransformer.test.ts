/**
 * Markdown Transformer Tests — Developer 4
 */

import { markdownToHtml, escapeHtml, sanitizeHtml } from '../markdownTransformer';

describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        );
    });

    it('escapes ampersands', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });
});

describe('sanitizeHtml', () => {
    it('removes script tags', () => {
        const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('<p>Hello</p>');
    });

    it('removes inline event handlers', () => {
        const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
        expect(result).not.toContain('onerror');
    });

    it('blocks javascript: URLs', () => {
        const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
        expect(result).toContain('#blocked');
    });
});

describe('markdownToHtml', () => {
    it('returns empty string for empty input', () => {
        expect(markdownToHtml('')).toBe('');
        expect(markdownToHtml('  ')).toBe('');
    });

    it('converts bold text', () => {
        const result = markdownToHtml('This is **bold** text.');
        expect(result).toContain('<strong>bold</strong>');
    });

    it('converts italic text', () => {
        const result = markdownToHtml('This is *italic* text.');
        expect(result).toContain('<em>italic</em>');
    });

    it('converts bold + italic', () => {
        const result = markdownToHtml('***bold italic***');
        expect(result).toContain('<strong><em>bold italic</em></strong>');
    });

    it('converts inline code', () => {
        const result = markdownToHtml('Use `npm install` to install.');
        expect(result).toContain('<code>npm install</code>');
    });

    it('converts fenced code blocks', () => {
        const result = markdownToHtml('```typescript\nconst x = 1;\n```');
        expect(result).toContain('<pre><code class="language-typescript">');
        expect(result).toContain('const x = 1;');
        expect(result).toContain('</code></pre>');
    });

    it('escapes HTML inside code blocks', () => {
        const result = markdownToHtml('```\n<script>alert("bad")</script>\n```');
        expect(result).toContain('&lt;script&gt;');
        expect(result).not.toContain('<script>alert');
    });

    it('converts headings', () => {
        expect(markdownToHtml('## Heading 2')).toContain('<h2>Heading 2</h2>');
        expect(markdownToHtml('### Heading 3')).toContain('<h3>Heading 3</h3>');
        expect(markdownToHtml('#### Heading 4')).toContain('<h4>Heading 4</h4>');
    });

    it('converts unordered lists', () => {
        const result = markdownToHtml('- item one\n- item two');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>item one</li>');
        expect(result).toContain('<li>item two</li>');
        expect(result).toContain('</ul>');
    });

    it('converts task checkboxes', () => {
        const result = markdownToHtml('- [ ] open task\n- [x] done task');
        expect(result).toContain('mrcf-task-open');
        expect(result).toContain('mrcf-task-done');
        expect(result).toContain('checked');
    });

    it('converts links', () => {
        const result = markdownToHtml('[Google](https://google.com)');
        expect(result).toContain('<a href="https://google.com">Google</a>');
    });

    it('blocks javascript: URLs in links', () => {
        const result = markdownToHtml('[click](javascript:alert(1))');
        expect(result).toContain('#blocked');
        expect(result).not.toContain('javascript:alert');
    });

    it('converts images', () => {
        const result = markdownToHtml('![diagram](assets/arch.png)');
        expect(result).toContain('<img src="assets/arch.png"');
        expect(result).toContain('alt="diagram"');
    });

    it('converts blockquotes', () => {
        const result = markdownToHtml('> This is a quote.');
        expect(result).toContain('<blockquote>');
        expect(result).toContain('This is a quote.');
        expect(result).toContain('</blockquote>');
    });

    it('converts horizontal rules', () => {
        expect(markdownToHtml('---')).toContain('<hr>');
        expect(markdownToHtml('***')).toContain('<hr>');
    });

    it('converts tables', () => {
        const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
        const result = markdownToHtml(md);
        expect(result).toContain('<table>');
        expect(result).toContain('<th>');
        expect(result).toContain('<td>');
    });

    it('wraps bare text in paragraphs', () => {
        const result = markdownToHtml('A paragraph.\n\nAnother paragraph.');
        expect(result).toContain('<p>A paragraph.</p>');
        expect(result).toContain('<p>Another paragraph.</p>');
    });
});
