const vscode = require('vscode');

function buildCanonicalPreview(parsed) {
    if (!parsed || !parsed.entrypoint) return null;

    const parts = [parsed.entrypoint.canonicalRoot];
    const slots = parsed.entrypoint.slots || [];
    const assignments = parsed.slotAssignments || [];

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const assignment = assignments[i];

        if (!assignment || !assignment.token || assignment.token.kind === 'empty') {
            if (slot.defaultValue != null) {
                parts.push(slot.defaultValue);
            }
            continue;
        }

        if (assignment.token.kind === 'variable') {
            parts.push(`[${slot.groupId}]`);
            continue;
        }

        parts.push(assignment.token.value);
    }

    return parts.join('.');
}

function buildHoverMarkdown(parsed, hoveredInfo) {
    if (!parsed || !parsed.entrypoint) return null;

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = false;

    if (hoveredInfo.kind === 'root') {
        markdown.appendMarkdown(`**${parsed.entrypoint.authoredRoot}**  \n`);
        markdown.appendMarkdown(`${parsed.entrypoint.description}  \n\n`);
        markdown.appendMarkdown(`**Canonical:** \`${parsed.entrypoint.canonicalRoot}\`  \n`);

        const preview = buildCanonicalPreview(parsed);
        if (preview) {
            markdown.appendMarkdown(`**Resolved Preview:** \`${preview}\`  \n`);
        }

        if (parsed.entrypoint.examples && parsed.entrypoint.examples.length > 0) {
            markdown.appendMarkdown(`\n**Examples**  \n`);
            for (const example of parsed.entrypoint.examples) {
                markdown.appendMarkdown(`- \`${example}\`  \n`);
            }
        }

        return markdown;
    }

    if (hoveredInfo.kind === 'slot' && hoveredInfo.assignment) {
        const assignment = hoveredInfo.assignment;
        const group = assignment.group;

        markdown.appendMarkdown(`**${hoveredInfo.text}**  \n`);

        if (assignment.token.kind === 'variable') {
            markdown.appendMarkdown(`Variable placeholder for **${group ? group.label : assignment.slot.groupId}**.  \n`);
        } else {
            markdown.appendMarkdown(`Segment in **${group ? group.label : assignment.slot.groupId}**.  \n`);
        }

        if (group) {
            markdown.appendMarkdown(`${group.description}  \n`);
            markdown.appendMarkdown(`\n**Allowed Values:** \`${group.values.join('`, `')}\`  \n`);
        }

        return markdown;
    }

    return null;
}

module.exports = {
    buildHoverMarkdown,
};