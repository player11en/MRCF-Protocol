/**
 * Document symbol provider for .mrcf outline (Outline view + breadcrumbs).
 * Builds a tree from # / ## / ### section headers.
 */

import * as vscode from 'vscode';
import { getSections } from './mrcfParse';

export function registerDocumentSymbolProvider(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = { language: 'mrcf' };
  const provider = new (class implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(
      document: vscode.TextDocument,
      _token: vscode.CancellationToken
    ): vscode.DocumentSymbol[] {
      const sections = getSections(document);
      const roots: vscode.DocumentSymbol[] = [];
      const stack: { symbol: vscode.DocumentSymbol; level: number }[] = [];

      for (const s of sections) {
        const symbol = new vscode.DocumentSymbol(
          s.name,
          '',
          vscode.SymbolKind.Module,
          s.range,
          s.range
        );

        while (stack.length > 0 && stack[stack.length - 1].level >= s.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          roots.push(symbol);
          stack.push({ symbol, level: s.level });
        } else {
          stack[stack.length - 1].symbol.children.push(symbol);
          stack.push({ symbol, level: s.level });
        }
      }

      return roots;
    }
  })();

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, provider)
  );
}
