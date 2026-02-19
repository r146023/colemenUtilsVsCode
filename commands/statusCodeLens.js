const vscode = require("vscode");

/**
 * Register this in activate():
 *   activateStatusCodeLens(context)
 */
function activateStatusCodeLens(context) {
  const provider = new StatusCodeLensProvider();

  // Apply to all file languages. You can restrict if you want.
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: "file" }, provider),
    vscode.languages.registerCodeLensProvider({ scheme: "untitled" }, provider)
  );

  // Commands for the three actions
  context.subscriptions.push(
    vscode.commands.registerCommand("status.setStable", (args) => setStatusAtLine(args, "stable")),
    vscode.commands.registerCommand("status.setDevelopment", (args) => setStatusAtLine(args, "development")),
    vscode.commands.registerCommand("status.setDeprecated", (args) => setStatusAtLine(args, "deprecated"))
  );
}

/**
 * Finds & replaces the status value on a specific line.
 * args: { uri: string, line: number }
 */
async function setStatusAtLine(args, newValue) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const doc = editor.document;
  if (!args || !args.uri || typeof args.line !== "number") return;
  if (doc.uri.toString() !== String(args.uri)) return;

  const lineNum = args.line;
  if (lineNum < 0 || lineNum >= doc.lineCount) return;

  const line = doc.lineAt(lineNum);
  const text = line.text;

  // Match: " * @status xxxxx" (spaces flexible)
  // Captures prefix (up to value) and the value itself.
  const re = /^(\s*\*\s*@status\s+)(\S+)(\s*)$/;
  const m = text.match(re);
  if (!m) return;

  const prefix = m[1];
  const current = m[2];
  const suffix = m[3] || "";

  // Replace only the value range
  const valueStartChar = prefix.length;
  const valueEndChar = prefix.length + current.length;

  const range = new vscode.Range(
    new vscode.Position(lineNum, valueStartChar),
    new vscode.Position(lineNum, valueEndChar)
  );

  await editor.edit(
    (editBuilder) => editBuilder.replace(range, newValue),
    { undoStopBefore: true, undoStopAfter: true }
  );
}

class StatusCodeLensProvider {
  constructor() {
    this._onDidChangeCodeLenses = new vscode.EventEmitter();
    this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    // Refresh lenses when docs change / active editor changes
    this._subs = [
      vscode.workspace.onDidChangeTextDocument(() => this._onDidChangeCodeLenses.fire()),
      vscode.window.onDidChangeActiveTextEditor(() => this._onDidChangeCodeLenses.fire()),
    ];
  }

  dispose() {
    try { this._onDidChangeCodeLenses.dispose(); } catch(e) {}
    for (const s of this._subs) {
      try { s.dispose(); } catch(e) {}
    }
  }

  provideCodeLenses(document, token) {
    const lenses = [];

    for (let line = 0; line < document.lineCount; line++) {
      if (token.isCancellationRequested) break;

      const text = document.lineAt(line).text;

      // Search for: " * @status xxxxx" (xxxxx = any non-space token)
      if (!/^\s*\*\s*@status\s+\S+/.test(text)) continue;

      const pos = new vscode.Position(line, 0);
      const range = new vscode.Range(pos, pos);

      const args = { uri: document.uri.toString(), line };

      lenses.push(
        new vscode.CodeLens(range, {
          title: "stable",
          command: "status.setStable",
          arguments: [args],
        }),
        new vscode.CodeLens(range, {
          title: "development",
          command: "status.setDevelopment",
          arguments: [args],
        }),
        new vscode.CodeLens(range, {
          title: "deprecated",
          command: "status.setDeprecated",
          arguments: [args],
        })
      );
    }

    return lenses;
  }
}

module.exports = {
  activateStatusCodeLens,
};
