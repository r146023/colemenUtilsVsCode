const { resolveEntrypoint } = require('./resolveEntrypoint');
const { getSlotGroup } = require('../schema');

function parseThemePath(pathText) {
    const { tokenizeThemePath } = require('./tokenizeThemePath');
    const tokens = tokenizeThemePath(pathText);
    const entrypoint = resolveEntrypoint(tokens);

    if (!entrypoint) {
        return {
            valid: false,
            reason: 'No known entrypoint found.',
            pathText,
            tokens,
            entrypoint: null,
            slotAssignments: [],
            nextSlot: null,
        };
    }

    const remainingTokens = tokens.slice(1);
    const slotAssignments = [];
    const slots = entrypoint.slots || [];

    for (let i = 0; i < remainingTokens.length; i++) {
        const token = remainingTokens[i];
        const slot = slots[i] || null;

        if (!slot) {
            slotAssignments.push({
                token,
                slot: null,
                valid: false,
                reason: 'Too many segments for this entrypoint.',
            });
            continue;
        }

        const group = getSlotGroup(slot.groupId);

        slotAssignments.push({
            token,
            slot,
            group,
            valid: true,
        });
    }

    let nextSlot = null;
    const usedSlotCount = remainingTokens.filter((token) => token.kind !== 'empty').length;

    if (usedSlotCount < slots.length) {
        nextSlot = slots[usedSlotCount];
    }

    return {
        valid: true,
        pathText,
        tokens,
        entrypoint,
        slotAssignments,
        nextSlot,
    };
}

module.exports = {
    parseThemePath,
};