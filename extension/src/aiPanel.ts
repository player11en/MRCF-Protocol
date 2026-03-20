/**
 * MRCF AI panel: Webview view with section selection, presets, prompt, and result.
 */

import * as vscode from 'vscode';

import { getSectionContents, getRequiredSectionNames } from './mrcfParse';
import { getAiService } from './aiService';

const VIEW_ID = 'mrcf.ai';

interface AiPreset {
  id: string;
  label: string;
  defaultSections: string[]; // section names
  promptTemplate: string; // user-visible template
}

const PRESETS: AiPreset[] = [
  {
    id: 'plan-from-vision',
    label: 'Generate PLAN from VISION',
    defaultSections: ['VISION', 'CONTEXT'],
    promptTemplate:
      'Generate a PLAN section for this project based on the following VISION and CONTEXT.',
  },
  {
    id: 'tasks-from-plan',
    label: 'Generate TASKS from PLAN',
    defaultSections: ['PLAN'],
    promptTemplate:
      'Generate a TASKS section (checklist style) based on the following PLAN.',
  },
  {
    id: 'analyze-document',
    label: 'Analyze document',
    defaultSections: [],
    promptTemplate:
      'Analyze this MRCF document and suggest missing sections, inconsistencies, or improvements.',
  },
  {
    id: 'custom',
    label: 'Custom',
    defaultSections: [],
    promptTemplate: '',
  },
];

export function registerAiPanel(context: vscode.ExtensionContext): void {
  const provider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView: vscode.WebviewView): void {
      webviewView.webview.options = {
        enableScripts: true,
      };

      const update = () => {
        const editor = vscode.window.activeTextEditor;
        const hasKdoc = !!editor && editor.document.languageId === 'mrcf';
        const sections = hasKdoc ? getSectionContents(editor!.document) : [];
        const required = getRequiredSectionNames();
        webviewView.webview.postMessage({
          type: 'init',
          hasKdoc,
          sections: sections.map((s) => s.name),
          required,
          presets: PRESETS,
        });
      };

      webviewView.webview.onDidReceiveMessage(async (msg) => {
        if (msg.type === 'requestInit') {
          update();
          return;
        }

        if (msg.type === 'send') {
          const editor = vscode.window.activeTextEditor;
          if (!editor || editor.document.languageId !== 'mrcf') {
            webviewView.webview.postMessage({
              type: 'error',
              message: 'Open a .mrcf file to use MRCF AI.',
            });
            return;
          }
          const allSections = getSectionContents(editor.document);
          const selectedNames: string[] = msg.sections;
          const fullDocument: boolean = msg.fullDocument;
          const presetId: string | undefined = msg.presetId || undefined;
          const userPrompt: string = msg.prompt ?? '';

          let contextText = '';
          if (fullDocument || selectedNames.length === 0) {
            contextText = allSections
              .map((s) => `# ${s.name}\n\n${s.content}`)
              .join('\n\n');
          } else {
            const selected = allSections.filter((s) => selectedNames.includes(s.name));
            contextText = selected
              .map((s) => `# ${s.name}\n\n${s.content}`)
              .join('\n\n');
          }

          const service = getAiService();
          webviewView.webview.postMessage({ type: 'running' });
          try {
            const response = await service.sendPrompt(contextText, userPrompt, presetId);
            webviewView.webview.postMessage({
              type: 'result',
              response,
            });
          } catch (err) {
            webviewView.webview.postMessage({
              type: 'error',
              message: err instanceof Error ? err.message : String(err),
            });
          }
        }
      });

      webviewView.webview.html = getHtml(webviewView.webview);

      // Initial state
      update();

      vscode.window.onDidChangeActiveTextEditor(() => update());
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (vscode.window.activeTextEditor?.document === e.document) {
          update();
        }
      });
    },
  };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider)
  );
}

function getHtml(webview: vscode.Webview): string {
  const nonce = String(Date.now());

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MRCF AI</title>
    <style>
      body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
        margin: 0;
        padding: 8px;
      }
      .row { margin-bottom: 8px; }
      select, textarea, button, input[type="checkbox"] {
        font-family: inherit;
        font-size: inherit;
      }
      textarea {
        width: 100%;
        min-height: 80px;
        box-sizing: border-box;
        resize: vertical;
      }
      #result {
        white-space: pre-wrap;
        border: 1px solid var(--vscode-editorWidget-border);
        padding: 6px;
        margin-top: 4px;
        max-height: 240px;
        overflow-y: auto;
      }
      #status {
        font-size: 0.85em;
        opacity: 0.8;
      }
    </style>
  </head>
  <body>
    <div id="status" class="row">Loading…</div>
    <div class="row">
      <label for="preset">Preset:</label>
      <select id="preset"></select>
    </div>
    <div class="row">
      <label>Sections:</label><br />
      <label><input type="checkbox" id="fullDocument" /> Full document</label>
      <div id="sections"></div>
    </div>
    <div class="row">
      <label for="prompt">Prompt:</label><br />
      <textarea id="prompt" placeholder="Ask MRCF AI…"></textarea>
    </div>
    <div class="row">
      <button id="send">Send</button>
    </div>
    <div class="row">
      <strong>Result</strong>
      <div id="result"></div>
    </div>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();

      const state = {
        hasKdoc: false,
        sections: [],
        presets: [],
      };

      const statusEl = document.getElementById('status');
      const presetEl = document.getElementById('preset');
      const sectionsEl = document.getElementById('sections');
      const fullDocumentEl = document.getElementById('fullDocument');
      const promptEl = document.getElementById('prompt');
      const sendEl = document.getElementById('send');
      const resultEl = document.getElementById('result');

      function setStatus(text) {
        statusEl.textContent = text;
      }

      function renderSections() {
        sectionsEl.innerHTML = '';
        if (!state.hasKdoc) {
          setStatus('Open a .mrcf file to use MRCF AI.');
          sendEl.disabled = true;
          return;
        }
        setStatus('MRCF AI ready.');
        sendEl.disabled = false;
        state.sections.forEach((name) => {
          const id = 'section-' + name;
          const label = document.createElement('label');
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = id;
          cb.value = name;
          label.appendChild(cb);
          label.appendChild(document.createTextNode(' ' + name));
          sectionsEl.appendChild(label);
          sectionsEl.appendChild(document.createElement('br'));
        });
      }

      function renderPresets() {
        presetEl.innerHTML = '';
        state.presets.forEach((p) => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.label;
          presetEl.appendChild(opt);
        });
      }

      presetEl.addEventListener('change', () => {
        const id = presetEl.value;
        const preset = state.presets.find((p) => p.id === id);
        if (!preset) return;
        promptEl.value = preset.promptTemplate || '';
        // auto-select sections for non-custom presets
        if (id !== 'custom') {
          fullDocumentEl.checked = false;
          const boxes = sectionsEl.querySelectorAll('input[type=checkbox]');
          boxes.forEach((cb) => {
            cb.checked = preset.defaultSections.includes(cb.value);
          });
        }
      });

      sendEl.addEventListener('click', () => {
        const id = presetEl.value || 'custom';
        const boxes = sectionsEl.querySelectorAll('input[type=checkbox]');
        const selected = [];
        boxes.forEach((cb) => {
          if (cb.checked) selected.push(cb.value);
        });
        vscode.postMessage({
          type: 'send',
          presetId: id,
          sections: selected,
          fullDocument: fullDocumentEl.checked,
          prompt: promptEl.value,
        });
      });

      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'init') {
          state.hasKdoc = msg.hasKdoc;
          state.sections = msg.sections || [];
          state.presets = msg.presets || [];
          renderPresets();
          renderSections();
        } else if (msg.type === 'running') {
          setStatus('Running…');
        } else if (msg.type === 'result') {
          setStatus('Done.');
          resultEl.textContent = msg.response || '';
        } else if (msg.type === 'error') {
          setStatus('Error: ' + (msg.message || 'Unknown error'));
        }
      });

      vscode.postMessage({ type: 'requestInit' });
    </script>
  </body>
</html>`;
}

