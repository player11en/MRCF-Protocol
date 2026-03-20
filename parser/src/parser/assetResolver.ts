import * as fs from 'fs';
import * as path from 'path';
import type { MrcfAssetReference, ValidationIssue } from '../types/index';

export interface AssetResolveResult {
  issues: ValidationIssue[];
  resolvedPaths: string[];
}

/**
 * Resolves and optionally validates asset references found in a .mrcf document.
 *
 * @param assets     All asset references extracted by the section parser.
 * @param docPath    Absolute or relative path to the .mrcf file itself.
 *                   Asset paths are resolved relative to this file's directory.
 * @param checkExists Whether to verify each asset actually exists on disk.
 *                   Defaults to true.  Set to false in unit tests / CI where
 *                   the assets directory may not be present.
 */
export function resolveAssets(
  assets: MrcfAssetReference[],
  docPath: string,
  checkExists = true,
): AssetResolveResult {
  const issues: ValidationIssue[] = [];
  const resolvedPaths: string[] = [];
  const docDir = path.dirname(path.resolve(docPath));

  for (const asset of assets) {
    // External URLs are not validated — spec §18
    if (/^https?:\/\//i.test(asset.path)) {
      resolvedPaths.push(asset.path);
      continue;
    }

    // Prevent path traversal outside the document directory
    const resolved = path.resolve(docDir, asset.path);
    if (!resolved.startsWith(docDir)) {
      issues.push({
        severity: 'error',
        code: 'ASSET_PATH_TRAVERSAL',
        message: `Asset path "${asset.path}" escapes the document directory`,
        line: asset.lineNumber,
      });
      continue;
    }

    resolvedPaths.push(resolved);

    if (checkExists && !fs.existsSync(resolved)) {
      issues.push({
        severity: 'warning',
        code: 'ASSET_NOT_FOUND',
        message: `Asset file not found: "${asset.path}"`,
        line: asset.lineNumber,
      });
    }
  }

  return { issues, resolvedPaths };
}
