import type { MrcfMetadata, ParseError } from '../types/index';
import { REQUIRED_METADATA_FIELDS } from '../types/index';

export interface MetadataParseResult {
  metadata: MrcfMetadata | null;
  /** Number of lines consumed by the front-matter block (including delimiters) */
  linesConsumed: number;
  errors: ParseError[];
}

/**
 * Parses the YAML-like front-matter block at the top of a .mrcf file.
 *
 * Expected format:
 * ```
 * ---
 * title: My Document
 * version: 1.0
 * created: 2026-03-12
 * tags:
 *   - ai
 *   - docs
 * ---
 * ```
 *
 * The parser is deliberately minimal: it handles scalar values and simple
 * YAML sequences (list items prefixed with `  - `).  Full YAML is intentionally
 * NOT supported to keep the implementation dependency-free and trivially
 * auditable.
 */
export function parseMetadata(lines: string[]): MetadataParseResult {
  const errors: ParseError[] = [];

  // Front-matter must start on line 1 with exactly `---`
  if (lines.length === 0 || lines[0].trim() !== '---') {
    errors.push({
      type: 'invalid_metadata',
      message: 'Document must start with a front-matter block (---)',
      line: 1,
    });
    return { metadata: null, linesConsumed: 0, errors };
  }

  // Find the closing `---`
  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    errors.push({
      type: 'invalid_metadata',
      message: 'Front-matter block is not closed (missing closing ---)',
      line: 1,
    });
    return { metadata: null, linesConsumed: 0, errors };
  }

  const frontMatterLines = lines.slice(1, closingIndex);
  const raw: Record<string, unknown> = {};
  let currentKey: string | null = null;

  for (let i = 0; i < frontMatterLines.length; i++) {
    const line = frontMatterLines[i];

    // List item continuation: `  - value`
    if (currentKey !== null && /^\s{2,}-\s+/.test(line)) {
      const value = line.replace(/^\s+-\s+/, '').trim();
      const arr = raw[currentKey];
      if (Array.isArray(arr)) {
        arr.push(value);
      } else {
        raw[currentKey] = [value];
      }
      continue;
    }

    // Key-value pair: `key: value` or `key:` (value on next lines)
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      raw[currentKey] = value === '' ? null : value;
      continue;
    }

    // Blank lines are allowed
    if (line.trim() === '') {
      continue;
    }

    errors.push({
      type: 'invalid_metadata',
      message: `Unrecognised front-matter line: "${line}"`,
      line: i + 2, // +1 for opening ---, +1 for 1-based index
    });
  }

  // Validate required fields
  for (const field of REQUIRED_METADATA_FIELDS) {
    if (!raw[field]) {
      errors.push({
        type: 'missing_metadata_field',
        message: `Required metadata field "${field}" is missing or empty`,
      });
    }
  }

  if (errors.some((e) => e.type === 'missing_metadata_field')) {
    return { metadata: null, linesConsumed: closingIndex + 1, errors };
  }

  // Normalise tags: could be string "ai, docs" or array ["ai", "docs"]
  let tags: string[] | undefined;
  if (Array.isArray(raw['tags'])) {
    tags = (raw['tags'] as unknown[]).map(String);
  } else if (typeof raw['tags'] === 'string' && raw['tags'] !== '') {
    tags = raw['tags'].split(',').map((t) => t.trim()).filter(Boolean);
  }

  const metadata: MrcfMetadata = {
    title: String(raw['title']),
    version: String(raw['version']),
    created: String(raw['created']),
  };

  if (raw['author']) metadata.author = String(raw['author']);
  if (raw['updated']) metadata.updated = String(raw['updated']);
  if (tags) metadata.tags = tags;
  if (raw['status']) {
    const s = String(raw['status']);
    if (s === 'draft' || s === 'active' || s === 'archived') {
      metadata.status = s;
    }
  }
  if (raw['license']) metadata.license = String(raw['license']);

  // Carry over any other unknown keys
  const knownKeys = new Set(['title', 'version', 'created', 'author', 'updated', 'tags', 'status', 'license']);
  for (const [k, v] of Object.entries(raw)) {
    if (!knownKeys.has(k)) {
      metadata[k] = v;
    }
  }

  return { metadata, linesConsumed: closingIndex + 1, errors };
}
