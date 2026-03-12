import type { MrcfDocument, ParseResult } from '../types/index';
import { parseMetadata } from './metadataParser';
import { parseSections } from './sectionParser';

/**
 * Parses a raw .mrcf file string into a MrcfDocument.
 *
 * Returns a ParseResult that always has an `ok` flag and an `errors` array.
 * When `ok` is true, `document` is guaranteed to be non-null.
 */
export function parse(source: string): ParseResult {
  const lines = source.split('\n');
  const { metadata, linesConsumed, errors: metaErrors } = parseMetadata(lines);

  if (metaErrors.length > 0 || metadata === null) {
    return { document: null, errors: metaErrors, ok: false };
  }

  const bodyLines = lines.slice(linesConsumed);
  const { sections, allAssets } = parseSections(bodyLines, linesConsumed + 1);

  if (sections.length === 0) {
    return {
      document: null,
      errors: [
        {
          type: 'no_sections',
          message: 'Document contains no sections',
        },
      ],
      ok: false,
    };
  }

  const sectionIndex = new Map(sections.map((s) => [s.name, s]));

  const document: MrcfDocument = {
    metadata,
    sections,
    assets: allAssets,
    sectionIndex,
  };

  return { document, errors: [], ok: true };
}
