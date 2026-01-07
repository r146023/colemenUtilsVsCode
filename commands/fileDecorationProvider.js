const vscode = require('vscode');

class ColemenFileDecorationProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChange.event;
        this._dirty = new Set(); // URIs of documents currently modified (unsaved/edited)

        // track editors/doc changes
        vscode.workspace.onDidChangeTextDocument(e => {
            this._dirty.add(e.document.uri.toString());
            this._fire(e.document.uri);
        }, this);

        vscode.workspace.onDidSaveTextDocument(doc => {
            this._dirty.delete(doc.uri.toString());
            this._fire(doc.uri);
        }, this);

        vscode.workspace.onDidCloseTextDocument(doc => {
            this._dirty.delete(doc.uri.toString());
            this._fire(doc.uri);
        }, this);

        // listen to diagnostics changes
        vscode.languages.onDidChangeDiagnostics(e => {
            for (const uri of e.uris) this._fire(uri);
        }, this);
    }

    _fire(uri) {
        // request refresh for that single uri (provider consumers will re-query)
        this._onDidChange.fire(uri);
    }

    provideFileDecoration(uri) {
        try {
            const uriStr = uri.toString();

            // decide "modified" — here: unsaved changes in editor / tracked by _dirty
            const modified = this._dirty.has(uriStr);

            // decide "has errors" — check diagnostics for that file
            const diags = vscode.languages.getDiagnostics(uri);
            const hasError = diags.some(d => d.severity === vscode.DiagnosticSeverity.Error);

            if (modified && hasError) {
                return new vscode.FileDecoration(
                    undefined, // no badge
                    'Modified and has errors',
                    new vscode.ThemeColor('colemenutils.fileDecoration.modifiedError') // custom theme color id
                );
            } else if (hasError) {
                return new vscode.FileDecoration(
                    undefined,
                    'Has errors',
                    '#ff00dd'
                    // new vscode.ThemeColor('colemenutils.fileDecoration.error') // custom theme color id
                    // new vscode.ThemeColor('problemsErrorIcon.foreground') // use existing theme color id
                );
            } else if (modified) {
                return new vscode.FileDecoration(
                    undefined,
                    'Modified',
                    new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')
                );
            }
            return undefined;
        } catch (err) {
            console.error('FileDecorationProvider error', err);
            return undefined;
        }
    }

    dispose() {
        this._onDidChange.dispose();
    }
}


function registerFileDecorations(context) {
    // Register the file decoration provider
    const provider = new ColemenFileDecorationProvider();
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider));
}

module.exports = { registerFileDecorations };