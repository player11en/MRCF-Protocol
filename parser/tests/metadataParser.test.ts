import { parseMetadata } from '../src/parser/metadataParser';

const MINIMAL = [
  '---',
  'title: Test Document',
  'version: 1.0',
  'created: 2026-03-12',
  '---',
];

describe('parseMetadata', () => {
  it('parses required fields from a minimal front-matter block', () => {
    const result = parseMetadata(MINIMAL);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata).not.toBeNull();
    expect(result.metadata!.title).toBe('Test Document');
    expect(result.metadata!.version).toBe('1.0');
    expect(result.metadata!.created).toBe('2026-03-12');
  });

  it('reports lines consumed (including the two --- delimiters)', () => {
    const result = parseMetadata(MINIMAL);
    expect(result.linesConsumed).toBe(5);
  });

  it('parses optional fields', () => {
    const lines = [
      '---',
      'title: My Doc',
      'version: 2.1',
      'created: 2026-01-01',
      'author: Dev One',
      'updated: 2026-03-12',
      'status: active',
      'license: MIT',
      '---',
    ];
    const result = parseMetadata(lines);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata!.author).toBe('Dev One');
    expect(result.metadata!.updated).toBe('2026-03-12');
    expect(result.metadata!.status).toBe('active');
    expect(result.metadata!.license).toBe('MIT');
  });

  it('parses tags as a YAML sequence', () => {
    const lines = [
      '---',
      'title: T',
      'version: 1.0',
      'created: 2026-01-01',
      'tags:',
      '  - ai',
      '  - docs',
      '---',
    ];
    const result = parseMetadata(lines);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata!.tags).toEqual(['ai', 'docs']);
  });

  it('parses inline comma-separated tags', () => {
    const lines = [
      '---',
      'title: T',
      'version: 1.0',
      'created: 2026-01-01',
      'tags: ai, platform, docs',
      '---',
    ];
    const result = parseMetadata(lines);
    expect(result.metadata!.tags).toEqual(['ai', 'platform', 'docs']);
  });

  it('returns an error when front-matter is missing', () => {
    const result = parseMetadata(['# VISION', 'Some content']);
    expect(result.errors.length > 0).toBeTruthy();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.metadata).toBeNull();
  });

  it('returns an error when the closing --- is missing', () => {
    const lines = ['---', 'title: Unterminated'];
    const result = parseMetadata(lines);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.metadata).toBeNull();
  });

  it('returns an error for each missing required field', () => {
    const lines = ['---', 'author: someone', '---'];
    const result = parseMetadata(lines);
    const codes = result.errors.map((e) => e.type);
    expect(codes).toContain('missing_metadata_field');
    // title, version, created all missing
    expect(result.errors.filter((e) => e.type === 'missing_metadata_field')).toHaveLength(3);
  });

  it('preserves unknown custom metadata fields', () => {
    const lines = [
      '---',
      'title: T',
      'version: 1.0',
      'created: 2026-01-01',
      'team: alpha',
      '---',
    ];
    const result = parseMetadata(lines);
    expect(result.metadata!['team']).toBe('alpha');
  });
});
