import type {
  MrcfSection,
  MrcfSubsection,
  MrcfTask,
  MrcfAssetReference,
} from '../types/index';
import { STANDARD_SECTIONS } from '../types/index';

// ─── Task parsing ─────────────────────────────────────────────────────────────

const TASK_RE = /^- \[(x| )\] (.+)/i;
const TASK_META_RE = /^\s{2,}(\w+):\s*(.+)/;

/**
 * Parses markdown checkbox task lists within a TASKS section.
 *
 * Supports optional inline metadata on indented lines immediately after a task:
 * ```
 * - [ ] implement parser
 *   owner: dev1
 *   priority: high
 * ```
 */
function parseTasks(lines: string[], baseLineNumber: number): MrcfTask[] {
  const tasks: MrcfTask[] = [];
  let current: MrcfTask | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const taskMatch = line.match(TASK_RE);
    if (taskMatch) {
      current = {
        completed: taskMatch[1].toLowerCase() === 'x',
        description: taskMatch[2].trim(),
        lineNumber: baseLineNumber + i,
      };
      tasks.push(current);
      continue;
    }

    if (current) {
      const metaMatch = line.match(TASK_META_RE);
      if (metaMatch) {
        const key = metaMatch[1].toLowerCase();
        const value = metaMatch[2].trim();
        if (key === 'owner') current.owner = value;
        if (key === 'priority' && (value === 'low' || value === 'medium' || value === 'high')) {
          current.priority = value;
        }
        continue;
      }
    }

    // Non-task, non-meta line resets current task context
    current = null;
  }

  return tasks;
}

// ─── Asset reference parsing ──────────────────────────────────────────────────

const ASSET_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function parseAssets(content: string, baseLineNumber: number): MrcfAssetReference[] {
  const assets: MrcfAssetReference[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let match: RegExpExecArray | null;
    ASSET_RE.lastIndex = 0;
    while ((match = ASSET_RE.exec(lines[i])) !== null) {
      assets.push({
        alt: match[1],
        path: match[2],
        lineNumber: baseLineNumber + i,
      });
    }
  }

  return assets;
}

// ─── Subsection parsing ───────────────────────────────────────────────────────

/**
 * Builds a nested subsection tree from the lines inside a top-level section.
 * Headings at level 2 (##) become direct children; deeper headings nest further.
 */
function parseSubsections(
  lines: string[],
  baseLineNumber: number,
  minLevel = 2,
): MrcfSubsection[] {
  const result: MrcfSubsection[] = [];
  let i = 0;

  while (i < lines.length) {
    const headingMatch = lines[i].match(/^(#{2,})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level < minLevel) {
        // This heading belongs to a parent scope — stop
        break;
      }
      if (level === minLevel) {
        const sub: MrcfSubsection = {
          name: headingMatch[2].trim(),
          level,
          content: '',
          subsections: [],
          lineNumber: baseLineNumber + i,
        };

        // Collect body lines until the next heading at this level or higher
        const bodyLines: string[] = [];
        i++;
        while (i < lines.length) {
          const nextHeading = lines[i].match(/^(#{2,})\s+(.+)/);
          if (nextHeading && nextHeading[1].length <= level) {
            break;
          }
          bodyLines.push(lines[i]);
          i++;
        }

        sub.content = bodyLines.join('\n').trim();
        // Recurse for deeper headings
        sub.subsections = parseSubsections(bodyLines, baseLineNumber + (i - bodyLines.length), level + 1);
        result.push(sub);
        continue;
      }
    }
    i++;
  }

  return result;
}

// ─── Top-level section parsing ────────────────────────────────────────────────

const SECTION_HEADER_RE = /^# ([A-Z][A-Z0-9_ ]*)$/;
const STANDARD_SET = new Set<string>(STANDARD_SECTIONS as unknown as string[]);

export interface SectionParseResult {
  sections: MrcfSection[];
  allAssets: MrcfAssetReference[];
}

/**
 * Parses the body of a .mrcf file (everything after the front-matter block)
 * into an ordered array of MrcfSection objects.
 *
 * Rules (per spec §12):
 * - A section begins with `# SECTION_NAME` (level-1 heading, all-caps name)
 * - Section names must be A-Z, 0-9, underscore, or space
 * - Unknown section names are accepted as custom sections (§12.2)
 *
 * Parses the body of a .mrcf file (everything after the front-matter block)
 * into an ordered array of MrcfSection objects.
 */
export function parseSections(
  lines: string[],
  startLineNumber: number,
): SectionParseResult {
  const sections: MrcfSection[] = [];
  const allAssets: MrcfAssetReference[] = [];

  let currentSection: { name: string; startLine: number; bodyLines: string[] } | null = null;

  const flushSection = () => {
    if (!currentSection) return;

    const { name, startLine, bodyLines } = currentSection;
    const content = bodyLines.join('\n').trim();
    const isStandard = STANDARD_SET.has(name);
    const tasks = name === 'TASKS' ? parseTasks(bodyLines, startLine + 1) : [];
    const assets = parseAssets(content, startLine + 1);
    const subsections = parseSubsections(bodyLines, startLine + 1);

    allAssets.push(...assets);

    sections.push({
      name,
      isStandard,
      content,
      subsections,
      tasks,
      assets,
      lineNumber: startLine,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = startLineNumber + i;
    const line = lines[i];
    const headerMatch = line.match(SECTION_HEADER_RE);

    if (headerMatch) {
      flushSection();
      currentSection = {
        name: headerMatch[1].trim(),
        startLine: lineNumber,
        bodyLines: [],
      };
    } else if (currentSection) {
      currentSection.bodyLines.push(line);
    }
    // Lines before the first section header are silently ignored (preamble)
  }

  flushSection();

  return { sections, allAssets };
}
