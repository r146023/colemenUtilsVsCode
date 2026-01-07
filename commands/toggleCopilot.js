const vscode = require('vscode');
const PATH = require('path');

const BACKUP_FILENAME = 'colemenutils-copilot-backup.json';
const SETTINGS_FOLDER = '.vscode';
const COPILOT_KEYS = [
    // keys we will toggle in workspace settings
    'github.copilot.enable',
    'github.copilot.chat.enable',
    'chat.disableAIFeatures'
];

async function readJson(uri) {
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const text = Buffer.from(bytes).toString('utf8');
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

async function writeJson(uri, obj) {
    const text = JSON.stringify(obj, null, 2) + '\n';
    const bytes = Buffer.from(text, 'utf8');
    await vscode.workspace.fs.writeFile(uri, bytes);
}

async function ensureVscodeFolder(folderUri) {
    const vscodeUri = vscode.Uri.joinPath(folderUri, SETTINGS_FOLDER);
    try {
        await vscode.workspace.fs.createDirectory(vscodeUri);
    } catch (err) {
        // ignore
    }
    return vscodeUri;
}

async function findWorkspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return null;
    }
    // use first workspace folder
    return folders[0].uri;
}

async function findCopilotExtensionId() {
    // try to auto-detect installed copilot extension id
    const exts = vscode.extensions.all;
    const ext = exts.find(e => e.id.toLowerCase().includes('copilot'));
    return ext ? ext.id : null;
}

// Use workspace configuration API to disable copilot-related settings
async function disableCopilotSettingsWorkspace() {
    const cfg = vscode.workspace.getConfiguration();
    await cfg.update('github.copilot.enable', false, vscode.ConfigurationTarget.Workspace);
    // await cfg.update('github.copilot.inlineSuggest.enable', false, vscode.ConfigurationTarget.Workspace);
    // await cfg.update('github.copilot.chat.enable', false, vscode.ConfigurationTarget.Workspace);
    await cfg.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Workspace);
}

// Restore workspace settings from backup object (prevValues map)
async function restoreCopilotSettingsWorkspace(prevValues = {}) {
    const cfg = vscode.workspace.getConfiguration();
    for (const key of COPILOT_KEYS) {
        if (prevValues.hasOwnProperty(key)) {
            const prev = prevValues[key];
            // if prev is undefined, call update with undefined to remove workspace override
            await cfg.update(key, typeof prev === 'undefined' ? undefined : prev, vscode.ConfigurationTarget.Workspace);
        }
    }
}

async function toggleCopilotCommand() {
    try {
        const root = await findWorkspaceRoot();
        if (!root) {
            vscode.window.showWarningMessage('Toggle Copilot: no workspace folder open.');
            return;
        }

        await ensureVscodeFolder(root);
        const backupUri = vscode.Uri.joinPath(root, SETTINGS_FOLDER, BACKUP_FILENAME);

        // detect whether backup exists -> currently toggled off
        const backup = await readJson(backupUri);

        if (!backup) {
            // Disable Copilot: save current workspace values and write overrides via API
            const cfg = vscode.workspace.getConfiguration();
            const toBackup = {};
            for (const key of COPILOT_KEYS) {
                // read current workspace value (will inherit from other scopes if not set)
                const current = cfg.has(key) ? cfg.get(key) : undefined;
                toBackup[key] = current;
            }

            // Persist backup file so we can restore later
            await writeJson(backupUri, { backedUp: toBackup, timestamp: new Date().toISOString() });

            // Apply disabling using workspace configuration API
            await disableCopilotSettingsWorkspace();

            // try to disable the extension (best-effort)
            const extId = await findCopilotExtensionId();
            if (extId) {
                try {
                    await vscode.commands.executeCommand('workbench.extensions.disableExtension', extId);
                } catch (err) {
                    console.warn('toggleCopilot: disable extension command failed', err);
                }
            }

            vscode.window.showInformationMessage('Copilot disabled for workspace (backup saved). Toggle again to restore.');
        } else {
            // Restore previous values from backup (use config API)
            const backedUp = backup.backedUp || {};
            await restoreCopilotSettingsWorkspace(backedUp);

            // remove backup file
            try { await vscode.workspace.fs.delete(backupUri); } catch (e) { /* ignore */ }

            // try to enable the extension (best-effort)
            const extId = await findCopilotExtensionId();
            if (extId) {
                try {
                    await vscode.commands.executeCommand('workbench.extensions.enableExtension', extId);
                } catch (err) {
                    console.warn('toggleCopilot: enable extension command failed', err);
                }
            }

            vscode.window.showInformationMessage('Copilot settings restored for workspace.');
        }
    } catch (err) {
        console.error('toggleCopilot error', err);
        vscode.window.showErrorMessage('Toggle Copilot failed: ' + (err && err.message ? err.message : String(err)));
    }
}

function registerToggleCopilot(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.toggleCopilot', toggleCopilotCommand)
    );
}

module.exports = { registerToggleCopilot };