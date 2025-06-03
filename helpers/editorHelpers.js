const vscode = require('vscode');

function mostCommonNonAlphanumeric(str) {
    const counts = {};
    for (const char of str) {
        if (/[^a-zA-Z0-9 \n\r'"]/.test(char)) {
            counts[char] = (counts[char] || 0) + 1;
        }
    }
    let maxChar = null;
    let maxCount = 0;
    for (const [char, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxChar = char;
            maxCount = count;
        }
    }
    return maxChar;
}

function fileToArrayOfLines(editor, keepEmptyLines = false) {
    if (editor) {
        let document = editor.document;
        var text = document.getText();

        if (keepEmptyLines) {
            text = text.replace(/\r?\n/g, '\n__NEW_LINE__');
        }
        var lines = text.split(/\r?\n/);
        return lines;
    }
    return false;
}

function fileOrSelectionToArrayOfLines(editor, keepEmptyLines = false) {
    if (!editor) return;

    let rrange;
    let fullDoc = false;
    if (editor.selection.isEmpty) {
        if (editor.document.lineCount === 0) return;
        rrange = new vscode.Range(
            0, 0,
            editor.document.lineCount - 1,
            editor.document.lineAt(editor.document.lineCount - 1).text.length
        );
    } else {
        rrange = editor.selection;
        fullDoc = true;
    }
    var text = editor.document.getText(rrange);
    var lines = text.split(/\r?\n/);
    if (keepEmptyLines === false && fullDoc === true) {
        var x = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length > 0) {
                x.push(lines[i]);
            }
        }
        lines = x;
    }
    return [lines, rrange];
}

function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function matchCasing(original, replacement) {
    if (!original) return replacement;

    // ALL UPPERCASE
    if (original === original.toUpperCase()) {
        return replacement.toUpperCase();
    }
    // all lowercase
    if (original === original.toLowerCase()) {
        return replacement.toLowerCase();
    }
    // Title Case (First letter uppercase, rest lowercase)
    if (
        original[0] === original[0].toUpperCase() &&
        original.slice(1) === original.slice(1).toLowerCase()
    ) {
        return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }
    // snake_case
    if (/^[a-z0-9_]+$/.test(original) && original.includes('_')) {
        return replacement
            .replace(/([A-Z])/g, '_$1') // handle camelCase/PascalCase input
            .replace(/[\s\-]+/g, '_')   // spaces/dashes to underscores
            .toLowerCase();
    }
    // PascalCase
    if (/^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/.test(original)) {
        return replacement
            .replace(/[_\-\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
            .replace(/^(.)/, (m) => m.toUpperCase());
    }
    // camelCase
    if (/^[a-z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/.test(original)) {
        let pascal = replacement
            .replace(/[_\-\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
            .replace(/^(.)/, (m) => m.toUpperCase());
        return pascal[0].toLowerCase() + pascal.slice(1);
    }
    // fallback: return as-is
    return replacement;
}

module.exports = {
    mostCommonNonAlphanumeric,
    fileToArrayOfLines,
    fileOrSelectionToArrayOfLines,
    generateUUIDv4,
    matchCasing
};