const vscode = require('vscode');

let _suppressAutoReplace = new Set();
let MSTEP_DECS = new Map();
let mstepUpdateTimeout;

/* tag -> color defaults */
const DEFAULT_TAG_COLORS = {
    'EVENT': [undefined, '#b488ff6e'],
    'IF': ['#e4f3a0', '#4e5a18'],
    'LOOP': ['#d0bfff', '#4e2c85'],
    'ELSE': ['#adb5bd', '#6c757d'],
    'RETURN': ['#dd7db2', '#701e4b'],
    'EVENT-CLICK': ['#5b97af', '#1f5a72'],
    '': ['#c09cff', '#6e42c171'] // empty tag
};

// This becomes the source of truth at runtime (merged + normalized)
let CURRENT_TAG_COLORS = normalizeTagColors(DEFAULT_TAG_COLORS);

const MSTEP_FIND_RE = /[^a-zA-Z0-9]{1,2}\s*@Mstep\s*\[([^\]]*)\][^(\n|\r|\r\n|\n\r)]*/i;
const MSTEP_TRIGGER_RE = /mstep\s*([a-z0-9\-]*)\s$/i;

function getConfiguredTagColors() {
    const cfg = vscode.workspace.getConfiguration('colemenutils.mstepHighlighting');
    const user = cfg.get('tagColors');

    // Merge: user overrides defaults, but defaults remain if missing
    // If user sets a key, it replaces that key’s value.
    const merged = { ...DEFAULT_TAG_COLORS, ...(user || {}) };
    return normalizeTagColors(merged);
}

/**
 * Accepts values in either:
 *   - [fg, bg]
 *   - { fg, bg }
 * Normalizes to: { TAG: [fgOrUndefined, bgOrUndefined] } with TAG uppercased.
 */
function normalizeTagColors(input) {
    const out = {};
    if (!input || typeof input !== 'object') return { ...DEFAULT_TAG_COLORS };

    for (const [rawKey, rawVal] of Object.entries(input)) {
        const key = (rawKey === null || rawKey === undefined ? '' : rawKey).toString().toUpperCase();

        let fg;
        let bg;

        if (Array.isArray(rawVal)) {
            fg = rawVal[0];
            bg = rawVal[1];
        } else if (rawVal && typeof rawVal === 'object') {
            fg = rawVal.fg;
            bg = rawVal.bg;
        } else {
            continue;
        }

        // Normalize null -> undefined for fg (so VSCode uses default text color)
        if (fg === null) fg = undefined;

        // Basic sanity: bg must be present to be useful; skip if not
        if (typeof bg !== 'string' || bg.trim() === '') continue;

        // fg may be undefined or string
        if (fg !== undefined && typeof fg !== 'string') fg = undefined;

        out[key] = [fg, bg];
    }

    // Ensure empty-tag fallback always exists
    if (!out.hasOwnProperty('')) out[''] = DEFAULT_TAG_COLORS[''];

    return out;
}

function createMstepDecorations() {
    // dispose old
    for (const dec of MSTEP_DECS.values()) {
        try { dec.dispose(); } catch (e) {}
    }
    MSTEP_DECS.clear();

    // Refresh runtime colors
    CURRENT_TAG_COLORS = getConfiguredTagColors();

    for (const [tag, color] of Object.entries(CURRENT_TAG_COLORS)) {
        MSTEP_DECS.set(tag.toUpperCase(), vscode.window.createTextEditorDecorationType({
        backgroundColor: color[1],
        color: color[0],
        borderRadius: '3px',
        overviewRulerColor: color[1],
        overviewRulerLane: vscode.OverviewRulerLane.Center,
        isWholeLine: false
        }));
    }
}

function applyMstepLineRanges(lineNum, line, map) {
    const txt = line.text;
    let m;
    const re = new RegExp(MSTEP_FIND_RE.source, 'gi');

    while ((m = re.exec(txt)) !== null) {
        const tag = (m[1] || '').toUpperCase();

        // IMPORTANT: use CURRENT_TAG_COLORS, not DEFAULT_TAG_COLORS
        const normalized = Object.prototype.hasOwnProperty.call(CURRENT_TAG_COLORS, tag)
        ? tag
        : ''; // fallback to empty-tag decoration for unknown tags

        const start = new vscode.Position(lineNum, m.index);
        const end = new vscode.Position(lineNum, m.index + m[0].length);
        if (!map.has(normalized)) map.set(normalized, []);
        map.get(normalized).push(new vscode.Range(start, end));
    }

    return map;
}

function updateMstepHighlights(editor) {
    clearTimeout(mstepUpdateTimeout);
    mstepUpdateTimeout = setTimeout(() => {
        try {
        editor = editor || vscode.window.activeTextEditor;
        if (!editor) return;
        const doc = editor.document;
        if (!doc || doc.isBinary) return;

        const rangesByTag = new Map();
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i);
            if (MSTEP_FIND_RE.test(line.text)) {
            applyMstepLineRanges(i, line, rangesByTag);
            }
        }

        for (const key of MSTEP_DECS.keys()) {
            editor.setDecorations(MSTEP_DECS.get(key), []);
        }

        for (const [tag, ranges] of rangesByTag.entries()) {
            const dec = MSTEP_DECS.get(tag) || MSTEP_DECS.get('');
            if (dec) editor.setDecorations(dec, ranges);
        }
        } catch (err) {
        console.error('updateMstepHighlights error', err);
        }
    }, 120);
}

function detectCommentSyntax(lang) {
    let start = '//', end = '';
    if (['python', 'ruby', 'perl', 'shellscript'].includes(lang)) start = '#';
    else if (['html', 'xml', 'svg'].includes(lang)) { start = '<!--'; end = ' -->'; }
    return { start, end };
}

function registerMstep(context) {
    createMstepDecorations();

    context.subscriptions.push({
        dispose: () => {
        for (const d of MSTEP_DECS.values()) {
            try { d.dispose(); } catch (e) {}
        }
        }
    });

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => updateMstepHighlights(editor)),
        vscode.workspace.onDidChangeTextDocument(e => {
        const active = vscode.window.activeTextEditor;
        if (active && e.document && e.document.uri.toString() === active.document.uri.toString()) {
            updateMstepHighlights(active);
        }
        })
    );

    // Recreate decorations if settings change
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
        // IMPORTANT: match the actual setting path you used
        if (e.affectsConfiguration('colemenutils.mstepHighlighting.tagColors')) {
            try { createMstepDecorations(); } catch (err) { console.error(err); }
            updateMstepHighlights(vscode.window.activeTextEditor);
        }
        })
    );

    // autocomplete replacements for "mstep" triggers
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (e) => {
        try {
            if (!e.contentChanges || e.contentChanges.length === 0) return;
            const doc = e.document;
            const uriStr = doc.uri.toString();
            if (_suppressAutoReplace.has(uriStr)) return;

            for (const change of e.contentChanges) {
                // only handle simple insertions
                if (change.rangeLength !== 0) continue;
                if (!/\s|[A-Za-z0-9\-]/.test(change.text)) continue;

                const pos = change.range.start;
                const lineText = doc.lineAt(pos.line).text;
                const before = lineText.substring(0, pos.character);

                const m = MSTEP_TRIGGER_RE.exec(before);
                if (!m) continue;

                const rawTag = (m[1] || '').toUpperCase();
                const tag = rawTag || ''; // allow empty
                const lang = doc.languageId;
                const { start: commentStart, end: commentEnd } = detectCommentSyntax(lang);

                const insertText = `${commentStart} @Mstep [${tag}] ${commentEnd}`;
                const replaceRange = new vscode.Range(
                    new vscode.Position(pos.line, Math.max(0, pos.character - m[0].length)),
                    new vscode.Position(pos.line, pos.character + change.text.length)
                );

                const edit = new vscode.WorkspaceEdit();
                edit.replace(doc.uri, replaceRange, insertText);

                _suppressAutoReplace.add(uriStr);
                const applied = await vscode.workspace.applyEdit(edit);
                setTimeout(() => _suppressAutoReplace.delete(uriStr), 500);

                if (applied) {
                    // place caret inside the brackets if empty, else after tag
                    const editor = vscode.window.visibleTextEditors.find(ed => ed.document.uri.toString() === uriStr);
                    if (editor) {
                        // const brIndex = insertText.indexOf('[');
                        const closeIndex = insertText.indexOf(']');
                        let caretChar = closeIndex + 2; // default just after tag
                        // if (brIndex >= 0 && closeIndex === brIndex + 1) {
                        //     // empty brackets -> put caret between them
                        //     caretChar = brIndex + 1;
                        // }
                        const cursorPos = new vscode.Position(pos.line, (Math.max(0, pos.character - m[0].length)) + caretChar);
                        editor.selection = new vscode.Selection(cursorPos, cursorPos);
                        editor.revealRange(new vscode.Range(cursorPos, cursorPos));
                    }
                }
                break;
            }
        } catch (err) {
            console.error('mstep auto-replace error', err);
        }
    }));

    updateMstepHighlights(vscode.window.activeTextEditor);
}

module.exports = { registerMstep };
