const typographyEntrypoints = [
    {
        id: 'fontSize',
        kind: 'alias',
        authoredRoot: 'fontSize',
        canonicalRoot: 'typography.fontSize',
        description: 'Typography font size token.',
        slots: [
            { slotId: 'scale', groupId: 'fontSizeScale', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['x'],
        examples: ['fontSize', 'fontSize.med', 'fontSize.zzzz'],
    },

    {
        id: 'fontWeight',
        kind: 'alias',
        authoredRoot: 'fontWeight',
        canonicalRoot: 'typography.fontWeight',
        description: 'Typography font weight token.',
        slots: [
            { slotId: 'scale', groupId: 'fontWeightScale', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['x'],
        examples: ['fontWeight', 'fontWeight.bold', 'fontWeight.zz'],
    },

    {
        id: 'lineHeight',
        kind: 'alias',
        authoredRoot: 'lineHeight',
        canonicalRoot: 'typography.lineHeight',
        description: 'Typography line height token.',
        slots: [
            { slotId: 'scale', groupId: 'lineHeightScale', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['x'],
        examples: ['lineHeight', 'lineHeight.med'],
    },

    {
        id: 'letterSpacing',
        kind: 'alias',
        authoredRoot: 'letterSpacing',
        canonicalRoot: 'typography.letterSpacing',
        description: 'Typography letter spacing token.',
        slots: [
            { slotId: 'scale', groupId: 'letterSpacingScale', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['x'],
        examples: ['letterSpacing', 'letterSpacing.a'],
    },

    {
        id: 'fontFamily',
        kind: 'alias',
        authoredRoot: 'fontFamily',
        canonicalRoot: 'typography.fontFamily',
        description: 'Typography font family token.',
        slots: [],
        defaultExpansion: [],
        examples: ['fontFamily'],
    },

    {
        id: 'headers',
        kind: 'alias',
        authoredRoot: 'headers',
        canonicalRoot: 'typography.headers',
        description: 'Typography headers root.',
        slots: [
            { slotId: 'headerKey', groupId: 'headerKey', required: true },
        ],
        defaultExpansion: [],
        examples: ['headers.h1', 'headers.h2'],
    },

    {
        id: 'h1',
        kind: 'shorthand',
        authoredRoot: 'h1',
        canonicalRoot: 'typography.headers.h1',
        description: 'Typography header shorthand.',
        slots: [],
        defaultExpansion: [],
        examples: ['h1'],
    },
    {
        id: 'h2',
        kind: 'shorthand',
        authoredRoot: 'h2',
        canonicalRoot: 'typography.headers.h2',
        description: 'Typography header shorthand.',
        slots: [],
        defaultExpansion: [],
        examples: ['h2'],
    },
    {
        id: 'h3',
        kind: 'shorthand',
        authoredRoot: 'h3',
        canonicalRoot: 'typography.headers.h3',
        description: 'Typography header shorthand.',
        slots: [],
        defaultExpansion: [],
        examples: ['h3'],
    },
    {
        id: 'h4',
        kind: 'shorthand',
        authoredRoot: 'h4',
        canonicalRoot: 'typography.headers.h4',
        description: 'Typography header shorthand.',
        slots: [],
        defaultExpansion: [],
        examples: ['h4'],
    },
    {
        id: 'h5',
        kind: 'shorthand',
        authoredRoot: 'h5',
        canonicalRoot: 'typography.headers.h5',
        description: 'Typography header shorthand.',
        slots: [],
        defaultExpansion: [],
        examples: ['h5'],
    },
    {
        id: 'h6',
        kind: 'shorthand',
        authoredRoot: 'h6',
        canonicalRoot: 'typography.headers.h6',
        description: 'Typography header shorthand.',
        slots: [],
        defaultExpansion: [],
        examples: ['h6'],
    },
];

module.exports = {
    typographyEntrypoints,
};