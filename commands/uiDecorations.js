const vscode = require('vscode');
const { matchCasing } = require('../helpers/editorHelpers');


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
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(handleMultiCursorCasing)
    );

    // Trailing spaces highlighting
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(highlightTrailingSpaces),
        vscode.workspace.onDidChangeTextDocument(highlightTrailingSpaces),
        vscode.window.onDidChangeTextEditorSelection(highlightTrailingSpaces),
        vscode.workspace.onDidChangeConfiguration(onConfigurationChanged)
    );

    // Selected lines status bar
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(updateSelectedLinesStatusBar),
        vscode.window.onDidChangeActiveTextEditor(updateSelectedLinesStatusBar)
    );

    // Initialize features
    highlightTrailingSpaces();
    updateSelectedLinesStatusBar();
}

/**
 * Handle multi-cursor casing logic to match casing across cursors
 */
async function handleMultiCursorCasing(event) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    if (editor.selections.length <= 1) return;

    // For each change (usually one per cursor)
    for (let i = 0; i < event.contentChanges.length; i++) {
        const change = event.contentChanges[i];
        const selection = editor.selections[i];
        if (!selection) continue;

        // Get the original text at the change location (before the change)
        const start = change.range.start;
        const end = change.range.end;

        // Only process insertions (not deletions)
        if (change.text.length === 0) continue;

        // The text just inserted by the user
        const insertedText = change.text;

        // The original text that was replaced (if any)
        const originalText = event.document.getText(new vscode.Range(start, end));

        // Match the casing of the original text for this cursor
        const newText = matchCasing(originalText, insertedText);

        // If casing needs to be fixed, apply the edit
        if (newText !== insertedText) {
            await editor.edit(editBuilder => {
                editBuilder.replace(
                    new vscode.Range(start, start.translate(0, insertedText.length)),
                    newText
                );
            }, { undoStopAfter: false, undoStopBefore: false });
        }
    }
}


let selectedLinesStatusBarItem;

/**
 * Update the status bar to show selected lines count
 */
function updateSelectedLinesStatusBar() {
    const config = vscode.workspace.getConfiguration('colemenutils');
    if (!config.get('showSelectedLinesStatus', true)) {
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
    selections.forEach(sel => {
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
    const config = vscode.workspace.getConfiguration('colemenutils');
    const color = config.get('trailingSpacesHighlightColor', 'rgba(255,0,0,0.3)');
    return vscode.window.createTextEditorDecorationType({
        backgroundColor: color,
        borderRadius: '2px'
    });
}

/**
 * Highlight trailing spaces in the active editor
 */
function highlightTrailingSpaces() {
    const config = vscode.workspace.getConfiguration('colemenutils');
    if (!config.get('highlightTrailingSpaces', true)) {
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
        decorations.push({ range: new vscode.Range(startPos, endPos) });
    }
    editor.setDecorations(trailingSpacesDecorationType, decorations);
}

/**
 * Handle configuration changes
 */
function onConfigurationChanged(e) {
    if (
        e.affectsConfiguration('colemenutils.highlightTrailingSpaces') ||
        e.affectsConfiguration('colemenutils.trailingSpacesHighlightColor')
    ) {
        highlightTrailingSpaces();
    }
}

module.exports = {
    registerUiDecorations
};