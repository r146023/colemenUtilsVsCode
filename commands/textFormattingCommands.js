const vscode = require('vscode');
const figlet = require('figlet');
const { fileToArrayOfLines } = require('../helpers/editorHelpers');
const { getConfigValue } = require('../helpers/configHelpers');
/**
 * Text Formatting Commands Module for ColemenUtils
 * Handles all text transformation and formatting functionality
 */

/**
 * Register all text formatting-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerTextFormattingCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.asciiBanner', asciiBanner),
        vscode.commands.registerCommand('colemenutils.insertBoxHeader', insertBoxHeader),
        vscode.commands.registerCommand('colemenutils.insertSingleLineHeader', insertSingleLineHeader),
        vscode.commands.registerCommand('colemenutils.ComponentToMultiLine', componentToMultiLine),
        vscode.commands.registerCommand('colemenutils.applyNewLines', applyNewLines),
        vscode.commands.registerCommand('colemenutils.escapeAllSingleBackSlash', escapeAllSingleBackSlash),
        vscode.commands.registerCommand('colemenutils.escapeSelectedSingleBackSlash', escapeSelectedSingleBackSlash),
        vscode.commands.registerCommand('colemenutils.singleToDoubleQuote', singleToDoubleQuote),
        vscode.commands.registerCommand('colemenutils.reverseSlashesInWindowsPaths', reverseSlashesInWindowsPaths),
        vscode.commands.registerCommand('colemenutils.normalizeBlankLines', normalizeBlankLines)
    );
}

/**
 * Generate ASCII banner art from selected text using figlet
 */
async function asciiBanner() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    // const config = vscode.workspace.getConfiguration('colemenutils');
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const text = editor.document.getText(selection) || '';
            if (!text.trim()) continue;
            const font = getConfigValue('bannerFont', 'Banner');
            let banner = figlet.textSync(text, { font: font, horizontalLayout: 'default', verticalLayout: 'default' });
            // Replace all non-space characters with #
            banner = banner.replace(/[^\s]/g, '#');
            // Remove trailing spaces from each line and filter out empty lines
            banner = banner
                .split('\n')
                .map(line => line.replace(/\s+$/, '')) // remove trailing spaces
                .filter(line => line.length > 0) // remove empty lines
                .join('\n');
            editBuilder.replace(selection, banner);
        }
    });
}

/**
 * Insert a formatted box header with the selected text or current line content
 */
async function insertBoxHeader() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    // const config = vscode.workspace.getConfiguration('colemenutils');
    const selections = editor.selections;
    const BOX_WIDTH = getConfigValue('headerWidth', 80);

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            let text = editor.document.getText(selection).trim();
            let rangeToReplace = selection;
            // If nothing is selected, use the content of the current line and replace the whole line
            if (selection.isEmpty) {
                const line = editor.document.lineAt(selection.active.line);
                text = line.text.trim();
                rangeToReplace = new vscode.Selection(line.range.start, line.range.end);
            }
            const content = ` ${text} `;
            const pad = BOX_WIDTH - 4 - content.length;
            const padLeft = Math.floor(pad / 2);
            const padRight = pad - padLeft + 2;
            const centered = ' '.repeat(padLeft) + content + ' '.repeat(padRight);
            const header =
                '/* ' + '-'.repeat(BOX_WIDTH - 4) + ' */\n' +
                '/*' + centered + '*/\n' +
                '/* ' + '-'.repeat(BOX_WIDTH - 4) + ' */';
            editBuilder.replace(rangeToReplace, header);
        }
    });
}

/**
 * Insert a single line header with the selected text or current line content
 */
async function insertSingleLineHeader() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    // const config = vscode.workspace.getConfiguration('colemenutils');
    const selections = editor.selections;
    const BOX_WIDTH = getConfigValue('headerWidth', 80);

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            let text = editor.document.getText(selection).trim();
            let rangeToReplace = selection;
            // If nothing is selected, use the content of the current line and replace the whole line
            if (selection.isEmpty) {
                const line = editor.document.lineAt(selection.active.line);
                text = line.text.trim();
                rangeToReplace = new vscode.Selection(line.range.start, line.range.end);
            }
            const content = ` ${text} `;
            const pad = BOX_WIDTH - 2 - content.length;
            const padLeft = Math.floor(pad / 2) - 2;
            const padRight = pad - padLeft - 2;
            const header =
                '/*' + '-'.repeat(padLeft) +
                content +
                '-'.repeat(padRight) + '*/';
            editBuilder.replace(rangeToReplace, header);
        }
    });
}

/**
 * Convert JSX/TSX component to multi-line format with proper indentation
 */
async function componentToMultiLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    if (editor.document.languageId !== 'javascript' && editor.document.languageId !== 'typescript') return;

    let document = editor.document;
    // const documentText = document.getText();

    var content = editor.document.getText(editor.selection);
    const { text } = editor.document.lineAt(editor.selection.active.line);

    var baseIndent = "";

    // Determine the indentation of the line
    const indentRegex = /^\s*/gm;
    var result = text.match(indentRegex);
    if (result.length > 0) baseIndent = result[0];

    if (content.length === 0) {
        content = text.replace(indentRegex, "");
    }

    const closeComponentRegex = /(<\/|\/>)/gm;
    content = content.replace(closeComponentRegex, "\n__BASE_INDENT__$1");
    const PropSplitRegex = /\s+([a-zA-Z0-9-]*)=/gm;
    content = content.replace(PropSplitRegex, "__NEW_LINE__$1=");
    const newLineRegex = /__NEW_LINE__/gm;
    content = content.replace(newLineRegex, `\n${baseIndent}    `);

    const baseIndentRegex = /__BASE_INDENT__/gm;
    content = content.replace(baseIndentRegex, baseIndent);

    var output_string = `${baseIndent}${content}\n`;

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(editor.selection.start.line, 0, editor.selection.end.line + 1, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Apply new lines by converting \n sequences to actual line breaks
 */
async function applyNewLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const documentText = document.getText();

    var lines = fileToArrayOfLines(editor);

    var new_lines = [];
    if (Array.isArray(lines) === false) return;
    lines.forEach(line => {
        var lineArray = line.split(/\\n/);
        lineArray.forEach(newLine => {
            var skip_push = false;
            newLine = newLine.replace(/\<\/?b\>/gi, '');
            newLine = newLine.replace(/\<br\s*\/\>/gi, '');
            if (new_lines.length > 0) {
                var prev_arr = new_lines[new_lines.length - 1].match(/=\>$/gmi);
                if (prev_arr != null) {
                    newLine = newLine.replace(/^\s*/gmi, '');
                    new_lines[new_lines.length - 1] = `${new_lines[new_lines.length - 1]} ${newLine}`;
                    skip_push = true;
                }
            }
            if (skip_push == false) new_lines.push(newLine);
        });
    });

    var output_string = new_lines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Escape all single backslashes in the entire document
 */
async function escapeAllSingleBackSlash() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const documentText = document.getText();

    var lines = fileToArrayOfLines(editor);

    var new_lines = [];
    if (Array.isArray(lines)){
        lines.forEach(line => {
            new_lines.push(line.replace(/(?<!\\)\\(?!\\)/gmi, '\\\\'));
        });
    }

    var output_string = new_lines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Escape single backslashes in the selected text only
 */
async function escapeSelectedSingleBackSlash() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const documentText = document.getText();

    const contents = editor.document.getText(editor.selection);

    var lines = contents.split(/\r?\n/);
    var new_lines = [];
    lines.forEach(line => {
        new_lines.push(line.replace(/(?<!\\)\\(?!\\)/gmi, '\\\\'));
    });
    var output_string = new_lines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(editor.selection.start.line, 0, editor.selection.end.line + 1, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Convert all single quotes to double quotes in the entire document
 */
async function singleToDoubleQuote() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;

    var lines = fileToArrayOfLines(editor);
    if (!lines) return;
    var new_lines = [];
    if(Array.isArray(lines)){
        lines.forEach(line => {
            new_lines.push(line.replace(/'/g, '"'));
        });

    }
    var output_string = new_lines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Reverse backslashes to forward slashes in Windows file paths
 */
async function reverseSlashesInWindowsPaths() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const edits = [];
    editor.selections.forEach(selection => {
        const line = document.lineAt(selection.active.line);
        // Regex to match Windows file paths anywhere in the line (e.g., C:/foo/bar, D:/baz, etc.)
        const newText = line.text.replace(/([A-Za-z]:[\\/][^'"`]*)/g, (match) => {
            return match.replace(/\\/g, '\/');
        });
        if (newText !== line.text) {
            edits.push({
                range: line.range,
                text: newText
            });
        }
    });
    if (edits.length > 0) {
        editor.edit(editBuilder => {
            edits.forEach(edit => {
                editBuilder.replace(edit.range, edit.text);
            });
        });
    }
}

/**
 * Replace excessive repeating newlines with maximum of 2 consecutive newlines (FIXED VERSION)
 */
async function normalizeBlankLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const text = document.getText();
    
    // Handle different line ending styles and empty lines with whitespace
    let normalizedText = text;
    
    // First, normalize line endings to \n for processing
    normalizedText = normalizedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Replace lines that contain only whitespace with truly empty lines
    normalizedText = normalizedText.replace(/^[ \t]+$/gm, '');
    
    // Replace 3 or more consecutive newlines (empty lines) with exactly 2 newlines
    normalizedText = normalizedText.replace(/\n{3,}/g, '\n\n');
    
    // Convert back to document's original line ending style
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    if (eol === '\r\n') {
        normalizedText = normalizedText.replace(/\n/g, '\r\n');
    }
    
    if (normalizedText === text) {
        vscode.window.showInformationMessage('No excessive blank lines found to normalize');
        return;
    }

    // Replace entire document content
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    const fullRange = new vscode.Range(
        firstLine.range.start,
        lastLine.range.end
    );

    const success = await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, normalizedText);
    });

    if (success) {
        const originalLines = text.split(/\r\n|\r|\n/).length;
        const newLines = normalizedText.split(/\r\n|\r|\n/).length;
        const linesRemoved = originalLines - newLines;
        
        vscode.window.showInformationMessage(
            `Normalized blank lines - removed ${linesRemoved} excessive blank line(s)`
        );
    } else {
        vscode.window.showErrorMessage('Failed to normalize blank lines');
    }
}

module.exports = {
    registerTextFormattingCommands
};