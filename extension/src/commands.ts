/**
 * KDOC commands: reveal section, go to next/previous section, go to section (QuickPick).
 */

import * as vscode from 'vscode';

import { getSections, getTasks, getRequiredSectionNames, type MrcfSectionInfo } from './mrcfParse';

function getLevel1Sections(sections: MrcfSectionInfo[]): MrcfSectionInfo[] {
  return sections.filter((s) => s.level === 1);
}

function isTaskLine(document: vscode.TextDocument, line: number): boolean {
  const tasks = getTasks(document);
  return tasks.some((t) => t.lineIndex === line);
}

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'mrcf.revealSection',
      async (uriArg: vscode.Uri | string, rangeArg: vscode.Range | { start: { line: number; character: number }; end: { line: number; character: number } }) => {
        const uri = typeof uriArg === 'string' ? vscode.Uri.parse(uriArg) : uriArg;
        const range =
          rangeArg instanceof vscode.Range
            ? rangeArg
            : new vscode.Range(
                new vscode.Position(rangeArg.start.line, rangeArg.start.character),
                new vscode.Position(rangeArg.end.line, rangeArg.end.character)
              );
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(range.start, range.start);
      }
    )
  );

  // Toggle current task checkbox [-] <-> [x]
  context.subscriptions.push(
    vscode.commands.registerCommand('mrcf.toggleTask', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'mrcf') return;
      const lineNumber = editor.selection.active.line;
      if (!isTaskLine(editor.document, lineNumber)) return;

      const line = editor.document.lineAt(lineNumber);
      const text = line.text;
      const toggled = text.replace(/\[(x| )\]/i, (match) => {
        const c = match.toLowerCase();
        return c === '[x]' ? '[ ]' : '[x]';
      });
      if (toggled === text) return;

      await editor.edit((editBuilder) => {
        editBuilder.replace(line.range, toggled);
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mrcf.goToNextSection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'mrcf') return;
      const sections = getLevel1Sections(getSections(editor.document));
      if (sections.length === 0) return;
      const cursor = editor.selection.active;
          let next: MrcfSectionInfo | undefined;
          for (const s of sections) {
            if (s.range.start.isAfter(cursor)) {
              next = s;
              break;
            }
          }
          if (next) {
            editor.revealRange(next.range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(next.range.start, next.range.start);
          }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mrcf.goToPreviousSection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'mrcf') return;
      const sections = getLevel1Sections(getSections(editor.document));
      if (sections.length === 0) return;
      const cursor = editor.selection.active;
          let prev: MrcfSectionInfo | undefined;
          for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].range.start.isBefore(cursor)) {
              prev = sections[i];
              break;
            }
          }
          if (prev) {
            editor.revealRange(prev.range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(prev.range.start, prev.range.start);
          }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mrcf.goToSection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'mrcf') return;
      const sections = getLevel1Sections(getSections(editor.document));
      if (sections.length === 0) {
        void vscode.window.showInformationMessage('No sections found in this document.');
        return;
      }
      const chosen = await vscode.window.showQuickPick(
        sections.map((s) => ({ label: s.name, section: s })),
        { placeHolder: 'Go to section…', matchOnDescription: true }
      );
      if (chosen) {
        editor.revealRange(chosen.section.range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(chosen.section.range.start, chosen.section.range.start);
      }
    })
  );
}
