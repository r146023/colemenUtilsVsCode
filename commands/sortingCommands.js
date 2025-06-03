const vscode = require('vscode');
const { fileOrSelectionToArrayOfLines } = require('../helpers/editorHelpers');
const { getConfigValue } = require('../helpers/configHelpers');
/**
 * Sorting Commands Module for ColemenUtils
 * Handles all text sorting and line manipulation functionality
 */

/**
 * Register all sorting-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerSortingCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.shuffleLines', shuffleLines),
        vscode.commands.registerCommand('colemenutils.sortLines', sortLines),
        vscode.commands.registerCommand('colemenutils.sortLinesReversed', sortLinesReversed),
        vscode.commands.registerCommand('colemenutils.sortByLength', sortByLength),
        vscode.commands.registerCommand('colemenutils.sortByLengthReversed', sortByLengthReversed)
    );
}

/**
 * ### Shuffle Lines
 * **Command:** `colemenutils.shuffleLines`
 *
 * Randomly shuffles all lines in the current file.
 * This command uses the [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) algorithm to rearrange the lines in a random order.
 * Useful for randomizing lists, test data, or any content where order does not matter.
 *
 * **How to use:**
 * - Open the file you want to shuffle.
 * - Run the command via the Command Palette (`Ctrl+Shift+P` → "Shuffle Lines") or your assigned keybinding.
 * - All lines in the file will be randomly reordered.
 *
 * > **Note:** This command operates on the entire file, not just the selected lines.
 */
async function shuffleLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const lines = [];
    for (let i = 0; i < document.lineCount; i++) {
        lines.push(document.lineAt(i).text);
    }

    // Fisher-Yates shuffle
    for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
    }

    const output_string = lines.join('\n');
    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document alphabetically (A-Z).
 *
 * - Numbers and strings are sorted separately, with placement controlled by the
 *   `colemenutils.numberPlacementAlphaSort` setting ("before" or "after").
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortLines`
 *
 * @command colemenutils.sortLines
 * @description Sorts lines alphabetically (A-Z) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort Alphabetically A-Z" command from the Command Palette.
 * // 3. Lines will be sorted in place.
 */
async function sortLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];
    var sortableNumbers = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        if (!isNaN(lines[i]) && lines[i].trim() !== '') {
            sortableNumbers.push(Number(lines[i]));
            continue;
        }
        sortableValues.push(lines[i]);
    }

    var sortedValues = sortableValues.sort((a, b) => {
        const cleanA = a.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return cleanA.localeCompare(cleanB);
    });
    var sortedNumbers = sortableNumbers.sort((a, b) => a - b);

    var sortedLines = [];
    if (getConfigValue("numberPlacementAlphaSort", "before") === "before") {
        sortedLines = sortedNumbers.concat(sortedValues);
    } else {
        sortedLines = sortedValues.concat(sortedNumbers);
    }
    var outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        var sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        var emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    var output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document alphabetically in reverse order (Z-A).
 *
 * - Numbers and strings are sorted separately, with placement controlled by the
 *   `colemenutils.numberPlacementAlphaSort` setting ("before" or "after").
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortLinesReversed`
 *
 * @command colemenutils.sortLinesReversed
 * @description Sorts lines alphabetically (Z-A) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort Alphabetically Z-A (Reversed)" command from the Command Palette.
 * // 3. Lines will be sorted in reverse alphabetical order in place.
 */
async function sortLinesReversed() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];
    var sortableNumbers = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        if (!isNaN(lines[i]) && lines[i].trim() !== '') {
            sortableNumbers.push(Number(lines[i]));
            continue;
        }
        sortableValues.push(lines[i]);
    }

    var sortedValues = sortableValues.sort((a, b) => {
        const cleanA = a.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return cleanA.localeCompare(cleanB);
    });
    var sortedNumbers = sortableNumbers.sort((a, b) => a - b);

    sortedNumbers.reverse();
    sortedValues.reverse();

    var sortedLines = [];
    if (getConfigValue("numberPlacementAlphaSort", "before") === "before") {
        sortedLines = sortedNumbers.concat(sortedValues);
    } else {
        sortedLines = sortedValues.concat(sortedNumbers);
    }
    var outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        var sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        var emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    var output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document by length (shortest to longest).
 *
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortByLength`
 *
 * @command colemenutils.sortByLength
 * @description Sorts lines by length (shortest to longest) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort By Length Small to Large" command from the Command Palette.
 * // 3. Lines will be sorted by length in place.
 */
async function sortByLength() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        sortableValues.push(lines[i]);
    }

    // Sort lines by length (ascending)
    const sortedLines = sortableValues.slice().sort((a, b) => a.length - b.length);

    let outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        // Keep empty lines in their original positions
        let sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        // Remove empty lines, then add them back at the end
        const emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    const output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document by length (longest to shortest).
 *
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortByLengthReversed`
 *
 * @command colemenutils.sortByLengthReversed
 * @description Sorts lines by length (longest to shortest) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort By Length Large to Small (Reversed)" command from the Command Palette.
 * // 3. Lines will be sorted by length in descending order in place.
 */
async function sortByLengthReversed() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        sortableValues.push(lines[i]);
    }

    // Sort lines by length (ascending)
    const sortedLines = sortableValues.slice().sort((a, b) => a.length - b.length);
    sortedLines.reverse();

    let outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        // Keep empty lines in their original positions
        let sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        // Remove empty lines, then add them back at the end
        const emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    const output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}


module.exports = {
    registerSortingCommands
};