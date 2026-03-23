const paletteEntrypoints = [
    {
        id: 'palette',
        kind: 'family',
        authoredRoot: 'palette',
        canonicalRoot: 'palette',
        description: 'Palette root.',
        slots: [
            { slotId: 'family', groupId: 'paletteFamily', required: true },
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: [],
        examples: ['palette.primary.500', 'palette.gray.700'],
    },

    {
        id: 'body',
        kind: 'shorthand',
        authoredRoot: 'body',
        canonicalRoot: 'palette.body',
        description: 'Palette shorthand for body.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['body', 'body.700'],
    },

    {
        id: 'primary',
        kind: 'shorthand',
        authoredRoot: 'primary',
        canonicalRoot: 'palette.primary',
        description: 'Palette shorthand for primary.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['primary', 'primary.750'],
    },

    {
        id: 'secondary',
        kind: 'shorthand',
        authoredRoot: 'secondary',
        canonicalRoot: 'palette.secondary',
        description: 'Palette shorthand for secondary.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['secondary', 'secondary.750'],
    },

    {
        id: 'success',
        kind: 'shorthand',
        authoredRoot: 'success',
        canonicalRoot: 'palette.success',
        description: 'Palette shorthand for success.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['success', 'success.750'],
    },

    {
        id: 'info',
        kind: 'shorthand',
        authoredRoot: 'info',
        canonicalRoot: 'palette.info',
        description: 'Palette shorthand for info.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['info', 'info.750'],
    },

    {
        id: 'warning',
        kind: 'shorthand',
        authoredRoot: 'warning',
        canonicalRoot: 'palette.warning',
        description: 'Palette shorthand for warning.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['warning', 'warning.750'],
    },

    {
        id: 'danger',
        kind: 'shorthand',
        authoredRoot: 'danger',
        canonicalRoot: 'palette.danger',
        description: 'Palette shorthand for danger.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['danger', 'danger.750'],
    },

    {
        id: 'gray',
        kind: 'shorthand',
        authoredRoot: 'gray',
        canonicalRoot: 'palette.gray',
        description: 'Palette shorthand for gray.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['gray', 'gray.750'],
    },

    {
        id: 'altGray',
        kind: 'shorthand',
        authoredRoot: 'altGray',
        canonicalRoot: 'palette.altGray',
        description: 'Palette shorthand for altGray.',
        slots: [
            { slotId: 'stop', groupId: 'paletteStop', required: false, defaultValue: '500' },
        ],
        defaultExpansion: ['500'],
        examples: ['altGray', 'altGray.750'],
    },
];

module.exports = {
    paletteEntrypoints,
};