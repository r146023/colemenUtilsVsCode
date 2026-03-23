const colorEntrypoints = [
    {
        id: 'fill',
        kind: 'alias',
        authoredRoot: 'fill',
        canonicalRoot: 'tokens.color.fill',
        description: 'Fill color token family.',
        slots: [
            { slotId: 'role', groupId: 'themeRoleWithAlt', required: false, defaultValue: 'main' },
            { slotId: 'pack', groupId: 'fillPack', required: false, defaultValue: 'solid' },
            { slotId: 'channel', groupId: 'fillChannel', required: false, defaultValue: 'bg' },
            { slotId: 'cluster', groupId: 'likertCluster', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['main', 'solid', 'bg', 'x'],
        examples: [
            'fill.primary.solid.bg.x',
            'fill.warning.soft.fg.a',
            'fill.main.disabled.border.zz',
        ],
    },

    {
        id: 'font',
        kind: 'alias',
        authoredRoot: 'font',
        canonicalRoot: 'tokens.color.font',
        description: 'Font color token family.',
        slots: [
            { slotId: 'role', groupId: 'themeRole', required: false, defaultValue: 'main' },
            { slotId: 'cluster', groupId: 'likertCluster', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['main', 'x'],
        examples: [
            'font.main.x',
            'font.primary.aa',
            'font.disabled.z',
        ],
    },

    {
        id: 'spacing',
        kind: 'alias',
        authoredRoot: 'spacing',
        canonicalRoot: 'spacing',
        description: 'Spacing token family.',
        slots: [
            {
                slotId: 'role',
                groupId: 'SpacingScale',
                required: false,
                defaultValue: 'x'
            }
        ],
        defaultExpansion: ['med', 'x'],
        examples: [
            'spacing.x',
            'spacing.aa',
            'spacing.med',
        ],
    },

    {
        id: 'surface',
        kind: 'alias',
        authoredRoot: 'surface',
        canonicalRoot: 'tokens.color.surface',
        description: 'Surface color token family.',
        slots: [
            { slotId: 'role', groupId: 'themeRoleWithAlt', required: false, defaultValue: 'main' },
            { slotId: 'cluster', groupId: 'likertCluster', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['main', 'x'],
        examples: [
            'surface.main.x',
            'surface.primary.aa',
        ],
    },

    {
        id: 'border',
        kind: 'alias',
        authoredRoot: 'border',
        canonicalRoot: 'tokens.color.border',
        description: 'Border color token family.',
        slots: [
            { slotId: 'role', groupId: 'themeRoleWithAlt', required: false, defaultValue: 'main' },
            { slotId: 'cluster', groupId: 'likertCluster', required: false, defaultValue: 'x' },
        ],
        defaultExpansion: ['main', 'x'],
        examples: [
            'border.main.a',
            'border.warning.zz',
        ],
    },
];

module.exports = {
    colorEntrypoints,
};