const vscode = require('vscode');
const { KAIKAI_SUPPORTED_LANGUAGES } = require('./constants');
const { createKaiKaiHoverProvider } = require('./hoverProvider');
const { createKaiKaiCompletionProvider } = require('./completionProvider');

function registerKaiKaiHelper(context) {
    const hoverProvider = createKaiKaiHoverProvider();
    const completionProvider = createKaiKaiCompletionProvider();

    for (const language of KAIKAI_SUPPORTED_LANGUAGES) {
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                { language, scheme: 'file' },
                hoverProvider
            ),
            vscode.languages.registerCompletionItemProvider(
                { language, scheme: 'file' },
                completionProvider,
                '.'
            )
        );
    }
}

module.exports = {
    registerKaiKaiHelper,
};