const vscode = require('vscode');
const figlet = require('figlet');
const { fileToArrayOfLines } = require('../helpers/editorHelpers');
const { getConfigValue } = require('../helpers/configHelpers');
const { humanizeString } = require('../helpers/textHelpers');
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
        vscode.commands.registerCommand('colemenutils.normalizeBlankLines', normalizeBlankLines),
        vscode.commands.registerCommand('colemenutils.stripPlusAndHyphenLines', stripPlusAndHyphenLines),
        vscode.commands.registerCommand('colemenutils.indentSelectedLines', indentSelectedLines),
        vscode.commands.registerCommand('colemenutils.wrapComments', wrapComments),
    );
}
// XXX [2026-02-04 11:42:27]: (javascript,frontend,textFormatting) Command that indents all selected lines (by moving cursor to start)

// TODO []: (javascript,frontend,textFormatting) Command that sets indentation of all selected lines to the lowest indentation level among them. 


/**
 * Remove entire lines that start with a hyphen (optionally leading spaces)
 * and remove leading plus signs (and any leading spaces) from lines that start with '+'.
 * Operates on the entire open document.
 */
async function stripPlusAndHyphenLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const originalText = document.getText();
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    // Split preserving content (handles CRLF/LF)
    const lines = originalText.split(/\r\n|\r|\n/);
    const outLines = [];

    for (const line of lines) {
        if (/^\s*-/.test(line)) {
            // Skip entire line if it starts (optionally after spaces) with a hyphen
            continue;
        }
        if (/^\s*\+/.test(line)) {
            // Remove leading spaces and the plus sign only
            outLines.push(line.replace(/^\s*\+/, ''));
            continue;
        }
        if (/^\s*[#/]+\s*...existing\s*code.../.test(line)){
            outLines.push(line.replace(/^\s*[#/]+\s*...existing\s*code.../, ''));
            continue;

        }
        outLines.push(line);
    }

    var newText = outLines.join(eol);
    // newText = humanizeString(newText);

    if (newText === originalText) return;

    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

    await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, newText);
    });
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



/**
 * Register:
 *   vscode.commands.registerCommand("wrapComments", wrapComments)
 */
async function wrapComments() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const doc = editor.document;
  const fullText = doc.getText();
  const LIMIT = 100;

  // Find C-style block comments: /* ... */
  // Non-greedy, includes newlines.
  const commentRe = /\/\*[\s\S]*?\*\//g;

  const edits = [];
  let match;

  while ((match = commentRe.exec(fullText)) !== null) {
    const startOffset = match.index;
    const endOffset = startOffset + match[0].length;
    const originalComment = match[0];

    var replacement = wrapBlockComment(originalComment, LIMIT);
    // replacement.replace(/\s*\*\s*(@[a-zA-Z0-9]*)/g,)


    if (replacement !== originalComment) {
      const range = new vscode.Range(doc.positionAt(startOffset), doc.positionAt(endOffset));
      edits.push({ startOffset, range, replacement });
    }
  }

  if (edits.length === 0) return;

  // Apply edits back-to-front so offsets don't shift
  edits.sort((a, b) => b.startOffset - a.startOffset);

  await editor.edit(
    (editBuilder) => {
      for (const e of edits) {
        editBuilder.replace(e.range, e.replacement);
      }
    },
    { undoStopBefore: true, undoStopAfter: true }
  );
}

/**
 * Wraps the inner text of a block comment without breaking words.
 * Preserves:
 * - Opening and closing delimiters
 * - Per-line indentation
 * - Leading " * " prefixes (JSDoc style)
 * - Blank lines
 */
function wrapBlockComment(block, limit) {
  // Split preserving line endings as \n (VS Code uses \n in getText()).
  const lines = block.split("\n");

  if (lines.length === 1) {
    // Single-line /* ... */ - do nothing (usually already short; wrapping here can be surprising)
    return block;
  }

  // Detect comment indent from the first line
  const firstLine = lines[0];
  const _m = firstLine.match(/^\s*/);
  const indent = (_m && _m[0]) ? _m[0] : "";

  const isJSDoc = firstLine.trimStart().startsWith("/**");

  // Extract open and close tokens
  // Keep first line’s opening as-is (typically "/*" or "/**" maybe with text).
  // Keep last line’s closing as-is (typically "*/" maybe with leading spaces).
  const openLine = lines[0];
  const closeLine = lines[lines.length - 1];

  // Middle lines are where we wrap content
  const middle = lines.slice(1, -1);

  // Parse each middle line into:
  // - prefix: indent + optional "*" + optional single space after "*"
  // - content: rest of the text (trim-right preserved loosely)
  const parsed = middle.map((line) => parseCommentMiddleLine(line, indent));

  // Combine into paragraphs: consecutive non-blank content lines join; blank lines break paragraphs.
  const wrappedMiddleLines = [];
  let paragraphTokens = [];
  let paragraphPrefix = null; // keep prefix from first line in paragraph

  const flushParagraph = () => {
    if (paragraphTokens.length === 0) return;

    const prefix = (paragraphPrefix !== null && paragraphPrefix !== undefined) ? paragraphPrefix : indent;
    const maxTextWidth = Math.max(10, limit - prefix.length*3); // avoid pathological too-small widths

    const joined = paragraphTokens.join(" ").replace(/\s+/g, " ").trim();

    if (joined.length === 0) {
      wrappedMiddleLines.push(prefix.trimEnd());
      paragraphTokens = [];
      paragraphPrefix = null;
      return;
    }

    const wrapped = wrapTextNoWordSplit(joined, maxTextWidth);

    for (const w of wrapped) {
        if(isJSDoc && !w.startsWith("*")) {
            wrappedMiddleLines.push(prefix + "* " + w);
            continue;
        }

      wrappedMiddleLines.push(prefix + w);
    }

    paragraphTokens = [];
    paragraphPrefix = null;
  };

  for (const p of parsed) {
    const isBlank = p.content.trim().length === 0;

    if (isBlank) {
      flushParagraph();
      // Preserve blank comment line with its prefix (JSDoc keeps " *" lines)
      // If the original had a star prefix, keep it.
      wrappedMiddleLines.push(p.prefix.trimEnd());
      continue;
    }

    if (paragraphTokens.length === 0) {
      paragraphPrefix = p.prefix;
    }

    paragraphTokens.push(p.content.trim());
  }

  flushParagraph();
//   var outMiddleLines = [];
//   for (const line of wrappedMiddleLines) {
//     line.replace(/(@[a-zA-Z0-9]*)/g,`__JSDOC_KEY__ * $1`);
//     var lp = line.split("__JSDOC_KEY__")
//     if (lp.length > 1) {
//         outMiddleLines.concat(lp);
//         continue;
//     }
//     else{
//         outMiddleLines.push(line);
//     }
//     // outMiddleLines.push(line);
//   }
  // Rebuild:
  // Keep the opening and closing lines as they were, unless you want to wrap text on them too.
  // Most people expect only the body to be reflowed.
  const rebuilt = [openLine, ...wrappedMiddleLines, closeLine].join("\n");

  return rebuilt;
}

/**
 * Determines the prefix (indent + optional " * ") and content for a middle block-comment line.
 */
function parseCommentMiddleLine(line, indent) {
  // Preserve original indentation as much as possible, but normalize to doc indent if present.
  const _m = line.match(/^\s*/);
  const actualIndent = (_m && _m[0]) ? _m[0] : indent;

  const afterIndent = line.slice(actualIndent.length);

  // Common in JSDoc: " * text"
  // Also allow "* text" with no leading space.
  const starMatch = afterIndent.match(/^(\*?)(\s?)(.*)$/);

  const hasStar = starMatch && starMatch[1] === "*";
  const spaceAfterStar = starMatch && starMatch[2] ? starMatch[2] : "";

  const content = starMatch ? starMatch[3] : afterIndent;

  // If the original line had "*", keep " * " (or " *" if no space existed)
  // If it didn't, prefix is just indent.
  const prefix = hasStar
    ? actualIndent + "*" + (spaceAfterStar || " ")
    : actualIndent;

  return { prefix, content: content != null ? content : "" };
}


/**
 * Wrap text into lines with a maximum width, preferring whitespace breaks.
 * Never splits words. If a single word exceeds width, it occupies a line by itself.
 */
function wrapTextNoWordSplit(text, width) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const w of words) {
    if (current.length === 0) {
      current = w;
      continue;
    }
    // if (typeof w === "string"){
    //     if (w.matchAll(/(@[a-zA-Z0-9]*)/gmi)){
    //         // If the word contains JSDoc tags, we want to force each tag onto its own line to preserve readability, even if it exceeds the width limit.
    //         const tags = w.split(/(@[a-zA-Z0-9]*)\s*[^\n\r]*/g).filter(Boolean);
    //         for (const tag of tags) {
    //             if (tag.startsWith("@")) {
    //                 // If the tag itself exceeds the width, we still put it on its own line.
    //                 if (current.length > 0) {
    //                     lines.push(current);
    //                     current = "";
    //                 }
    //                 lines.push(tag);
    //             }
    //             else {
    //                 if (current.length + 1 + tag.length <= width) {
    //                     current += " " + tag;
    //                 } else {
    //                     lines.push(current);
    //                     current = tag;
    //                 }
    //             }
    //         }
    //         continue;
    //     }
    // }

    if (current.length + 1 + w.length <= width) {
      current += " " + w;
    } else {
      lines.push(current);
      current = w;
    }
  }

  if (current.length > 0) lines.push(current);

  return lines;
}



/**
 * Indents the beginning of every line touched by the current selections.
 * - Works with multi-cursor / multi-selection.
 * - If all selections are empty (carets only), indents the line for each caret.
 * - Uses the editor's indent settings:
 *   - insertSpaces + tabSize -> inserts spaces
 *   - otherwise inserts a tab
 *
 * @param {object} [opts]
 * @param {string} [opts.indentText] If provided, this exact string is inserted (overrides editor settings).
 */
async function indentSelectedLines(opts = {}) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;

    const indentText =
        typeof opts.indentText === "string"
        ? opts.indentText
        : (editor.options.insertSpaces
            ? " ".repeat(Number(editor.options.tabSize) || 4)
            : "\t");

    // Collect all line numbers touched by selections/carets
    const lineSet = new Set();

    for (const sel of editor.selections) {
        const startLine = Math.min(sel.start.line, sel.end.line);
        const endLine = Math.max(sel.start.line, sel.end.line);

        // If selection is empty, indent only that caret line.
        if (sel.isEmpty) {
        lineSet.add(sel.start.line);
        continue;
        }

        // If selection ends at column 0, it usually means the user selected "up to"
        // the start of that line—don’t include that end line.
        const adjustedEndLine = sel.end.character === 0 ? endLine - 1 : endLine;

        for (let line = startLine; line <= adjustedEndLine; line++) {
        if (line >= 0 && line < doc.lineCount) lineSet.add(line);
        }
    }

    if (lineSet.size === 0) return;

    // Convert to sorted array DESC so edits don't shift subsequent insert positions.
    const lines = Array.from(lineSet).sort((a, b) => b - a);

    await editor.edit(
        (editBuilder) => {
        for (const line of lines) {
            const pos = doc.lineAt(line).range.start; // beginning of line
            editBuilder.insert(pos, indentText);
        }
        },
        { undoStopBefore: true, undoStopAfter: true }
    );
}


// TODO []: (javascript,frontend,textFormatting) Finish implementing reverseCharacters.
async function reverseCharacters() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const document = editor.document;


    var contents = editor.document.getText(editor.selection);
    // var lines = contents.split(/\r?\n/);
    var chars = contents.split("")

    chars.reverse()

    const output_string = chars.join('');
    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(editor.selection.start.line, 0, editor.selection.end.line + 1, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

module.exports = {
    registerTextFormattingCommands
};