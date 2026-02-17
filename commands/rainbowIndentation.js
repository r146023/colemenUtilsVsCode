const vscode = require("vscode");
const { getConfigValue } = require("../helpers/configHelpers");

/**
 * Activation entry
 */
function activateIndentRainbow(context) {
    const decorator = new IndentRainbowDecorator();
    context.subscriptions.push(decorator);

    decorator.refresh();

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => decorator.onDidChangeTextDocument(e))
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => decorator.refresh())
    );

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorVisibleRanges((e) => decorator.onDidChangeVisibleRanges(e))
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(() => decorator.refresh())
    );
}

function deactivateIndentRainbow() {}

class IndentRainbowDecorator {
    constructor() {
        this.disposed = false;

        this.pendingTimer = undefined;
        this.pendingEditorKey = undefined;

        this.decorationTypes = [];
        this._configCache = null;
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;

        if (this.pendingTimer) clearTimeout(this.pendingTimer);
        this.disposeDecorationTypes();
    }

    onDidChangeTextDocument(e) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        if (e.document !== editor.document) return;

        this.refreshDebounced(editor);
    }

    onDidChangeVisibleRanges(e) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        if (e.textEditor !== editor) return;

        this.refreshDebounced(editor);
    }

    refresh() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        this.ensureConfigUpToDate(editor);
        this.applyToEditor(editor);
    }

    refreshDebounced(editor, delayMs = 30) {
        if (this.disposed) return;

        const key = editor.document.uri.toString();
        this.pendingEditorKey = key;

        if (this.pendingTimer) clearTimeout(this.pendingTimer);

        this.pendingTimer = setTimeout(() => {
            this.pendingTimer = undefined;

            const current = vscode.window.activeTextEditor;
            if (!current) return;
            if (current.document.uri.toString() !== this.pendingEditorKey) return;

            this.ensureConfigUpToDate(current);
            this.applyToEditor(current);
        }, delayMs);
    }

    ensureConfigUpToDate(editor) {
        const enabled = !!getConfigValue("indentRainbowEnabled", true);
        const style = getConfigValue("indentRainbowStyle", "background"); // "background" | "border"
        const ignoreEmptyLines = !!getConfigValue("indentRainbowIgnoreEmptyLines", true);
        const maxDepth = clampInt(getConfigValue("indentRainbowMaxDepth", 24), 1, 200);
        const useVisibleOnly = !!getConfigValue("indentRainbowUseVisibleRangesOnly", true);
        const defaultColors = getConfigValue("indentRainbowPalette", [
            "#b700ff0d",
            "#00a2ff22",
            "#15ff000d",
            "#ffee0022",
            "#ff7b000d",
            "#ff000033",
        ]);

        // Default palette that looks decent on most themes (transparent-ish backgrounds).
        // const defaultColors = [
        //     "#b700ff0d",
        //     "#00a2ff22",
        //     "#15ff000d",
        //     "#ffee0022",
        //     "#ff7b000d",
        //     "#ff000033",
        // ];

        const colorsRaw = getConfigValue("indentRainbowColors", defaultColors);
        const colors = Array.isArray(colorsRaw) && colorsRaw.length > 0 ? colorsRaw : defaultColors;

        const config = { enabled, style, ignoreEmptyLines, maxDepth, useVisibleOnly, colors };

        const changed = !this._configCache || !shallowEqualConfig(this._configCache, config);
        if (!changed) return;

        this._configCache = config;

        // rebuild decorators
        this.disposeDecorationTypes();

        if (!enabled) return;

        this.decorationTypes = colors.map((c) => {
            const color = normalizeColor(c);
            if (style === "border") {
                return vscode.window.createTextEditorDecorationType({
                    borderStyle: "solid",
                    borderWidth: "0 0 0 2px",
                    borderColor: color,
                    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
                });
            }

            // default: background
            return vscode.window.createTextEditorDecorationType({
                backgroundColor: color,
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            });
        });
    }

    disposeDecorationTypes() {
        for (const t of this.decorationTypes) {
            try { t.dispose(); } catch (e) {}
        }
        this.decorationTypes = [];
    }

    applyToEditor(editor) {
        const cfg = this._configCache;
        if (!cfg || !cfg.enabled) {
            // clear any old decorations just in case
            for (const t of this.decorationTypes) editor.setDecorations(t, []);
            return;
        }

        const doc = editor.document;

        // tabSize and insertSpaces affect how indentation “depth” should be interpreted
        const tabSize = getEditorTabSize(editor);
        const indentSize = tabSize; // indent-rainbow typically uses tabSize-like steps

        const rangesByColorIndex = Array.from({ length: this.decorationTypes.length }, () => []);

        const targetRanges = cfg.useVisibleOnly ? editor.visibleRanges : [new vscode.Range(0, 0, doc.lineCount - 1, 0)];

        // Build ranges only for targeted lines (visible recommended)
        const seenLines = new Set();
        for (const vr of targetRanges) {
            const startLine = Math.max(0, vr.start.line);
            const endLine = Math.min(doc.lineCount - 1, vr.end.line);

            for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
                if (seenLines.has(lineNum)) continue;
                seenLines.add(lineNum);

                const line = doc.lineAt(lineNum);
                const text = line.text;

                // Optionally ignore blank/whitespace-only lines
                if (cfg.ignoreEmptyLines && text.trim().length === 0) continue;

                const segments = computeIndentSegments(text, indentSize, tabSize, cfg.maxDepth);
                if (segments.length === 0) continue;

                for (let depth = 0; depth < segments.length; depth++) {
                    const seg = segments[depth];
                    const colorIndex = depth % this.decorationTypes.length;

                    // Whole segment range in the line
                    const start = line.range.start.translate(0, seg.startChar);
                    const end = line.range.start.translate(0, seg.endChar);

                    if (start.isBefore(end)) {
                        rangesByColorIndex[colorIndex].push(new vscode.Range(start, end));
                    }
                }
            }
        }

        // Apply all in one shot per decoration type
        for (let i = 0; i < this.decorationTypes.length; i++) {
            editor.setDecorations(this.decorationTypes[i], rangesByColorIndex[i]);
        }
    }
}

/**
 * Compute indent segments for a line.
 * Each segment represents one indentation "block" (indentSize columns), tab-aware.
 *
 * Returns: [{ startChar, endChar }, ...] where char indexes are within the line.
 */
function computeIndentSegments(lineText, indentSize, tabSize, maxDepth) {
    let col = 0;
    let i = 0;

    // Walk leading whitespace only
    while (i < lineText.length) {
        const ch = lineText[i];
        if (ch === " ") {
            col += 1;
            i += 1;
            continue;
        }
        if (ch === "\t") {
            // advance to next tab stop
            const nextStop = tabSize - (col % tabSize);
            col += nextStop;
            i += 1;
            continue;
        }
        break;
    }

    if (i === 0) return [];

    // Now we have leading whitespace length in chars = i, and columns = col
    // We need to split that whitespace into indent blocks (indentSize columns each).
    // But because tabs are “fat”, we must map blocks back to char ranges.
    const segments = [];
    let depth = 0;

    // Re-walk leading whitespace and cut it into blocks by columns
    let segStartChar = 0;
    let segStartCol = 0;

    let curCol = 0;
    for (let charIndex = 0; charIndex < i; charIndex++) {
        const ch = lineText[charIndex];
        const colAdvance =
            ch === "\t" ? (tabSize - (curCol % tabSize)) :
            ch === " " ? 1 :
            0;

        const before = curCol;
        const after = curCol + colAdvance;

        // While this char crosses an indent boundary, we need to close the segment at this char boundary.
        // For simplicity/robustness, we close segments at character boundaries (not sub-char).
        // This matches the look of indentation-rainbow closely enough.
        curCol = after;

        const segTargetCol = (depth + 1) * indentSize;

        if (curCol >= segTargetCol) {
            segments.push({
                startChar: segStartChar,
                endChar: charIndex + 1,
            });

            depth += 1;
            if (depth >= maxDepth) break;

            segStartChar = charIndex + 1;
            segStartCol = segTargetCol;
        }
    }

    // If any remaining whitespace past last boundary, treat it as partial next segment
    // (only if we haven't exceeded maxDepth)
    if (depth < maxDepth && segStartChar < i) {
        segments.push({
            startChar: segStartChar,
            endChar: i,
        });
    }

    return segments;
}

function getEditorTabSize(editor) {
    // VS Code can return "auto" in some cases; normalize to a sane int
    const opt = editor.options;
    const ts = opt && typeof opt.tabSize === "number" ? opt.tabSize : 4;
    return clampInt(ts, 1, 16);
}

function clampInt(v, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.trunc(n)));
}

function shallowEqualConfig(a, b) {
    if (!a || !b) return false;
    if (a.enabled !== b.enabled) return false;
    if (a.style !== b.style) return false;
    if (a.ignoreEmptyLines !== b.ignoreEmptyLines) return false;
    if (a.maxDepth !== b.maxDepth) return false;
    if (a.useVisibleOnly !== b.useVisibleOnly) return false;

    // colors array shallow compare
    if (!Array.isArray(a.colors) || !Array.isArray(b.colors)) return false;
    if (a.colors.length !== b.colors.length) return false;
    for (let i = 0; i < a.colors.length; i++) {
        if (a.colors[i] !== b.colors[i]) return false;
    }
    return true;
}

/**
 * Accept:
 *  - "#rrggbb", "#rrggbbaa", "rgba(...)" etc.
 *  - "theme:<token>" -> ThemeColor(token)
 */
function normalizeColor(value) {
    if (!value || typeof value !== "string") return undefined;
    const v = value.trim();
    if (!v) return undefined;

    if (v.toLowerCase().startsWith("theme:")) {
        const token = v.slice("theme:".length).trim();
        return token ? new vscode.ThemeColor(token) : undefined;
    }

    return v;
}

module.exports = {
    activateIndentRainbow,
    deactivateIndentRainbow,
};
