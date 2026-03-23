const slotGroups = {
    likertCluster: {
        id: 'likertCluster',
        label: 'Likert Cluster',
        description: 'Relative distance cluster token.',
        values: ['aaaa', 'aaa', 'aa', 'a', 'x', 'z', 'zz', 'zzz', 'zzzz'],
        aliases: {
            ultraminor: 'aaaa',
            extraminor: 'aa',
            minor: 'a',
            major: 'z',
            extramajor: 'zz',
            ultramajor: 'zzzz',
        },
    },

    themeRole: {
        id: 'themeRole',
        label: 'Theme Role',
        description: 'Semantic theme role.',
        values: ['main', 'primary', 'secondary', 'info', 'success', 'warning', 'danger', 'disabled'],
    },

    themeRoleWithAlt: {
        id: 'themeRoleWithAlt',
        label: 'Theme Role',
        description: 'Semantic theme role including alt.',
        values: ['main', 'alt', 'primary', 'secondary', 'info', 'success', 'warning', 'danger', 'disabled'],
    },

    fillPack: {
        id: 'fillPack',
        label: 'Fill Pack',
        description: 'Interactive fill pack variant.',
        values: ['solid', 'soft', 'disabled'],
    },

    fillChannel: {
        id: 'fillChannel',
        label: 'Fill Channel',
        description: 'Coordinated fill channel.',
        values: ['bg', 'fg', 'border'],
    },

    paletteFamily: {
        id: 'paletteFamily',
        label: 'Palette Family',
        description: 'Palette family root.',
        values: ['body', 'primary', 'secondary', 'success', 'info', 'warning', 'danger', 'gray', 'altGray'],
    },

    paletteStop: {
        id: 'paletteStop',
        label: 'Palette Stop',
        description: 'Numeric palette step.',
        values: ['0', '50', '100', '150', '200', '250', '300', '350', '400', '450', '500', '550', '600', '650', '700', '750', '800', '850', '900', '950', '1000'],
    },

    fontSizeScale: {
        id: 'fontSizeScale',
        label: 'Font Size Scale',
        description: 'Typography font size scale.',
        values: ['aaaa', 'aaa', 'aa', 'a', 'x', 'z', 'zz', 'zzz', 'zzzz'],
        aliases: {
            xxxs: 'aaaa',
            xxs: 'aaa',
            xsm: 'aa',
            sml: 'a',
            med: 'x',
            lrg: 'z',
            xlg: 'zz',
            xxl: 'zzz',
            xxxl: 'zzzz',
            main: 'x',
        },
    },

    fontWeightScale: {
        id: 'fontWeightScale',
        label: 'Font Weight Scale',
        description: 'Typography font weight scale.',
        values: ['aaaa', 'aaa', 'aa', 'a', 'x', 'z', 'zz', 'zzz', 'zzzz'],
        aliases: {
            xxxs: 'aaaa',
            xxs: 'aaa',
            xsm: 'aa',
            sml: 'a',
            med: 'x',
            lrg: 'z',
            xlg: 'zz',
            xxl: 'zzz',
            xxxl: 'zzzz',
            normal: 'x',
            bold: 'z',
            light: 'a',
            heavy: 'zz',
            thin: 'aa',
            main: 'x',
        },
    },

    borderRadiusSize: {
        id: 'borderRadiusSize',
        label: 'Border Radius Size',
        description: 'Border radius size token.',
        values: ['xxs', 'xsm', 'sml', 'med', 'lrg', 'xlg', 'xxl'],
        aliases: {
            aaa: 'xxs',
            aa: 'xsm',
            a: 'sml',
            x: 'med',
            z: 'lrg',
            zz: 'xlg',
            zzz: 'xxl',
        },
    },

    lineHeightScale: {
        id: 'lineHeightScale',
        label: 'Line Height Scale',
        description: 'Typography line height scale.',
        values: ['aaaa', 'aaa', 'aa', 'a', 'x', 'z', 'zz', 'zzz', 'zzzz'],
        aliases: {
            xxxs: 'aaaa',
            xxs: 'aaa',
            xsm: 'aa',
            sml: 'a',
            med: 'x',
            lrg: 'z',
            xlg: 'zz',
            xxl: 'zzz',
            xxxl: 'zzzz',
            main: 'x',
        },
    },

    letterSpacingScale: {
        id: 'letterSpacingScale',
        label: 'Letter Spacing Scale',
        description: 'Typography letter spacing scale.',
        values: ['aaaa', 'aaa', 'aa', 'a', 'x', 'z', 'zz', 'zzz', 'zzzz'],
        aliases: {
            xxxs: 'aaaa',
            xxs: 'aaa',
            xsm: 'aa',
            sml: 'a',
            med: 'x',
            lrg: 'z',
            xlg: 'zz',
            xxl: 'zzz',
            xxxl: 'zzzz',
            main: 'x',
        },
    },

    SpacingScale: {
        id: 'SpacingScale',
        label: 'Spacing Scale',
        description: 'Padding & Margin spacing scale.',
        values: ['aaaa', 'aaa', 'aa', 'a', 'x', 'z', 'zz', 'zzz', 'zzzz'],
        aliases: {
            xxxs: 'aaaa',
            xxs: 'aaa',
            xsm: 'aa',
            sml: 'a',
            med: 'x',
            lrg: 'z',
            xlg: 'zz',
            xxl: 'zzz',
            xxxl: 'zzzz',
            main: 'x',
        },
    },

    headerKey: {
        id: 'headerKey',
        label: 'Header Key',
        description: 'Typography header slot.',
        values: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },

    breakpointKey: {
        id: 'breakpointKey',
        label: 'Breakpoint Key',
        description: 'Sizing breakpoint key.',
        values: ['xxs', 'xsm', 'sml', 'med', 'lrg', 'xlg', 'xxl'],
    },

    minMaxKey: {
        id: 'minMaxKey',
        label: 'Breakpoint Bound',
        description: 'Breakpoint bound selector.',
        values: ['min', 'max'],
    },
};

module.exports = {
    slotGroups,
};