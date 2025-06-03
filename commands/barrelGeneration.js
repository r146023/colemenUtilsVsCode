const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Barrel Generation Module for ColemenUtils
 * Handles all barrel file generation and management functionality
 */

/**
 * Register all barrel-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerBarrelCommands(context) {
    // Register all barrel commands
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.excludeFromBarrel', excludeFromBarrel),
        vscode.commands.registerCommand('colemenutils.generateBarrel', generateBarrel),
        vscode.commands.registerCommand('colemenutils.excludeDirectoryFromBarrel', excludeDirectoryFromBarrel),
        vscode.commands.registerCommand('colemenutils.collectStoriesPaths', collectStoriesPaths)
    );
}

/**
 * Exclude a file from barrel generation
 */
async function excludeFromBarrel(uri) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('Please right-click on a file to exclude from barrel.');
        return;
    }

    try {
        // Get relative path from workspace
        const relativePath = vscode.workspace.asRelativePath(uri);

        // Get current configuration
        const config = vscode.workspace.getConfiguration('colemenutils');
        const currentExcludes = config.get('barrelExcludeFiles', []);

        // Check if already excluded
        if (currentExcludes.includes(relativePath)) {
            vscode.window.showInformationMessage(`${relativePath} is already excluded from barrel generation.`);
            return;
        }

        // Add to exclusion list
        const newExcludes = [...currentExcludes, relativePath];

        // Update configuration
        await config.update('barrelExcludeFiles', newExcludes, vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage(`${relativePath} has been excluded from barrel generation.`);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to exclude file from barrel: ${error.message}`);
    }
}

/**
 * Generate a barrel file for the selected directory
 */
async function generateBarrel(uri) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('Please right-click on a folder to generate a barrel.');
        return;
    }

    try {
        const folderPath = uri.fsPath;
        const files = fs.readdirSync(folderPath);

        // Detect project type and determine barrel file extension
        // const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
        const tsConfigFiles = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1);
        const isTypeScriptProject = tsConfigFiles.length > 0;
        const barrelExtension = isTypeScriptProject ? '.ts' : '.js';
        const barrelFileName = `index${barrelExtension}`;
        const barrelPath = path.join(folderPath, barrelFileName);

        // Get exclusion list from configuration
        const config = vscode.workspace.getConfiguration('colemenutils');
        const excludeFiles = config.get('barrelExcludeFiles', []);

        let sourceFiles = [];
        let subdirectories = [];
        let existingExports = [];

        // Check if barrel already exists (check both .ts and .js)
        const tsBarrelPath = path.join(folderPath, 'index.ts');
        const jsBarrelPath = path.join(folderPath, 'index.js');
        let existingBarrelPath = null;

        if (fs.existsSync(barrelPath)) {
            existingBarrelPath = barrelPath;
        } else if (fs.existsSync(tsBarrelPath)) {
            existingBarrelPath = tsBarrelPath;
        } else if (fs.existsSync(jsBarrelPath)) {
            existingBarrelPath = jsBarrelPath;
        }

        if (existingBarrelPath) {
            // Read existing barrel and extract current exports
            const existingContent = fs.readFileSync(existingBarrelPath, 'utf8');
            const exportLines = existingContent.split('\n').filter(line => line.trim().startsWith('export'));

            existingExports = exportLines.map(line => {
                // Extract the module name from "export * from './moduleName';"
                const match = line.match(/export \* from ['"]\.\/(.*?)['"];?/);
                return match ? match[1] : null;
            }).filter(Boolean);

            console.log('Existing exports found:', existingExports);
            console.log('Exclude files:', excludeFiles);

            // If we're changing file types (e.g., TS project but existing JS barrel), remove old barrel
            if (existingBarrelPath !== barrelPath) {
                fs.unlinkSync(existingBarrelPath);
                console.log(`Removed old barrel: ${existingBarrelPath}`);
            }
        }

        // Filter for appropriate file types based on project type
        const supportedExtensions = isTypeScriptProject
            ? ['.ts', '.tsx', '.js', '.jsx']
            : ['.js', '.jsx'];

        // Scan files and directories
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Check if subdirectory has an index file
                const subIndexTs = path.join(filePath, 'index.ts');
                const subIndexJs = path.join(filePath, 'index.js');

                if (fs.existsSync(subIndexTs) || fs.existsSync(subIndexJs)) {
                    // Check if this subdirectory is excluded
                    const subDirRelativePath = vscode.workspace.asRelativePath(filePath);
                    if (!excludeFiles.includes(subDirRelativePath)) {
                        subdirectories.push(file);
                    }
                }
            } else {
                // Regular file processing
                const ext = path.extname(file);
                const relativePath = vscode.workspace.asRelativePath(filePath);

                if (supportedExtensions.includes(ext) &&
                    !file.includes('.stories.') &&
                    !file.includes('.test.') &&
                    !file.includes('.spec.') &&
                    file !== 'index.ts' &&
                    file !== 'index.js' &&
                    !excludeFiles.includes(relativePath)) {

                    sourceFiles.push(file);
                }
            }
        });

        var filteredExistingExports = [];
        // If barrel exists, filter existing exports by exclusion list
        if (existingExports.length > 0) {
            filteredExistingExports = existingExports.filter(exportName => {
                // Check if this export corresponds to an excluded file
                const folderRelativePath = vscode.workspace.asRelativePath(folderPath);

                // Normalize the folder path (remove any leading/trailing slashes)
                const normalizedFolderPath = folderRelativePath.replace(/^\/+|\/+$/g, '');

                const possiblePaths = [
                    `${normalizedFolderPath}/${exportName}`,
                    `${normalizedFolderPath}/${exportName}.ts`,
                    `${normalizedFolderPath}/${exportName}.tsx`,
                    `${normalizedFolderPath}/${exportName}.js`,
                    `${normalizedFolderPath}/${exportName}.jsx`,
                    // Also try with forward slashes converted to backslashes for Windows
                    `${normalizedFolderPath.replace(/\//g, '\\')}\\${exportName}.ts`,
                    `${normalizedFolderPath.replace(/\//g, '\\')}\\${exportName}.tsx`,
                    `${normalizedFolderPath.replace(/\//g, '\\')}\\${exportName}.js`,
                    `${normalizedFolderPath.replace(/\//g, '\\')}\\${exportName}.jsx`,
                    `${normalizedFolderPath.replace(/\//g, '\\')}\\${exportName}`
                ];

                console.log(`Checking export "${exportName}"`);
                console.log(`Folder relative path: "${folderRelativePath}"`);
                console.log(`Normalized folder path: "${normalizedFolderPath}"`);
                console.log('Possible paths:', possiblePaths);
                console.log('Exclusion list:', excludeFiles);

                const isExcluded = possiblePaths.some(possiblePath => {
                    const normalizedPossiblePath = possiblePath.replace(/\\/g, '/');
                    const isMatch = excludeFiles.some(excludePath => {
                        const normalizedExcludePath = excludePath.replace(/\\/g, '/');
                        return normalizedExcludePath === normalizedPossiblePath;
                    });
                    if (isMatch) {
                        console.log(`MATCH FOUND: "${possiblePath}" matches exclusion "${excludeFiles.find(ep => ep.replace(/\\/g, '/') === normalizedPossiblePath)}"`);
                    }
                    return isMatch;
                });

                console.log(`Export "${exportName}" is excluded: ${isExcluded}`);
                console.log('---');

                return !isExcluded;
            });

            console.log('Filtered existing exports:', filteredExistingExports);

            // Combine current files, subdirectories, and filtered existing exports
            const currentFileNames = sourceFiles.map(file => path.basename(file, path.extname(file)));
            var allExports = [...new Set([...currentFileNames, ...subdirectories, ...filteredExistingExports])];

            if (allExports.length === 0) {
                if(existingExports.length > 0){
                    allExports = [];
                }else{
                    vscode.window.showInformationMessage('No exportable files found after filtering exclusions.');
                    return;
                }
            }

            console.log("allExports:", allExports);

            // Generate barrel exports
            const exports = allExports.sort().map(exportName => {
                return `export * from './${exportName}';`;
            }).join('\n');

            fs.writeFileSync(barrelPath, exports + '\n');
            vscode.window.showInformationMessage(`Barrel updated: ${allExports.length} exports (${currentFileNames.length} files, ${subdirectories.length} subdirs) in ${path.basename(folderPath)}/${barrelFileName}`);
        } else {
            // No existing barrel, create new one
            if (sourceFiles.length === 0 && subdirectories.length === 0) {
                vscode.window.showInformationMessage('No exportable files or subdirectories with index files found in this directory.');
                return;
            }

            // Combine files and subdirectories
            const currentFileNames = sourceFiles.map(file => path.basename(file, path.extname(file)));
            const allExports = [...currentFileNames, ...subdirectories].sort();

            const exports = allExports.map(exportName => {
                return `export * from './${exportName}';`;
            }).join('\n');

            fs.writeFileSync(barrelPath, exports + '\n');
            vscode.window.showInformationMessage(`Barrel generated: ${allExports.length} exports (${sourceFiles.length} files, ${subdirectories.length} subdirs) in ${path.basename(folderPath)}/${barrelFileName}`);
        }

        // Optionally open the generated file
        const document = await vscode.workspace.openTextDocument(barrelPath);
        await vscode.window.showTextDocument(document);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate barrel: ${error.message}`);
    }
}

/**
 * Exclude a directory from barrel generation
 */
async function excludeDirectoryFromBarrel(uri) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('Please right-click on a directory to exclude from barrel.');
        return;
    }

    try {
        // Get relative path from workspace
        const relativePath = vscode.workspace.asRelativePath(uri);

        // Get current configuration
        const config = vscode.workspace.getConfiguration('colemenutils');
        const currentExcludes = config.get('barrelExcludeFiles', []);

        // Check if already excluded
        if (currentExcludes.includes(relativePath)) {
            vscode.window.showInformationMessage(`${relativePath} is already excluded from barrel generation.`);
            return;
        }

        // Add to exclusion list
        const newExcludes = [...currentExcludes, relativePath];

        // Update configuration
        await config.update('barrelExcludeFiles', newExcludes, vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage(`Directory ${relativePath} has been excluded from barrel generation.`);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to exclude directory from barrel: ${error.message}`);
    }
}

/**
 * Collect all .stories file paths in the workspace
 */
async function collectStoriesPaths() {
    console.log("Collecting stories file paths...");

    // Try multiple patterns to catch different file extensions
    const patterns = [
        '**/*.stories.tsx',
        '**/*.stories.jsx',
        '**/*.stories.ts',
        '**/*.stories.js'
    ];

    let allFiles = [];
    for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(pattern);
        allFiles = allFiles.concat(files);
    }

    if (allFiles.length === 0) {
        vscode.window.showInformationMessage('No .stories files found in workspace.');
        return;
    }

    // Convert URIs to relative paths
    const relativePaths = allFiles.map(file => vscode.workspace.asRelativePath(file));

    // Format as array or comma-separated list for barrel exclusions
    const pathsAsArray = JSON.stringify(relativePaths, null, 2);
    const pathsAsCommaSeparated = relativePaths.join(', ');

    // Copy to clipboard (choose format you prefer)
    await vscode.env.clipboard.writeText(pathsAsArray);

    // Show result in output channel
    const outputChannel = vscode.window.createOutputChannel('Stories Paths');
    outputChannel.clear();
    outputChannel.appendLine(`Found ${allFiles.length} .stories files:`);
    outputChannel.appendLine('');
    outputChannel.appendLine('Paths as JSON array (copied to clipboard):');
    outputChannel.appendLine(pathsAsArray);
    outputChannel.appendLine('');
    outputChannel.appendLine('Paths as comma-separated list:');
    outputChannel.appendLine(pathsAsCommaSeparated);
    outputChannel.show();

    vscode.window.showInformationMessage(`Found ${allFiles.length} .stories files. Paths copied to clipboard.`);
}

module.exports = {
    registerBarrelCommands
};