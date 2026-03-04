const vscode = require('vscode');

let TODO_HIGHLIGHT_DEC = null;
let TODO_COMPLETE_HIGHLIGHT_DEC = null;

// const TODO_REGEX = /\b(TODO|FIXME)\b/gi;
// const TODO_REGEX = /(?:\b(-\s*\[\s*\]\s*)?\b(TODO|FIXME)\s*|\b(TODO|FIXME)\s*\[\s*\])/gi;
const TODO_REGEX = /(?:(-\s*\[\s*\]\s*)\s*(TODO|FIXME|BUG)\s*|\b(TODO|FIXME|BUG)\s*\[\s*\])/gi;
// const TODO_REGEX = /\b(TODO|FIXME)\s*\[\s*\]/gi;
const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\])/i;
// const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\b)/i;
// const TODO_COMPLETE_REGEX = /\bXXX\b/i;

let todoUpdateTimeout;
let _suppressAutoReplace = new Set();

function pad(n) { return n.toString().padStart(2, '0'); }

function formatDateForTodo(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// TODO []: (javascript) something

/**
 * Daily contract detection (conservative):
 * - Must be markdown
 * - Must either:
 *   - live in a path containing "daily contract" or "daily contracts"
 *   - OR have a yyyy-mm-dd filename (common daily note/contract pattern)
 */
function isDailyContractDocument(doc) {
    try {
        if (!doc) return false;
        if (doc.languageId !== 'markdown') return false;

        const fileName = (doc.fileName || '').toLowerCase();
        const base = fileName.split(/[\\/]/).pop() || '';

        const pathLooksLikeDailyContract =
            fileName.includes('daily contract') || fileName.includes('daily contracts');

        const baseLooksLikeDate =
            /^\d{4}-\d{2}-\d{2}(\.md|\.markdown)$/i.test(base);

        return !!(pathLooksLikeDailyContract || baseLooksLikeDate);
    } catch (e) {
        return false;
    }
}

/**
 * Likert TODOs for daily contracts:
 *   - [ ] TODO (health,sleep) Sleep Quality
 *   - [ ] TODO (health,focus) Focus Quality
 *
 * We intentionally ONLY match markdown checklist items with TODO + optional tag parens.
 */
const LIKERT_TODO_REGEX = /^\s*-\s*\[\s*\]\s*TODO\b/i;

/**
 * Parse a Likert TODO line into parts.
 * Returns null if not a match.
 *
 * Expected general forms:
 * - [ ] TODO (tags) Label text
 * - [ ] TODO Label text
 *
 * We keep the original "(...)" segment (if present) as-is.
 */
function parseLikertTodoLine(lineText) {
    // groups:
    // 1: tagsWithParens "(health,sleep)" (optional)
    // 2: label "Sleep Quality" (rest, trimmed)
    const re = /^\s*-\s*\[\s*\]\s*TODO\b(?:\s+(\([^)]*\)))?\s*(.*)\s*$/i;
    const m = lineText.match(re);
    if (!m) return null;

    const tagsWithParens = (m[1] || '').trim(); // includes parentheses if present
    const label = (m[2] || '').trim();

    return { tagsWithParens, label };
}

function normalizeTagList(tagStr) {
    // input might be "(health,sleep)" or "health, sleep"
    if (!tagStr) return '';
    let s = String(tagStr).trim();
    if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1);

    // normalize: split, trim, drop empties, join with comma (stable ordering preserved)
    return s
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .join(',');
}

function normalizeLabel(label) {
    return (label || '').trim();
}

function normalizeLikertType(t) {
    return (t || '').toString().trim();
}

/**
 * Built-in Likert option sets.
 * You can add more here freely.
 */
function getBuiltInLikertTypes() {
    return {
        goodBad: [
            'Very Good',
            'Good',
            'Somewhat Good',
            'Neutral',
            'Somewhat Bad',
            'Bad',
            'Very Bad'
        ],
        agreement: [
            'Strongly Agree',
            'Agree',
            'Somewhat Agree',
            'Neutral',
            'Somewhat Disagree',
            'Disagree',
            'Strongly Disagree'
        ],
        frequency: [
            'Always',
            'Often',
            'Sometimes',
            'Neutral',
            'Rarely',
            'Never'
        ],
        effort: [
            'Very High',
            'High',
            'Somewhat High',
            'Neutral',
            'Somewhat Low',
            'Low',
            'Very Low'
        ]
    };
}

/**
 * Optional user-defined likert types:
 * "colemenutils.todoCodeLens.likertTypes": {
 *   "mood": ["Amazing","Good","Ok","Neutral","Bad","Awful"],
 *   ...
 * }
 */
function getCustomLikertTypesFromConfig() {
    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const raw = cfg.get('likertTypes', null);

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

    const out = {};
    for (const [key, val] of Object.entries(raw)) {
        const typeKey = normalizeLikertType(key);
        if (!typeKey) continue;
        if (!Array.isArray(val)) continue;

        const opts = val.map(x => (x == null ? '' : String(x).trim())).filter(Boolean);
        if (opts.length < 2) continue;

        out[typeKey] = opts;
    }
    return out;
}

function resolveLikertOptions(likertType) {
    const typeKey = normalizeLikertType(likertType) || 'goodBad';

    // Custom types override built-ins (same key)
    const custom = getCustomLikertTypesFromConfig();
    if (custom[typeKey]) return custom[typeKey];

    const builtIn = getBuiltInLikertTypes();
    if (builtIn[typeKey]) return builtIn[typeKey];

    // Unknown type fallback:
    return builtIn.goodBad;
}

/**
 * likertWhitelist entries:
 * [
 *   { tags: "health,sleep", label: "Sleep Quality", likert: "goodBad" },
 *   { tags: "general", label: "I feel productive", likert: "agreement" }
 * ]
 */
function getLikertWhitelist() {
    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const raw = cfg.get('likertWhitelist', []);
    if (!Array.isArray(raw)) return [];

    return raw
        .map(e => {
            if (!e || typeof e !== 'object') return null;

            const tags = normalizeTagList(e.tags);
            const label = normalizeLabel(e.label);
            if (!tags || !label) return null;

            const likert = normalizeLikertType(e.likert) || 'goodBad';
            return { tags, label, likert };
        })
        .filter(Boolean);
}

/**
 * Returns the matched whitelist entry (including likert type) or null.
 */
function matchLikertWhitelistEntry(parsed, whitelist) {
    const tags = normalizeTagList(parsed.tagsWithParens);
    const label = normalizeLabel(parsed.label);

    if (!tags || !label) return null;

    return whitelist.find(w => w.tags === tags && w.label === label) || null;
}

/**
 * Complete a Likert TODO line to the requested format:
 *   - [x] [YYYY-MM-DD HH:mm:ss] (tags) Label: Rating
 */
function buildLikertCompletedLine(originalLineText, rating) {
    const parsed = parseLikertTodoLine(originalLineText);
    if (!parsed) return null;

    const ts = formatDateForTodo(new Date());
    const tagsPart = parsed.tagsWithParens ? `${parsed.tagsWithParens} ` : '';
    const labelPart = parsed.label || '';

    const suffix = labelPart ? `${labelPart}: ${rating}` : `: ${rating}`;
    return `- [x] [${ts}] ${tagsPart}${suffix}`.replace(/\s+$/, '');
}

function createTodoDecorations() {
    try { TODO_HIGHLIGHT_DEC && TODO_HIGHLIGHT_DEC.dispose(); } catch (e) { /* ignore */ }

    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const bg = cfg.get('highlightBackground', '#441a34');
    const fontColor = cfg.get('fontColor', '#e78de3e6');
    var underline = cfg.get('underlineColor', '#ff00f2e6');
    const isWhole = cfg.get('isWholeLine', true);
    const underlineEnabled = cfg.get('underlineEnabled', true);
    if (!underlineEnabled) underline = 'transparent';

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
    try { TODO_COMPLETE_HIGHLIGHT_DEC && TODO_COMPLETE_HIGHLIGHT_DEC.dispose(); } catch (e) { /* ignore */ }

    const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
    const bg = cfg.get('completeBackground', '#1a4420');
    const fontColor = cfg.get('completeFontColor', '#8de7a8e6');
    var underline = cfg.get('completeUnderlineColor', '#00ff40e6');
    const isWhole = cfg.get('isWholeLine', true);
    const underlineEnabled = cfg.get('underlineEnabled', true);
    if (!underlineEnabled) underline = 'transparent';

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

/**
 * Update decorations for TODO lines in the provided editor (or active editor if omitted)
 */
function updateTodoHighlights(editor) {
    try {
        editor = editor || vscode.window.activeTextEditor;
        if (!editor) return;

        const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
        const enabled = cfg.get('enabled', true);

        if (!enabled) {
            try {
                editor.setDecorations(TODO_HIGHLIGHT_DEC, []);
                editor.setDecorations(TODO_COMPLETE_HIGHLIGHT_DEC, []);
            } catch (e) {}
            return;
        }

        const doc = editor.document;

        if (doc.isBinary) return;
        if (doc.getText().length > 200000) return;

        var incomplete_ranges = [];
        var complete_ranges = [];

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
 * Registers // TODO []: (javascript,frontend) support and related behaviors for the extension.
 */
function registerTodoCodeLens(context) {
    context.subscriptions.push({ dispose: () => TODO_HIGHLIGHT_DEC.dispose() });
    context.subscriptions.push({ dispose: () => TODO_COMPLETE_HIGHLIGHT_DEC.dispose() });

    const provider = new class {
        async provideCodeLenses(document) {
            const lenses = [];

            const isDailyContract = isDailyContractDocument(document);
            const likertWhitelist = isDailyContract ? getLikertWhitelist() : [];

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);

                // Likert lenses ONLY in daily contract files AND only for whitelisted todos (with per-entry likert type)
                if (isDailyContract) {
                    if (LIKERT_TODO_REGEX.test(line.text)) {
                        const parsed = parseLikertTodoLine(line.text);
                        if (parsed) {
                            const entry = matchLikertWhitelistEntry(parsed, likertWhitelist);
                            if (entry) {
                                const options = resolveLikertOptions(entry.likert);

                                for (let idx = 0; idx < options.length; idx++) {
                                    const option = options[idx];
                                    const title =
                                        idx === 0 ? `${option} |`
                                      : idx === options.length - 1 ? `${option}`
                                      : `${option} |`;

                                    lenses.push(new vscode.CodeLens(line.range, {
                                        title,
                                        command: 'colemenutils.completeTodo',
                                        arguments: [{
                                            uri: document.uri.toString(),
                                            line: i,
                                            rating: option,
                                            mode: 'likert',
                                            likertType: entry.likert
                                        }]
                                    }));
                                }

                                // IMPORTANT: don't add generic "Complete" for whitelisted Likert todos
                                continue;
                            }
                        }
                    }
                }

                // Generic TODO lens everywhere else
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

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider([{ scheme: 'file' }, { scheme: 'untitled' }], provider),

        vscode.commands.registerCommand('colemenutils.completeTodo', async (args) => {
            try {
                const cfg = vscode.workspace.getConfiguration('colemenutils.todoCodeLens');
                if (!args || !args.uri) return;

                const uri = vscode.Uri.parse(args.uri);
                const doc = await vscode.workspace.openTextDocument(uri);

                const lineNum = args.line;
                if (lineNum == null || lineNum < 0 || lineNum >= doc.lineCount) return;

                const line = doc.lineAt(lineNum);

                // --- Likert completion path (ONLY for daily contract files AND only if still whitelisted) ---
                const isDailyContract = isDailyContractDocument(doc);
                if (args.mode === 'likert' && typeof args.rating === 'string') {
                    if (!isDailyContract) return;

                    const parsed = parseLikertTodoLine(line.text);
                    if (!parsed) return;

                    const whitelist = getLikertWhitelist();
                    const entry = matchLikertWhitelistEntry(parsed, whitelist);
                    if (!entry) return;

                    // Ensure the clicked rating is actually valid for the entry's likert type
                    const options = resolveLikertOptions(entry.likert);
                    if (!options.includes(args.rating)) return;

                    const completed = buildLikertCompletedLine(line.text, args.rating);
                    if (!completed) return;

                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(uri, line.range, completed);
                    await vscode.workspace.applyEdit(edit);

                    const active = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
                    if (active) {
                        const pos = new vscode.Position(lineNum, 0);
                        active.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
                    }

                    return;
                }

                // --- Generic completion path (existing behavior) ---
                TODO_REGEX.lastIndex = 0;
                if (!TODO_REGEX.test(line.text)) return;

                var completedText = line.text.replace(/\[\s*\]/gi, `[${formatDateForTodo(new Date())}]`);
                completedText = completedText.replace(/\b(TODO|FIX.?ME)\b/gi, 'XXX');

                if (cfg.get("useMarkdownTodo", true) && doc.languageId === 'markdown') {
                    completedText = line.text.replace(
                        /-\s*\[\s*\]\s*\b(TODO|FIX.?ME)\b/gi,
                        `- [x] [${formatDateForTodo(new Date())}]`
                    );
                }

                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, line.range, completedText);
                await vscode.workspace.applyEdit(edit);

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
            if (e.affectsConfiguration('colemenutils.todoCodeLens')) {
                try { createTodoDecorations(); } catch (err) { console.error('createTodoDecorations error', err); }
                try { createCompleteTodoDecorations(); } catch (err) { console.error('createCompleteTodoDecorations error', err); }
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

                var tags = [];
                if (cfg.get("includeLanguageTag", true) && !formatForMarkdown) {
                    tags.push(lang);
                }
                var defaultTags = cfg.get("defaultTags", []);
                if (Array.isArray(defaultTags)) {
                    tags.push(...defaultTags);
                }

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

                var tagString = tags.join(',');
                var insertText = `${commentSyntax} TODO []: (${tagString}) ${commentSyntaxEnd}`;
                if (formatForMarkdown) {
                    var insertText = `- [ ] TODO (${tagString}) `;
                }

                const edit = new vscode.WorkspaceEdit();
                edit.replace(doc.uri, replaceRange, insertText);

                _suppressAutoReplace.add(uriStr);
                const applied = await vscode.workspace.applyEdit(edit);
                setTimeout(() => _suppressAutoReplace.delete(uriStr), 500);

                if (applied) {
                    const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uriStr);
                    if (editor) {
                        const N = carretOffset;
                        let caretIndexInInsert = -1;

                        const parenPos = insertText.indexOf('()');
                        if (parenPos >= 0) {
                            caretIndexInInsert = parenPos + 1;
                        } else if (commentSyntaxEnd && insertText.indexOf(commentSyntaxEnd) >= 0) {
                            caretIndexInInsert = insertText.indexOf(commentSyntaxEnd) - N + 1;
                        } else {
                            caretIndexInInsert = insertText.length - N;
                        }

                        caretIndexInInsert = Math.max(0, caretIndexInInsert);
                        const cursorPos = new vscode.Position(pos.line, startChar + caretIndexInInsert);
                        editor.selection = new vscode.Selection(cursorPos, cursorPos);
                        editor.revealRange(new vscode.Range(cursorPos, cursorPos));
                    }
                }
                break;
            }
        } catch (err) {
            console.error('auto-replace todo error', err);
        }
    }));

    // initial run
    triggerTodoUpdate(vscode.window.activeTextEditor);
}

module.exports = { registerTodoCodeLens };