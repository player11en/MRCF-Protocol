/**
 * MRCF VS Code Extension
 * Developer 2 – Editor integration for .mrcf files.
 * Consumes parser contract from @mrcf/parser when present; uses local lightweight parse for outline/folding until then.
 */

import * as vscode from 'vscode';

import { registerCommands } from './commands';
import { registerDocumentSymbolProvider } from './documentSymbols';
import { registerFoldingRangeProvider } from './folding';
import { registerSidebarView } from './sidebarView';
import { registerStatusBar } from './statusBar';
import { registerTasksView } from './tasksView';
import { registerAiPanel } from './aiPanel';

export function activate(context: vscode.ExtensionContext): void {
  registerFoldingRangeProvider(context);
  registerDocumentSymbolProvider(context);
  registerSidebarView(context);
  registerTasksView(context);
  registerAiPanel(context);
  registerCommands(context);
  registerStatusBar(context);
}

export function deactivate(): void {}
