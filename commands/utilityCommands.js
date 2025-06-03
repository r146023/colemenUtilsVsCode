const vscode = require('vscode');
// const { fileToArrayOfLines } = require('../helpers/editorHelpers');

/**
 * Utility Commands Module for ColemenUtils
 * Handles miscellaneous utilities
 */

/**
 * Register all utility commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerUtilityCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.helloWorld', helloWorld),
        vscode.commands.registerCommand('colemenutils.commentConsoleLogLines', commentConsoleLogLines)
    );
}

/**
 * Display hello world message
 */
async function helloWorld() {
    vscode.window.showInformationMessage('Hello World from ColemenUtils!');
}

/**
 * Comment out console.log lines in the current file
 */
async function commentConsoleLogLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const document = editor.document;
    const edits = [];
    
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.text.includes('console.log') && !line.text.trim().startsWith('//')) {
            const indentation = line.text.match(/^\s*/)[0];
            const newText = indentation + '// ' + line.text.trim();
            edits.push({
                range: line.range,
                text: newText
            });
        }
    }
    
    if (edits.length > 0) {
        await editor.edit(editBuilder => {
            edits.forEach(edit => {
                editBuilder.replace(edit.range, edit.text);
            });
        });
        vscode.window.showInformationMessage(`Commented out ${edits.length} console.log lines.`);
    } else {
        vscode.window.showInformationMessage('No console.log lines found to comment.');
    }
}

module.exports = {
    registerUtilityCommands
};