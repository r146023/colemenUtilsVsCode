const vscode = require('vscode');
const { extractThemeStringContext } = require('./parser/extractThemeStringContext');
const { parseThemePath } = require('./parser/parseThemePath');
const { buildHoverMarkdown } = require('./parser/buildHoverMarkdown');
const { getKaiKaiHelperConfig } = require('./config');

function findHoveredToken(parsed, themeText, cursorOffsetInString) {
    let runningIndex = 0;

    for (let i = 0; i < parsed.tokens.length; i++) {
        const token = parsed.tokens[i];
        const start = runningIndex;
        const end = start + token.value.length;

        if (cursorOffsetInString >= start && cursorOffsetInString <= end) {
            if (i === 0) {
                return {
                    kind: 'root',
                    text: token.value,
                };
            }

            return {
                kind: 'slot',
                text: token.value,
                assignment: parsed.slotAssignments[i - 1] || null,
            };
        }

        runningIndex = end + 1;
    }

    return null;
}

function createKaiKaiHoverProvider() {
    return {
        provideHover(document, position) {
            const config = getKaiKaiHelperConfig();
            if (!config.enabled || !config.hoverEnabled) return null;

            const context = extractThemeStringContext(document, position, {
                onlyInsideBuildThemeKeyMap: config.onlyInsideBuildThemeKeyMap,
            });

            if (!context) return null;

            const parsed = parseThemePath(context.text);
            if (!parsed || !parsed.entrypoint) return null;

            const cursorOffsetInString = document.offsetAt(position) - document.offsetAt(context.range.start);
            const hoveredInfo = findHoveredToken(parsed, context.text, cursorOffsetInString);

            if (!hoveredInfo) return null;

            const markdown = buildHoverMarkdown(parsed, hoveredInfo);
            if (!markdown) return null;

            return new vscode.Hover(markdown);
        },
    };
}

module.exports = {
    createKaiKaiHoverProvider,
};