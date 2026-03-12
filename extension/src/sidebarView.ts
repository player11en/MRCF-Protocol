/**
 * KDOC sidebar tree view: sections list with missing indicators; click to reveal in editor.
 */

import * as vscode from 'vscode';

import { getSections, getTasks, getRequiredSectionNames, type MrcfSectionInfo } from './mrcfParse';

const VIEW_ID = 'mrcf.sectionList';

export interface SectionNode {
  label: string;
  range?: vscode.Range;
  missing: boolean;
  uri?: vscode.Uri;
}

function getLevel1Sections(sections: MrcfSectionInfo[]): MrcfSectionInfo[] {
  return sections.filter((s) => s.level === 1);
}

function buildSectionNodes(doc: vscode.TextDocument): SectionNode[] {
  const sections = getSections(doc);
  const level1 = getLevel1Sections(sections);
  const required = getRequiredSectionNames();
  const nodes: SectionNode[] = [];
  const tasks = getTasks(doc);
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  for (const name of required) {
    const found = level1.find((s) => s.name === name);
    if (found) {
      let label = name;
      if (name === 'TASKS' && total > 0) {
        label = `${name} (${done}/${total})`;
      }
      nodes.push({ label, range: found.range, missing: false, uri: doc.uri });
    } else {
      nodes.push({ label: `${name} (missing)`, missing: true });
    }
  }

  for (const s of level1) {
    if (!required.includes(s.name as (typeof required)[number])) {
      nodes.push({ label: s.name, range: s.range, missing: false, uri: doc.uri });
    }
  }
  return nodes;
}

export function registerSidebarView(context: vscode.ExtensionContext): void {
  const provider = new (class implements vscode.TreeDataProvider<SectionNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SectionNode | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getTreeItem(element: SectionNode): vscode.TreeItem {
      const item = new vscode.TreeItem(element.label);
      if (element.missing) {
        item.description = 'missing';
      }
      if (element.range && element.uri) {
        item.command = {
          command: 'mrcf.revealSection',
          title: 'Go to Section',
          arguments: [element.uri, element.range],
        };
      }
      item.contextValue = element.missing ? 'missingSection' : 'section';
      return item;
    }

    getChildren(_element?: SectionNode): SectionNode[] {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'mrcf') {
        return [];
      }
      return buildSectionNodes(editor.document);
    }

    refresh(): void {
      this._onDidChangeTreeData.fire();
    }
  })();

  const refresh = (): void => provider.refresh();

  vscode.window.onDidChangeActiveTextEditor(refresh);
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (vscode.window.activeTextEditor?.document === e.document) {
      refresh();
    }
  });

  context.subscriptions.push(vscode.window.registerTreeDataProvider(VIEW_ID, provider));
}
