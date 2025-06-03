const vscode = require('vscode');
const { getConfigValue } = require('../helpers/configHelpers');

/**
 * JSON Commands Module for ColemenUtils
 * Handles all JSON processing and manipulation utilities
 */

/**
 * Register all JSON-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerJsonCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.formatJSON', formatJSON),
        vscode.commands.registerCommand('colemenutils.minifyJSON', minifyJSON),
        vscode.commands.registerCommand('colemenutils.validateJSON', validateJSON),
        vscode.commands.registerCommand('colemenutils.jsonToTypeScript', jsonToTypeScript),
        vscode.commands.registerCommand('colemenutils.jsonToCSV', jsonToCSV),
        vscode.commands.registerCommand('colemenutils.extractJSONKeys', extractJSONKeys),
        vscode.commands.registerCommand('colemenutils.flattenJSON', flattenJSON),
        vscode.commands.registerCommand('colemenutils.unflattenJSON', unflattenJSON),
        vscode.commands.registerCommand('colemenutils.jsonPath', jsonPath),
        vscode.commands.registerCommand('colemenutils.sortJSONKeys', sortJSONKeys),
        vscode.commands.registerCommand('colemenutils.jsonToYAML', jsonToYAML),
        vscode.commands.registerCommand('colemenutils.yamlToJSON', yamlToJSON),
        vscode.commands.registerCommand('colemenutils.jsonSchema', generateJSONSchema),
        vscode.commands.registerCommand('colemenutils.jsonDiff', jsonDiff),
        vscode.commands.registerCommand('colemenutils.escapeJSON', escapeJSON),
        vscode.commands.registerCommand('colemenutils.unescapeJSON', unescapeJSON),
        vscode.commands.registerCommand('colemenutils.typeScriptToJSON', typeScriptToJSON),
        vscode.commands.registerCommand('colemenutils.typeScriptToJSONSchema', typeScriptToJSONSchema),
        vscode.commands.registerCommand('colemenutils.typeScriptToMockJSON', typeScriptToMockJSON)
    );
}

/**
 * Format JSON with proper indentation
 */
async function formatJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const selection = editor.selection;
    const text = selection.isEmpty ? document.getText() : document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const indentSize = getConfigValue('json.indentSize', 2);
        const formatted = JSON.stringify(parsed, null, indentSize);

        const range = selection.isEmpty ? 
            new vscode.Range(0, 0, document.lineCount, 0) : 
            selection;

        await editor.edit(editBuilder => {
            editBuilder.replace(range, formatted);
        });

        vscode.window.showInformationMessage('JSON formatted successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Minify JSON to single line
 */
async function minifyJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const selection = editor.selection;
    const text = selection.isEmpty ? document.getText() : document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const minified = JSON.stringify(parsed);

        const range = selection.isEmpty ? 
            new vscode.Range(0, 0, document.lineCount, 0) : 
            selection;

        await editor.edit(editBuilder => {
            editBuilder.replace(range, minified);
        });

        vscode.window.showInformationMessage('JSON minified successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Validate JSON and show detailed error information
 */
async function validateJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const selection = editor.selection;
    const text = selection.isEmpty ? document.getText() : document.getText(selection);

    try {
        JSON.parse(text);
        vscode.window.showInformationMessage('✅ Valid JSON!');
    } catch (error) {
        const errorMsg = parseJSONError(error.message, text);
        vscode.window.showErrorMessage(`❌ Invalid JSON: ${errorMsg}`);
        
        // Try to highlight the error location
        highlightJSONError(editor, error, text);
    }
}

/**
 * Convert JSON to TypeScript interface
 */
async function jsonToTypeScript() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const interfaceName = await vscode.window.showInputBox({
            prompt: 'Enter interface name',
            value: 'MyInterface'
        });

        if (!interfaceName) return;

        const typescript = generateTypeScriptInterface(parsed, interfaceName);
        
        // Create new document with TypeScript interface
        const doc = await vscode.workspace.openTextDocument({
            content: typescript,
            language: 'typescript'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('TypeScript interface generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Convert JSON array to CSV
 */
async function jsonToCSV() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        
        if (!Array.isArray(parsed)) {
            vscode.window.showErrorMessage('JSON must be an array for CSV conversion');
            return;
        }

        if (parsed.length === 0) {
            vscode.window.showErrorMessage('JSON array is empty');
            return;
        }

        const csv = jsonArrayToCSV(parsed);
        
        // Create new document with CSV
        const doc = await vscode.workspace.openTextDocument({
            content: csv,
            language: 'csv'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('CSV generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Error converting to CSV: ${error.message}`);
    }
}

/**
 * Extract all unique keys from JSON object
 */
async function extractJSONKeys() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const keys = extractAllKeys(parsed);
        const sortedKeys = keys.sort();
        
        const result = sortedKeys.join('\n');
        
        // Create new document with keys
        const doc = await vscode.workspace.openTextDocument({
            content: result
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Extracted ${keys.length} unique keys`);
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Flatten nested JSON object
 */
async function flattenJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const delimiter = await vscode.window.showInputBox({
            prompt: 'Enter delimiter for nested keys',
            value: '.'
        });

        if (delimiter === undefined) return;

        const flattened = flattenObject(parsed, delimiter);
        const result = JSON.stringify(flattened, null, 2);

        const range = selection.isEmpty ? 
            new vscode.Range(0, 0, editor.document.lineCount, 0) : 
            selection;

        await editor.edit(editBuilder => {
            editBuilder.replace(range, result);
        });

        vscode.window.showInformationMessage('JSON flattened successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Unflatten previously flattened JSON
 */
async function unflattenJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const delimiter = await vscode.window.showInputBox({
            prompt: 'Enter delimiter used for flattening',
            value: '.'
        });

        if (delimiter === undefined) return;

        const unflattened = unflattenObject(parsed, delimiter);
        const result = JSON.stringify(unflattened, null, 2);

        const range = selection.isEmpty ? 
            new vscode.Range(0, 0, editor.document.lineCount, 0) : 
            selection;

        await editor.edit(editBuilder => {
            editBuilder.replace(range, result);
        });

        vscode.window.showInformationMessage('JSON unflattened successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Error unflattening JSON: ${error.message}`);
    }
}

/**
 * Extract value using JSON path
 */
async function jsonPath() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const path = await vscode.window.showInputBox({
            prompt: 'Enter JSON path (e.g., user.name, items[0].id)',
            placeHolder: 'user.name'
        });

        if (!path) return;

        const result = getValueByPath(parsed, path);
        
        if (result !== undefined) {
            const output = typeof result === 'object' ? 
                JSON.stringify(result, null, 2) : 
                String(result);
                
            await vscode.env.clipboard.writeText(output);
            vscode.window.showInformationMessage(`Value copied to clipboard: ${output.substring(0, 100)}${output.length > 100 ? '...' : ''}`);
        } else {
            vscode.window.showWarningMessage(`Path '${path}' not found`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}

/**
 * Sort JSON object keys alphabetically
 */
async function sortJSONKeys() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const sorted = sortObjectKeys(parsed);
        const result = JSON.stringify(sorted, null, 2);

        const range = selection.isEmpty ? 
            new vscode.Range(0, 0, editor.document.lineCount, 0) : 
            selection;

        await editor.edit(editBuilder => {
            editBuilder.replace(range, result);
        });

        vscode.window.showInformationMessage('JSON keys sorted successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Convert JSON to YAML
 */
async function jsonToYAML() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const yaml = jsonToYamlString(parsed);
        
        // Create new document with YAML
        const doc = await vscode.workspace.openTextDocument({
            content: yaml,
            language: 'yaml'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('YAML generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Convert YAML to JSON
 */
async function yamlToJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const json = yamlToJsonString(text);
        
        // Create new document with JSON
        const doc = await vscode.workspace.openTextDocument({
            content: json,
            language: 'json'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('JSON generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid YAML: ${error.message}`);
    }
}

/**
 * Generate JSON Schema from JSON data
 */
async function generateJSONSchema() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const parsed = JSON.parse(text);
        const schema = generateSchemaFromObject(parsed);
        const result = JSON.stringify(schema, null, 2);
        
        // Create new document with schema
        const doc = await vscode.workspace.openTextDocument({
            content: result,
            language: 'json'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('JSON Schema generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid JSON: ${error.message}`);
    }
}

/**
 * Compare two JSON objects and show differences
 */
async function jsonDiff() {
    vscode.window.showInformationMessage('Select two JSON files or text selections to compare');
    // This would require more complex implementation with diff UI
    // For now, just show a message
}

/**
 * Escape JSON string for embedding
 */
async function escapeJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    const escaped = JSON.stringify(text);
    
    const range = selection.isEmpty ? 
        new vscode.Range(0, 0, editor.document.lineCount, 0) : 
        selection;

    await editor.edit(editBuilder => {
        editBuilder.replace(range, escaped);
    });

    vscode.window.showInformationMessage('JSON escaped successfully');
}

/**
 * Unescape JSON string
 */
async function unescapeJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const unescaped = JSON.parse(text);
        
        const range = selection.isEmpty ? 
            new vscode.Range(0, 0, editor.document.lineCount, 0) : 
            selection;

        await editor.edit(editBuilder => {
            editBuilder.replace(range, unescaped);
        });

        vscode.window.showInformationMessage('JSON unescaped successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Invalid escaped JSON: ${error.message}`);
    }
}

/**
 * Convert TypeScript interface to JSON example
 */
async function typeScriptToJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const conversionType = await vscode.window.showQuickPick([
            { label: 'JSON Schema', description: 'Generate JSON Schema from interface' },
            { label: 'Example JSON', description: 'Generate example JSON object' },
            { label: 'Mock JSON', description: 'Generate JSON with realistic mock data' }
        ], {
            placeHolder: 'Select conversion type'
        });

        if (!conversionType) return;

        let result;
        switch (conversionType.label) {
            case 'JSON Schema':
                result = convertTypeScriptToJSONSchema(text);
                break;
            case 'Example JSON':
                result = convertTypeScriptToExampleJSON(text);
                break;
            case 'Mock JSON':
                result = convertTypeScriptToMockJSON(text);
                break;
        }

        if (result) {
            // Create new document with result
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(result, null, 2),
                language: 'json'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`${conversionType.label} generated successfully`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error converting TypeScript: ${error.message}`);
    }
}

/**
 * Convert TypeScript interface to JSON Schema specifically
 */
async function typeScriptToJSONSchema() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const schema = convertTypeScriptToJSONSchema(text);
        
        // Create new document with schema
        const doc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(schema, null, 2),
            language: 'json'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('JSON Schema generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Error converting to JSON Schema: ${error.message}`);
    }
}

/**
 * Convert TypeScript interface to mock JSON with realistic data
 */
async function typeScriptToMockJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    try {
        const mockData = convertTypeScriptToMockJSON(text);
        
        // Create new document with mock data
        const doc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(mockData, null, 2),
            language: 'json'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Mock JSON generated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Error generating mock JSON: ${error.message}`);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse JSON error and provide better error message
 */
function parseJSONError(errorMessage, text) {
    const match = errorMessage.match(/position (\d+)/);
    if (match) {
        const position = parseInt(match[1]);
        const lines = text.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return `${errorMessage} (Line ${line}, Column ${column})`;
    }
    return errorMessage;
}

/**
 * Highlight JSON error location
 */
function highlightJSONError(editor, error, text) {
    const match = error.message.match(/position (\d+)/);
    if (match) {
        const position = parseInt(match[1]);
        const lines = text.substring(0, position).split('\n');
        const line = lines.length - 1;
        const column = lines[lines.length - 1].length;
        
        const errorPosition = new vscode.Position(line, column);
        const errorRange = new vscode.Range(errorPosition, errorPosition.translate(0, 1));
        
        editor.selection = new vscode.Selection(errorPosition, errorPosition);
        editor.revealRange(errorRange, vscode.TextEditorRevealType.InCenter);
    }
}

/**
 * Generate TypeScript interface from JSON object
 */
function generateTypeScriptInterface(obj, interfaceName) {
    function getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'any[]';
            const itemType = getType(value[0]);
            return `${itemType}[]`;
        }
        if (typeof value === 'object') {
            return generateInterfaceForObject(value);
        }
        return typeof value;
    }

    function generateInterfaceForObject(obj) {
        const properties = Object.keys(obj).map(key => {
            const type = getType(obj[key]);
            return `  ${key}: ${type};`;
        }).join('\n');
        
        return `{\n${properties}\n}`;
    }

    const interfaceBody = generateInterfaceForObject(obj);
    return `interface ${interfaceName} ${interfaceBody}`;
}

/**
 * Convert JSON array to CSV
 */
function jsonArrayToCSV(jsonArray) {
    if (jsonArray.length === 0) return '';
    
    // Get all unique keys
    const allKeys = new Set();
    jsonArray.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => allKeys.add(key));
        }
    });
    
    const headers = Array.from(allKeys);
    const csvLines = [headers.join(',')];
    
    jsonArray.forEach(obj => {
        const values = headers.map(header => {
            const value = obj[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') {
                // Escape quotes and wrap in quotes if contains comma
                const escaped = value.replace(/"/g, '""');
                return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
            }
            return String(value);
        });
        csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
}

/**
 * Extract all keys from nested object
 */
function extractAllKeys(obj, prefix = '') {
    const keys = new Set();
    
    function traverse(current, currentPrefix) {
        if (typeof current === 'object' && current !== null) {
            if (Array.isArray(current)) {
                current.forEach((item, index) => {
                    traverse(item, `${currentPrefix}[${index}]`);
                });
            } else {
                Object.keys(current).forEach(key => {
                    const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;
                    keys.add(fullKey);
                    traverse(current[key], fullKey);
                });
            }
        }
    }
    
    traverse(obj, prefix);
    return Array.from(keys);
}

/**
 * Flatten nested object
 */
function flattenObject(obj, delimiter = '.', prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, flattenObject(obj[key], delimiter, newKey));
            } else {
                flattened[newKey] = obj[key];
            }
        }
    }
    
    return flattened;
}

/**
 * Unflatten object
 */
function unflattenObject(obj, delimiter = '.') {
    const result = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const keys = key.split(delimiter);
            let current = result;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = obj[key];
        }
    }
    
    return result;
}

/**
 * Get value by path
 */
function getValueByPath(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        // Handle array indices
        const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
            const [, arrayKey, index] = arrayMatch;
            current = current[arrayKey];
            if (!Array.isArray(current)) return undefined;
            current = current[parseInt(index)];
        } else {
            current = current[key];
        }
        
        if (current === undefined) return undefined;
    }
    
    return current;
}

/**
 * Sort object keys recursively
 */
function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    } else if (typeof obj === 'object' && obj !== null) {
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortObjectKeys(obj[key]);
        });
        return sorted;
    }
    return obj;
}

/**
 * Convert JSON to YAML (basic implementation)
 */
function jsonToYamlString(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(obj)) {
        return obj.map(item => `${spaces}- ${jsonToYamlString(item, indent + 1)}`).join('\n');
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.keys(obj).map(key => {
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
                return `${spaces}${key}:\n${jsonToYamlString(value, indent + 1)}`;
            } else {
                return `${spaces}${key}: ${JSON.stringify(value)}`;
            }
        }).join('\n');
    } else {
        return JSON.stringify(obj);
    }
}

/**
 * Convert YAML to JSON (basic implementation)
 */
function yamlToJsonString(yamlText) {
    // This is a very basic YAML parser - for production use, consider using a proper YAML library
    vscode.window.showWarningMessage('Basic YAML parser - consider using a dedicated YAML extension for complex files');
    
    try {
        // Simple conversion for basic YAML
        const lines = yamlText.split('\n').filter(line => line.trim());
        const result = {};
        
        lines.forEach(line => {
            const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
            if (match) {
                const [, indent, key, value] = match;
                result[key.trim()] = value.trim() || null;
            }
        });
        
        return JSON.stringify(result, null, 2);
    } catch (error) {
        throw new Error('Failed to parse YAML');
    }
}

/**
 * Generate JSON Schema from object
 */
function generateSchemaFromObject(obj) {
    function getSchema(value) {
        if (value === null) {
            return { type: 'null' };
        } else if (Array.isArray(value)) {
            return {
                type: 'array',
                items: value.length > 0 ? getSchema(value[0]) : {}
            };
        } else if (typeof value === 'object') {
            const properties = {};
            const required = [];
            
            Object.keys(value).forEach(key => {
                properties[key] = getSchema(value[key]);
                required.push(key);
            });
            
            return {
                type: 'object',
                properties,
                required
            };
        } else {
            return { type: typeof value };
        }
    }
    
    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        ...getSchema(obj)
    };
}

// ============================================================================
// TYPESCRIPT CONVERSION HELPER FUNCTIONS
// ============================================================================

/**
 * Parse TypeScript interfaces from text (COMPLETELY REWRITTEN)
 */
function parseTypeScriptInterfaces(text) {
    const interfaces = [];
    
    // Remove comments and clean up
    const cleanText = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/^\s*export\s+/gm, '');

    // Find interface declarations
    const interfacePattern = /(?:interface|type)\s+(\w+)\s*(?:extends\s+[\w\s,<>]+)?\s*=?\s*\{/g;
    let match;

    while ((match = interfacePattern.exec(cleanText)) !== null) {
        const interfaceName = match[1];
        const startPos = match.index + match[0].length - 1; // Position of opening brace
        
        const interfaceBody = extractBalancedBraces(cleanText, startPos);
        if (interfaceBody) {
            const properties = parseComplexInterfaceBody(interfaceBody);
            interfaces.push({ name: interfaceName, properties });
        }
    }

    return interfaces;
}

/**
 * Extract content between balanced braces
 */
function extractBalancedBraces(text, startIndex) {
    let braceCount = 0;
    let content = '';
    
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        
        if (char === '{') {
            braceCount++;
            if (braceCount > 1) content += char; // Don't include the opening brace
        } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
                return content; // Found matching closing brace
            }
            content += char;
        } else {
            if (braceCount > 0) content += char;
        }
    }
    
    return null;
}

/**
 * Parse complex interface body with nested objects (COMPLETELY REWRITTEN)
 */
function parseComplexInterfaceBody(body) {
    const properties = [];
    
    // Clean up the body first
    const cleanBody = body
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .trim();
    
    let i = 0;
    let currentProperty = '';
    let braceDepth = 0;
    let inPropertyName = true;
    let foundColon = false;
    
    while (i < cleanBody.length) {
        const char = cleanBody[i];
        const nextChar = cleanBody[i + 1] || '';
        
        if (char === ':' && braceDepth === 0 && !foundColon) {
            foundColon = true;
            inPropertyName = false;
            currentProperty += char;
        } else if (char === '{') {
            braceDepth++;
            currentProperty += char;
        } else if (char === '}') {
            braceDepth--;
            currentProperty += char;
        } else if ((char === ';' || char === ',') && braceDepth === 0) {
            // End of property at top level
            if (currentProperty.trim() && foundColon) {
                const property = parsePropertyDefinition(currentProperty.trim());
                if (property) {
                    properties.push(property);
                }
            }
            currentProperty = '';
            foundColon = false;
            inPropertyName = true;
        } else if (char === '\n' && braceDepth === 0) {
            // Handle newline at top level
            const trimmed = currentProperty.trim();
            if (trimmed && foundColon) {
                // Look ahead to see if next non-whitespace starts a new property
                const remaining = cleanBody.substring(i + 1);
                const nextMeaningful = remaining.replace(/^\s+/, '');
                
                // Check if next line starts with a property name (word followed by optional ? and :)
                const nextPropertyPattern = /^(\w+)(\??):\s*/;
                const isNextProperty = nextPropertyPattern.test(nextMeaningful);
                
                if (isNextProperty || nextMeaningful === '' || nextMeaningful.startsWith('}')) {
                    // This is the end of current property
                    const property = parsePropertyDefinition(trimmed);
                    if (property) {
                        properties.push(property);
                    }
                    currentProperty = '';
                    foundColon = false;
                    inPropertyName = true;
                } else {
                    currentProperty += char;
                }
            } else {
                currentProperty += char;
            }
        } else {
            currentProperty += char;
        }
        
        i++;
    }
    
    // Handle remaining property
    if (currentProperty.trim() && foundColon) {
        const property = parsePropertyDefinition(currentProperty.trim());
        if (property) {
            properties.push(property);
        }
    }
    
    return properties;
}

/**
 * Parse individual property definition (COMPLETELY REWRITTEN)
 */
function parsePropertyDefinition(text) {
    // Clean up the text
    const cleanText = text.trim().replace(/[;,]+$/, ''); // Remove trailing semicolons/commas
    
    // Find the colon that separates property name from type
    const colonIndex = cleanText.indexOf(':');
    if (colonIndex === -1) return null;
    
    // Extract property name part
    const namePartRaw = cleanText.substring(0, colonIndex).trim();
    const nameMatch = namePartRaw.match(/^(\w+)(\??)\s*$/);
    if (!nameMatch) return null;
    
    const [, name, optional] = nameMatch;
    
    // Extract type part (everything after the colon)
    let typeDefinition = cleanText.substring(colonIndex + 1).trim();
    
    // Remove trailing semicolon or comma if present
    typeDefinition = typeDefinition.replace(/[;,]\s*$/, '');
    
    return {
        type: 'property',
        name: name.trim(),
        optional: optional === '?',
        typeDefinition: typeDefinition
    };
}

/**
 * Convert TypeScript type to example value (FIXED VERSION)
 */
function typeToExampleValue(tsType) {
    const cleanType = tsType.replace(/\s+/g, ' ').trim();
    
    // Debug logging
    console.log('Processing type for example:', cleanType);
    
    // Handle nested objects - check for object literal syntax
    if (cleanType.startsWith('{') && cleanType.endsWith('}')) {
        console.log('Found nested object type:', cleanType);
        return parseNestedObjectToExample(cleanType);
    }
    
    // Handle union types
    if (cleanType.includes('|') && !cleanType.includes('{')) {
        const types = cleanType.split('|').map(t => t.trim());
        return typeToExampleValue(types[0]);
    }
    
    // Handle arrays
    if (cleanType.endsWith('[]')) {
        const itemType = cleanType.slice(0, -2).trim();
        return [typeToExampleValue(itemType)];
    }
    
    // Handle Array<T> syntax
    const arrayMatch = cleanType.match(/^Array<(.+)>$/);
    if (arrayMatch) {
        const itemType = arrayMatch[1].trim();
        return [typeToExampleValue(itemType)];
    }
    
    return generatePrimitiveExampleValue(cleanType);
}

/**
 * Convert TypeScript type to mock value (FIXED VERSION)
 */
function typeToMockValue(tsType, propertyName = '') {
    const cleanType = tsType.replace(/\s+/g, ' ').trim();
    
    // Debug logging
    console.log('Processing type for mock:', cleanType, 'Property:', propertyName);
    
    // Handle nested object types
    if (cleanType.startsWith('{') && cleanType.endsWith('}')) {
        console.log('Found nested object type for mock:', cleanType);
        return parseNestedObjectToMock(cleanType, propertyName);
    }
    
    // Handle union types
    if (cleanType.includes('|') && !cleanType.includes('{')) {
        const types = cleanType.split('|').map(t => t.trim());
        return typeToMockValue(types[0], propertyName);
    }
    
    // Handle array types
    if (cleanType.endsWith('[]')) {
        const itemType = cleanType.slice(0, -2).trim();
        return [
            typeToMockValue(itemType, propertyName),
            typeToMockValue(itemType, propertyName)
        ];
    }
    
    // Handle Array<T> syntax
    const arrayMatch = cleanType.match(/^Array<(.+)>$/);
    if (arrayMatch) {
        const itemType = arrayMatch[1].trim();
        return [
            typeToMockValue(itemType, propertyName),
            typeToMockValue(itemType, propertyName)
        ];
    }
    
    return generatePrimitiveMockValue(cleanType, propertyName);
}

/**
 * Parse nested object type definition to example object (FIXED VERSION)
 */
function parseNestedObjectToExample(objectType) {
    console.log('Parsing nested object to example:', objectType);
    
    const objectBody = objectType.slice(1, -1); // Remove outer braces
    console.log('Object body:', objectBody);
    
    const properties = parseComplexInterfaceBody(objectBody);
    console.log('Parsed properties:', properties);
    
    const exampleObj = {};
    
    properties.forEach(prop => {
        console.log('Processing property:', prop.name, 'Type:', prop.typeDefinition, 'Optional:', prop.optional);
        if (!prop.optional) { // Only include required properties in examples
            exampleObj[prop.name] = typeToExampleValue(prop.typeDefinition);
        }
    });
    
    console.log('Generated example object:', exampleObj);
    return exampleObj;
}

/**
 * Parse nested object type definition to mock object (FIXED VERSION)
 */
function parseNestedObjectToMock(objectType, parentName = '') {
    console.log('Parsing nested object to mock:', objectType);
    
    const objectBody = objectType.slice(1, -1); // Remove outer braces
    console.log('Object body:', objectBody);
    
    const properties = parseComplexInterfaceBody(objectBody);
    console.log('Parsed properties:', properties);
    
    const mockObj = {};
    
    properties.forEach(prop => {
        console.log('Processing property:', prop.name, 'Type:', prop.typeDefinition);
        mockObj[prop.name] = typeToMockValue(prop.typeDefinition, prop.name);
    });
    
    console.log('Generated mock object:', mockObj);
    return mockObj;
}

/**
 * Enhanced debugging version of convertTypeScriptToExampleJSON
 */
function convertTypeScriptToExampleJSON(tsText) {
    console.log('Converting TypeScript to example JSON...');
    
    const interfaces = parseTypeScriptInterfaces(tsText);
    console.log('Found interfaces:', interfaces);
    
    if (interfaces.length === 0) {
        throw new Error('No TypeScript interfaces found');
    }

    const mainInterface = interfaces[0];
    console.log('Processing main interface:', mainInterface.name);
    console.log('Interface properties:', mainInterface.properties);
    
    const example = {};

    mainInterface.properties.forEach(prop => {
        console.log('Processing top-level property:', prop.name, 'Type:', prop.typeDefinition, 'Optional:', prop.optional);
        if (!prop.optional) {
            example[prop.name] = typeToExampleValue(prop.typeDefinition);
        }
    });

    console.log('Final example:', example);
    return example;
}

/**
 * Enhanced debugging version of convertTypeScriptToMockJSON
 */
function convertTypeScriptToMockJSON(tsText) {
    console.log('Converting TypeScript to mock JSON...');
    
    const interfaces = parseTypeScriptInterfaces(tsText);
    console.log('Found interfaces:', interfaces);
    
    if (interfaces.length === 0) {
        throw new Error('No TypeScript interfaces found');
    }

    const mainInterface = interfaces[0];
    console.log('Processing main interface:', mainInterface.name);
    console.log('Interface properties:', mainInterface.properties);
    
    const mockData = {};

    mainInterface.properties.forEach(prop => {
        console.log('Processing top-level property:', prop.name, 'Type:', prop.typeDefinition);
        mockData[prop.name] = typeToMockValue(prop.typeDefinition, prop.name);
    });

    console.log('Final mock data:', mockData);
    return mockData;
}

/**
 * Generate primitive example values
 */
function generatePrimitiveExampleValue(type) {
    switch (type) {
        case 'string':
            return 'example string';
        case 'number':
            return 42;
        case 'boolean':
            return true;
        case 'null':
            return null;
        case 'undefined':
            return undefined;
        case 'Date':
            return new Date().toISOString();
        case 'any':
        case 'object':
            return {};
        default:
            // Handle string literals
            if (type.match(/^['"`].*['"`]$/)) {
                return type.slice(1, -1);
            }
            return 'example value';
    }
}

/**
 * Generate primitive mock values based on type and property name
 */
function generatePrimitiveMockValue(type, propertyName) {
    const lowerPropName = propertyName.toLowerCase();
    
    switch (type) {
        case 'string':
            return generateMockStringValue(lowerPropName);
        case 'number':
            return generateMockNumberValue(lowerPropName);
        case 'boolean':
            return Math.random() > 0.5;
        case 'null':
            return null;
        case 'undefined':
            return undefined;
        case 'Date':
            return new Date().toISOString();
        case 'any':
        case 'object':
            return {};
        default:
            // Handle string literals
            if (type.match(/^['"`].*['"`]$/)) {
                return type.slice(1, -1);
            }
            return generateMockStringValue(lowerPropName);
    }
}

/**
 * Enhanced mock string generator with better property name recognition
 */
function generateMockStringValue(propertyName) {
    const colorNames = ['primary', 'secondary', 'info', 'warning', 'danger', 'default'];
    const durationNames = ['slow', 'normal', 'fast'];
    
    // Color-specific values
    if (colorNames.some(color => propertyName.includes(color))) {
        const colors = {
            primary: '#007bff',
            secondary: '#6c757d', 
            info: '#17a2b8',
            warning: '#ffc107',
            danger: '#dc3545',
            default: '#343a40'
        };
        
        for (const [key, value] of Object.entries(colors)) {
            if (propertyName.includes(key)) return value;
        }
        return '#007bff'; // Default color
    }
    
    // Duration-specific values
    if (durationNames.some(duration => propertyName.includes(duration))) {
        const durations = {
            slow: '300ms',
            normal: '200ms',
            fast: '100ms'
        };
        
        for (const [key, value] of Object.entries(durations)) {
            if (propertyName.includes(key)) return value;
        }
        return '200ms';
    }
    
    // Color property names
    if (propertyName.includes('color') || propertyName.includes('iconcolor')) return '#333333';
    if (propertyName.includes('background')) return '#ffffff';
    
    // Generic property-based values
    const mockValues = {
        id: () => `id_${Math.random().toString(36).substr(2, 9)}`,
        name: () => 'Sample Name',
        email: () => 'user@example.com',
        url: () => 'https://example.com',
        title: () => 'Sample Title',
        description: () => 'Sample description'
    };
    
    for (const [key, generator] of Object.entries(mockValues)) {
        if (propertyName.includes(key)) {
            return generator();
        }
    }
    
    return `sample_${propertyName}`;
}

/**
 * Enhanced mock number generator
 */
function generateMockNumberValue(propertyName) {
    // Angle-specific values
    if (propertyName.includes('angle')) {
        return Math.floor(Math.random() * 360);
    }
    
    const mockValues = {
        id: () => Math.floor(Math.random() * 1000) + 1,
        age: () => Math.floor(Math.random() * 80) + 18,
        price: () => Math.round((Math.random() * 1000) * 100) / 100,
        count: () => Math.floor(Math.random() * 100),
        score: () => Math.floor(Math.random() * 100),
        rating: () => Math.round((Math.random() * 5) * 10) / 10
    };
    
    for (const [key, generator] of Object.entries(mockValues)) {
        if (propertyName.includes(key)) {
            return generator();
        }
    }
    
    return Math.floor(Math.random() * 100);
}

/**
 * Parse TypeScript interface and convert to JSON Schema
 */
function convertTypeScriptToJSONSchema(tsText) {
    const interfaces = parseTypeScriptInterfaces(tsText);
    
    if (interfaces.length === 0) {
        throw new Error('No TypeScript interfaces found');
    }

    // Convert first interface to JSON Schema
    const mainInterface = interfaces[0];
    const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: mainInterface.name,
        type: 'object',
        properties: {},
        required: []
    };

    mainInterface.properties.forEach(prop => {
        schema.properties[prop.name] = typeToJSONSchema(prop.typeDefinition, prop.optional);
        if (!prop.optional) {
            schema.required.push(prop.name);
        }
    });

    return schema;
}

/**
 * Convert TypeScript type to JSON Schema (ENHANCED)
 */
function typeToJSONSchema(tsType, isOptional = false) {
    const cleanType = tsType.replace(/\s+/g, ' ').trim();
    
    // Handle nested objects
    if (cleanType.startsWith('{') && cleanType.endsWith('}')) {
        const objectBody = cleanType.slice(1, -1);
        const properties = parseComplexInterfaceBody(objectBody);
        
        const schema = {
            type: 'object',
            properties: {},
            required: []
        };
        
        properties.forEach(prop => {
            schema.properties[prop.name] = typeToJSONSchema(prop.typeDefinition, prop.optional);
            if (!prop.optional) {
                schema.required.push(prop.name);
            }
        });
        
        return schema;
    }
    
    // Handle union types
    if (cleanType.includes('|') && !cleanType.includes('{')) {
        const types = cleanType.split('|').map(t => t.trim());
        return {
            oneOf: types.map(type => typeToJSONSchema(type))
        };
    }
    
    // Handle arrays
    if (cleanType.endsWith('[]')) {
        const itemType = cleanType.slice(0, -2);
        return {
            type: 'array',
            items: typeToJSONSchema(itemType)
        };
    }
    
    // Basic types
    const typeMap = {
        'string': { type: 'string' },
        'number': { type: 'number' },
        'boolean': { type: 'boolean' },
        'null': { type: 'null' },
        'Date': { type: 'string', format: 'date-time' },
        'any': {},
        'object': { type: 'object' }
    };
    
    return typeMap[cleanType] || { type: 'string' };
}

module.exports = {
    registerJsonCommands
};