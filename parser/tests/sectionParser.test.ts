import { parseSections } from '../src/parser/sectionParser';

const FULL_BODY = `
# VISION
Build a collaborative knowledge platform.

# CONTEXT
Target users: developers.

# STRUCTURE
## System Architecture
Editor, AI Service, Document Engine.

### API Layer
REST endpoints.

# PLAN
Phase 1: Prototype.

# TASKS
- [ ] implement parser
  owner: dev1
  priority: high
- [x] define spec
- [ ] build editor
`.trimStart();

describe('parseSections', () => {
  const lines = FULL_BODY.split('\n');
  const { sections, allAssets } = parseSections(lines, 1);

  it('detects all five standard sections', () => {
    const names = sections.map((s) => s.name);
    expect(names).toContain('VISION');
    expect(names).toContain('CONTEXT');
    expect(names).toContain('STRUCTURE');
    expect(names).toContain('PLAN');
    expect(names).toContain('TASKS');
  });

  it('marks standard sections correctly', () => {
    sections.forEach((s) => {
      expect(s.isStandard).toBe(true);
    });
  });

  it('captures section content', () => {
    const vision = sections.find((s) => s.name === 'VISION')!;
    expect(vision.content).toContain('collaborative knowledge platform');
  });

  it('parses tasks in TASKS section', () => {
    const tasks = sections.find((s) => s.name === 'TASKS')!.tasks;
    expect(tasks).toHaveLength(3);
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].description).toBe('implement parser');
    expect(tasks[0].owner).toBe('dev1');
    expect(tasks[0].priority).toBe('high');
    expect(tasks[1].completed).toBe(true);
    expect(tasks[1].description).toBe('define spec');
  });

  it('parses subsections within STRUCTURE', () => {
    const structure = sections.find((s) => s.name === 'STRUCTURE')!;
    expect(structure.subsections).toHaveLength(1);
    expect(structure.subsections[0].name).toBe('System Architecture');
    expect(structure.subsections[0].level).toBe(2);
  });

  it('extracts no assets when none are present', () => {
    expect(allAssets).toHaveLength(0);
  });
});

describe('parseSections — asset extraction', () => {
  it('extracts image asset references', () => {
    const lines = [
      '# STRUCTURE',
      '![architecture](assets/architecture.png)',
      '![diagram](assets/diagram.svg)',
    ];
    const { allAssets } = parseSections(lines, 1);
    expect(allAssets).toHaveLength(2);
    expect(allAssets[0].alt).toBe('architecture');
    expect(allAssets[0].path).toBe('assets/architecture.png');
    expect(allAssets[1].path).toBe('assets/diagram.svg');
  });
});

describe('parseSections — custom sections', () => {
  it('accepts unknown section names as custom sections', () => {
    const lines = [
      '# VISION',
      'Some vision.',
      '# DECISIONS',
      'We decided to use TypeScript.',
    ];
    const { sections } = parseSections(lines, 1);
    const decisions = sections.find((s) => s.name === 'DECISIONS');
    expect(decisions).toBeDefined();
    expect(decisions!.isStandard).toBe(false);
  });
});
