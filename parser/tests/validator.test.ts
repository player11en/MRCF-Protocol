import { parse } from '../src/parser/index';
import { validate } from '../src/validator/index';
import type { MrcfDocument } from '../src/types/index';

const VALID_DOC = `---
title: AI Knowledge Platform
version: 1.0
created: 2026-03-12
---

# VISION
Build a platform for structured project knowledge.

# CONTEXT
Target: developers and architects.

# STRUCTURE
## Modules
Editor, Parser, Renderer.

# PLAN
Phase 1: Prototype.
Phase 2: AI Integration.

# TASKS
- [ ] implement parser
- [ ] build editor
- [x] write spec
`;

function parseValid(): MrcfDocument {
  const result = parse(VALID_DOC);
  if (!result.ok || !result.document) throw new Error('Expected valid parse: ' + JSON.stringify(result.errors));
  return result.document;
}

describe('validate — valid document', () => {
  it('reports no issues for a fully valid document', () => {
    const result = validate(parseValid());
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });
});

describe('validate — V-001 required sections', () => {
  it('errors when a required section is missing', () => {
    const source = VALID_DOC.replace('# TASKS\n- [ ] implement parser\n- [ ] build editor\n- [x] write spec\n', '');
    const parsed = parse(source);
    expect(parsed.ok).toBe(true);
    const result = validate(parsed.document!);
    const errors = result.issues.filter((i) => i.code === 'V-001');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('TASKS');
    expect(result.valid).toBe(false);
  });
});

describe('validate — V-002 section order', () => {
  it('warns when sections are out of canonical order', () => {
    const source = `---
title: T
version: 1.0
created: 2026-01-01
---

# CONTEXT
ctx

# VISION
vision

# STRUCTURE
struct

# PLAN
plan

# TASKS
- [ ] do something
`;
    const parsed = parse(source);
    const result = validate(parsed.document!);
    const warnings = result.issues.filter((i) => i.code === 'V-002');
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe('validate — V-003 version format', () => {
  it('errors on a non-semver version string', () => {
    const source = VALID_DOC.replace('version: 1.0', 'version: v1');
    const parsed = parse(source);
    const result = validate(parsed.document!);
    const errors = result.issues.filter((i) => i.code === 'V-003');
    expect(errors).toHaveLength(1);
  });
});

describe('validate — V-004 date format', () => {
  it('errors on an invalid created date', () => {
    const source = VALID_DOC.replace('created: 2026-03-12', 'created: 12/03/2026');
    const parsed = parse(source);
    const result = validate(parsed.document!);
    const errors = result.issues.filter((i) => i.code === 'V-004');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validate — V-006 empty TASKS', () => {
  it('warns when TASKS section has no task items', () => {
    const source = VALID_DOC.replace(
      '- [ ] implement parser\n- [ ] build editor\n- [x] write spec',
      'No tasks defined yet.',
    );
    const parsed = parse(source);
    const result = validate(parsed.document!);
    const warnings = result.issues.filter((i) => i.code === 'V-006');
    expect(warnings).toHaveLength(1);
    expect(result.valid).toBe(true); // warning only, not error
  });
});
