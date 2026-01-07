const vscode = require('vscode');
const { generateUUIDv4 } = require('../helpers/editorHelpers');

/**
 * Editor Commands Module for ColemenUtils
 * Handles editor state and selection utilities
 */

/**
 * Register all editor-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerEditorCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.clearCurrentLine', clearCurrentLine),
        vscode.commands.registerCommand('colemenutils.selectCurrentLine', selectCurrentLine),
        vscode.commands.registerCommand('colemenutils.insertUUIDs', insertUUIDs),
        vscode.commands.registerCommand('colemenutils.copyCurrentLine', copyCurrentLine),
        vscode.commands.registerCommand('colemenutils.deleteCurrentLine', deleteCurrentLine),
        vscode.commands.registerCommand('colemenutils.cutCurrentLine', cutCurrentLine),
    );
}


/**
 * Copy then delete the current line(s).
 * Copies the full line text(s) (joined by document EOL for multiple lines) to the clipboard,
 * then deletes the entire line(s) including their line breaks.
 * This will Re
 */
async function cutCurrentLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const eol = doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    // Collect unique line numbers in ascending order for copying
    const lineNums = Array.from(new Set(editor.selections.map(s => s.active.line))).sort((a, b) => a - b);

    // Gather text to copy (top-to-bottom)
    const linesToCopy = lineNums.map(lineNum => doc.lineAt(lineNum).text);
    const textToCopy = linesToCopy.join(eol);

    try {
        await vscode.env.clipboard.writeText(textToCopy);
    } catch (err) {
        console.error('Failed to write clipboard for cutCurrentLine:', err);
        vscode.window.showErrorMessage('Failed to copy line(s) to clipboard before cutting');
        return;
    }

    // Delete lines bottom-to-top so indices remain valid
    const selectionsForDelete = [...lineNums].sort((a, b) => b - a).map(lineNum => {
        const line = doc.lineAt(lineNum);
        return line.rangeIncludingLineBreak;
    });

    const success = await editor.edit(editBuilder => {
        for (const range of selectionsForDelete) {
            editBuilder.delete(range);
        }
    });

    if (success) {
        vscode.window.setStatusBarMessage('Cut current line(s) to clipboard', 1500);
    } else {
        vscode.window.showErrorMessage('Failed to cut current line(s)');
    }
}


/**
 * Clear the content of the current line
 * This will remove all contents from the line WITHOUT deleting the line itself.
 * E.g., the line remains as an empty line.
 * This will not copy the line to clipboard.
 */
async function clearCurrentLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selections = editor.selections;
    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const line = editor.document.lineAt(selection.active.line);
            editBuilder.replace(line.range, '');
        }
    });
}


/**
 * Delete the current line(s) without copying to the clipboard.
 * Deletes the entire line including the line break when present.
 */
async function deleteCurrentLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Work from bottom to top so earlier deletions don't change later line numbers
    const selections = [...editor.selections].sort((a, b) => b.active.line - a.active.line);

    await editor.edit(editBuilder => {
        for (const sel of selections) {
            const line = editor.document.lineAt(sel.active.line);
            // rangeIncludingLineBreak deletes the trailing newline when present
            editBuilder.delete(line.rangeIncludingLineBreak);
        }
    });
}


/**
 * Copy the contents of the current line(s) to the clipboard without modifying the document.
 * For multiple selections, copies each active line joined by the document EOL.
 */
async function copyCurrentLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const eol = doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    const lines = editor.selections.map(sel => {
        const lineNum = sel.active.line;
        return doc.lineAt(lineNum).text;
    });

    const textToCopy = lines.join(eol);
    try {
        await vscode.env.clipboard.writeText(textToCopy);
        vscode.window.setStatusBarMessage('Current line(s) copied to clipboard', 1500);
    } catch (err) {
        console.error('Failed to copy line(s):', err);
        vscode.window.showErrorMessage('Failed to copy current line(s) to clipboard');
    }
}


/**
 * Select the entire current line
 */
async function selectCurrentLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const currentLine = editor.selection.active.line;
    const line = editor.document.lineAt(currentLine);
    const newSelection = new vscode.Selection(line.range.start, line.range.end);
    editor.selection = newSelection;
}

/**
 * Insert UUIDs at cursor positions
 */
async function insertUUIDs() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selections = editor.selections;
    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const uuid = generateUUIDv4();
            editBuilder.replace(selection, uuid);
        }
    });
}


module.exports = {
    registerEditorCommands
};