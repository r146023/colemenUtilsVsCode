const vscode = require('vscode');
const {  mostCommonNonAlphanumeric } = require('../helpers/editorHelpers');
const { fileOrSelectionToArrayOfLines } = require('../helpers/editorHelpers');
const { getConfigValue } = require('../helpers/configHelpers');
/**
 * Array Commands Module for ColemenUtils
 * Handles all array and list manipulation functionality
 */

/**
 * Register all array-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerArrayCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.LinesToStringArray', linesToStringArray),
        vscode.commands.registerCommand('colemenutils.LinesToFormattedArray', linesToFormattedArray),
        vscode.commands.registerCommand('colemenutils.linesToArray', linesToArray),
        vscode.commands.registerCommand('colemenutils.LinesToImageTag', linesToImageTag),
        vscode.commands.registerCommand('colemenutils.ImageTagsToLinesCMD', imageTagsToLines),
        vscode.commands.registerCommand('colemenutils.explodeByDelim', explodeByDelim),
        vscode.commands.registerCommand('colemenutils.linesToListDelimiterUnique', linesToListDelimiterUnique),
        vscode.commands.registerCommand('colemenutils.linesToListDelimiter', linesToListDelimiter)
    );
}

/**
 * Convert lines to string array format
 */
async function linesToStringArray() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    const documentText = document.getText();

    const result = documentText.split(/\r?\n/);
    var indices = [];
    // @Mstep [LOOP] iterate through each line
    result.forEach((element) => {
        // @Mstep [IF] if the line has content
        if (element.length > 0) {
            // @Mstep [] strip quotes and commas from start and end
            element = element.replace(/^\"/, '');
            element = element.replace(/[\"|,]*$/, '');
            // @Mstep [] push the formatted line to indices array wrapped in quotes
            indices.push(`"${element}"`);
        }
    });
    // console.log("Indices:", indices);

    // @Mstep [] Get configuration for line wrapping
    const enableLineWrap = getConfigValue('linesToStringArray.wrapLines', true);
    const max_line_length = getConfigValue('linesToStringArray.maxLineLength', 80);

    // @Mstep [IF] If line wrapping is disabled, output single line array
    if (!enableLineWrap) {
        let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
        var output_string = `[${indices.join(', ')}]`;
        const workEdits = new vscode.WorkspaceEdit();
        workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
        vscode.workspace.applyEdit(workEdits);
        // @Mstep [RETURN] Exit function
        return;
    }


    // var max_line_length = 80;
    /**
     * Contains an array of line arrays
     */
    var line_arrays = []

    let current_line = [];
    // @Mstep [LOOP] iterate through each term in indices
    for (let i = 0; i < indices.length; i++) {
        // @Mstep [] Calculate the length of this term plus commas and spaces
        let term_length = indices[i].length + 2;
        // @Mstep [] calculate the current line length if this term is added
        let current_line_length = current_line.join(', ').length;

        // @Mstep [IF] if adding this term exceeds the max line length
        if (current_line_length + term_length > max_line_length) {
            // @Mstep [] Push the current line to line_arrays
            line_arrays.push(current_line);
            // @Mstep [] Start a new current line with this term
            current_line = [indices[i]];
        } 
        // @Mstep [ELSE] if the term fits in the current line
        else {
            // @Mstep [] Add the term to the current line
            current_line.push(indices[i]);
        }
    }
    // @Mstep [] After loop, push any remaining terms in current_line to line_arrays
    if (current_line.length > 0) {
        line_arrays.push(current_line);
    }
    // console.log("line Arrays before final push:", line_arrays);
    var lines = [];
    // @Mstep [LOOP] iterate through each line array
    for (let j = 0; j < line_arrays.length; j++) {
        // @Mstep [] Join the line array into a single line string
        let new_line = line_arrays[j].join(', ');
        // @Mstep [] Push the line string to lines with a special delimiter for new lines
        lines.push(new_line+'__NEW_KFBR392_LINE__');
    }

    indices = lines;

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = `[\n${indices.join(',')}]`;
    output_string = output_string.replace(/__NEW_KFBR392_LINE__,/gmi, ',\n');
    output_string = output_string.replace(/__NEW_KFBR392_LINE__/gmi, '\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Convert lines to formatted array with type guessing
 */
async function linesToFormattedArray() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    const config = vscode.workspace.getConfiguration('colemenutils');
    // const enableLineWrap = getConfigValue('linesToStringArray.wrapLines', true);
    // const max_line_length = getConfigValue('linesToStringArray.maxLineLength', 80);

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    var indices = [];
    lines.forEach((element) => {
        if (element.length > 0 && element !== "\n") {
            element = element.replace(/^\"/, '');
            element = element.replace(/[\"|,]*$/, '');

            if (element.toLowerCase() === "true") {
                indices.push("true");
                return;
            }
            if (element.toLowerCase() === "false") {
                indices.push("false");
                return;
            }

            if (!isNaN(Number(element)) && element.trim() !== '') {
                indices.push(Number(element));
                return;
            }

            indices.push(`${config.get("toArrayQuoteCharacter")}${element}${config.get("toArrayQuoteCharacter")}`);
        }
    });

    var output_string = `[${indices.join(',')}]`;
    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Convert lines to array without formatting
 */
async function linesToArray() {
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
    var output_string = `[${indices.join(',')}]`;

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Convert lines to image tag format
 * @example line1;line2;line3
 */
async function linesToImageTag() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    const documentText = document.getText();
    var content = documentText;
    var tmpcon = [];
    content.split(/\r?\n/).forEach((element) => {
        if (element.length > 0) {
            if (element.startsWith("###")) return;
            tmpcon.push(element);
        }
    });
    content = tmpcon.join("\n").replace(/[;,\s]+/gmi, "\n");

    var indices = [];
    content.split(/\r?\n/).forEach((element) => {
        if (element.length > 0) {
            // if (element.startsWith("###")) return;
            var value = `${element}`;
            indices.push(value);
        }
    });

    content = [...new Set(indices)].sort().join(';');
    content = content.replace(/[;,\s]+/gmi, ";");

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = `${content}`;
    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
    vscode.env.clipboard.writeText(output_string);
}

/**
 * Convert image tags to lines
 */
async function imageTagsToLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    let document = editor.document;
    const documentText = document.getText();

    var content = documentText.replace(/[;,\s]+/gmi, "\n");

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = `${content}`;
    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
    vscode.env.clipboard.writeText(output_string);
}

/**
 * Explode text by most common delimiter
 */
async function explodeByDelim() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    let document = editor.document;
    let documentText = document.getText();

    var dlim = mostCommonNonAlphanumeric(documentText);
    if (dlim == null) return;

    documentText = documentText.replace(RegExp(`[${dlim}]{2}`, 'gm'), "__DELIM__");
    var matches = documentText.matchAll(/(['"])(.*?)\1/gmi);
    for (const match of matches) {
        var escaped = match[0].replace(RegExp(dlim, 'gm'), '__QUOTED_DELIM__');
        documentText = documentText.replace(match[0], escaped);
    }

    var content = documentText.replace(RegExp(dlim, 'gmi'), "\n");
    content = content.replace(/__QUOTED_DELIM__/gm, dlim);
    content = content.replace(/__DELIM__/gm, dlim);

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = `${content}`;
    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
    vscode.env.clipboard.writeText(output_string);
}

/**
 * Convert lines to list with delimiter (unique values)
 */
async function linesToListDelimiterUnique() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    let document = editor.document;
    const config = vscode.workspace.getConfiguration('colemenutils');
    const del = config.get("linesToListDelimiter", ",");

    var d = fileOrSelectionToArrayOfLines(editor);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    lines = [...new Set(lines)];

    var indices = [];
    lines.forEach((element) => {
        indices.push(element.replace(/\s$/, ""));
    });

    var output_string = `${indices.join(del)}`;
    output_string = output_string.replace(/[,]{2,}/g, ",");

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Convert lines to list with delimiter
 */
async function linesToListDelimiter() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    let document = editor.document;
    const config = vscode.workspace.getConfiguration('colemenutils');
    const del = config.get("linesToListDelimiter", ",");

    var d = fileOrSelectionToArrayOfLines(editor);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    var indices = [];
    lines.forEach((element) => {
        indices.push(element.replace(/\s$/, ""));
    });

    var output_string = `${indices.join(del)}`;
    output_string = output_string.replace(/[,]{2,}/g, ",");

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

module.exports = {
    registerArrayCommands
};