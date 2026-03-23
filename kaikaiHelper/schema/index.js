const { slotGroups } = require('./slotGroups');
const { colorEntrypoints } = require('./entrypoints.color');
const { typographyEntrypoints } = require('./entrypoints.typography');
const { paletteEntrypoints } = require('./entrypoints.palette');
const { sizingEntrypoints } = require('./entrypoints.sizing');

const entrypoints = [
    ...colorEntrypoints,
    ...typographyEntrypoints,
    ...paletteEntrypoints,
    ...sizingEntrypoints,
];

function getEntrypointByRoot(root) {
    return entrypoints.find((entry) => entry.authoredRoot === root) || null;
}

function getSlotGroup(groupId) {
    return slotGroups[groupId] || null;
}

module.exports = {
    slotGroups,
    entrypoints,
    getEntrypointByRoot,
    getSlotGroup,
};