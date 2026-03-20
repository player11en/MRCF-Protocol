/**
 * Integration tests: parse() → validate() full pipeline.
 * These tests simulate real .mrcf file content end-to-end.
 */
import { parse } from '../src/parser/index';
import { validate } from '../src/validator/index';

const EXAMPLE_FROM_SPEC = `---
title: AI Knowledge Platform
version: 1.0
created: 2026-03-12
---

# VISION

Build a platform where developers can collaborate
on structured knowledge with AI.

# CONTEXT

Target users: developers and architects.

# STRUCTURE

## System

Editor
AI Service
Document Engine

# PLAN

Phase 1 Prototype
Phase 2 AI Integration

# TASKS

- [ ] implement parser
- [ ] build editor
- [ ] connect AI
`;

describe('Full pipeline — spec example document', () => {
  it('parses the example document from spec §17 without errors', () => {
    const result = parse(EXAMPLE_FROM_SPEC);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.document).not.toBeNull();
  });

  it('validates cleanly with no errors', () => {
    const parsed = parse(EXAMPLE_FROM_SPEC);
    const validation = validate(parsed.document!);
    expect(validation.valid).toBe(true);
    expect(validation.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('sectionIndex provides O(1) lookup by name', () => {
    const { document } = parse(EXAMPLE_FROM_SPEC);
    expect(document!.sectionIndex.has('VISION')).toBe(true);
    expect(document!.sectionIndex.has('TASKS')).toBe(true);
    expect(document!.sectionIndex.has('NONEXISTENT')).toBe(false);
  });

  it('exposes tasks via the TASKS section', () => {
    const { document } = parse(EXAMPLE_FROM_SPEC);
    const tasks = document!.sectionIndex.get('TASKS')!.tasks;
    expect(tasks).toHaveLength(3);
    expect(tasks.every((t) => !t.completed)).toBe(true);
  });

  it('exposes subsections via STRUCTURE', () => {
    const { document } = parse(EXAMPLE_FROM_SPEC);
    const structure = document!.sectionIndex.get('STRUCTURE')!;
    expect(structure.subsections[0].name).toBe('System');
  });

  it('metadata fields are correct', () => {
    const { document } = parse(EXAMPLE_FROM_SPEC);
    expect(document!.metadata.title).toBe('AI Knowledge Platform');
    expect(document!.metadata.version).toBe('1.0');
    expect(document!.metadata.created).toBe('2026-03-12');
  });
});

describe('Full pipeline — error propagation', () => {
  it('returns ok=false when front-matter is completely absent', () => {
    const result = parse('# VISION\nHello world');
    expect(result.ok).toBe(false);
    expect(result.document).toBeNull();
  });

  it('returns ok=false when there are no sections', () => {
    const result = parse('---\ntitle: T\nversion: 1.0\ncreated: 2026-01-01\n---\n\nJust plain text, no sections.');
    expect(result.ok).toBe(false);
  });
});
