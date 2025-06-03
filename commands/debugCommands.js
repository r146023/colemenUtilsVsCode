const vscode = require('vscode');

/**
 * Debug Commands Module for ColemenUtils
 * Handles commenting/uncommenting debug statements
 */

/**
 * Register all debug-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerDebugCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.commentOutPrints', commentOutPrints),
        vscode.commands.registerCommand('colemenutils.uncommentPrints', uncommentPrints),
        vscode.commands.registerCommand('colemenutils.removePrints', removePrints),
        vscode.commands.registerCommand('colemenutils.togglePrintComments', togglePrintComments),
        vscode.commands.registerCommand('colemenutils.stripAllComments', stripAllComments)
    );
}

/**
 * Comment out all print statements in the current file (COMPLETELY FIXED)
 */
async function commentOutPrints() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const language = document.languageId;
    
    const printPatterns = getPrintPatterns(language);
    const commentSyntax = getCommentSyntax(language);
    
    if (!printPatterns.length) {
        vscode.window.showWarningMessage(`Print statement detection not supported for ${language}`);
        return;
    }

    let changeCount = 0;
    const edits = [];

    // Process each line in the document
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        const lineText = line.text;
        const trimmedLine = lineText.trim();
        
        // Skip if already commented
        if (isAlreadyCommented(trimmedLine, commentSyntax)) {
            continue;
        }
        
        // Check if line contains print statements
        for (const pattern of printPatterns) {
            if (pattern.test(trimmedLine)) {
                const leadingWhitespace = lineText.match(/^\s*/)[0];
                const commentedLine = leadingWhitespace + commentSyntax.line + ' ' + lineText.trimStart();
                
                // Use the line's range directly
                edits.push(vscode.TextEdit.replace(line.range, commentedLine));
                changeCount++;
                break; // Only comment once per line
            }
        }
    }

    if (edits.length === 0) {
        vscode.window.showInformationMessage('No print statements found to comment out');
        return;
    }

    // Apply all edits in one operation
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);

    vscode.window.showInformationMessage(`Commented out ${changeCount} print statement(s)`);
}

/**
 * Uncomment all previously commented print statements (COMPLETELY FIXED)
 */
async function uncommentPrints() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const language = document.languageId;
    
    const printPatterns = getPrintPatterns(language);
    const commentSyntax = getCommentSyntax(language);
    
    if (!printPatterns.length) {
        vscode.window.showWarningMessage(`Print statement detection not supported for ${language}`);
        return;
    }

    let changeCount = 0;
    const edits = [];

    // Process each line in the document
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        const lineText = line.text;
        const trimmedLine = lineText.trim();
        
        // Check if line is a commented print statement
        if (isCommentedPrint(trimmedLine, printPatterns, commentSyntax)) {
            const leadingWhitespace = lineText.match(/^\s*/)[0];
            const uncommentedLine = leadingWhitespace + uncommentLine(lineText.trimStart(), commentSyntax);
            
            // Use the line's range directly
            edits.push(vscode.TextEdit.replace(line.range, uncommentedLine));
            changeCount++;
        }
    }

    if (edits.length === 0) {
        vscode.window.showInformationMessage('No commented print statements found');
        return;
    }

    // Apply all edits in one operation
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);

    vscode.window.showInformationMessage(`Uncommented ${changeCount} print statement(s)`);
}

/**
 * Remove all print statements entirely (COMPLETELY FIXED)
 */
async function removePrints() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        'This will permanently remove all print statements. Continue?',
        'Yes', 'No'
    );

    if (confirm !== 'Yes') return;

    const document = editor.document;
    const language = document.languageId;
    
    const printPatterns = getPrintPatterns(language);
    
    if (!printPatterns.length) {
        vscode.window.showWarningMessage(`Print statement detection not supported for ${language}`);
        return;
    }

    let changeCount = 0;
    const edits = [];

    // Process each line in the document (in reverse order for deletion)
    for (let lineIndex = document.lineCount - 1; lineIndex >= 0; lineIndex--) {
        const line = document.lineAt(lineIndex);
        const trimmedLine = line.text.trim();
        
        // Check if line contains only print statements (and whitespace)
        for (const pattern of printPatterns) {
            if (pattern.test(trimmedLine)) {
                // Delete the entire line including the line break
                const range = new vscode.Range(
                    new vscode.Position(lineIndex, 0),
                    new vscode.Position(lineIndex + 1, 0)
                );
                edits.push(vscode.TextEdit.delete(range));
                changeCount++;
                break;
            }
        }
    }

    if (edits.length === 0) {
        vscode.window.showInformationMessage('No print statements found to remove');
        return;
    }

    // Apply all edits in one operation
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);

    vscode.window.showInformationMessage(`Removed ${changeCount} print statement(s)`);
}

/**
 * Toggle comments on print statements (COMPLETELY FIXED)
 */
async function togglePrintComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const language = document.languageId;
    
    const printPatterns = getPrintPatterns(language);
    const commentSyntax = getCommentSyntax(language);
    
    if (!printPatterns.length) {
        vscode.window.showWarningMessage(`Print statement detection not supported for ${language}`);
        return;
    }

    // Count commented vs uncommented print statements
    let commentedCount = 0;
    let uncommentedCount = 0;
    
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        const trimmedLine = line.text.trim();
        
        if (isCommentedPrint(trimmedLine, printPatterns, commentSyntax)) {
            commentedCount++;
        } else {
            for (const pattern of printPatterns) {
                if (pattern.test(trimmedLine)) {
                    uncommentedCount++;
                    break;
                }
            }
        }
    }

    // Decide whether to comment or uncomment based on majority
    if (uncommentedCount >= commentedCount) {
        await commentOutPrints();
    } else {
        await uncommentPrints();
    }
}

/**
 * Strip all comments from the current file
 */
async function stripAllComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const language = document.languageId;
    const text = document.getText();
    
    if (!isCommentStrippingSupported(language)) {
        vscode.window.showWarningMessage(`Comment stripping not supported for ${language}`);
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        'This will permanently remove all comments from the file. Continue?',
        'Yes', 'No'
    );

    if (confirm !== 'Yes') return;

    try {
        const strippedText = stripCommentsFromText(text, language);
        
        if (strippedText === text) {
            vscode.window.showInformationMessage('No comments found to remove');
            return;
        }

        // Use editor.edit() instead of WorkspaceEdit for better compatibility
        const success = await editor.edit(editBuilder => {
            // Replace entire document content safely
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            const fullRange = new vscode.Range(
                firstLine.range.start,
                lastLine.range.end
            );
            
            editBuilder.replace(fullRange, strippedText);
        });

        if (success) {
            vscode.window.showInformationMessage('Successfully stripped all comments from file');
        } else {
            vscode.window.showErrorMessage('Failed to strip comments from file');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error stripping comments: ${error.message}`);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get print statement patterns for different languages
 */
function getPrintPatterns(language) {
    const patterns = {
        javascript: [
            /^\s*console\.(log|info|warn|error|debug|trace)\s*\(/,
            /^\s*console\.(dir|table|count|time|timeEnd)\s*\(/,
            /^\s*console\.group(Collapsed)?\s*\(/,
            /^\s*console\.groupEnd\s*\(/,
            /^\s*console\.clear\s*\(/,
            /^\s*console\.assert\s*\(/
        ],
        typescript: [
            /^\s*console\.(log|info|warn|error|debug|trace)\s*\(/,
            /^\s*console\.(dir|table|count|time|timeEnd)\s*\(/,
            /^\s*console\.group(Collapsed)?\s*\(/,
            /^\s*console\.groupEnd\s*\(/,
            /^\s*console\.clear\s*\(/,
            /^\s*console\.assert\s*\(/
        ],
        python: [
            /^\s*print\s*\(/,
            /^\s*pprint\.(pprint|pformat)\s*\(/,
            /^\s*logging\.(debug|info|warning|error|critical)\s*\(/,
            /^\s*logger\.(debug|info|warning|error|critical)\s*\(/
        ],
        php: [
            /^\s*echo\s+/,
            /^\s*print\s+/,
            /^\s*print_r\s*\(/,
            /^\s*var_dump\s*\(/,
            /^\s*var_export\s*\(/,
            /^\s*debug_print_backtrace\s*\(/,
            /^\s*error_log\s*\(/
        ],
        rust: [
            /^\s*println!\s*\(/,
            /^\s*print!\s*\(/,
            /^\s*dbg!\s*\(/,
            /^\s*eprintln!\s*\(/,
            /^\s*eprint!\s*\(/
        ],
        shellscript: [
            /^\s*echo\s+/,
            /^\s*printf\s+/,
            /^\s*print\s+/
        ],
        bash: [
            /^\s*echo\s+/,
            /^\s*printf\s+/,
            /^\s*print\s+/
        ],
        batch: [
            /^\s*echo\s+/,
            /^\s*@echo\s+/
        ],
        powershell: [
            /^\s*Write-Host\s+/,
            /^\s*Write-Output\s+/,
            /^\s*Write-Information\s+/,
            /^\s*Write-Debug\s+/,
            /^\s*Write-Verbose\s+/,
            /^\s*Write-Warning\s+/,
            /^\s*Write-Error\s+/
        ]
    };

    return patterns[language] || patterns[getLanguageFamily(language)] || [];
}

/**
 * Get comment syntax for different languages
 */
function getCommentSyntax(language) {
    const syntaxMap = {
        javascript: { line: '//', block: { start: '/*', end: '*/' } },
        typescript: { line: '//', block: { start: '/*', end: '*/' } },
        python: { line: '#', block: { start: '"""', end: '"""' } },
        php: { line: '//', block: { start: '/*', end: '*/' } },
        rust: { line: '//', block: { start: '/*', end: '*/' } },
        shellscript: { line: '#', block: null },
        bash: { line: '#', block: null },
        batch: { line: 'REM', block: null },
        powershell: { line: '#', block: { start: '<#', end: '#>' } }
    };

    return syntaxMap[language] || syntaxMap[getLanguageFamily(language)] || { line: '//', block: null };
}

/**
 * Get language family for similar languages
 */
function getLanguageFamily(language) {
    const families = {
        'javascriptreact': 'javascript',
        'typescriptreact': 'typescript',
        'jsx': 'javascript',
        'tsx': 'typescript',
        'sh': 'bash',
        'zsh': 'bash',
        'fish': 'bash',
        'ps1': 'powershell',
        'cmd': 'batch'
    };

    return families[language] || language;
}

/**
 * Check if a line is already commented
 */
function isAlreadyCommented(line, commentSyntax) {
    const trimmed = line.trim();
    
    // Check line comments
    if (commentSyntax.line) {
        return trimmed.startsWith(commentSyntax.line);
    }
    
    // Check block comments
    if (commentSyntax.block) {
        return trimmed.startsWith(commentSyntax.block.start);
    }
    
    return false;
}

/**
 * Check if a commented line contains a print statement
 */
function isCommentedPrint(line, printPatterns, commentSyntax) {
    if (!isAlreadyCommented(line, commentSyntax)) {
        return false;
    }
    
    // Remove comment syntax and check for print patterns
    const uncommented = uncommentLine(line, commentSyntax);
    
    for (const pattern of printPatterns) {
        if (pattern.test(uncommented.trim())) {
            return true;
        }
    }
    
    return false;
}

/**
 * Remove comment syntax from a line
 */
function uncommentLine(line, commentSyntax) {
    let trimmed = line.trim();
    
    // Handle line comments
    if (commentSyntax.line && trimmed.startsWith(commentSyntax.line)) {
        trimmed = trimmed.substring(commentSyntax.line.length);
        // Remove optional space after comment marker
        if (trimmed.startsWith(' ')) {
            trimmed = trimmed.substring(1);
        }
        return trimmed;
    }
    
    // Handle block comments (basic implementation)
    if (commentSyntax.block) {
        if (trimmed.startsWith(commentSyntax.block.start)) {
            trimmed = trimmed.substring(commentSyntax.block.start.length);
        }
        if (trimmed.endsWith(commentSyntax.block.end)) {
            trimmed = trimmed.substring(0, trimmed.length - commentSyntax.block.end.length);
        }
        return trimmed.trim();
    }
    
    return line;
}

/**
 * Check if comment stripping is supported for the language
 */
function isCommentStrippingSupported(language) {
    const supportedLanguages = [
        'json', 'jsonc', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact',
        'python', 'php', 'sql', 'rust', 'css', 'scss', 'less'
    ];
    return supportedLanguages.includes(language);
}

/**
 * Strip all comments from text based on language
 */
function stripCommentsFromText(text, language) {
    switch (language) {
        case 'json':
        case 'jsonc':
            return stripJSONComments(text);
        case 'javascript':
        case 'javascriptreact':
        case 'typescript':
        case 'typescriptreact':
            return stripJSComments(text);
        case 'python':
            return stripPythonComments(text);
        case 'php':
            return stripPHPComments(text);
        case 'sql':
            return stripSQLComments(text);
        case 'rust':
            return stripRustComments(text);
        case 'css':
        case 'scss':
        case 'less':
            return stripCSSComments(text);
        default:
            throw new Error(`Unsupported language: ${language}`);
    }
}

/**
 * Strip JSON/JSONC comments
 */
function stripJSONComments(text) {
    let result = '';
    let i = 0;
    let inString = false;
    let inSingleComment = false;
    let inMultiComment = false;
    
    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1] || '';
        
        // Handle string literals
        if (!inSingleComment && !inMultiComment && char === '"') {
            if (!inString) {
                inString = true;
                result += char;
            } else if (text[i - 1] !== '\\') {
                inString = false;
                result += char;
            } else {
                result += char;
            }
        }
        // Handle comments
        else if (!inString) {
            if (char === '/' && nextChar === '/' && !inMultiComment) {
                inSingleComment = true;
                i++; // Skip the second /
            } else if (char === '/' && nextChar === '*' && !inSingleComment) {
                inMultiComment = true;
                i++; // Skip the *
            } else if (inSingleComment && char === '\n') {
                inSingleComment = false;
                result += char; // Keep the newline
            } else if (inMultiComment && char === '*' && nextChar === '/') {
                inMultiComment = false;
                i++; // Skip the /
            } else if (!inSingleComment && !inMultiComment) {
                result += char;
            }
        } else {
            result += char;
        }
        
        i++;
    }
    
    return result;
}

/**
 * Strip JavaScript/TypeScript comments
 */
function stripJSComments(text) {
    let result = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let inRegex = false;
    let inSingleComment = false;
    let inMultiComment = false;
    
    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1] || '';
        
        // Handle string literals
        if (!inSingleComment && !inMultiComment && !inRegex && (char === '"' || char === "'" || char === '`')) {
            if (!inString) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (char === stringChar && text[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
                result += char;
            } else {
                result += char;
            }
        }
        // Handle regex literals (basic detection)
        else if (!inString && !inSingleComment && !inMultiComment && char === '/' && nextChar !== '/' && nextChar !== '*') {
            if (!inRegex && isRegexContext(text, i)) {
                inRegex = true;
                result += char;
            } else if (inRegex && text[i - 1] !== '\\') {
                inRegex = false;
                result += char;
            } else {
                result += char;
            }
        }
        // Handle comments
        else if (!inString && !inRegex) {
            if (char === '/' && nextChar === '/' && !inMultiComment) {
                inSingleComment = true;
                i++; // Skip the second /
            } else if (char === '/' && nextChar === '*' && !inSingleComment) {
                inMultiComment = true;
                i++; // Skip the *
            } else if (inSingleComment && char === '\n') {
                inSingleComment = false;
                result += char; // Keep the newline
            } else if (inMultiComment && char === '*' && nextChar === '/') {
                inMultiComment = false;
                i++; // Skip the /
            } else if (!inSingleComment && !inMultiComment) {
                result += char;
            }
        } else {
            result += char;
        }
        
        i++;
    }
    
    return result;
}

/**
 * Basic regex context detection for JavaScript
 */
function isRegexContext(text, index) {
    // Look backward for operators that typically precede regex
    const before = text.substring(0, index).replace(/\s+$/, '');
    const regexOperators = ['=', '(', '[', ',', ':', ';', '!', '&', '|', '?', '+', '-', '*', '/', '%', '^', '<', '>', '{', '}', 'return', 'throw'];
    
    return regexOperators.some(op => before.endsWith(op));
}

/**
 * Strip Python comments
 */
function stripPythonComments(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (const line of lines) {
        let cleanLine = '';
        let inString = false;
        let stringChar = '';
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextTwoChars = line.substring(i, i + 3);
            
            // Handle triple quotes
            if (!inString && (nextTwoChars === '"""' || nextTwoChars === "'''")) {
                inString = true;
                stringChar = nextTwoChars;
                cleanLine += nextTwoChars;
                i += 3;
                continue;
            } else if (inString && nextTwoChars === stringChar) {
                inString = false;
                stringChar = '';
                cleanLine += nextTwoChars;
                i += 3;
                continue;
            }
            
            // Handle single/double quotes
            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
                cleanLine += char;
            } else if (inString && char === stringChar && line[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
                cleanLine += char;
            } else if (!inString && char === '#') {
                // Found comment, stop processing this line
                break;
            } else {
                cleanLine += char;
            }
            
            i++;
        }
        
        result.push(cleanLine.trimEnd());
    }
    
    return result.join('\n');
}

/**
 * Strip PHP comments
 */
function stripPHPComments(text) {
    let result = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let inSingleComment = false;
    let inMultiComment = false;
    
    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1] || '';
        
        // Handle string literals
        if (!inSingleComment && !inMultiComment && (char === '"' || char === "'")) {
            if (!inString) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (char === stringChar && text[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
                result += char;
            } else {
                result += char;
            }
        }
        // Handle comments
        else if (!inString) {
            if ((char === '/' && nextChar === '/') || char === '#') {
                if (!inMultiComment) {
                    inSingleComment = true;
                    if (char === '/') i++; // Skip the second /
                }
            } else if (char === '/' && nextChar === '*' && !inSingleComment) {
                inMultiComment = true;
                i++; // Skip the *
            } else if (inSingleComment && char === '\n') {
                inSingleComment = false;
                result += char; // Keep the newline
            } else if (inMultiComment && char === '*' && nextChar === '/') {
                inMultiComment = false;
                i++; // Skip the /
            } else if (!inSingleComment && !inMultiComment) {
                result += char;
            }
        } else {
            result += char;
        }
        
        i++;
    }
    
    return result;
}

/**
 * Strip SQL comments
 */
function stripSQLComments(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (const line of lines) {
        let cleanLine = '';
        let inString = false;
        let stringChar = '';
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1] || '';
            
            // Handle string literals
            if ((char === '"' || char === "'") && !inString) {
                inString = true;
                stringChar = char;
                cleanLine += char;
            } else if (inString && char === stringChar) {
                if (nextChar === stringChar) {
                    // Escaped quote
                    cleanLine += char + nextChar;
                    i++;
                } else {
                    inString = false;
                    stringChar = '';
                    cleanLine += char;
                }
            } else if (!inString && char === '-' && nextChar === '-') {
                // Found SQL comment, stop processing this line
                break;
            } else {
                cleanLine += char;
            }
            
            i++;
        }
        
        result.push(cleanLine.trimEnd());
    }
    
    // Remove multi-line comments /* */
    let fullResult = result.join('\n');
    fullResult = fullResult.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return fullResult;
}

/**
 * Strip Rust comments
 */
function stripRustComments(text) {
    let result = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let inSingleComment = false;
    let inMultiComment = false;
    let commentDepth = 0;
    
    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1] || '';
        
        // Handle string literals
        if (!inSingleComment && !inMultiComment && (char === '"' || char === "'")) {
            if (!inString) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (char === stringChar && text[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
                result += char;
            } else {
                result += char;
            }
        }
        // Handle comments
        else if (!inString) {
            if (char === '/' && nextChar === '/' && !inMultiComment) {
                inSingleComment = true;
                i++; // Skip the second /
            } else if (char === '/' && nextChar === '*' && !inSingleComment) {
                inMultiComment = true;
                commentDepth++;
                i++; // Skip the *
            } else if (inMultiComment && char === '/' && nextChar === '*') {
                commentDepth++; // Nested comment
                i++; // Skip the *
            } else if (inSingleComment && char === '\n') {
                inSingleComment = false;
                result += char; // Keep the newline
            } else if (inMultiComment && char === '*' && nextChar === '/') {
                commentDepth--;
                if (commentDepth === 0) {
                    inMultiComment = false;
                }
                i++; // Skip the /
            } else if (!inSingleComment && !inMultiComment) {
                result += char;
            }
        } else {
            result += char;
        }
        
        i++;
    }
    
    return result;
}

/**
 * Strip CSS comments
 */
function stripCSSComments(text) {
    // CSS only has /* */ comments
    return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

module.exports = {
    registerDebugCommands
};