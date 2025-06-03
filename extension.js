// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// const figlet = require('figlet');
// const crypto = require('crypto');
const { registerBarrelCommands } = require('./commands/barrelGeneration');
const { registerHashingCommands } = require('./commands/hashingCommands');
const { registerTextFormattingCommands } = require('./commands/textFormattingCommands');
const { registerSortingCommands } = require('./commands/sortingCommands');
const { registerEditorCommands } = require('./commands/editorCommands');
const { registerSpacingCommands } = require('./commands/spacingCommands');
const { registerMarkdownCommands } = require('./commands/markdownCommands');
const { registerUtilityCommands } = require('./commands/utilityCommands');
const { registerUiDecorations } = require('./commands/uiDecorations');
const { registerArrayCommands } = require('./commands/arrayCommands');
const { registerSvgCommands } = require('./commands/svgCommands');
const { registerBracketColorizer } = require('./commands/bracketColorizer');
const { registerJsonCommands } = require('./commands/jsonCommands');
const { registerDebugCommands } = require('./commands/debugCommands');
// const { registerAutoRenameTag } = require('./commands/autoRenameTag');

// import * as vscode from 'vscode';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// const config = vscode.workspace.getConfiguration('colemenutils');

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "colemenutils" is now active!');


	// Check if this is a JS/TS project
	const checkIsJSProject = async () => {
		const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
		const tsConfigFiles = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1);
		const isJSProject = packageJsonFiles.length > 0 || tsConfigFiles.length > 0;

		vscode.commands.executeCommand('setContext', 'colemenutils.isJSProject', isJSProject);
	};

	checkIsJSProject();
    registerBarrelCommands(context);
    registerHashingCommands(context);
    registerTextFormattingCommands(context);
    registerSortingCommands(context);
    registerEditorCommands(context);
    registerSpacingCommands(context);
    registerMarkdownCommands(context);
    registerUtilityCommands(context);
	registerUiDecorations(context);
    registerArrayCommands(context);
    registerSvgCommands(context);
	registerBracketColorizer(context);
    registerJsonCommands(context);
    registerDebugCommands(context);
	// registerAutoRenameTag(context);

}

// this method is called when your extension is deactivated
function deactivate() {}



module.exports = {
	activate,
	deactivate
}


