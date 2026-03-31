/**
 * Slides Generator — Developer 4
 *
 * Generates a self-contained HTML slide deck from a MrcfDocument.
 * Maps standard sections to slide types and chunks long content.
 */

import type { MrcfDocument, MrcfSection } from '@mrcf/parser';
import { markdownToHtml, escapeHtml } from './markdownTransformer';
import type { Slide, SlideDeck, SlideType } from './types';

/** Section → Slide type mapping per spec */
const SECTION_SLIDE_MAP: Record<string, SlideType> = {
    VISION: 'intro',
    CONTEXT: 'problem',
    STRUCTURE: 'architecture',
    PLAN: 'roadmap',
    TASKS: 'next-steps',
};

/** Max characters per slide body before chunking */
const MAX_SLIDE_CHARS = 800;

/** Max lines per slide before chunking */
const MAX_SLIDE_LINES = 15;

/**
 * Generate a SlideDeck from a MrcfDocument.
 */
export function generateSlideDeck(doc: MrcfDocument): SlideDeck {
    const slides: Slide[] = [];
    let slideNumber = 1;

    // Title slide from metadata
    slides.push({
        type: 'title',
        title: doc.metadata.title,
        subtitle: doc.metadata.author
            ? `By ${doc.metadata.author}`
            : `v${doc.metadata.version}`,
        bodyHtml: '',
        number: slideNumber++,
    });

    // Convert each section to one or more slides
    for (const section of doc.sections) {
        const sectionSlides = sectionToSlides(section, slideNumber);
        slides.push(...sectionSlides);
        slideNumber += sectionSlides.length;
    }

    return {
        title: doc.metadata.title,
        author: doc.metadata.author,
        slides,
        totalSlides: slides.length,
    };
}

/**
 * Convert a section to one or more slides.
 * Long content is chunked into multiple slides.
 */
function sectionToSlides(section: MrcfSection, startNumber: number): Slide[] {
    const slideType = SECTION_SLIDE_MAP[section.name] || 'content';
    const slides: Slide[] = [];
    let num = startNumber;

    const contentWithSubs = buildFullContent(section);
    const chunks = chunkContent(contentWithSubs);

    for (let i = 0; i < chunks.length; i++) {
        const title =
            chunks.length > 1
                ? `${section.name} (${i + 1}/${chunks.length})`
                : section.name;

        slides.push({
            type: slideType,
            title,
            subtitle: i === 0 ? extractSubtitle(section.content) : undefined,
            bodyHtml: markdownToHtml(chunks[i]),
            speakerNotes: i === 0 ? section.content.slice(0, 200) : undefined,
            number: num++,
        });
    }

    return slides;
}

/**
 * Build full content including subsections.
 */
function buildFullContent(section: MrcfSection): string {
    let content = section.content;

    for (const sub of section.subsections) {
        content += `\n\n${'#'.repeat(sub.level)} ${sub.name}\n\n${sub.content}`;
    }

    return content;
}

/**
 * Chunk content into sections that fit on a single slide.
 */
function chunkContent(content: string): string[] {
    const trimmed = content.trim();
    if (!trimmed) return [''];

    // If content is short enough, return as single chunk
    if (trimmed.length <= MAX_SLIDE_CHARS && trimmed.split('\n').length <= MAX_SLIDE_LINES) {
        return [trimmed];
    }

    // Split by paragraphs (double newlines)
    const paragraphs = trimmed.split(/\n\n+/);
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
        const combined = current ? `${current}\n\n${para}` : para;
        if (
            combined.length > MAX_SLIDE_CHARS ||
            combined.split('\n').length > MAX_SLIDE_LINES
        ) {
            if (current) chunks.push(current);
            current = para;
        } else {
            current = combined;
        }
    }
    if (current) chunks.push(current);

    return chunks.length > 0 ? chunks : [''];
}

/**
 * Extract a subtitle from the first meaningful line of content.
 */
function extractSubtitle(content: string): string | undefined {
    const firstLine = content
        .trim()
        .split('\n')
        .find((l) => l.trim().length > 0);
    if (!firstLine) return undefined;
    const cleaned = firstLine.replace(/^#+\s*/, '').trim();
    return cleaned.length > 80 ? cleaned.slice(0, 77) + '...' : cleaned;
}

/**
 * Render a SlideDeck to a self-contained HTML file.
 */
export function renderSlides(doc: MrcfDocument): string {
    const deck = generateSlideDeck(doc);
    return renderSlideDeckHtml(deck);
}

/**
 * Render a SlideDeck to HTML.
 */
function renderSlideDeckHtml(deck: SlideDeck): string {
    const slideHtmls = deck.slides.map((slide) => renderSlideHtml(slide, deck.totalSlides));

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(deck.title)} — Slides</title>
<style>${SLIDES_CSS}</style>
</head>
<body>
<div class="slides-container">
${slideHtmls.join('\n')}
</div>
<script>${SLIDES_JS}</script>
</body>
</html>`;
}

/**
 * Render a single slide.
 */
function renderSlideHtml(slide: Slide, total: number): string {
    const typeClass = `slide-${slide.type}`;

    return `<div class="slide ${typeClass}" data-slide="${slide.number}">
  <div class="slide-content">
    <h1 class="slide-title">${escapeHtml(slide.title)}</h1>
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div class="slide-body">${slide.bodyHtml}</div>
  </div>
  <div class="slide-footer">
    <span>${slide.number} / ${total}</span>
  </div>
</div>`;
}

/** CSS for the slide deck */
const SLIDES_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  overflow: hidden;
}

.slides-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.slides-container > .slide {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  display: none !important;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 6rem;
}

.slides-container > .slide.active { display: flex !important; }

/* Fallback for restrictive preview environments: show only first slide */
.slides-container > .slide:first-child { display: flex; }

.slide-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }

.slide-title {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.slide-subtitle {
  font-size: 1.4rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

.slide-body {
  font-size: 1.2rem;
  line-height: 1.8;
  max-height: 60vh;
  overflow-y: auto;
}

.slide-body ul { padding-left: 2rem; margin: 0.5rem 0; }
.slide-body li { margin: 0.4rem 0; }
.slide-body code { background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; }
.slide-body pre { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin: 1rem 0; overflow-x: auto; }
.slide-body table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
.slide-body th, .slide-body td { border: 1px solid #334155; padding: 0.5rem 0.8rem; text-align: left; }
.slide-body th { background: rgba(255,255,255,0.05); }

.slide-footer {
  text-align: right;
  font-size: 0.9rem;
  color: #64748b;
  padding-top: 1rem;
}

/* Slide type variations */
.slide-title-slide { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
.slide-title-slide .slide-title { font-size: 3.5rem; }
.slide-intro { border-left: 6px solid #6366f1; }
.slide-problem { border-left: 6px solid #8b5cf6; }
.slide-architecture { border-left: 6px solid #06b6d4; }
.slide-roadmap { border-left: 6px solid #10b981; }
.slide-next-steps { border-left: 6px solid #f59e0b; }
.slide-content { border-left: 6px solid #9ca3af; }

/* Navigation hint */
.slides-container::after {
  content: 'Use ← → arrow keys to navigate';
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  color: #475569;
  font-size: 0.8rem;
  opacity: 0.6;
}
`;

/** Minimal JS for slide navigation */
const SLIDES_JS = `
(function() {
  var slides = document.querySelectorAll('.slide');
  var current = 0;

  function show(index) {
    slides.forEach(function(s) { s.classList.remove('active'); });
    if (slides[index]) slides[index].classList.add('active');
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      current = Math.min(current + 1, slides.length - 1);
      show(current);
    } else if (e.key === 'ArrowLeft') {
      current = Math.max(current - 1, 0);
      show(current);
    }
  });

  document.addEventListener('click', function(e) {
    var x = e.clientX;
    if (x > window.innerWidth / 2) {
      current = Math.min(current + 1, slides.length - 1);
    } else {
      current = Math.max(current - 1, 0);
    }
    show(current);
  });

  show(0);
})();
`;
