/**
 * MRCF Document Model
 * Defines all TypeScript interfaces representing the internal representation
 * of a parsed .mrcf file.
 */

// ─── Metadata ────────────────────────────────────────────────────────────────

export type SectionPermission = 'human-only' | 'ai-assisted' | 'ai-primary';

export interface MrcfMetadata {
  /** Document title (required) */
  title: string;
  /** Semantic version major.minor (required) */
  version: string;
  /** ISO 8601 creation date (required) */
  created: string;
  /** Author name (optional) */
  author?: string;
  /** ISO 8601 last-updated date (optional) */
  updated?: string;
  /** Arbitrary tag list (optional) */
  tags?: string[];
  /** Document lifecycle status (optional) */
  status?: 'draft' | 'active' | 'archived';
  /**
   * Optional per-section permission map used by the writeback protocol.
   * Keys are section names (e.g. "VISION", "PLAN").
   */
  sectionPermissions?: Record<string, SectionPermission>;
  /**
   * Default permission applied to sections that do not have an explicit
   * entry in `sectionPermissions`.
   */
  defaultPermission?: SectionPermission;
  /** License identifier (optional) */
  license?: string;
  /** Any additional custom metadata fields */
  [key: string]: unknown;
}

// ─── Content ─────────────────────────────────────────────────────────────────

export interface MrcfTask {
  /** Raw description text of the task */
  description: string;
  /** Whether the task has been completed */
  completed: boolean;
  /** Optional owning developer / team */
  owner?: string;
  /** Optional priority level */
  priority?: 'low' | 'medium' | 'high';
  /** Optional stable task identifier */
  id?: string;
  /** Optional list of task IDs this task depends on */
  dependsOn?: string[];
  /** Line number in the source file (1-based) */
  lineNumber?: number;
}

export interface MrcfAssetReference {
  /** Alt text / label used in the reference */
  alt: string;
  /** Relative path to the asset file */
  path: string;
  /** Line number in the source file (1-based) */
  lineNumber?: number;
}

// ─── Sections ────────────────────────────────────────────────────────────────

/** The five standard section names defined by the MRCF spec */
export type StandardSectionName =
  | 'VISION'
  | 'CONTEXT'
  | 'STRUCTURE'
  | 'PLAN'
  | 'TASKS';

export interface MrcfSection {
  /** Section name (uppercase).  Standard or custom. */
  name: string;
  /** Whether this is one of the five required standard sections */
  isStandard: boolean;
  /** Raw Markdown text body of the section */
  content: string;
  /** Nested sub-sections (## level and below) */
  subsections: MrcfSubsection[];
  /** Parsed task items (populated when name === 'TASKS') */
  tasks: MrcfTask[];
  /** Asset references found in this section */
  assets: MrcfAssetReference[];
  /** Line number where the section header was found (1-based) */
  lineNumber?: number;
  /**
   * Optional lock information when the section is currently being edited
   * by a particular actor (human or AI).
   */
  lock?: {
    actor: string;
    timestamp: string;
  };
  /**
   * Structured representation of any proposal blocks found in the section
   * content (writeback protocol).
   */
  proposals?: MrcfProposal[];
}

export interface MrcfSubsection {
  /** Sub-section heading text */
  name: string;
  /** Heading level (2 = ##, 3 = ###, …) */
  level: number;
  /** Raw Markdown content */
  content: string;
  /** Nested children */
  subsections: MrcfSubsection[];
  /** Line number (1-based) */
  lineNumber?: number;
}

export interface MrcfProposal {
  /** Opaque, stable identifier for this proposal */
  id: string;
  /** Name of the section the proposal belongs to */
  sectionName: string;
  /** Actor that created the proposal, e.g. "ai:claude" or "human:alice" */
  actor: string;
  /** ISO-8601 timestamp when the proposal was created */
  timestamp: string;
  /** Optional confidence level provided by the agent */
  confidence?: 'low' | 'medium' | 'high';
  /** Optional free-form reason or justification */
  reason?: string;
  /** Raw proposed markdown content */
  content: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface MrcfDocument {
  /** Parsed metadata from the YAML front-matter block */
  metadata: MrcfMetadata;
  /** Ordered list of sections found in the document */
  sections: MrcfSection[];
  /** All asset references found across all sections */
  assets: MrcfAssetReference[];
  /** Quick lookup index: section name → section */
  sectionIndex: Map<string, MrcfSection>;
}

// ─── Parse Result ─────────────────────────────────────────────────────────────

export interface ParseError {
  type: 'missing_metadata_field' | 'invalid_metadata' | 'no_sections' | 'parse_error';
  message: string;
  line?: number;
}

export interface ParseResult {
  document: MrcfDocument | null;
  errors: ParseError[];
  /** True when errors is empty */
  ok: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STANDARD_SECTIONS: readonly StandardSectionName[] = [
  'VISION',
  'CONTEXT',
  'STRUCTURE',
  'PLAN',
  'TASKS',
] as const;

export const REQUIRED_METADATA_FIELDS: readonly string[] = [
  'title',
  'version',
  'created',
] as const;
