function tokenizeThemePath(pathText) {
    const tokens = [];
    let current = '';
    let i = 0;

    while (i < pathText.length) {
        const char = pathText[i];
        const next = pathText[i + 1];

        if (char === '$' && next === '{') {
            if (current.length > 0) {
                tokens.push({
                    kind: 'literal',
                    value: current,
                });
                current = '';
            }

            let variableText = '${';
            i += 2;

            while (i < pathText.length) {
                const innerChar = pathText[i];
                variableText += innerChar;
                if (innerChar === '}') {
                    i++;
                    break;
                }
                i++;
            }

            tokens.push({
                kind: 'variable',
                value: variableText,
            });

            if (pathText[i] === '.') {
                i++;
                if (i >= pathText.length) {
                    tokens.push({ kind: 'empty', value: '' });
                }
            }

            continue;
        }

        if (char === '.') {
            tokens.push({
                kind: current.length > 0 ? 'literal' : 'empty',
                value: current,
            });
            current = '';
            i++;
            if (i >= pathText.length) {
                tokens.push({ kind: 'empty', value: '' });
            }
            continue;
        }

        current += char;
        i++;
    }

    if (current.length > 0) {
        tokens.push({
            kind: 'literal',
            value: current,
        });
    }

    return tokens;
}

module.exports = {
    tokenizeThemePath,
};