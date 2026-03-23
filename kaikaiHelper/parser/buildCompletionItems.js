const vscode = require('vscode');
const { getSlotGroup } = require('../schema');

function buildCompletionItems(parsed, options = {}) {
    if (!parsed || !parsed.entrypoint || !parsed.nextSlot) {
        return [];
    }

    const includeLegacyAliases = !!options.includeLegacyAliases;
    const nextGroup = getSlotGroup(parsed.nextSlot.groupId);

    if (!nextGroup) return [];

    const items = [];

    for (const value of nextGroup.values) {
        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Constant);
        item.detail = nextGroup.label;
        item.documentation = new vscode.MarkdownString(
            `**${value}**\n\n${nextGroup.description}`
        );
        item.insertText = value;
        items.push(item);
    }

    if (includeLegacyAliases && nextGroup.aliases) {
        for (const aliasKey of Object.keys(nextGroup.aliases)) {
            const resolved = nextGroup.aliases[aliasKey];
            const item = new vscode.CompletionItem(aliasKey, vscode.CompletionItemKind.EnumMember);
            item.detail = `${nextGroup.label} alias`;
            item.documentation = new vscode.MarkdownString(
                `**${aliasKey}**\n\nAlias for \`${resolved}\`.`
            );
            item.insertText = aliasKey;
            item.sortText = `z_${aliasKey}`;
            items.push(item);
        }
    }

    return items;
}

module.exports = {
    buildCompletionItems,
};