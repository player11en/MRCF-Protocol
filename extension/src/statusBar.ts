/**
 * MRCF status bar: show section count (e.g. 5/5 or 3/5 missing STRUCTURE, PLAN); click opens Go to Section.
 */

import * as vscode from 'vscode';

import { getSections, getRequiredSectionNames } from './mrcfParse';

function getLevel1Names(sections: ReturnType<typeof getSections>): Set<string> {
  return new Set(sections.filter((s) => s.level === 1).map((s) => s.name));
}

export function registerStatusBar(context: vscode.ExtensionContext): void {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  const update = (): void => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'mrcf') {
      item.hide();
      return;
    }
    const sections = getSections(editor.document);
    const present = getLevel1Names(sections);
    const required = getRequiredSectionNames();
    const count = required.filter((name) => present.has(name)).length;
    const total = required.length;
    const missing = required.filter((name) => !present.has(name));
    if (missing.length > 0) {
      item.text = `MRCF: ${count}/${total} (${missing.join(', ')} missing)`;
    } else {
      item.text = `MRCF: ${count}/${total} sections`;
    }
    item.tooltip = missing.length > 0 ? `Missing: ${missing.join(', ')}. Click to go to a section.` : 'Click to go to a section.';
    item.command = 'mrcf.goToSection';
    item.show();
  };

  context.subscriptions.push(item);

  vscode.window.onDidChangeActiveTextEditor(update);
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (vscode.window.activeTextEditor?.document === e.document) {
      update();
    }
  });

  update();
}
