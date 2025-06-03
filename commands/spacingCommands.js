const vscode = require('vscode');
const { fileToArrayOfLines } = require('../helpers/editorHelpers');
const { stripExcessiveSpaces: stripExcessiveSpacesHelper } = require('../helpers/textHelpers');

/**
 * Spacing Commands Module for ColemenUtils
 * Handles all whitespace and spacing management functionality
 */

/**
 * Register all spacing-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerSpacingCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.stripTrailingSpaces', stripTrailingSpaces),
        vscode.commands.registerCommand('colemenutils.stripExcessiveSpaces', stripExcessiveSpaces),
        vscode.commands.registerCommand('colemenutils.stripEmptyLines', stripEmptyLines),
        vscode.commands.registerCommand('colemenutils.stripDuplicateLines', stripDuplicateLines),
        vscode.commands.registerCommand('colemenutils.stripSelectedDuplicate', stripSelectedDuplicate),
        vscode.commands.registerCommand('colemenutils.toSingleLine', toSingleLine),
        vscode.commands.registerCommand('colemenutils.minifyFile', minifyFile)
    );
}

/**
 * Remove trailing spaces and tabs from each line
 */
async function stripTrailingSpaces() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const documentText = document.getText();
    const output_string = documentText.replace(/[ \t]+$/gm, '');
    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Replace multiple spaces/tabs with single space
 */
async function stripExcessiveSpaces() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let rrange;
    if (editor.selection.isEmpty) {
        rrange = new vscode.Range(
            0, 0,
            editor.document.lineCount - 1,
            editor.document.lineAt(editor.document.lineCount - 1).text.length
        );
    } else {
        rrange = editor.selection;
    }
    const document = editor.document;
    const documentText = document.getText(rrange);
    const output_string = documentText.replace(/[ \t]+/gm, ' ');
    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Remove empty lines from document
 */
async function stripEmptyLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    const documentText = document.getText();

    const result = documentText.split(/\r?\n/);
    var indices = [];
    result.forEach((element) => {
        if (element.length > 0) {
            indices.push(`${element}`);
        }
    });

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = indices.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Remove duplicate lines from document
 */
async function stripDuplicateLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const documentText = document.getText();

    var lines = fileToArrayOfLines(editor);
    var output_string = [...new Set(lines)].join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Remove duplicate lines from selection
 */
async function stripSelectedDuplicate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    const contents = editor.document.getText(editor.selection);

    var lines = contents.split(/\r?\n/);
    var output_string = [...new Set(lines)].join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(editor.selection.start.line, 0, editor.selection.end.line + 1, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Collapse all lines into a single line
 */
async function toSingleLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    const documentText = document.getText();

    const result = documentText.split(/\r?\n/);
    var indices = [];
    result.forEach((element) => {
        if (element.length > 0) {
            indices.push(`${element}`);
        }
    });

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = indices.join('');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Minify file by removing excessive whitespace
 */
async function minifyFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");

    var lines = fileToArrayOfLines(editor);
    ColemenUtils.appendLine(JSON.stringify(lines));

    var output_string = minify(lines);

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}



/**
 * Minify lines by removing excessive spaces
 */
function minify(lines) {
    var newLines = [];
    lines.forEach((element) => {
        newLines.push(stripExcessiveSpacesHelper(element));
    });
    return newLines.join('');
}


module.exports = {
    registerSpacingCommands
};