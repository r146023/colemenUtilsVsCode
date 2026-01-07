const vscode = require('vscode');

let _suppressAutoReplace = new Set();
let MSTEP_DECS = new Map();
let mstepUpdateTimeout;

/* tag -> color defaults */
const TAG_COLORS = {
    'EVENT': [undefined,'#b388ff'],
    'IF': ['#e4f3a0','#4e5a18'],
    'LOOP': ['#d0bfff','#4e2c85'],
    'ELSE': ['#adb5bd','#6c757d'],
    'RETURN': ['#dd7db2','#701e4b'],
    'EVENT-CLICK': ['#5b97af','#1f5a72'],
    '': ['#c09cff','#6f42c1'] // empty tag
};
// const TAG_COLORS = {
//     'EVENT': '#b388ff',
//     'IF': '#4d8199',
//     'LOOP': '#4e2c85',
//     'ELSE': '#adb5bd',
//     'RETURN': '#95d5b2',
//     'EVENT-CLICK': '#ff6bcb',
//     '': '#c09cff' // empty tag
// };

const MSTEP_FIND_RE = /[^a-zA-Z0-9]{1,2}\s*@Mstep\s*\[([^\]]*)\][^(\n|\r|\r\n|\n\r)]*/i;
const MSTEP_TRIGGER_RE = /mstep\s*([a-z0-9\-]*)\s$/i;

function createMstepDecorations() {
    // dispose old
    for (const dec of MSTEP_DECS.values()) {
        try { dec.dispose(); } catch (e) {}
    }
    MSTEP_DECS.clear();

    for (const [tag, color] of Object.entries(TAG_COLORS)) {
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
        const normalized = TAG_COLORS.hasOwnProperty(tag) ? tag : (tag === '' ? '' : tag);
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

            // collect ranges per tag
            const rangesByTag = new Map();
            for (let i = 0; i < doc.lineCount; i++) {
                const line = doc.lineAt(i);
                if (MSTEP_FIND_RE.test(line.text)) {
                    applyMstepLineRanges(i, line, rangesByTag);
                }
            }

            // clear all first
            for (const key of MSTEP_DECS.keys()) {
                editor.setDecorations(MSTEP_DECS.get(key), []);
            }

            // apply
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

    context.subscriptions.push({ dispose: () => {
        for (const d of MSTEP_DECS.values()) try { d.dispose(); } catch (e) {}
    }});

    // update on editor/document changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => updateMstepHighlights(editor)),
        vscode.workspace.onDidChangeTextDocument(e => {
            const active = vscode.window.activeTextEditor;
            if (active && e.document && e.document.uri.toString() === active.document.uri.toString()) {
                updateMstepHighlights(active);
            }
        })
    );

    // config change recreate decs (if you later add color settings)
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('colemenutils.mstep') || e.affectsConfiguration('colemenutils')) {
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
    
    // initial highlight
    updateMstepHighlights(vscode.window.activeTextEditor);
}

module.exports = { registerMstep };