const vscode = require("vscode");
const {matchCasing} = require("../helpers/editorHelpers");
const {activateLineWidthIndicator, deactivateLineWidthIndicator} = require("./lineWidthIndicator");
const {activateIndentRainbow, deactivateIndentRainbow} = require("./rainbowIndentation");
const {
    activateVscodeColorPickerDecorator,
    deactivateVscodeColorPickerDecorator
} = require("./colorPickerDecorator");
// const lineWidthActivate = require("./lineWidthIndicator")["activate"];

/**
 * UI Decorations Module for ColemenUtils
 * Handles visual enhancements and UI features
 */

/**
 * Register all UI decoration features
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerUiDecorations(context) {
    // Multi-cursor casing logic
    // context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(handleMultiCursorCasing));

    // Trailing spaces highlighting
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(highlightTrailingSpaces), vscode.workspace.onDidChangeTextDocument(highlightTrailingSpaces), vscode.window.onDidChangeTextEditorSelection(highlightTrailingSpaces), vscode.workspace.onDidChangeConfiguration(onConfigurationChanged));

    // Selected lines status bar
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateSelectedLinesStatusBar), vscode.window.onDidChangeActiveTextEditor(updateSelectedLinesStatusBar));

    // Initialize features
    highlightTrailingSpaces();
    updateSelectedLinesStatusBar();
    registerDocumentSnapshots();
    activateLineWidthIndicator(context);
    activateIndentRainbow(context);
    activateVscodeColorPickerDecorator(context);
}

/**
 * Handle multi-cursor casing logic to match casing across cursors
 */
// async function handleMultiCursorCasing(event) {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor || event.document !== editor.document) return;

//     if (editor.selections.length <= 1) return;

//     // For each change (usually one per cursor)
//     for (let i = 0; i < event.contentChanges.length; i++) {
//         const change = event.contentChanges[i];
//         const selection = editor.selections[i];
//         if (!selection) continue;

//         // Get the original text at the change location (before the change)
//         const start = change.range.start;
//         const end = change.range.end;

//         // Only process insertions (not deletions)
//         if (change.text.length === 0) continue;

//         // The text just inserted by the user
//         const insertedText = change.text;

//         // The original text that was replaced (if any)
//         const originalText = event.document.getText(new vscode.Range(start, end));

//         // Match the casing of the original text for this cursor
//         const newText = matchCasing(originalText, insertedText);

//         // If casing needs to be fixed, apply the edit
//         if (newText !== insertedText) {
//             await editor.edit(editBuilder => {
//                 editBuilder.replace(
//                     new vscode.Range(start, start.translate(0, insertedText.length)),
//                     newText
//                 );
//             }, { undoStopAfter: false, undoStopBefore: false });
//         }
//     }
// }

/**
 * Cache the *previous* text of each document so we can accurately compute
 * the replaced/original text for onDidChangeTextDocument (which fires AFTER the change).
 */
const _docSnapshots = new Map(); // key: uri.toString(), value: full text string

/**
 * Prevent recursion: our own editor.edit(...) triggers onDidChangeTextDocument again.
 */
const _isApplying = new Set(); // key: uri.toString()

/**
 * Call this once during activation to keep snapshots warm and accurate.
 * Example:
 *   context.subscriptions.push(...registerDocumentSnapshots());
 */
function registerDocumentSnapshots() {
    const subs = [];

    // Initialize snapshot for already-open docs
    for (const doc of vscode.workspace.textDocuments) {
        if (!doc.isClosed) _docSnapshots.set(doc.uri.toString(), doc.getText());
    }

    subs.push(
        vscode.workspace.onDidOpenTextDocument((doc) => {
            _docSnapshots.set(doc.uri.toString(), doc.getText());
        }),
    );

    subs.push(
        vscode.workspace.onDidCloseTextDocument((doc) => {
            _docSnapshots.delete(doc.uri.toString());
            _isApplying.delete(doc.uri.toString());
        }),
    );

    return subs;
}

/**
 * Robust multi-cursor casing handler.
 *
 * Requirements for correctness:
 * - You MUST have snapshots enabled via registerDocumentSnapshots(), otherwise
 *   originalText cannot be known reliably.
 */
// async function handleMultiCursorCasing(event) {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) return;

//     const doc = event.document;
//     if (doc !== editor.document) return;

//     // Only meaningful with multi-cursor (but contentChanges could still be >1 without it).
//     const selectionCount = editor && editor.selections ? editor.selections.length : 0;
//     if (selectionCount <= 1) {
//         // Still update snapshot at end.
//         _docSnapshots.set(doc.uri.toString(), doc.getText());
//         return;
//     }

//     const uriKey = doc.uri.toString();

//     // If this change was triggered by our own casing edits, ignore.
//     if (_isApplying.has(uriKey)) {
//         _docSnapshots.set(uriKey, doc.getText());
//         return;
//     }

//     const beforeText = _docSnapshots.get(uriKey);
//     if (typeof beforeText !== "string") {
//         // Snapshot missing: bail safely and seed it for next time.
//         _docSnapshots.set(uriKey, doc.getText());
//         return;
//     }

//     const changes = event.contentChanges;
//     if (!changes || changes.length === 0) {
//         _docSnapshots.set(uriKey, doc.getText());
//         return;
//     }

//     // Build a list of casing fixes to apply in one transaction.
//     // We'll compute original text from beforeText using offsets + rangeLength.
//     const fixes = [];

//     for (const change of changes) {
//         // Only process insertions (ignore pure deletions)
//         if (!change.text || change.text.length === 0) continue;

//         // Offset in the document BEFORE the change (same start position)
//         const startOffsetBefore = doc.offsetAt(change.range.start);

//         // rangeLength is the length of replaced text in the document BEFORE the change.
//         const replacedLenBefore = typeof change.rangeLength === "number" ? change.rangeLength : 0;

//         // True original text (pre-change)
//         const originalText = beforeText.slice(startOffsetBefore, startOffsetBefore + replacedLenBefore);

//         // Decide casing based on what was replaced.
//         const insertedText = change.text;
//         const casedText = matchCasing(originalText, insertedText);

//         if (casedText !== insertedText) {
//             // We need to replace the *inserted* text in the document AFTER the change.
//             // Compute the end position using the AFTER document via positionAt(startOffset + insertedText.length)
//             // Note: startOffsetBefore corresponds to same position in AFTER doc start (change.range.start).
//             const startPosAfter = change.range.start;
//             const startOffsetAfter = doc.offsetAt(startPosAfter);
//             const endPosAfter = doc.positionAt(startOffsetAfter + insertedText.length);

//             fixes.push({
//                 startOffsetAfter,
//                 rangeAfter: new vscode.Range(startPosAfter, endPosAfter),
//                 newText: casedText,
//             });
//         }
//     }

//     if (fixes.length === 0) {
//         _docSnapshots.set(uriKey, doc.getText());
//         return;
//     }

//     // Sort back-to-front so earlier replacements don't shift offsets for later ones.
//     fixes.sort((a, b) => b.startOffsetAfter - a.startOffsetAfter);

//     try {
//         _isApplying.add(uriKey);

//         await editor.edit(
//             (editBuilder) => {
//                 for (const f of fixes) {
//                     editBuilder.replace(f.rangeAfter, f.newText);
//                 }
//             },
//             {undoStopBefore: false, undoStopAfter: false},
//         );
//     } finally {
//         _isApplying.delete(uriKey);
//         // Update snapshot to the latest doc state (post-fix)
//         _docSnapshots.set(uriKey, doc.getText());
//     }
// }


let selectedLinesStatusBarItem;

/**
 * Update the status bar to show selected lines count
 */
function updateSelectedLinesStatusBar() {
    const config = vscode.workspace.getConfiguration("colemenutils");
    if (!config.get("showSelectedLinesStatus", true)) {
        if (selectedLinesStatusBarItem) selectedLinesStatusBarItem.hide();
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        if (selectedLinesStatusBarItem) selectedLinesStatusBarItem.hide();
        return;
    }
    const selections = editor.selections;
    let totalLines = 0;
    selections.forEach((sel) => {
        totalLines += sel.end.line - sel.start.line + 1;
    });
    if (!selectedLinesStatusBarItem) {
        selectedLinesStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
        selectedLinesStatusBarItem.command = undefined;
    }
    selectedLinesStatusBarItem.text = `☵ ${totalLines} lines`;
    selectedLinesStatusBarItem.show();
}

let trailingSpacesDecorationType;

/**
 * Get decoration type for trailing spaces highlighting
 */
function getTrailingSpacesDecorationType() {
    const config = vscode.workspace.getConfiguration("colemenutils");
    const color = config.get("trailingSpacesHighlightColor", "rgba(255,0,0,0.3)");
    return vscode.window.createTextEditorDecorationType({
        backgroundColor: color,
        borderRadius: "2px",
    });
}

/**
 * Highlight trailing spaces in the active editor
 */
function highlightTrailingSpaces() {
    const config = vscode.workspace.getConfiguration("colemenutils");
    if (!config.get("highlightTrailingSpaces", true)) {
        if (trailingSpacesDecorationType && vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.setDecorations(trailingSpacesDecorationType, []);
        }
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Re-create decoration type if color changed
    if (trailingSpacesDecorationType) trailingSpacesDecorationType.dispose();
    trailingSpacesDecorationType = getTrailingSpacesDecorationType();

    const regEx = /[ \t]+$/gm;
    const text = editor.document.getText();
    const decorations = [];
    let match;
    while ((match = regEx.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        decorations.push({range: new vscode.Range(startPos, endPos)});
    }
    editor.setDecorations(trailingSpacesDecorationType, decorations);
}

/**
 * Handle configuration changes
 */
function onConfigurationChanged(e) {
    if (e.affectsConfiguration("colemenutils.highlightTrailingSpaces") || e.affectsConfiguration("colemenutils.trailingSpacesHighlightColor")) {
        highlightTrailingSpaces();
    }
}

module.exports = {
    registerUiDecorations,
};
