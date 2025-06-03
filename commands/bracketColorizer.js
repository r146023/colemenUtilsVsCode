const vscode = require('vscode');
const { getConfigValue } = require('../helpers/configHelpers');

/**
 * Bracket Pair Colorizer Module for ColemenUtils
 * Colorizes matching brackets, parentheses, and braces
 */

// Store decoration types for different bracket levels
let bracketDecorations = {};
let isActive = false;

/**
 * Register bracket colorizer commands and events
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerBracketColorizer(context) {
    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.toggleBracketColorizer', toggleBracketColorizer),
        vscode.commands.registerCommand('colemenutils.refreshBracketColors', refreshBracketColors)
    );

    // Event listeners
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateBracketColors),
        vscode.workspace.onDidChangeTextDocument(handleDocumentChange),
        vscode.window.onDidChangeTextEditorSelection(updateBracketColors),
        vscode.workspace.onDidChangeConfiguration(handleConfigChange)
    );

    // Initialize
    initializeBracketColorizer();
    updateBracketColors();
}

/**
 * Initialize bracket colorizer with default settings
 */
function initializeBracketColorizer() {
    isActive = getConfigValue('bracketColorizer.enabled', true);
    createDecorationTypes();
}

/**
 * Create decoration types for different bracket levels and types
 */
function createDecorationTypes() {
    // Dispose existing decorations
    Object.values(bracketDecorations).forEach(decorations => {
        if (Array.isArray(decorations)) {
            decorations.forEach(decoration => decoration && decoration.dispose());
        } else if (decorations) {
            decorations.dispose();
        }
    });

    const colors = getConfigValue('bracketColorizer.colors', [
        '#FFD700', // Gold
        '#DA70D6', // Orchid
        '#87CEEB', // SkyBlue
        '#98FB98', // PaleGreen
        '#F0E68C', // Khaki
        '#FF6347', // Tomato
        '#40E0D0', // Turquoise
        '#EE82EE', // Violet
        '#90EE90', // LightGreen
        '#FFB6C1'  // LightPink
    ]);

    const highlightStyle = getConfigValue('bracketColorizer.highlightStyle', 'color');
    const highlightActiveScope = getConfigValue('bracketColorizer.highlightActiveScope', true);
    const fontWeight = getConfigValue('bracketColorizer.fontWeight', 'bold');
    const opacity = getConfigValue('bracketColorizer.opacity', '1.0');

    bracketDecorations = {
        parentheses: [],
        brackets: [],
        braces: [],
        activeScope: null
    };

    // Create decorations for each color level
    colors.forEach((color, index) => {
        let decorationOptions = {
            overviewRulerColor: color,
            overviewRulerLane: vscode.OverviewRulerLane.Right
        };

        // Apply opacity to color if specified
        const colorWithOpacity = opacity !== '1.0' ? 
            color + Math.round(parseFloat(opacity) * 255).toString(16).padStart(2, '0') : 
            color;

        // Choose highlighting style
        switch (highlightStyle) {
            case 'background':
                decorationOptions.backgroundColor = colorWithOpacity + '40'; // Add transparency
                decorationOptions.borderRadius = '2px';
                break;
            case 'underline':
                decorationOptions.textDecoration = `underline; text-decoration-color: ${colorWithOpacity}; text-decoration-thickness: 2px;`;
                break;
            case 'border':
                decorationOptions.border = `1px solid ${colorWithOpacity}`;
                decorationOptions.borderRadius = '2px';
                break;
            case 'glow':
                decorationOptions.color = colorWithOpacity;
                decorationOptions.fontWeight = fontWeight;
                decorationOptions.textShadow = `0 0 3px ${colorWithOpacity}`;
                break;
            case 'color':
            default:
                decorationOptions.color = colorWithOpacity;
                decorationOptions.fontWeight = fontWeight;
                break;
        }

        // Create decoration types for each bracket type
        ['parentheses', 'brackets', 'braces'].forEach(bracketType => {
            bracketDecorations[bracketType].push(
                vscode.window.createTextEditorDecorationType(decorationOptions)
            );
        });
    });

    // Active scope highlighting
    if (highlightActiveScope) {
        bracketDecorations.activeScope = vscode.window.createTextEditorDecorationType({
            backgroundColor: getConfigValue('bracketColorizer.activeScopeColor', 'rgba(255,255,255,0.05)'),
            isWholeLine: false,
            borderRadius: '3px'
        });
    }
}

/**
 * Toggle bracket colorizer on/off
 */
function toggleBracketColorizer() {
    isActive = !isActive;
    
    if (isActive) {
        vscode.window.showInformationMessage('Bracket Colorizer: Enabled');
        updateBracketColors();
    } else {
        vscode.window.showInformationMessage('Bracket Colorizer: Disabled');
        clearAllDecorations();
    }
}

/**
 * Refresh bracket colors (useful after config changes)
 */
function refreshBracketColors() {
    createDecorationTypes();
    updateBracketColors();
    vscode.window.showInformationMessage('Bracket colors refreshed');
}

/**
 * Handle document changes with debouncing
 */
let updateTimeout;
function handleDocumentChange(event) {
    if (!isActive) return;
    
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        updateBracketColors(vscode.window.activeTextEditor);
    }, 150); // Debounce for performance
}

/**
 * Handle configuration changes
 */
function handleConfigChange(event) {
    if (event.affectsConfiguration('colemenutils.bracketColorizer')) {
        initializeBracketColorizer();
        updateBracketColors();
    }
}

/**
 * Main function to update bracket colors
 */
function updateBracketColors(editor) {
    if (!editor || !isActive) return;

    const document = editor.document;
    const text = document.getText();
    
    // Skip binary files or very large files for performance
    if (document.isBinary || text.length > 100000) return;

    // Clear existing decorations
    clearAllDecorations(editor);

    // Parse brackets and apply colors
    const bracketInfo = parseBrackets(text);
    applyBracketDecorations(editor, bracketInfo);

    // Highlight active scope if enabled
    if (getConfigValue('bracketColorizer.highlightActiveScope', true)) {
        highlightActiveScope(editor, bracketInfo);
    }
}

/**
 * Parse all brackets in the document
 */
function parseBrackets(text) {
    const brackets = {
        parentheses: [],
        brackets: [],
        braces: []
    };

    const stack = {
        parentheses: [],
        brackets: [],
        braces: []
    };

    const bracketTypes = {
        '(': { type: 'parentheses', isOpening: true },
        ')': { type: 'parentheses', isOpening: false },
        '[': { type: 'brackets', isOpening: true },
        ']': { type: 'brackets', isOpening: false },
        '{': { type: 'braces', isOpening: true },
        '}': { type: 'braces', isOpening: false }
    };

    let inString = false;
    let inComment = false;
    let stringChar = '';
    let i = 0;

    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1];

        // Handle string literals
        if ((char === '"' || char === "'" || char === '`') && !inComment) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar && text[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            }
            i++;
            continue;
        }

        // Handle comments
        if (!inString) {
            if (char === '/' && nextChar === '/') {
                // Line comment
                const lineEnd = text.indexOf('\n', i);
                i = lineEnd === -1 ? text.length : lineEnd;
                continue;
            }
            if (char === '/' && nextChar === '*') {
                // Block comment start
                inComment = true;
                i += 2;
                continue;
            }
            if (inComment && char === '*' && nextChar === '/') {
                // Block comment end
                inComment = false;
                i += 2;
                continue;
            }
        }

        // Process brackets only if not in string or comment
        if (!inString && !inComment && bracketTypes[char]) {
            const bracketInfo = bracketTypes[char];
            const position = positionFromIndex(text, i);

            if (bracketInfo.isOpening) {
                // Opening bracket
                stack[bracketInfo.type].push({
                    position: position,
                    index: i,
                    level: stack[bracketInfo.type].length
                });
            } else {
                // Closing bracket
                const openingBracket = stack[bracketInfo.type].pop();
                if (openingBracket) {
                    brackets[bracketInfo.type].push({
                        opening: openingBracket,
                        closing: {
                            position: position,
                            index: i,
                            level: openingBracket.level
                        }
                    });
                }
            }
        }

        i++;
    }

    return brackets;
}

/**
 * Convert string index to VS Code position
 */
function positionFromIndex(text, index) {
    const lines = text.substring(0, index).split('\n');
    return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
}

/**
 * Apply bracket decorations to the editor
 */
function applyBracketDecorations(editor, bracketInfo) {
    const maxColors = getConfigValue('bracketColorizer.colors', []).length;

    Object.keys(bracketInfo).forEach(bracketType => {
        const pairs = bracketInfo[bracketType];
        const decorationsByLevel = {};

        pairs.forEach(pair => {
            const level = pair.opening.level % maxColors;
            
            if (!decorationsByLevel[level]) {
                decorationsByLevel[level] = [];
            }

            // Add opening bracket
            decorationsByLevel[level].push({
                range: new vscode.Range(
                    pair.opening.position,
                    pair.opening.position.translate(0, 1)
                )
            });

            // Add closing bracket
            decorationsByLevel[level].push({
                range: new vscode.Range(
                    pair.closing.position,
                    pair.closing.position.translate(0, 1)
                )
            });
        });

        // Apply decorations for each level
        Object.keys(decorationsByLevel).forEach(level => {
            const decorationType = bracketDecorations[bracketType][parseInt(level)];
            if (decorationType) {
                editor.setDecorations(decorationType, decorationsByLevel[level]);
            }
        });
    });
}

/**
 * Highlight the active scope around cursor
 */
function highlightActiveScope(editor, bracketInfo) {
    if (!bracketDecorations.activeScope) return;

    const cursorPosition = editor.selection.active;
    let activePair = null;
    let smallestRange = null;

    // Find the smallest bracket pair containing the cursor
    Object.values(bracketInfo).forEach(pairs => {
        pairs.forEach(pair => {
            const range = new vscode.Range(pair.opening.position, pair.closing.position);
            if (range.contains(cursorPosition)) {
                if (!smallestRange || range.contains(smallestRange)) {
                    activePair = pair;
                    smallestRange = range;
                }
            }
        });
    });

    if (activePair && smallestRange) {
        editor.setDecorations(bracketDecorations.activeScope, [{ range: smallestRange }]);
    }
}

/**
 * Clear all bracket decorations
 */
function clearAllDecorations(editor) {
    if (!editor) editor = vscode.window.activeTextEditor;
    if (!editor) return;

    Object.values(bracketDecorations).forEach(decorations => {
        if (Array.isArray(decorations)) {
            decorations.forEach(decoration => {
                if (decoration) editor.setDecorations(decoration, []);
            });
        } else if (decorations) {
            editor.setDecorations(decorations, []);
        }
    });
}

module.exports = {
    registerBracketColorizer
};