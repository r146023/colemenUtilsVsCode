const { getEntrypointByRoot } = require('../schema');

function resolveEntrypoint(tokens) {
    if (!tokens || tokens.length === 0) return null;
    const first = tokens[0];
    if (!first || first.kind !== 'literal') return null;
    return getEntrypointByRoot(first.value);
}

module.exports = {
    resolveEntrypoint,
};