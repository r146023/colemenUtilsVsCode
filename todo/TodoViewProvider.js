// path: todo/TodoViewProvider.js
"use strict";

const vscode = require("vscode");
const { DEFAULT_OPTIONS, debounce, scanWorkspaceTodos, buildTodoPayload, buildHtml } = require("./TodoCore");


const VIEW_ID = "myext-todos-view"; // MUST match package.json contributes.views[].id


class TodoViewProvider {
  /**
   * @param {vscode.ExtensionContext} context
   * @param {object} options
   */
  constructor(context, options = {}) {
    this.context = context;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.view = null;
    this.disposables = [];

    this.autoRefreshKey = "todoView.autoRefreshOnSave";
    const stored = context.workspaceState.get(this.autoRefreshKey);
    this.autoRefreshOnSave = typeof stored === "boolean" ? stored : true;

    this._refreshDebounced = debounce(() => {
      if (this.view) this.refresh();
    }, 250);

    this._saveListenerDisposable = null;
    this._applySaveListener();
  }

  dispose() {
    if (this._saveListenerDisposable) {
      this._saveListenerDisposable.dispose();
      this._saveListenerDisposable = null;
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  _applySaveListener() {
    if (this._saveListenerDisposable) {
      this._saveListenerDisposable.dispose();
      this._saveListenerDisposable = null;
    }
    if (!this.autoRefreshOnSave) return;

    this._saveListenerDisposable = vscode.workspace.onDidSaveTextDocument(() => {
      if (this.view) this._refreshDebounced();
    });

    this.disposables.push(this._saveListenerDisposable);
  }

  /**
   * Called by VS Code when the sidebar view is first shown.
   * @param {vscode.WebviewView} webviewView
   */
  resolveWebviewView(webviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = buildHtml(webviewView.webview);

    webviewView.onDidDispose(() => {
      this.view = null;
    });

    webviewView.webview.onDidReceiveMessage(
      async (msg) => {
        if (!msg || typeof msg !== "object") return;

        if (msg.type === "ready") {
          this._postSettings();
          await this.refresh();
          return;
        }

        if (msg.type === "refresh") {
          await this.refresh();
          return;
        }

        if (msg.type === "toggleAutoRefresh") {
          const next = !!(msg.payload && msg.payload.enabled);
          this.autoRefreshOnSave = next;
          await this.context.workspaceState.update(this.autoRefreshKey, next);
          this._applySaveListener();
          this._postSettings();
          return;
        }

        if (msg.type === "open") {
          await this.openTodo(msg.payload);
          return;
        }
      },
      null,
      this.disposables
    );
  }

  _postSettings() {
    if (!this.view) return;
    this.view.webview.postMessage({
      type: "settings",
      payload: { autoRefreshOnSave: this.autoRefreshOnSave },
    });
  }

  async refresh() {
    if (!this.view) return;

    const todos = await scanWorkspaceTodos(this.options);
    const payload = buildTodoPayload(todos);

    this.view.webview.postMessage({ type: "data", payload });
  }

  async openTodo(payload) {
    if (!payload || !payload.uri) return;

    const uri = vscode.Uri.parse(payload.uri);
    const line = Math.max(0, (payload.line || 1) - 1);
    const col = Math.max(0, payload.col || 0);

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Active,
      preserveFocus: false,
      preview: true,
    });

    const pos = new vscode.Position(line, col);
    const range = new vscode.Range(pos, pos);

    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

    // brief highlight flash
    const deco = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: "rgba(255, 215, 0, 0.18)",
    });

    editor.setDecorations(deco, [
      new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 100000)),
    ]);
    setTimeout(() => deco.dispose(), 650);
  }
}

// module.exports = { TodoViewProvider };
function registerTodoViewProvider(context) {
    console.log("[colemenutils] registering todo view provider:", VIEW_ID);
    vscode.window.showInformationMessage("Todo view provider registered");
    const provider = new TodoViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            VIEW_ID,
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true }
            }
        )
    );
}

module.exports = { registerTodoViewProvider };
