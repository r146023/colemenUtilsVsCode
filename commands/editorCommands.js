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
        vscode.commands.registerCommand('colemenutils.formatActiveDocument', formatActiveDocument),
        vscode.commands.registerCommand('colemenutils.insertSequence', vsSequentialNumber),
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

async function formatActiveDocument() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;

    // Normalize editor options to primitive types expected by format providers
    const tabSize = Number(editor.options.tabSize) || 4;
    const insertSpaces = editor.options.insertSpaces === true || editor.options.insertSpaces === 'true';

    // executeCommand is asynchronous and JS does not support TypeScript generics here
    const edits = await vscode.commands.executeCommand(
        'vscode.executeFormatDocumentProvider',
        document.uri,
        { tabSize, insertSpaces }
    );

    // Ensure edits is an array before accessing length to satisfy the type checker
    if (!Array.isArray(edits) || edits.length === 0) return;

    /** @type {import('vscode').TextEdit[]} */
    const textEdits = edits;

    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, textEdits);

    await vscode.workspace.applyEdit(workspaceEdit);
}




async function vsSequentialNumber() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const selections = editor.selections || [];
    if (selections.length === 0) return;

    // VS Sequential Number syntax: "<start> <operator?> <step?>"
    // Defaults: start=1, operator="+", step=1 :contentReference[oaicite:5]{index=5}
    const input = await vscode.window.showInputBox({
        title: "VS Sequential Number",
        prompt: "Syntax: <start> <operator?> <step?>   (defaults: 1 + 1)",
        placeHolder: "Example: 1 + 1   |   10 - 2   |   1 * 2   |   100 / 5",
        value: "1 + 1",
        ignoreFocusOut: true,
        validateInput: (value) => {
            const parsed = parseSequenceSpec(value);
            if (!parsed.ok) return parsed.error;

            // Basic guard: division by zero
            if (parsed.operator === "/" && parsed.step === 0) return "Step cannot be 0 for division.";
            return null;
        }
    });

    if (input == null) return; // cancelled

    const parsed = parseSequenceSpec(input);
    if (!parsed.ok) {
        vscode.window.showErrorMessage(parsed.error);
        return;
    }

    let current = parsed.start;
    const op = parsed.operator;
    const step = parsed.step;

    // 1) Assign numbers in DOCUMENT order (top-to-bottom / left-to-right)
    const ordered = selections
        .map((sel, idx) => ({ sel, idx }))
        .sort((a, b) => comparePositions(minPos(a.sel), minPos(b.sel)));

    const planned = [];
    for (const item of ordered) {
        planned.push({
            sel: item.sel,
            text: String(current)
        });
        current = applyOperator(current, op, step);
    }

    // 2) Apply edits in REVERSE document order so earlier edits don't shift later ranges
    const plannedReverse = planned
        .slice()
        .sort((a, b) => comparePositions(minPos(b.sel), minPos(a.sel)));

    await editor.edit((editBuilder) => {
        for (const p of plannedReverse) {
            if (p.sel.isEmpty) {
                // Insert at caret
                editBuilder.insert(p.sel.active, p.text);
            } else {
                // Replace selection
                editBuilder.replace(p.sel, p.text);
            }
        }
    }, { undoStopBefore: true, undoStopAfter: true });
}

/**
 * Parses "<start> <operator?> <step?>"
 * Robustly supports:
 *  - "10 + 2"
 *  - "10+2"
 *  - "10" (=> 10 + 1)
 */
function parseSequenceSpec(raw) {
    const s = String(raw || "").trim();

    // Defaults: 1 + 1 :contentReference[oaicite:6]{index=6}
    if (!s) {
        return { ok: true, start: 1, operator: "+", step: 1 };
    }

    // Allow optional spaces around operator; allow no operator/step
    const m = s.match(/^(-?\d+)\s*([+\-*/])?\s*(-?\d+)?$/);
    if (!m) {
        return {
            ok: false,
            error: "Invalid format. Use: <start> <operator?> <step?>   e.g. '1 + 1' or '10-2'."
        };
    }

    const start = parseInt(m[1], 10);
    const operator = (m[2] || "+");
    const step = (m[3] == null || m[3] === "") ? 1 : parseInt(m[3], 10);

    if (!Number.isFinite(start)) return { ok: false, error: "Start must be an integer." };
    if (!["+", "-", "*", "/"].includes(operator)) return { ok: false, error: "Operator must be one of + - * /." };
    if (!Number.isFinite(step)) return { ok: false, error: "Step must be an integer." };

    return { ok: true, start, operator, step };
}

function applyOperator(value, operator, step) {
    switch (operator) {
        case "+": return value + step;
        case "-": return value - step;
        case "*": return value * step;
        // spec says integer inputs; extension allows '/' :contentReference[oaicite:7]{index=7}
        case "/": return value / step; 
        default: return value + step;
    }
}

function minPos(sel) {
    // Selection start can be after end depending on direction; normalize
    return sel.start.isBefore(sel.end) ? sel.start : sel.end;
}

function comparePositions(a, b) {
    if (a.line !== b.line) return a.line - b.line;
    return a.character - b.character;
}











module.exports = {
    registerEditorCommands
};