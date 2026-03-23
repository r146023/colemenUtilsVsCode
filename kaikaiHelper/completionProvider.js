const vscode = require('vscode');
const { extractThemeStringContext } = require('./parser/extractThemeStringContext');
const { parseThemePath } = require('./parser/parseThemePath');
const { buildCompletionItems } = require('./parser/buildCompletionItems');
const { getKaiKaiHelperConfig } = require('./config');

function createKaiKaiCompletionProvider() {
    return {
        provideCompletionItems(document, position) {
            // console.log('[KaiKai] provideCompletionItems fired');

            const config = getKaiKaiHelperConfig();
            // console.log('[KaiKai] config:', config);

            if (!config.enabled || !config.completionEnabled) {
                // console.log('[KaiKai] blocked by config');
                return null;
            }

            const context = extractThemeStringContext(document, position, {
                onlyInsideBuildThemeKeyMap: config.onlyInsideBuildThemeKeyMap,
            });

            // console.log('[KaiKai] context:', context);

            if (!context) {
                // console.log('[KaiKai] no string context found');
                return null;
            }

            const cursorOffsetInString =
                document.offsetAt(position) - document.offsetAt(context.range.start);

            // console.log('[KaiKai] cursorOffsetInString:', cursorOffsetInString);

            if (cursorOffsetInString < 0) {
                // console.log('[KaiKai] invalid cursor offset');
                return null;
            }

            const textBeforeCursor = context.text.slice(0, cursorOffsetInString);
            // console.log('[KaiKai] textBeforeCursor:', textBeforeCursor);

            const parsed = parseThemePath(textBeforeCursor);
            // console.log('[KaiKai] parsed:', parsed);

            if (!parsed || !parsed.entrypoint) {
                // console.log('[KaiKai] no entrypoint');
                return null;
            }

            const items = buildCompletionItems(parsed, {
                includeLegacyAliases: config.includeLegacyAliasesInCompletion,
            });

            // console.log('[KaiKai] completion item count:', items ? items.length : 0);

            return items;
        },
    };
}

module.exports = {
    createKaiKaiCompletionProvider,
};

// const vscode = require('vscode');
// const { extractThemeStringContext } = require('./parser/extractThemeStringContext');
// const { parseThemePath } = require('./parser/parseThemePath');
// const { buildCompletionItems } = require('./parser/buildCompletionItems');
// const { getKaiKaiHelperConfig } = require('./config');

// function createKaiKaiCompletionProvider() {
//     return {
//         provideCompletionItems(document, position) {
//             const config = getKaiKaiHelperConfig();
//             if (!config.enabled || !config.completionEnabled) return null;

//             const context = extractThemeStringContext(document, position, {
//                 onlyInsideBuildThemeKeyMap: config.onlyInsideBuildThemeKeyMap,
//             });

//             if (!context) return null;

//             const cursorOffsetInString =
//                 document.offsetAt(position) - document.offsetAt(context.range.start);

//             if (cursorOffsetInString < 0) return null;

//             const textBeforeCursor = context.text.slice(0, cursorOffsetInString);
//             const parsed = parseThemePath(textBeforeCursor);

//             if (!parsed || !parsed.entrypoint) return null;
//             console.log('KaiKai completion fired');
//             console.log('position:', position.line, position.character);
//             console.log('context:', context);
//             console.log('textBeforeCursor:', textBeforeCursor);
//             console.log('parsed:', parsed);


//             return buildCompletionItems(parsed, {
//                 includeLegacyAliases: config.includeLegacyAliasesInCompletion,
//             });
//         },
//     };
// }

// module.exports = {
//     createKaiKaiCompletionProvider,
// };