/**
 * Folding range provider for .mrcf sections.
 * Folds from each # / ## / ### header to the next same-or-higher-level header or EOF.
 */

import * as vscode from 'vscode';
import { getSections } from './mrcfParse';

export function registerFoldingRangeProvider(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = { language: 'mrcf' };
  const provider = new (class implements vscode.FoldingRangeProvider {
    provideFoldingRanges(
      document: vscode.TextDocument,
      _context: vscode.FoldingContext,
      _token: vscode.CancellationToken
    ): vscode.FoldingRange[] {
      const sections = getSections(document);
      const ranges: vscode.FoldingRange[] = [];

      for (let i = 0; i < sections.length; i++) {
        const curr = sections[i];
        const startLine = curr.range.start.line;
        let endLine = document.lineCount - 1;

        for (let j = i + 1; j < sections.length; j++) {
          if (sections[j].level <= curr.level) {
            endLine = sections[j].range.start.line - 1;
            break;
          }
        }

        if (endLine > startLine) {
          ranges.push(new vscode.FoldingRange(startLine, endLine));
        }
      }

      return ranges;
    }
  })();

  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(selector, provider)
  );
}
