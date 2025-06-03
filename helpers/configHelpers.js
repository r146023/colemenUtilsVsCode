const vscode = require('vscode');

/**
 * Get ColemenUtils configuration
 * @returns {vscode.WorkspaceConfiguration} Configuration object
 */
function getConfig() {
    return vscode.workspace.getConfiguration('colemenutils');
}

/**
 * Get a specific configuration value with fallback
 * @param {string} key - Configuration key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Configuration value
 */
function getConfigValue(key, defaultValue) {
    return getConfig().get(key, defaultValue);
}

/**
 * Update a configuration value
 * @param {string} key - Configuration key
 * @param {any} value - New value
 * @param {boolean} global - Whether to update globally or workspace-specific
 */
async function updateConfig(key, value, global = false) {
    const config = getConfig();
    await config.update(key, value, global);
}

/**
 * Check if this is a JavaScript/TypeScript project
 * @returns {Promise<boolean>} True if JS/TS project
 */
async function isJSProject() {
    const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
    const tsConfigFiles = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1);
    return packageJsonFiles.length > 0 || tsConfigFiles.length > 0;
}

module.exports = {
    getConfig,
    getConfigValue,
    updateConfig,
    isJSProject
};