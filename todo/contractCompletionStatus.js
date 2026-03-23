/**
 * Adds a status bar item that shows the completion percentage of tasks in a contract markdown file.
 * This is separate from the file decoration to keep concerns isolated and avoid performance issues.
 * The main idea is to parse the markdown content for TODO/FIXME items, determine completion percentage,
 * and then show that percentage in the status bar when a contract file is active. It also updates in real-time as you edit.
 * @path todo/contractCompletionStatus.js
 */
const vscode = require("vscode");

function isContractMarkdownDoc(doc) {
    if (!doc) return false;
    if (doc.languageId !== "markdown") return false;
    if (doc.uri.scheme !== "file") return false;
    const base = (doc.uri.path.split("/").pop() || "").toLowerCase();
    return base.includes("daily contract") || base.includes("weekly contract");
}

function countTasksFromText(content) {
    const TODO_REGEX = /(?:(-\s*\[\s*\]\s*)\s*(TODO|FIXME|BUG)\s*|\b(TODO|FIXME|BUG)\s*\[\s*\])/gi;
    // const TODO_REGEX = /(\b(?:-\s*\[\s*\]\s*)?\b(?:TODO|FIXME)\s*|\b(?:TODO|FIXME)\s*\[\s*\])/gi;
    const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\])/gi;
    // const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\b)/gi;

    const completed = typeof content === "string" ? [...content.matchAll(TODO_COMPLETE_REGEX)].length : 0;
    const incomplete = typeof content === "string" ? [...content.matchAll(TODO_REGEX)].length : 0;
    const total = completed + incomplete;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, incomplete, pct };
}

function getColorId(pct, total) {
    if (total === 0) return "charts.blue";
    if (pct >= 85) return "charts.green";
    if (pct >= 60) return "charts.yellow";
    if (pct >= 35) return "charts.orange";
    return "charts.red";
}

function registerContractCompletionStatus(context) {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
    item.name = "Contract Completion";
    context.subscriptions.push(item);

    const timers = new Map();
    function debounce(key, fn, ms = 200) {
        clearTimeout(timers.get(key));
        timers.set(key, setTimeout(() => {
            timers.delete(key);
            fn();
        }, ms));
    }

    function refresh() {
        const editor = vscode.window.activeTextEditor;
        const doc = editor.document;
        if (!doc) return;

        if (!isContractMarkdownDoc(doc)) {
            item.hide();
            return;
        }

        const { pct, completed, total } = countTasksFromText(doc.getText());
        item.text = `$(checklist) Contract ${pct}%`;
        item.tooltip = `Completion: ${pct}% (${completed}/${total})`;
        item.color = new vscode.ThemeColor(getColorId(pct, total));

        // Optional: click to regenerate summary
        item.command = "colemenutils.dailyContractGenerateSummary";

        item.show();
    }

    refresh();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => refresh()),
        vscode.workspace.onDidSaveTextDocument((doc) => {
            const active = vscode.window.activeTextEditor.document;
            if (!active) return;
            if (active && doc.uri.toString() === active.uri.toString()) refresh();
        }),
        vscode.workspace.onDidChangeTextDocument((e) => {
            const active = vscode.window.activeTextEditor.document;
            if (!active) return;
            if (active && e.document.uri.toString() === active.uri.toString()) {
                debounce(e.document.uri.toString(), refresh, 200);
            }
        })
    );
}

module.exports = { registerContractCompletionStatus };