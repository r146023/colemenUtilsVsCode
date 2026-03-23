const vscode = require('vscode');
const { BUILD_THEME_KEY_MAP_NAME } = require('../constants');

function isEscaped(text, index) {
    let slashCount = 0;
    let i = index - 1;

    while (i >= 0 && text[i] === '\\') {
        slashCount++;
        i--;
    }

    return slashCount % 2 === 1;
}

function isInsideBuildThemeKeyMap(document, position) {
    const fullText = document.getText();
    const offset = document.offsetAt(position);
    const beforeText = fullText.slice(0, offset);

    const patterns = [
        `function ${BUILD_THEME_KEY_MAP_NAME}`,
        `${BUILD_THEME_KEY_MAP_NAME} =`,
        `${BUILD_THEME_KEY_MAP_NAME}:`,
        `${BUILD_THEME_KEY_MAP_NAME}(`,
    ];

    let foundIndex = -1;

    for (const pattern of patterns) {
        const idx = beforeText.lastIndexOf(pattern);
        if (idx > foundIndex) {
            foundIndex = idx;
        }
    }

    return foundIndex !== -1;
}

function findOpeningQuote(lineText, cursorChar) {
    for (let i = Math.min(cursorChar - 1, lineText.length - 1); i >= 0; i--) {
        const char = lineText[i];

        if ((char === '"' || char === "'" || char === '`') && !isEscaped(lineText, i)) {
            return {
                quote: char,
                index: i,
            };
        }
    }

    return null;
}

function findClosingQuote(lineText, openingQuote, openingIndex) {
    for (let i = openingIndex + 1; i < lineText.length; i++) {
        const char = lineText[i];

        if (char === openingQuote && !isEscaped(lineText, i)) {
            return i;
        }
    }

    return -1;
}

function extractThemeStringContext(document, position, options = {}) {
    const onlyInsideBuildThemeKeyMap = !!options.onlyInsideBuildThemeKeyMap;

    if (onlyInsideBuildThemeKeyMap && !isInsideBuildThemeKeyMap(document, position)) {
        return null;
    }

    const line = document.lineAt(position.line);
    const lineText = line.text;
    const cursorChar = position.character;

    const opening = findOpeningQuote(lineText, cursorChar);
    if (!opening) {
        return null;
    }

    const closingIndex = findClosingQuote(lineText, opening.quote, opening.index);
    const effectiveEnd = closingIndex === -1 ? lineText.length : closingIndex;

    // Cursor must be inside the quoted content, not on/before the opening quote.
    // Allow cursor at the logical end of the current string content.
    if (cursorChar <= opening.index || cursorChar > effectiveEnd) {
        return null;
    }

    const text = lineText.slice(opening.index + 1, effectiveEnd);

    const startPos = new vscode.Position(position.line, opening.index + 1);
    const endPos = new vscode.Position(position.line, effectiveEnd);
    const range = new vscode.Range(startPos, endPos);

    return {
        text,
        range,
        quote: opening.quote,
        lineText,
    };
}

module.exports = {
    extractThemeStringContext,
};