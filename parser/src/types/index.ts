/**
 * MRCF Document Model — v2
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
  /** Whether the task has been completed (v1 checkbox format) */
  completed: boolean;
  /** Optional owning developer / team */
  owner?: string;
  /** Optional priority level */
  priority?: 'low' | 'medium' | 'high';
  /** Optional stable task identifier */
  id?: string;
  /** Optional list of task IDs this task depends on */
  dependsOn?: string[];
  /** v2: explicit workflow status (overrides completed when present) */
  status?: 'planned' | 'in_progress' | 'done' | 'failed' | 'blocked';
  /** v2: insight IDs that relate to this task */
  relatedInsights?: string[];
  /** Line number in the source file (1-based) */
  lineNumber?: number;
}

// ─── v2 Block Types ───────────────────────────────────────────────────────────

/** A key-value snapshot of current project state (SUMMARY section) */
export interface MrcfSummaryBlock {
  /** What the team/AI is currently working on */
  currentFocus?: string;
  /** The highest-risk item right now */
  mainRisk?: string;
  /** Parts of the project considered stable */
  stableParts?: string;
  /** Any additional free-form key-value pairs */
  [key: string]: string | undefined;
}

/** Insight types: what kind of learning was captured */
export type InsightType = 'success' | 'failure' | 'observation';

/** A single learning entry in the INSIGHTS section */
export interface MrcfInsightBlock {
  /** Stable identifier, e.g. INSIGHT-1 */
  id: string;
  /** What kind of insight this is */
  type: InsightType;
  /** Human-readable description of the insight */
  description: string;
  /** Confidence in this insight (0.0–1.0) */
  confidence?: number;
  /** ID of the task or decision this insight came from */
  source?: string;
  /** Line number in source file (1-based) */
  lineNumber?: number;
}

/** Impact level of a decision */
export type DecisionImpact = 'low' | 'medium' | 'high';

/** A single architectural or product decision in the DECISIONS section */
export interface MrcfDecisionBlock {
  /** Stable identifier, e.g. DEC-1 */
  id: string;
  /** The chosen option */
  choice: string;
  /** Why this option was chosen */
  reason: string;
  /** Rejected alternatives (comma-separated or single string) */
  alternatives?: string;
  /** Impact level of this decision */
  impact?: DecisionImpact;
  /** Line number in source file (1-based) */
  lineNumber?: number;
}

/** Relationship type between two entities */
export type ReferenceRelationship =
  | 'derives_from'
  | 'contradicts'
  | 'depends_on'
  | 'validates';

/** A typed link between two IDs in the REFERENCES section */
export interface MrcfReferenceLink {
  /** Source entity ID (e.g. TASK-1) */
  from: string;
  /** Target entity ID (e.g. INSIGHT-1) */
  to: string;
  /** Relationship type. Defaults to depends_on when arrow syntax is used without qualifier */
  relationship: ReferenceRelationship;
  /** Line number in source file (1-based) */
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

/** The five required + four optional standard section names defined by MRCF v2 */
export type StandardSectionName =
  | 'SUMMARY'
  | 'VISION'
  | 'CONTEXT'
  | 'STRUCTURE'
  | 'PLAN'
  | 'TASKS'
  | 'INSIGHTS'
  | 'DECISIONS'
  | 'REFERENCES';

/** The five sections required for a valid MRCF document */
export type RequiredSectionName = 'VISION' | 'CONTEXT' | 'STRUCTURE' | 'PLAN' | 'TASKS';

export interface MrcfSection {
  /** Section name (uppercase).  Standard or custom. */
  name: string;
  /** Whether this is one of the nine standard sections (required or optional) */
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

  // ─── v2 structured blocks ─────────────────────────────────────────────────

  /** Parsed SUMMARY key-value snapshot (populated when name === 'SUMMARY') */
  summary?: MrcfSummaryBlock;
  /** Parsed INSIGHTS blocks (populated when name === 'INSIGHTS') */
  insights?: MrcfInsightBlock[];
  /** Parsed DECISIONS blocks (populated when name === 'DECISIONS') */
  decisions?: MrcfDecisionBlock[];
  /** Parsed REFERENCES links (populated when name === 'REFERENCES') */
  references?: MrcfReferenceLink[];
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

/** All nine standard section names (required + optional) in canonical order */
export const STANDARD_SECTIONS: readonly StandardSectionName[] = [
  'SUMMARY',
  'VISION',
  'CONTEXT',
  'STRUCTURE',
  'PLAN',
  'TASKS',
  'INSIGHTS',
  'DECISIONS',
  'REFERENCES',
] as const;

/** The five sections that MUST be present for a valid v2 document */
export const REQUIRED_SECTIONS: readonly RequiredSectionName[] = [
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
