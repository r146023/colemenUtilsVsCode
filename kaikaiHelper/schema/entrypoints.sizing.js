const sizingEntrypoints = [
    {
        id: 'borderRadius',
        kind: 'alias',
        authoredRoot: 'borderRadius',
        canonicalRoot: 'tokens.borderRadius',
        description: 'Border radius token.',
        slots: [
            { slotId: 'size', groupId: 'borderRadiusSize', required: false, defaultValue: 'med' },
        ],
        defaultExpansion: ['med'],
        examples: ['borderRadius', 'borderRadius.lrg', 'borderRadius.x'],
    },

    {
        id: 'minPageWidth',
        kind: 'alias',
        authoredRoot: 'minPageWidth',
        canonicalRoot: 'sizing.minPageWidth',
        description: 'Minimum page width sizing token.',
        slots: [],
        defaultExpansion: [],
        examples: ['minPageWidth'],
    },

    {
        id: 'maxPageWidth',
        kind: 'alias',
        authoredRoot: 'maxPageWidth',
        canonicalRoot: 'sizing.maxPageWidth',
        description: 'Maximum page width sizing token.',
        slots: [],
        defaultExpansion: [],
        examples: ['maxPageWidth'],
    },

    {
        id: 'breakpoints',
        kind: 'alias',
        authoredRoot: 'breakpoints',
        canonicalRoot: 'sizing.breakpoints',
        description: 'Sizing breakpoints root.',
        slots: [
            { slotId: 'breakpoint', groupId: 'breakpointKey', required: true },
            { slotId: 'bound', groupId: 'minMaxKey', required: true },
        ],
        defaultExpansion: [],
        examples: ['breakpoints.med.min', 'breakpoints.xlg.max'],
    },
];

module.exports = {
    sizingEntrypoints,
};