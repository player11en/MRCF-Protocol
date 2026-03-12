/**
 * KDOC Tasks view: lists tasks with All / Open / Completed filters.
 */

import * as vscode from 'vscode';

import { getTasks, type MrcfTaskInfo } from './mrcfParse';

type TaskFilter = 'all' | 'open' | 'done';

interface TaskNode {
  label: string;
  completed: boolean;
  lineIndex: number;
  uri?: vscode.Uri;
}

function filterTasks(tasks: MrcfTaskInfo[], filter: TaskFilter): MrcfTaskInfo[] {
  if (filter === 'open') return tasks.filter((t) => !t.completed);
  if (filter === 'done') return tasks.filter((t) => t.completed);
  return tasks;
}

const VIEW_ID = 'mrcf.tasks';

export function registerTasksView(context: vscode.ExtensionContext): void {
  let currentFilter: TaskFilter = 'all';

  const provider = new (class implements vscode.TreeDataProvider<TaskNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TaskNode | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getTreeItem(element: TaskNode): vscode.TreeItem {
      const item = new vscode.TreeItem(element.label);
      item.description = element.completed ? 'done' : 'open';
      if (element.uri) {
        item.command = {
          command: 'mrcf.revealSection',
          title: 'Go to Task',
          arguments: [
            element.uri,
            new vscode.Range(
              new vscode.Position(element.lineIndex, 0),
              new vscode.Position(element.lineIndex, 0)
            ),
          ],
        };
      }
      item.contextValue = element.completed ? 'taskDone' : 'taskOpen';
      return item;
    }

    getChildren(_element?: TaskNode): TaskNode[] {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'mrcf') {
        return [];
      }
      const all = getTasks(editor.document);
      const filtered = filterTasks(all, currentFilter);
      return filtered.map((t) => ({
        label: t.text,
        completed: t.completed,
        lineIndex: t.lineIndex,
        uri: editor.document.uri,
      }));
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

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(VIEW_ID, provider),
    vscode.commands.registerCommand('mrcf.tasks.filterAll', () => {
      currentFilter = 'all';
      refresh();
    }),
    vscode.commands.registerCommand('mrcf.tasks.filterOpen', () => {
      currentFilter = 'open';
      refresh();
    }),
    vscode.commands.registerCommand('mrcf.tasks.filterDone', () => {
      currentFilter = 'done';
      refresh();
    })
  );
}

