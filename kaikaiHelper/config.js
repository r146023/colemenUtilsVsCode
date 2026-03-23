const vscode = require('vscode');

function getKaiKaiHelperConfig() {
    const config = vscode.workspace.getConfiguration('colemenutils');

    return {
        enabled: config.get('kaiKaiThemeAssist.enabled', false),
        hoverEnabled: config.get('kaiKaiThemeAssist.hover.enabled', true),
        completionEnabled: config.get('kaiKaiThemeAssist.completion.enabled', true),
        onlyInsideBuildThemeKeyMap: config.get('kaiKaiThemeAssist.onlyInsideBuildThemeKeyMap', true),
        includeLegacyAliasesInCompletion: config.get('kaiKaiThemeAssist.includeLegacyAliasesInCompletion', false),
        preferCanonicalPreview: config.get('kaiKaiThemeAssist.preferCanonicalPreview', true),
    };
}

module.exports = {
    getKaiKaiHelperConfig,
};