import type {
  MrcfDocument,
  ValidationIssue,
  ValidationResult,
} from '../types/index';
import { STANDARD_SECTIONS, REQUIRED_SECTIONS } from '../types/index';

// ─── Individual rule runners ──────────────────────────────────────────────────

/**
 * RULE V-001: All five required sections must be present.
 * v2: VISION, CONTEXT, STRUCTURE, PLAN, TASKS are required.
 * SUMMARY, INSIGHTS, DECISIONS, REFERENCES are optional.
 */
function checkRequiredSections(doc: MrcfDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const name of REQUIRED_SECTIONS) {
    if (!doc.sectionIndex.has(name)) {
      issues.push({
        severity: 'error',
        code: 'V-001',
        message: `Required section "${name}" is missing`,
      });
    }
  }
  return issues;
}

/**
 * RULE V-002: Standard sections should appear in canonical order.
 * Spec §13 implies an ordered structure.  Out-of-order is a warning, not error.
 */
function checkSectionOrder(doc: MrcfDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const standardNames = STANDARD_SECTIONS as readonly string[];
  const foundStandard = doc.sections
    .filter((s) => s.isStandard)
    .map((s) => s.name);

  let lastIndex = -1;
  for (const name of foundStandard) {
    const idx = standardNames.indexOf(name);
    if (idx !== -1) {
      if (idx < lastIndex) {
        issues.push({
          severity: 'warning',
          code: 'V-002',
          message: `Section "${name}" appears out of canonical order (expected after "${standardNames[lastIndex]}")`,
          line: doc.sectionIndex.get(name)?.lineNumber,
        });
      }
      lastIndex = idx;
    }
  }
  return issues;
}

/**
 * RULE V-003: Metadata `version` must match `major.minor` format.
 * Spec §14: MRCF uses semantic versioning major.minor.
 */
function checkMetadataVersion(doc: MrcfDocument): ValidationIssue[] {
  const { version } = doc.metadata;
  if (!/^\d+\.\d+$/.test(version)) {
    return [
      {
        severity: 'error',
        code: 'V-003',
        message: `Metadata "version" must be in major.minor format (e.g. 1.0), got "${version}"`,
      },
    ];
  }
  return [];
}

/**
 * RULE V-004: Metadata `created` / `updated` must be ISO 8601 dates.
 */
function checkMetadataDates(doc: MrcfDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  if (!ISO_DATE_RE.test(doc.metadata.created)) {
    issues.push({
      severity: 'error',
      code: 'V-004',
      message: `Metadata "created" must be an ISO 8601 date (YYYY-MM-DD), got "${doc.metadata.created}"`,
    });
  }

  if (doc.metadata.updated && !ISO_DATE_RE.test(doc.metadata.updated)) {
    issues.push({
      severity: 'warning',
      code: 'V-004',
      message: `Metadata "updated" must be an ISO 8601 date (YYYY-MM-DD), got "${doc.metadata.updated}"`,
    });
  }

  return issues;
}

/**
 * RULE V-005: Metadata `status` must be one of the allowed values.
 */
function checkMetadataStatus(doc: MrcfDocument): ValidationIssue[] {
  const { status } = doc.metadata;
  if (status !== undefined && !['draft', 'active', 'archived'].includes(status)) {
    return [
      {
        severity: 'warning',
        code: 'V-005',
        message: `Metadata "status" must be "draft", "active", or "archived", got "${status}"`,
      },
    ];
  }
  return [];
}

/**
 * RULE V-006: TASKS section must contain at least one task item.
 * Warning only — an empty TASKS section may be intentional early in a project.
 */
function checkTasksNotEmpty(doc: MrcfDocument): ValidationIssue[] {
  const tasksSection = doc.sectionIndex.get('TASKS');
  if (tasksSection && tasksSection.tasks.length === 0) {
    return [
      {
        severity: 'warning',
        code: 'V-006',
        message: 'TASKS section contains no task items',
        line: tasksSection.lineNumber,
      },
    ];
  }
  return [];
}

/**
 * RULE V-007: Section names must be uppercase ASCII (A-Z, 0-9, underscore, space).
 * Spec §12.1: SECTION_NAME must be upper-cased.
 */
function checkSectionNameCasing(doc: MrcfDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const section of doc.sections) {
    if (!/^[A-Z][A-Z0-9_ ]*$/.test(section.name)) {
      issues.push({
        severity: 'error',
        code: 'V-007',
        message: `Section name "${section.name}" must be uppercase (A-Z, 0-9, underscore, space)`,
        line: section.lineNumber,
      });
    }
  }
  return issues;
}

/**
 * RULE V-008: REFERENCES section must only use valid relationship types.
 * Valid: derives_from | contradicts | depends_on | validates
 * (Arrow syntax without qualifier defaults to depends_on — no error.)
 */
function checkReferenceRelationships(doc: MrcfDocument): ValidationIssue[] {
  const refsSection = doc.sectionIndex.get('REFERENCES');
  if (!refsSection?.references) return [];

  const issues: ValidationIssue[] = [];
  const valid = new Set(['derives_from', 'contradicts', 'depends_on', 'validates']);

  for (const ref of refsSection.references) {
    if (!valid.has(ref.relationship)) {
      issues.push({
        severity: 'error',
        code: 'V-008',
        message: `Unknown reference relationship "${ref.relationship}". Must be derives_from | contradicts | depends_on | validates`,
        line: ref.lineNumber,
      });
    }
  }
  return issues;
}

/**
 * RULE V-009: REFERENCES must only point to IDs that exist in the document.
 * Collects all declared IDs from TASKS, INSIGHTS, DECISIONS, then validates
 * that every from/to in REFERENCES resolves to a known ID.
 */
function checkReferenceIntegrity(doc: MrcfDocument): ValidationIssue[] {
  const refsSection = doc.sectionIndex.get('REFERENCES');
  if (!refsSection?.references || refsSection.references.length === 0) return [];

  const issues: ValidationIssue[] = [];

  // Collect all declared IDs in the document
  const knownIds = new Set<string>();

  const tasksSection = doc.sectionIndex.get('TASKS');
  if (tasksSection) {
    for (const task of tasksSection.tasks) {
      if (task.id) knownIds.add(task.id);
    }
  }

  const insightsSection = doc.sectionIndex.get('INSIGHTS');
  if (insightsSection?.insights) {
    for (const insight of insightsSection.insights) {
      knownIds.add(insight.id);
    }
  }

  const decisionsSection = doc.sectionIndex.get('DECISIONS');
  if (decisionsSection?.decisions) {
    for (const decision of decisionsSection.decisions) {
      knownIds.add(decision.id);
    }
  }

  for (const ref of refsSection.references) {
    if (!knownIds.has(ref.from)) {
      issues.push({
        severity: 'warning',
        code: 'V-009',
        message: `Reference source "${ref.from}" does not match any known task, insight, or decision ID`,
        line: ref.lineNumber,
      });
    }
    if (!knownIds.has(ref.to)) {
      issues.push({
        severity: 'warning',
        code: 'V-009',
        message: `Reference target "${ref.to}" does not match any known task, insight, or decision ID`,
        line: ref.lineNumber,
      });
    }
  }

  return issues;
}

// ─── Validation Engine ────────────────────────────────────────────────────────

const RULES = [
  checkRequiredSections,
  checkSectionOrder,
  checkMetadataVersion,
  checkMetadataDates,
  checkMetadataStatus,
  checkTasksNotEmpty,
  checkSectionNameCasing,
  checkReferenceRelationships,
  checkReferenceIntegrity,
] as const;

/**
 * Runs all validation rules against a parsed MrcfDocument.
 *
 * Returns a ValidationResult with:
 * - `valid`: true only when there are zero error-severity issues
 * - `issues`: all errors and warnings from every rule
 */
export function validate(document: MrcfDocument): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const rule of RULES) {
    issues.push(...rule(document));
  }

  const valid = !issues.some((i) => i.severity === 'error');
  return { valid, issues };
}
