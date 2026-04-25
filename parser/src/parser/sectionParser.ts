import type {
  MrcfSection,
  MrcfSubsection,
  MrcfTask,
  MrcfAssetReference,
  MrcfProposal,
  MrcfSummaryBlock,
  MrcfInsightBlock,
  MrcfDecisionBlock,
  MrcfReferenceLink,
  MrcfArchiveLink,
  InsightType,
  DecisionImpact,
  ReferenceRelationship,
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
        if (key === 'id') current.id = value;
        if (key === 'depends' || key === 'depends_on') {
          // Handle both `depends: T-1,T-2` and `depends_on: [TASK-1]` formats
          const raw = value.replace(/[\[\]]/g, '');
          current.dependsOn = raw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        }
        if (key === 'status') {
          const validStatuses = ['planned', 'in_progress', 'done', 'failed', 'blocked'] as const;
          if ((validStatuses as readonly string[]).includes(value)) {
            current.status = value as typeof validStatuses[number];
          }
        }
        if (key === 'related_insights') {
          const raw = value.replace(/[\[\]]/g, '');
          current.relatedInsights = raw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        }
        if (key === 'anchor' || key === 'anchors') {
          const raw = value.replace(/[\[\]]/g, '');
          current.anchors = raw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        }
        continue;
      }
    }

    // Non-task, non-meta line resets current task context
    current = null;
  }

  return tasks;
}

// ─── v2 Block parsing ─────────────────────────────────────────────────────────

/**
 * Matches the start of a named block: [BLOCK-ID]
 * e.g. [TASK-1], [INSIGHT-2], [DEC-1]
 */
const BLOCK_HEADER_RE = /^\[([A-Z][A-Z0-9_-]*)\]\s*$/;

/**
 * Matches a key: value metadata line inside a block.
 */
const BLOCK_KV_RE = /^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/;

/**
 * Split content into named blocks delimited by [ID] headers.
 * Returns an array of { id, lines } objects.
 */
function splitBlocks(lines: string[]): Array<{ id: string; lines: string[]; lineOffset: number }> {
  const blocks: Array<{ id: string; lines: string[]; lineOffset: number }> = [];
  let current: { id: string; lines: string[]; lineOffset: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(BLOCK_HEADER_RE);
    if (m) {
      if (current) blocks.push(current);
      current = { id: m[1], lines: [], lineOffset: i };
    } else if (current) {
      current.lines.push(lines[i]);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

/** Parse a block's lines into a key-value map (ignores blank lines). */
function blockKV(lines: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of lines) {
    if (line.trim() === '') continue;
    const m = line.match(BLOCK_KV_RE);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

/**
 * Parse SUMMARY section content into a MrcfSummaryBlock.
 * Accepts simple key: value lines.
 */
function parseSummary(lines: string[]): MrcfSummaryBlock {
  const summary: MrcfSummaryBlock = {};
  for (const line of lines) {
    if (line.trim() === '') continue;
    const m = line.match(BLOCK_KV_RE);
    if (!m) continue;
    const key = m[1].toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    // Map known snake_case keys to camelCase properties
    const keyMap: Record<string, string> = {
      current_focus: 'currentFocus',
      main_risk: 'mainRisk',
      stable_parts: 'stableParts',
    };
    const normalized = keyMap[m[1].toLowerCase()] ?? key;
    summary[normalized] = m[2].trim();
  }
  return summary;
}

/**
 * Parse INSIGHTS section content into MrcfInsightBlock[].
 * Handles [INSIGHT-N] blocks with type, description, confidence, source.
 */
function parseInsights(lines: string[], baseLineNumber: number): MrcfInsightBlock[] {
  const blocks = splitBlocks(lines);
  return blocks.map((block) => {
    const kv = blockKV(block.lines);
    const rawType = kv['type'] ?? 'observation';
    const type: InsightType =
      rawType === 'success' || rawType === 'failure' ? rawType : 'observation';
    const rawConf = kv['confidence'];
    const confidence = rawConf !== undefined ? parseFloat(rawConf) : undefined;
    return {
      id: block.id,
      type,
      description: kv['description'] ?? '',
      confidence: confidence !== undefined && !isNaN(confidence) ? confidence : undefined,
      source: kv['source'],
      anchors: parseAnchors(kv),
      lineNumber: baseLineNumber + block.lineOffset,
    };
  });
}

function parseAnchors(kv: Record<string, string>): string[] | undefined {
  const raw = kv['anchor'] || kv['anchors'];
  if (!raw) return undefined;
  return raw.replace(/[\[\]]/g, '').split(',').map(v => v.trim()).filter(Boolean);
}

/**
 * Parse DECISIONS section content into MrcfDecisionBlock[].
 * Handles [DEC-N] blocks with choice, reason, alternatives, impact.
 */
function parseDecisions(lines: string[], baseLineNumber: number): MrcfDecisionBlock[] {
  const blocks = splitBlocks(lines);
  return blocks.map((block) => {
    const kv = blockKV(block.lines);
    const rawImpact = kv['impact'];
    const impact: DecisionImpact | undefined =
      rawImpact === 'low' || rawImpact === 'medium' || rawImpact === 'high'
        ? rawImpact
        : undefined;
    return {
      id: block.id,
      choice: kv['choice'] ?? '',
      reason: kv['reason'] ?? '',
      alternatives: kv['alternatives'],
      impact,
      anchors: parseAnchors(kv),
      lineNumber: baseLineNumber + block.lineOffset,
    };
  });
}

/**
 * Parse REFERENCES section content into MrcfReferenceLink[].
 *
 * Supported formats:
 *   TASK-1 → INSIGHT-1                       (defaults to depends_on)
 *   TASK-1 → INSIGHT-1 [depends_on]          (explicit type in brackets)
 *   TASK-1 -> INSIGHT-1 [validates]          (ASCII arrow also accepted)
 */
const REF_ARROW_RE = /^([A-Z][A-Z0-9_-]*)\s*(?:→|->)\s*([A-Z][A-Z0-9_-]*)(?:\s*\[([a-z_]+)\])?/;
const VALID_RELATIONSHIPS: ReadonlySet<string> = new Set([
  'derives_from', 'contradicts', 'depends_on', 'validates',
]);

function parseReferences(lines: string[], baseLineNumber: number): MrcfReferenceLink[] {
  const links: MrcfReferenceLink[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Strip leading list marker if present (- TASK-1 → ...)
    const stripped = line.replace(/^-\s*/, '');
    const m = stripped.match(REF_ARROW_RE);
    if (!m) continue;
    const rawRel = m[3]?.toLowerCase();
    const relationship: ReferenceRelationship =
      rawRel && VALID_RELATIONSHIPS.has(rawRel)
        ? (rawRel as ReferenceRelationship)
        : 'depends_on';
    links.push({
      from: m[1],
      to: m[2],
      relationship,
      lineNumber: baseLineNumber + i,
    });
  }
  return links;
}

// ─── Archive parsing ─────────────────────────────────────────────────────────

const ARCHIVE_RE = /^- \[([^\]]+)\]\(([^)]+)\)/;
function parseArchive(lines: string[], baseLineNumber: number): MrcfArchiveLink[] {
  const links: MrcfArchiveLink[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(ARCHIVE_RE);
    if (!m) continue;
    links.push({
      description: m[1].trim(),
      path: m[2].trim(),
      lineNumber: baseLineNumber + i,
    });
  }
  return links;
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

// Lock comment: <!-- lock: actor | 2026-03-13T14:22:00Z -->
const LOCK_RE = /^<!--\s*lock:\s*([^|]+)\|\s*([^-]+?)\s*-->$/i;

// Proposal block start: <!-- proposal: actor | timestamp | confidence:high -->
const PROPOSAL_START_RE = /^<!--\s*proposal:\s*([^|]+)\|\s*([^|]+)\|\s*confidence:(low|medium|high)\s*$/i;
const PROPOSAL_END_RE = /^-->$/;

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

    // Detect lock (first non-blank line)
    let lock: MrcfSection['lock'] | undefined;
    let contentLines = [...bodyLines];
    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i];
      if (line.trim() === '') continue;
      const m = line.match(LOCK_RE);
      if (m) {
        lock = {
          actor: m[1].trim(),
          timestamp: m[2].trim(),
        };
        // Keep the raw lock line in content for now (backwards compatible)
      }
      break;
    }

    const content = contentLines.join('\n').trim();
    const isStandard = STANDARD_SET.has(name);
    const tasks = name === 'TASKS' ? parseTasks(contentLines, startLine + 1) : [];
    const assets = parseAssets(content, startLine + 1);
    const subsections = parseSubsections(contentLines, startLine + 1);

    allAssets.push(...assets);

    // Extract proposal blocks
    const proposals: MrcfProposal[] = [];
    const proposalIdPrefix = `${name}-`;
    let proposalCounter = 0;

    const linesForProposals = content.split('\n');
    let i = 0;
    while (i < linesForProposals.length) {
      const line = linesForProposals[i];
      const startMatch = line.match(PROPOSAL_START_RE);
      if (startMatch) {
        const actor = startMatch[1].trim();
        const timestamp = startMatch[2].trim();
        const confidence = startMatch[3].toLowerCase() as 'low' | 'medium' | 'high';
        const body: string[] = [];
        let reason: string | undefined;
        i++;
        while (i < linesForProposals.length) {
          const inner = linesForProposals[i];
          if (PROPOSAL_END_RE.test(inner.trim())) {
            break;
          }
          if (inner.trim().toLowerCase().startsWith('reason:')) {
            reason = inner.trim().slice('reason:'.length).trim();
          } else {
            body.push(inner);
          }
          i++;
        }
        const proposal: MrcfProposal = {
          id: `${proposalIdPrefix}${++proposalCounter}`,
          sectionName: name,
          actor,
          timestamp,
          confidence,
          reason,
          content: body.join('\n').trim(),
        };
        proposals.push(proposal);
      }
      i++;
    }

    // ── v2 structured block parsing ──────────────────────────────────────────
    const summary = name === 'SUMMARY'
      ? parseSummary(contentLines)
      : undefined;

    const insights = name === 'INSIGHTS'
      ? parseInsights(contentLines, startLine + 1)
      : undefined;

    const decisions = name === 'DECISIONS'
      ? parseDecisions(contentLines, startLine + 1)
      : undefined;

    const references = name === 'REFERENCES'
      ? parseReferences(contentLines, startLine + 1)
      : undefined;

    const archiveLinks = name === 'ARCHIVE'
      ? parseArchive(contentLines, startLine + 1)
      : undefined;

    sections.push({
      name,
      isStandard,
      content,
      subsections,
      tasks,
      assets,
      lineNumber: startLine,
      lock,
      proposals: proposals.length > 0 ? proposals : undefined,
      summary,
      insights: insights && insights.length > 0 ? insights : undefined,
      decisions: decisions && decisions.length > 0 ? decisions : undefined,
      references: references && references.length > 0 ? references : undefined,
      archiveLinks: archiveLinks && archiveLinks.length > 0 ? archiveLinks : undefined,
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
