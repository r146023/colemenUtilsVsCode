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
        vscode.commands.registerCommand('colemenutils.insertUUIDs', insertUUIDs)
    );
}

/**
 * Clear the content of the current line
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