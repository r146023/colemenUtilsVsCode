const vscode = require('vscode');
// TODO []: (backend,PHP) boobies

let TODO_HIGHLIGHT_DEC = null;
let TODO_COMPLETE_HIGHLIGHT_DEC = null;


// const TODO_REGEX = /\b(TODO|FIXME)\b/gi;
const TODO_REGEX = /(?:\b(-\s*\[\s*\]\s*)?\b(TODO|FIXME)\s*|\b(TODO|FIXME)\s*\[\s*\])/gi;
// const TODO_REGEX = /\b(TODO|FIXME)\s*\[\s*\]/gi;
const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\b)/i;
// const TODO_COMPLETE_REGEX = /\bXXX\b/i;
let todoUpdateTimeout;
let _suppressAutoReplace = new Set();

function pad(n) { return n.toString().padStart(2, '0'); }

function formatDateForTodo(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}


function createTodoDecorations() {
    // dispose existing decorations if present
    try { TODO_HIGHLIGHT_DEC && TODO_HIGHLIGHT_DEC.dispose(); } catch (e) { /* ignore */ }

    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const bg = cfg.get('highlightBackground', '#441a34');
    const fontColor = cfg.get('fontColor', '#e78de3e6');
    var underline = cfg.get('underlineColor', '#ff00f2e6');
    const isWhole = cfg.get('isWholeLine', true);
    const underlineEnabled = cfg.get('underlineEnabled', true);
    if (!underlineEnabled) {
        underline = 'transparent';
    }


    TODO_HIGHLIGHT_DEC = vscode.window.createTextEditorDecorationType({
        backgroundColor: bg,
        color: fontColor,
        borderRadius: '3px',
        fontWeight: 'bold',
        overviewRulerColor: bg,
        overviewRulerLane: vscode.OverviewRulerLane.Left,
        textDecoration: `underline; text-decoration-color: ${underline}; text-decoration-thickness: 2px;`,
        isWholeLine: !!isWhole
    });

}

function createCompleteTodoDecorations() {
    // dispose existing decorations if present
    try { TODO_COMPLETE_HIGHLIGHT_DEC && TODO_COMPLETE_HIGHLIGHT_DEC.dispose(); } catch (e) { /* ignore */ }

    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const bg = cfg.get('completeBackground', '#1a4420');
    const fontColor = cfg.get('completeFontColor', '#8de7a8e6');
    var underline = cfg.get('completeUnderlineColor', '#00ff40e6');
    const isWhole = cfg.get('isWholeLine', true);
    const underlineEnabled = cfg.get('underlineEnabled', true);
    if (!underlineEnabled) {
        underline = 'transparent';
    }


    TODO_COMPLETE_HIGHLIGHT_DEC = vscode.window.createTextEditorDecorationType({
        backgroundColor: bg,
        color: fontColor,
        borderRadius: '3px',
        fontWeight: 'bold',
        overviewRulerColor: 'transparent',
        overviewRulerLane: vscode.OverviewRulerLane.Left,
        textDecoration: `underline; text-decoration-color: ${underline}; text-decoration-thickness: 2px;`,
        isWholeLine: !!isWhole
    });

}

createTodoDecorations();
createCompleteTodoDecorations();



// function shouldApplyLineDec(line, regex){
//     const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
//     const enabled = cfg.get('enabled', true);
//     if (!enabled) return false;
//     var lineMatches = regex.test(line.text);
//     return lineMatches;
// }


function applyLineDec(lineNum, line, regex, ranges = []) {
    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const enabled = cfg.get('enabled', true);
    const isWhole = cfg.get('isWholeLine', true);

    if (!enabled) return ranges;

    // 🔥 CRITICAL FIX — prevent global regex state bleed
    regex.lastIndex = 0;

    if (!regex.test(line.text)) return ranges;

    if (isWhole) {
        ranges.push(line.range);
    } else {
        const text = line.text;
        const firstNonWs = text.search(/\S/);
        if (firstNonWs === -1) return ranges;

        const trimmedEnd = text.replace(/\s+$/, '').length;
        const startPos = new vscode.Position(lineNum, firstNonWs);
        const endPos = new vscode.Position(lineNum, trimmedEnd);
        ranges.push(new vscode.Range(startPos, endPos));
    }

    return ranges;
}


// function applyLineDec(lineNum,line, regex,ranges=[]) {
//     const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
//     const enabled = cfg.get('enabled', true);
//     const isWhole = cfg.get('isWholeLine', true);


//     if (!enabled) return ranges;
//     var lineMatches = regex.test(line.text);
//     if (!lineMatches) return ranges;


//     if (isWhole) {
//         // highlight the full line range
//         ranges.push(line.range);
//     } else {
//         // highlight only the visible text on the line (trim leading/trailing whitespace)
//         const text = line.text;
//         const firstNonWs = text.search(/\S/);
//         if (firstNonWs === -1) return ranges; // blank line
//         const trimmedEnd = text.replace(/\s+$/,'').length;
//         const startPos = new vscode.Position(lineNum, firstNonWs);
//         const endPos = new vscode.Position(lineNum, trimmedEnd);
//         ranges.push(new vscode.Range(startPos, endPos));
//     }
//     return ranges;
// }


/**
 * Update decorations for TODO lines in the provided editor (or active editor if omitted)
 */
function updateTodoHighlights(editor) {
    try {
        editor = editor || vscode.window.activeTextEditor;
        if (!editor) return;

        // Master on/off config
        const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
        const enabled = cfg.get('enabled', true);
        // const isWhole = cfg.get('isWholeLine', true);

        if (!enabled) {
            try {
                editor.setDecorations(TODO_HIGHLIGHT_DEC, []);
                editor.setDecorations(TODO_COMPLETE_HIGHLIGHT_DEC, []);
            } catch (e) {}
            return;
        }

        const doc = editor.document;

        if (doc.isBinary) return;
        if (doc.getText().length > 200000) return; // skip very large files

        var incomplete_ranges = [];
        var complete_ranges = [];

        // const ranges = [];
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i);


            incomplete_ranges = applyLineDec(i, line, TODO_REGEX, incomplete_ranges);
            complete_ranges = applyLineDec(i, line, TODO_COMPLETE_REGEX, complete_ranges);
        }

        editor.setDecorations(TODO_HIGHLIGHT_DEC, incomplete_ranges);
        editor.setDecorations(TODO_COMPLETE_HIGHLIGHT_DEC, complete_ranges);

    } catch (err) {
        console.error('updateTodoHighlights error', err);
    }
}
function triggerTodoUpdate(editor) {
    clearTimeout(todoUpdateTimeout);
    todoUpdateTimeout = setTimeout(() => updateTodoHighlights(editor), 120);
}

/**
/**
 * Registers // TODO []: (javascript,frontend)  support and related behaviors for the extension.
 *
 * Responsibilities:
 * - Disposes of the // TODO []: (javascript,frontend)  decoration (TODO_HIGHLIGHT_DEC) when the extension is deactivated.
 * - Registers a CodeLens provider that scans each text document line for TODO_REGEX and
 *   adds a "Complete" CodeLens which invokes the 'colemenutils.completeTodo' command
 *   with { uri, line } arguments.
 * - Registers the 'colemenutils.completeTodo' command which:
 *     - Opens the document for the given URI, validates the line number and TODO_REGEX,
 *     - Replaces the first unchecked mark (e.g. "[ ]") with a formatted completion date
 *       (via formatDateForTodo) and obfuscates "TODO"/"FIXME" with "XXX",
 *     - Applies the WorkspaceEdit and optionally reveals the edited line in the visible editor,
 *     - Catches errors, logs them, and shows a user-facing error message on failure.
 * - Adds listeners to update highlights and CodeLenses:
 *     - vscode.window.onDidChangeActiveTextEditor
 *     - vscode.workspace.onDidChangeTextDocument (to trigger visual updates when the active document changes)
 *     - vscode.workspace.onDidChangeConfiguration (recreates decoration types when
 *       'colemenutils.todoCodeLens' config changes and triggers an update)
 * - Implements an automatic "todo" text replacement feature on typing that:
 *     - Watches text document changes and, when enabled (colemenutils.todoCodeLens.enabled),
 *       detects simple insertions that end with the token "todo" and an insertion containing spaces,
 *     - Replaces the typed token with a language-appropriate comment // TODO []: (javascript,frontend)  (e.g. "// TODO []: (tags)"),
 *     - Infers simple comment syntaxes for common languages and appends tags (language, frontend/backend),
 *     - Uses a suppression set (_suppressAutoReplace) to avoid reacting to its own WorkspaceEdits,
 *     - Attempts to position the caret inside the inserted template for convenience.
 * - Performs an initial triggerTodoUpdate on registration to populate decorations/CodeLenses.
 *
 * Important external dependencies (expected to be defined in the surrounding module):
 * - vscode (VS Code extension API)
 * - TODO_HIGHLIGHT_DEC (decoration type)
 * - TODO_REGEX (RegExp used to detect TODO/FIXME)
 * - triggerTodoUpdate(documentEditor)
 * - createTodoDecorations()
 * - _suppressAutoReplace (Set or similar used to avoid self-triggered edits)
 * - formatDateForTodo(date)
 *
 * Side effects:
 * - Mutates context.subscriptions by pushing disposables and registrations.
 * - Modifies documents when the "Complete" CodeLens is executed or when the auto-replace triggers.
 * - Shows an error message to the user on failure of the completion command.
 *
 * Configuration:
 * - Respects the 'colemenutils.todoCodeLens.enabled' configuration key for the auto-replace behavior.
 *
 * @param {vscode.ExtensionContext} context - The extension activation context; used to register disposables.
 * @returns {void}
 * @example
 * // Called from extension activation:
 * // registerTodoCodeLens(context);
 */
function registerTodoCodeLens(context) {
    // ensure decoration is disposed with extension
    context.subscriptions.push({ dispose: () => TODO_HIGHLIGHT_DEC.dispose() });

    const provider = new class {
        async provideCodeLenses(document) {
            const lenses = [];
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                TODO_REGEX.lastIndex = 0;
                if (TODO_REGEX.test(line.text)) {
                    lenses.push(new vscode.CodeLens(line.range, {
                        title: 'Complete',
                        command: 'colemenutils.completeTodo',
                        arguments: [{ uri: document.uri.toString(), line: i }]
                    }));
                }
            }
            return lenses;
        }
    }();

    /**
     * This subscription is responsible for:
     * - Registering the CodeLens provider for file and untitled schemes, which scans for TODO_REGEX and adds "Complete" CodeLenses.
     * - Registering the 'colemenutils.completeTodo' command that completes a TODO item by replacing the unchecked mark with a timestamp and obfuscating the TODO text.
     */
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider([{ scheme: 'file' }, { scheme: 'untitled' }], provider),
        vscode.commands.registerCommand('colemenutils.completeTodo', async (args) => {
            try {
                var cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
                if (!args || !args.uri) return;
                const uri = vscode.Uri.parse(args.uri);
                const doc = await vscode.workspace.openTextDocument(uri);
                const lineNum = args.line;
                if (lineNum == null || lineNum < 0 || lineNum >= doc.lineCount) return;
                const line = doc.lineAt(lineNum);
                // await vscode.commands.executeCommand("colemenutils.dailyContractGenerateSummary");
                if (!TODO_REGEX.test(line.text)) return;



                var completedText = line.text.replace(/\[\s*\]/gi,`[${formatDateForTodo(new Date())}]`)
                // var completedText = line.text.replace(/\[\s*\]/gi,`[${new Date().toISOString()}]`)
                completedText = completedText.replace(/\b(TODO|FIX.?ME)\b/gi,'XXX');
                // Example "complete" transformation: replace first TODO with DONE and append timestamp
                // const completedText = line.text.replace(TODO_REGEX, 'DONE') + ` // completed ${new Date().toISOString()}`;


                if (cfg.get("useMarkdownTodo", true) && doc.languageId === 'markdown') {
                    // For markdown, replace "- [ ]" with "- [x]" to mark as complete, and append completion date
                    completedText = line.text.replace(/-\s*\[\s*\]\s*\b(TODO|FIX.?ME)\b/gi, `- [x] [${formatDateForTodo(new Date())}]`);
                }


                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, line.range, completedText);
                await vscode.workspace.applyEdit(edit);

                // Optional: reveal the edited line in the active editor
                const active = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
                if (active) {
                    const pos = new vscode.Position(lineNum, 0);
                    active.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
                }


            } catch (err) {
                console.error('completeTodo error', err);
                vscode.window.showErrorMessage('Failed to complete TODO');
            }
        }),
        // listeners for updating highlights
        vscode.window.onDidChangeActiveTextEditor(editor => triggerTodoUpdate(editor)),
        vscode.workspace.onDidChangeTextDocument(e => {
            const active = vscode.window.activeTextEditor;
            if (active && e.document && e.document.uri.toString() === active.document.uri.toString()) {
                triggerTodoUpdate(active);
            }
        })
    );


    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            // recreate decoration types when any todoCodeLens setting changes so
            // the decoration's isWholeLine flag (and colors) are updated immediately
            if (e.affectsConfiguration('colemenutils.todoCodeLens')) {
                try { createTodoDecorations(); } catch (err) { console.error('createTodoDecorations error', err); }
                triggerTodoUpdate(vscode.window.activeTextEditor);
            }
        })
    );

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (e) => {
        try {
            if (!e.contentChanges || e.contentChanges.length === 0) return;
            const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
            if (!cfg.get('enabled', true)) return;

            const doc = e.document;
            const uriStr = doc.uri.toString();
            if (_suppressAutoReplace.has(uriStr)) return;

            for (const change of e.contentChanges) {
                // only handle simple insertions (no replacement) that include two spaces
                if (change.rangeLength !== 0) continue;
                if (!change.text.includes(' ')) continue;
                // await vscode.commands.executeCommand("colemenutils.dailyContractGenerateSummary");

                const pos = change.range.start; // insertion point (after typed text)
                const lineText = doc.lineAt(pos.line).text;
                const before = lineText.substring(0, pos.character);

                // match "todo" at end of the text before the insertion (case-insensitive)
                if (!/\btodo$/i.test(before)) continue;

                const startChar = Math.max(0, pos.character - 4); // start of "todo"
                const replaceRange = new vscode.Range(
                    new vscode.Position(pos.line, startChar),
                    new vscode.Position(pos.line, pos.character + change.text.length)
                );

                const lang = doc.languageId;
                var commentSyntax = '//'; // default
                var commentSyntaxEnd = ''; // default
                var carretOffset = 0;
                var formatForMarkdown = cfg.get("useMarkdownTodo", true) && lang === 'markdown';
                // console.log("Detected 'todo' insertion in language:", lang);
                var tags = [];
                if (cfg.get("includeLanguageTag", true) && !formatForMarkdown) {
                    tags.push(lang);
                }
                var defaultTags = cfg.get("defaultTags", []);
                if (Array.isArray(defaultTags)) {
                    tags.push(...defaultTags);
                }
                // simple mapping of some common languages to comment syntax
                if (['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'php', 'go', 'rust'].includes(lang)) {
                    commentSyntax = '//';
                }
                else if (['python', 'ruby', 'perl'].includes(lang)) {
                    commentSyntax = '#';
                }
                else if (lang === 'shellscript') {
                    commentSyntax = '#';
                }
                else if (lang === 'html' || lang === 'xml' || lang === 'svg') {
                    commentSyntax = '<!--';
                    commentSyntaxEnd = ' -->';
                }
                else if (lang === 'css' || lang === 'scss' || lang === 'less') {
                    commentSyntax = '/*';
                    commentSyntaxEnd = ' */';
                    carretOffset = 1;
                }


                // if ([
                //     'javascriptreact',
                //     'typescriptreact',
                //     'css',
                //     'scss',
                //     'less',
                // ].includes(lang)) {
                //     tags.push('frontend');
                // }
                // if (['php'].includes(lang)) {
                //     tags.push('backend');
                // }
                var tagString = tags.join(',')
                // console.log("Inserting TODO with tags:", tagString);
                var insertText = `${commentSyntax} TODO []: (${tagString}) ${commentSyntaxEnd}`; // desired replacement
                if (formatForMarkdown) {
                    // For markdown, use a more markdown-friendly format (with respect to settings)
                    // e.g. "- [ ] TODO: " with comment end as a placeholder for caret
                    var insertText = `- [ ] TODO (${tagString}) `;
                }


                const edit = new vscode.WorkspaceEdit();
                edit.replace(doc.uri, replaceRange, insertText);

                // mark to avoid reacting to our own WorkspaceEdit
                _suppressAutoReplace.add(uriStr);
                const applied = await vscode.workspace.applyEdit(edit);
                // remove suppression soon after
                setTimeout(() => _suppressAutoReplace.delete(uriStr), 500);

                if (applied) {
                    // position cursor before commentSyntaxEnd (or inside parentheses if present)
                    const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uriStr);
                    if (editor) {
                        const N = carretOffset; // number of chars to move the caret left of the anchor
                        let caretIndexInInsert = -1;

                        // prefer to place inside '()' if present
                        const parenPos = insertText.indexOf('()');
                        if (parenPos >= 0) {
                            caretIndexInInsert = parenPos + 1; // inside the parentheses
                        } else if (commentSyntaxEnd && insertText.indexOf(commentSyntaxEnd) >= 0) {
                            // place N chars left of the comment end marker
                            caretIndexInInsert = insertText.indexOf(commentSyntaxEnd) - N+1;
                        } else {
                            // fallback: N chars left of the end of the inserted text
                            caretIndexInInsert = insertText.length - N;
                        }

                        caretIndexInInsert = Math.max(0, caretIndexInInsert);
                        const cursorPos = new vscode.Position(pos.line, startChar + caretIndexInInsert);
                        editor.selection = new vscode.Selection(cursorPos, cursorPos);
                        editor.revealRange(new vscode.Range(cursorPos, cursorPos));
                    }
                }
                break; // handled one change
            }
        } catch (err) {
            console.error('auto-replace todo error', err);
        }
    }));

    // initial run
    triggerTodoUpdate(vscode.window.activeTextEditor);
}

module.exports = { registerTodoCodeLens };