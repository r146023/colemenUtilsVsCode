const vscode = require('vscode');

/**
 * Markdown Commands Module for ColemenUtils
 * Handles all markdown-specific functionality
 */

/**
 * Register all markdown-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerMarkdownCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.toggleBlockQuote', toggleBlockQuote),
        vscode.commands.registerCommand('colemenutils.addMarkdownHeader', addMarkdownHeader),
        vscode.commands.registerCommand('colemenutils.removeMarkdownHeader', removeMarkdownHeader),
        vscode.commands.registerCommand('colemenutils.reformatMarkdownTables', reformatMarkdownTables)
    );
}

/**
 * Toggle markdown block quote on selected lines
 */
async function toggleBlockQuote() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    editor.edit(editBuilder => {
        const selections = editor.selections;
        const linesDone = new Set();

        selections.forEach(selection => {
            const startLine = selection.start.line;
            const endLine = selection.end.line;

            for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
                if (linesDone.has(lineNum)) continue; // Avoid duplicate edits for overlapping selections
                linesDone.add(lineNum);

                const line = editor.document.lineAt(lineNum);
                const text = line.text;

                // Toggle block quote: if line starts with "> ", remove it; else, add "> "
                if (/^\s*> /.test(text)) {
                    // Remove one level of block quote
                    const newText = text.replace(/^(\s*)> /, '$1');
                    editBuilder.replace(line.range, newText);
                } else {
                    // Add block quote
                    editBuilder.replace(line.range, '> ' + text);
                }
            }
        });
    });
}

/**
 * Add markdown header to current line
 */
async function addMarkdownHeader() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    editor.edit(editBuilder => {
        editor.selections.forEach(selection => {
            const line = editor.document.lineAt(selection.active.line);
            if (!line.text.trim().startsWith('#')) {
                editBuilder.insert(line.range.start, '# ');
            } else {
                editBuilder.insert(line.range.start, "#");
            }
        });
    });
}

/**
 * Remove markdown header from current line
 */
async function removeMarkdownHeader() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    editor.edit(editBuilder => {
        editor.selections.forEach(selection => {
            const line = editor.document.lineAt(selection.active.line);
            const match = line.text.match(/^(\s*)#\s*/);
            if (match) {
                const start = line.range.start.translate(0, match[1].length);
                const end = line.range.start.translate(0, match[0].length);
                editBuilder.delete(new vscode.Range(start, end));
            }
        });
    });
}

/**
 * Reformat markdown tables to align columns properly
 */
async function reformatMarkdownTables() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showInformationMessage('This command only works in Markdown files.');
        return;
    }
    const doc = editor.document;
    const text = doc.getText();
    const lines = text.split('\n');
    let inTable = false;
    let tableStart = 0;
    let tableLines = [];
    let edits = [];

    function formatTable(tableLines) {
        // Split each line into cells
        let rows = tableLines.map(line =>
            line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())
        );
        // Find max width for each column
        let colCount = Math.max(...rows.map(row => row.length));
        let colWidths = Array(colCount).fill(0);
        rows.forEach(row => {
            row.forEach((cell, i) => {
                colWidths[i] = Math.max(colWidths[i], cell.length);
            });
        });
        // Pad cells and reconstruct lines
        return rows.map((row, rowIdx) => {
            let padded = row.map((cell, i) => {
                let pad = colWidths[i] - cell.length;
                let left = cell;
                let right = ' '.repeat(pad);
                // For separator row, keep dashes
                if (rowIdx === 1 && /^-+$/.test(cell.replace(/:/g, ''))) {
                    left = cell.replace(/-+/g, '-'.repeat(colWidths[i]));
                    right = '';
                }
                return left + right;
            });
            return '| ' + padded.join(' | ') + ' |';
        });
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect table: at least one | and a separator row (---)
        if (/\|/.test(line)) {
            if (!inTable) {
                inTable = true;
                tableStart = i;
                tableLines = [];
            }
            tableLines.push(line);
        } else if (inTable) {
            // End of table
            if (tableLines.length >= 2 && /-+/.test(tableLines[1])) {
                const formatted = formatTable(tableLines);
                edits.push({ start: tableStart, end: tableStart + tableLines.length, lines: formatted });
            }
            inTable = false;
            tableLines = [];
        }
    }
    // Handle table at end of file
    if (inTable && tableLines.length >= 2 && /-+/.test(tableLines[1])) {
        const formatted = formatTable(tableLines);
        edits.push({ start: tableStart, end: tableStart + tableLines.length, lines: formatted });
    }

    if (edits.length === 0) {
        vscode.window.showInformationMessage('No Markdown tables found to reformat.');
        return;
    }

    await editor.edit(editBuilder => {
        for (let i = edits.length - 1; i >= 0; i--) {
            const { start, end, lines } = edits[i];
            const range = new vscode.Range(start, 0, end, 0);
            editBuilder.replace(range, lines.join('\n'));
        }
    });
}

module.exports = {
    registerMarkdownCommands
};