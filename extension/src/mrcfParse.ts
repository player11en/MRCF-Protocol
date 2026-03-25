/**
 * Lightweight MRCF parse helpers used by the VS Code extension.
 * For full validation and rich document model, use @mrcf/parser (Dev 1).
 */

import * as vscode from 'vscode';

/** Section header: # SECTION_NAME (level 1) or ## / ### (nested) */
export interface MrcfSectionInfo {
  name: string;
  level: number;
  range: vscode.Range;
  /** Line index (0-based) of the header line */
  lineIndex: number;
}

export interface MrcfTaskInfo {
  /** 0-based line index of the task line */
  lineIndex: number;
  /** Task text after the checkbox */
  text: string;
  /** Whether the task is completed ([x]) */
  completed: boolean;
}

export interface MrcfSectionContent {
  name: string;
  content: string;
}

const SECTION_HEADER_RE = /^# ([A-Z][A-Z0-9_ ]*)$/;
const NESTED_HEADER_RE = /^(#{2,})\s+(.+)$/;
const TASK_LINE_RE = /^(\s*)-\s\[(x| )\]\s(.*)$/i;
/** v2 block header: [TASK-N] */
const V2_TASK_BLOCK_RE = /^\[TASK-(\d+)\]$/;
/** v2 key-value line inside a block: key: value */
const V2_KV_RE = /^(\w+):\s*(.+)$/;

/**
 * Returns section headers in document order with ranges.
 * Used by folding and document symbol providers.
 */
export function getSections(
  document: { getText(): string; positionAt(offset: number): vscode.Position }
): MrcfSectionInfo[] {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  const sections: MrcfSectionInfo[] = [];

  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const l1 = line.match(SECTION_HEADER_RE);
    if (l1) {
      const start = document.positionAt(offset);
      const end = document.positionAt(offset + line.length);
      sections.push({ name: l1[1].trim(), level: 1, range: new vscode.Range(start, end), lineIndex: i });
      offset += line.length + 1;
      continue;
    }
    const nested = line.match(NESTED_HEADER_RE);
    if (nested) {
      const start = document.positionAt(offset);
      const end = document.positionAt(offset + line.length);
      sections.push({
        name: nested[2].trim(),
        level: nested[1].length,
        range: new vscode.Range(start, end),
        lineIndex: i,
      });
      offset += line.length + 1;
      continue;
    }
    offset += line.length + 1;
  }

  return sections;
}

/** All standard section names (v2: 9 sections) */
export const STANDARD_SECTIONS = [
  'SUMMARY', 'VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS',
  'INSIGHTS', 'DECISIONS', 'REFERENCES',
] as const;

/** Required section names (v2: 5 core sections that must be present) */
export const REQUIRED_SECTIONS = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'] as const;

export function getRequiredSectionNames(): readonly string[] {
  return REQUIRED_SECTIONS;
}

/**
 * Returns all task lines within the TASKS section of the given document.
 * Scope: only level-1 TASKS section body, matching \"- [ ]\" / \"- [x]\".
 */
export function getTasks(document: vscode.TextDocument): MrcfTaskInfo[] {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  const sections = getSections(document);
  const tasksSection = sections.find((s) => s.level === 1 && s.name === 'TASKS');
  if (!tasksSection) return [];

  const startLine = tasksSection.lineIndex + 1;
  let endLine = lines.length - 1;
  for (const s of sections) {
    if (s.level === 1 && s.lineIndex > tasksSection.lineIndex) {
      endLine = s.lineIndex - 1;
      break;
    }
  }

  const result: MrcfTaskInfo[] = [];
  for (let i = startLine; i <= endLine; i++) {
    const line = lines[i] ?? '';

    // v1 checkbox format: - [ ] task text
    const m = line.match(TASK_LINE_RE);
    if (m) {
      const completed = m[2].toLowerCase() === 'x';
      result.push({ lineIndex: i, text: m[3].trim(), completed });
      continue;
    }

    // v2 block format: [TASK-N] header followed by key: value lines
    if (V2_TASK_BLOCK_RE.test(line.trim())) {
      const blockLine = i;
      let title = '';
      let status = 'planned';
      // Scan forward for key-value pairs until blank line or next block
      let j = i + 1;
      while (j <= endLine) {
        const kv = (lines[j] ?? '').trim();
        if (kv === '' || V2_TASK_BLOCK_RE.test(kv) || SECTION_HEADER_RE.test(kv)) break;
        const kvMatch = kv.match(V2_KV_RE);
        if (kvMatch) {
          const key = kvMatch[1].toLowerCase();
          if (key === 'title') title = kvMatch[2].trim();
          if (key === 'status') status = kvMatch[2].trim().toLowerCase();
        }
        j++;
      }
      if (title) {
        const completed = status === 'done';
        result.push({ lineIndex: blockLine, text: title, completed });
      }
      i = j - 1;
    }
  }
  return result;
}

/**
 * Returns top-level sections with their full body content (between headers).
 * Used by the AI panel to build context per section.
 */
export function getSectionContents(document: vscode.TextDocument): MrcfSectionContent[] {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  const sections = getSections(document).filter((s) => s.level === 1);
  const result: MrcfSectionContent[] = [];

  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const startLine = current.lineIndex + 1;
    const endLine =
      i + 1 < sections.length ? sections[i + 1].lineIndex - 1 : lines.length - 1;
    const bodyLines = lines.slice(startLine, endLine + 1);
    result.push({
      name: current.name,
      content: bodyLines.join('\n').trim(),
    });
  }

  return result;
}
