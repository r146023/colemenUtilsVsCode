const vscode = require('vscode');
const crypto = require('crypto');
const { getConfigValue } = require('../helpers/configHelpers');

/**
 * Hashing Commands Module for ColemenUtils
 * Handles all cryptographic hashing and encoding functionality
 */

/**
 * Register all hashing-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerHashingCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.defaultHashSelection', defaultHashSelection),
        vscode.commands.registerCommand('colemenutils.sha1HashSelection', sha1HashSelection),
        vscode.commands.registerCommand('colemenutils.md5HashSelection', md5HashSelection),
        vscode.commands.registerCommand('colemenutils.sha512HashSelection', sha512HashSelection),
        vscode.commands.registerCommand('colemenutils.sha256HashSelection', sha256HashSelection),
        vscode.commands.registerCommand('colemenutils.base64EncodeDecode', base64EncodeDecode)
    );
}

/**
 * Hash selected text using the default algorithm configured in settings
 */
async function defaultHashSelection() {
    // const config = vscode.workspace.getConfiguration('colemenutils');
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const text = editor.document.getText(selection);
            if (!text) continue;
            const hash = crypto.createHash(getConfigValue('defaultHashAlgo', 'MD5')).update(text, 'utf8').digest('hex');
            editBuilder.replace(selection, hash);
        }
    });
}

/**
 * Hash selected text using SHA-1 algorithm
 */
async function sha1HashSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const text = editor.document.getText(selection);
            if (!text) continue;
            const hash = crypto.createHash('sha1').update(text, 'utf8').digest('hex');
            editBuilder.replace(selection, hash);
        }
    });
}

/**
 * Hash selected text using MD5 algorithm
 */
async function md5HashSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const text = editor.document.getText(selection);
            if (!text) continue;
            const hash = crypto.createHash('md5').update(text, 'utf8').digest('hex');
            editBuilder.replace(selection, hash);
        }
    });
}

/**
 * Hash selected text using SHA-512 algorithm
 */
async function sha512HashSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const text = editor.document.getText(selection);
            if (!text) continue;
            const hash = crypto.createHash('sha512').update(text, 'utf8').digest('hex');
            editBuilder.replace(selection, hash);
        }
    });
}

/**
 * Hash selected text using SHA-256 algorithm
 */
async function sha256HashSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            const text = editor.document.getText(selection);
            if (!text) continue;
            const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
            editBuilder.replace(selection, hash);
        }
    });
}

/**
 * Toggle Base64 encoding/decoding on selected text
 * Automatically detects if text is Base64 encoded and decodes it, otherwise encodes it
 */
async function base64EncodeDecode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        for (const selection of selections) {
            let text = editor.document.getText(selection);
            if (!text) continue;

            // Try to decode, if fails, encode
            let result;
            try {
                // Try decode
                const decoded = Buffer.from(text, 'base64').toString('utf8');
                // If decoding and re-encoding matches, it's valid base64, so decode
                if (Buffer.from(decoded, 'utf8').toString('base64') === text.replace(/\s/g, '')) {
                    result = decoded;
                } else {
                    throw new Error();
                }
            } catch (e) {
                // Not valid base64, encode
                result = Buffer.from(text, 'utf8').toString('base64');
            }
            editBuilder.replace(selection, result);
        }
    });
}

module.exports = {
    registerHashingCommands
};