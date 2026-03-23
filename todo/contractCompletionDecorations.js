/**
 * Provides file decorations (badges/colors) on contract markdown files based on completion status.
 * This is separate from the status bar item to keep concerns isolated and avoid performance issues.
 *
 * The main idea is to parse the markdown content for TODO/FIXME items, determine completion percentage,
 * and then show a badge (e.g. "✔" for complete, "60%" for on track, etc.) on the file icon in the explorer.
 * This allows you to quickly see which contracts are complete or need attention without opening them.
 *
 * The decoration provider listens for document changes and updates the cache and decorations accordingly.
 * It uses theme colors for the badges to look good in both light/dark themes.
 *
 * @path todo/contractCompletionDecorations.js
 */
const vscode = require("vscode");

/** Match your current contract definition (markdown + filename includes daily/weekly contract) */
function isContractMarkdownDoc(doc) {
    if (!doc) return false;
    if (doc.languageId !== "markdown") return false;
    if (doc.uri.scheme !== "file") return false;

    const base = (doc.uri.path.split("/").pop() || "").toLowerCase();
    return base.includes("daily contract") || base.includes("weekly contract");
}

function isContractMarkdownUri(uri) {
    if (!uri || uri.scheme !== "file") return false;
    const base = (uri.path.split("/").pop() || "").toLowerCase();
    // We can’t know languageId from a URI, so we key off the .md suffix + name match.
    return base.endsWith(".md") && (base.includes("daily contract") || base.includes("weekly contract"));
}

/** Same counting approach you already use in dailyContractManager.js */
function countTasksFromText(content) {
    const TODO_REGEX = /(?:(-\s*\[\s*\]\s*)\s*(TODO|FIXME|BUG)\s*|\b(TODO|FIXME|BUG)\s*\[\s*\])/gi;
    const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\])/gi;
    // const TODO_REGEX = /(\b(?:-\s*\[\s*\]\s*)?\b(?:TODO|FIXME)\s*|\b(?:TODO|FIXME)\s*\[\s*\])/gi;
    // const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\b)/gi;

    const completed = typeof content === "string" ? [...content.matchAll(TODO_COMPLETE_REGEX)].length : 0;
    const incomplete = typeof content === "string" ? [...content.matchAll(TODO_REGEX)].length : 0;
    const total = completed + incomplete;

    const pct = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, incomplete, pct };
}

function getBucket(pct, total) {
    // Use theme colors so it looks good across light/dark themes.
    if (total === 0) return { colorId: "charts.blue", badge: "" };      // no tasks
    if (pct >= 85) return { colorId: "charts.green", badge: `${pct}%` };     // done
    // if (pct >= 85) return { colorId: "charts.green", badge: "✔" };     // done
    if (pct >= 60) return { colorId: "charts.yellow", badge: `${pct}%` }; // on track
    return { colorId: "charts.red", badge: `${pct}%` };                 // behind
}

class ContractCompletionDecorationProvider {
    constructor() {
        this._emitter = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._emitter.event;

        /** @type {Map<string, {pct:number,total:number,completed:number,incomplete:number}>} */
        this._cache = new Map();
    }

    invalidate(uri) {
        try {
            if (!uri) return;
            this._emitter.fire(uri);
        } catch (e) {
            // ignore
        }
    }

    updateFromDocument(doc) {
        if (!isContractMarkdownDoc(doc)) return;

        const uriStr = doc.uri.toString();
        const counts = countTasksFromText(doc.getText());
        this._cache.set(uriStr, counts);

        this.invalidate(doc.uri);
    }

    provideFileDecoration(uri) {
        if (!isContractMarkdownUri(uri)) return;

        const cached = this._cache.get(uri.toString());
        if (!cached) return;

        const { pct, total, completed } = cached;
        const { colorId, badge } = getBucket(pct, total);

        const dec = new vscode.FileDecoration(
            badge,
            `Contract completion: ${pct}% (${completed}/${total})`,
            new vscode.ThemeColor(colorId)
        );

        // Don’t color parent folders
        dec.propagate = false;

        return dec;
    }
}

function registerContractCompletionDecorations(context) {
    const provider = new ContractCompletionDecorationProvider();

    context.subscriptions.push(
        vscode.window.registerFileDecorationProvider(provider)
    );

    // Prime cache for already-open documents
    for (const doc of vscode.workspace.textDocuments) {
        provider.updateFromDocument(doc);
    }

    // Debounce updates so typing doesn’t spam decoration refresh
    const timers = new Map();
    function debounceDoc(doc, ms = 200) {
        const key = doc.uri.toString();
        clearTimeout(timers.get(key));
        timers.set(key, setTimeout(() => {
            timers.delete(key);
            provider.updateFromDocument(doc);
        }, ms));
    }

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((doc) => provider.updateFromDocument(doc)),
        vscode.workspace.onDidSaveTextDocument((doc) => provider.updateFromDocument(doc)),
        vscode.workspace.onDidChangeTextDocument((e) => {
            // only update when active doc changes; saves CPU
            const active = vscode.window.activeTextEditor.document;
            if (!active) return;
            if (active && e.document.uri.toString() === active.uri.toString()) {
                debounceDoc(e.document);
            }
        })
    );

    return provider;
}

module.exports = { registerContractCompletionDecorations };