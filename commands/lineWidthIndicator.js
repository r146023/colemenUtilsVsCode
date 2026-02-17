const vscode = require("vscode");
const { getConfigValue } = require("../helpers/configHelpers");

function activateLineWidthIndicator(context) {
    const lineLimit = getConfigValue("lineWidthIndicatorLength", 100);
    const LIMIT = lineLimit > 0 ? lineLimit : 100;

    const decorator = new CursorLineWidthIndicatorDecorator(LIMIT);
    context.subscriptions.push(decorator);

    // Initial
    decorator.refresh();

    // Cursor / selection changes
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection((e) => decorator.onDidChangeSelection(e))
    );

    // Text changes (line length can change under cursor / and also affects highlight)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => decorator.onDidChangeTextDocument(e))
    );

    // Editor focus changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => decorator.refresh())
    );

    // Config changes (colors, enabled flag, etc.)
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(() => decorator.refresh())
    );
}

function deactivateLineWidthIndicator() {}

class CursorLineWidthIndicatorDecorator {
    constructor(limit) {
        this.limit = limit;
        this.disposed = false;

        this.pendingTimer = undefined;
        this.pendingEditorKey = undefined;

        // Cursor-line counter decorator
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: "0 0 0 1ch",
                fontWeight: "normal",
                fontStyle: "normal",
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });

        // Whole-line highlight decorator (created lazily based on config)
        this.highlightDecorationType = undefined;
        this._highlightConfigCache = {
            enabled: undefined,
            bg: undefined,
            fg: undefined,
        };
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;

        if (this.pendingTimer) clearTimeout(this.pendingTimer);

        this.decorationType.dispose();
        if (this.highlightDecorationType) this.highlightDecorationType.dispose();
    }

    onDidChangeSelection(e) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        if (e.textEditor !== editor) return;

        this.refreshDebounced(editor);
    }

    onDidChangeTextDocument(e) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        if (e.document !== editor.document) return;

        // Typing can change both cursor-line counts and highlight state.
        this.refreshDebounced(editor);
    }

    refresh() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        this.applyToEditor(editor);
    }

    refreshDebounced(editor, delayMs = 25) {
        if (this.disposed) return;

        const key = editor.document.uri.toString();
        this.pendingEditorKey = key;

        if (this.pendingTimer) clearTimeout(this.pendingTimer);

        this.pendingTimer = setTimeout(() => {
            this.pendingTimer = undefined;

            const current = vscode.window.activeTextEditor;
            if (!current) return;
            if (current.document.uri.toString() !== this.pendingEditorKey) return;

            this.applyToEditor(current);
        }, delayMs);
    }

    applyToEditor(editor) {
        if (this.disposed) return;

        const doc = editor.document;
        const sels = editor.selections || [];

        const showTotalLength = getConfigValue("lineWidthIndicatorShowTotalLength", false);
        const showLimit = getConfigValue("lineWidthIndicatorShowLimit", 40);

        // --- NEW: Highlight config ---
        const highlightEnabled = getConfigValue("lineWidthIndicatorHighlightEnabled", false);
        const highlightBgRaw = getConfigValue("lineWidthIndicatorHighlightBackgroundColor", "#ff730022");
        const highlightFgRaw = getConfigValue("lineWidthIndicatorHighlightForegroundColor", "#ff7b00");

        this.ensureHighlightDecoratorUpToDate(highlightEnabled, highlightBgRaw, highlightFgRaw);

        // =============
        // 1) Cursor-line counters (only on lines with cursors)
        // =============

        if (sels.length === 0) {
            editor.setDecorations(this.decorationType, []);
            // Still apply/clear highlight if enabled/disabled
            this.applyHighlights(editor, doc, highlightEnabled);
            return;
        }

        const lineNums = new Set();
        for (const sel of sels) {
            const line = sel.active.line;
            if (line >= 0 && line < doc.lineCount) lineNums.add(line);
        }

        const decorations = [];
        for (const lineNum of lineNums) {
            const line = doc.lineAt(lineNum);

            const len = this.getDisplayLength(line.text);
            const remaining = this.limit - len;

            // keep your existing behavior
            const msg = showTotalLength && remaining > 0 ? String(len) : String(remaining);
            if (len <= showLimit + 1) continue;

            const pos = line.range.end;
            const range = new vscode.Range(pos, pos);

            decorations.push({
                range,
                renderOptions: {
                    after: {
                        contentText: msg,
                        color: this.pickColor(remaining),
                    },
                },
            });
        }

        editor.setDecorations(this.decorationType, decorations);

        // =============
        // 2) Whole-file highlight for exceeded lines (if enabled)
        // =============
        this.applyHighlights(editor, doc, highlightEnabled);
    }

    applyHighlights(editor, doc, highlightEnabled) {
        if (!this.highlightDecorationType) {
            // If disabled, this will be undefined; ensure we clear if needed.
            if (!highlightEnabled) return;
            // If enabled but decorator failed to create, fail safely.
            return;
        }

        if (!highlightEnabled) {
            editor.setDecorations(this.highlightDecorationType, []);
            return;
        }

        // Apply to ALL lines in the file that exceed the limit (as requested).
        const exceeded = [];
        for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
            const line = doc.lineAt(lineNum);
            const len = this.getDisplayLength(line.text);
            if (len <= this.limit) continue;

            // Whole line highlight
            exceeded.push({
                range: line.range,
                hoverMessage: `Line length ${len} exceeds limit ${this.limit}`,
            });
        }

        editor.setDecorations(this.highlightDecorationType, exceeded);
    }

    ensureHighlightDecoratorUpToDate(enabled, bgRaw, fgRaw) {
        const bg = normalizeColor(bgRaw);
        const fg = normalizeColor(fgRaw);

        const cache = this._highlightConfigCache;
        const changed =
            cache.enabled !== enabled ||
            cache.bg !== bgRaw ||
            cache.fg !== fgRaw;

        if (!changed) return;

        // Update cache
        cache.enabled = enabled;
        cache.bg = bgRaw;
        cache.fg = fgRaw;

        // Dispose old decorator
        if (this.highlightDecorationType) {
            this.highlightDecorationType.dispose();
            this.highlightDecorationType = undefined;
        }

        // If not enabled, don't keep a decorator around.
        if (!enabled) return;

        // Create new decorator with updated colors.
        this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            backgroundColor: bg,
            color: fg,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }

    getDisplayLength(text) {
        return text.length;
    }

    pickColor(remaining) {
        if (remaining < 0) return new vscode.ThemeColor("editorError.foreground");
        if (remaining <= 10) return new vscode.ThemeColor("editorWarning.foreground");
        return new vscode.ThemeColor("editorHint.foreground");
    }
}

/**
 * Accept either:
 *  - hex/rgb/rgba/css color strings: "#ff0000", "#ff000033", "rgba(255,0,0,0.2)"
 *  - theme tokens via "theme:<token>", e.g. "theme:editorError.background"
 */
function normalizeColor(value) {
    if (!value || typeof value !== "string") return undefined;
    const v = value.trim();
    if (!v) return undefined;

    if (v.toLowerCase().startsWith("theme:")) {
        const token = v.slice("theme:".length).trim();
        if (!token) return undefined;
        return new vscode.ThemeColor(token);
    }

    return v;
}

module.exports = {
    activateLineWidthIndicator,
    deactivateLineWidthIndicator,
};
