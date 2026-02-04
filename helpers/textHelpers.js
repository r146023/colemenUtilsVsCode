function stripExcessiveSpaces(string) {
    return string.replace(/\s+/g, ' ');
}

function flattenObject(ob, delim = ".") {
    var toReturn = {};
    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i], delim);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + delim + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

function apricityReplacements(value, reverse = false) {
    const replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    
    if (reverse) {
        // Reverse the replacements
        const reverseReplacements = {};
        for (const [key, val] of Object.entries(replacements)) {
            reverseReplacements[val] = key;
        }
        
        let result = value;
        for (const [encoded, original] of Object.entries(reverseReplacements)) {
            result = result.replace(new RegExp(encoded, 'g'), original);
        }
        return result;
    } else {
        let result = value;
        for (const [original, encoded] of Object.entries(replacements)) {
            result = result.replace(new RegExp('\\' + original, 'g'), encoded);
        }
        return result;
    }
}

function apricityColumnDefaults(obj) {
    const defaults = {
        name: '',
        type: 'VARCHAR(255)',
        nullable: true,
        default: null,
        primary: false,
        unique: false,
        index: false
    };
    
    return { ...defaults, ...obj };
}

/**
 * Helpers for normalizing / "humanizing" strings produced by AI or odd encodings.
 * Replaces common smart punctuation, non-breaking spaces, long dashes, ellipses, etc.
 */

function humanizeString(input) {
    if (typeof input !== 'string') return input;

    let s = input;

    // Normalize common dashes to simple hyphen-minus
    s = s.replace(/[\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63]/g, '-');

    // Smart quotes -> straight quotes
    s = s.replace(/[\u201C\u201D\u201E\u201F\u275D\u275E]/g, '"'); // double
    s = s.replace(/[\u2018\u2019\u201A\u201B\u275B\u275C]/g, "'"); // single / apostrophe

    // Ellipsis to three dots
    s = s.replace(/\u2026/g, '...');

    // Replace various spaces with normal space
    s = s.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ');

    // Replace unicode bullets/markers with simple equivalents
    s = s.replace(/[\u2022\u2023\u25E6\u00B7]/g, '•');

    // Replace uncommon hyphen-like separators (em/figure) when surrounded by spaces
    s = s.replace(/\s*[-–—―]\s*/g, ' - ');

    // Normalize multiple horizontal spaces (but preserve newlines)
    s = s.replace(/[ \t]{2,}/g, ' ');

    // Trim trailing/leading spaces on each line but preserve line breaks
    s = s.split('\n').map(line => line.replace(/^\s+|\s+$/g, '')).join('\n');

    return s;
}



/**
 * Convert an arbitrary value to snake_case.
 *
 * Goals:
 * - Handles camelCase, PascalCase, kebab-case, spaces, dots, slashes, punctuation.
 * - Preserves acronyms reasonably: "HTTPServer" -> "http_server", "myURLParser" -> "my_url_parser".
 * - Works with Unicode letters/digits (best-effort). Uses Intl-aware segmentation when available.
 * - Collapses repeated separators, trims underscores, avoids empty output.
 * - Optionally preserves leading/trailing underscores (useful for "__privateVar").
 *
 * @param {any} input
 * @param {object} [opts]
 * @param {boolean} [opts.lowercase=true] Lowercase output (recommended for snake_case).
 * @param {boolean} [opts.preserveLeadingUnderscores=false]
 * @param {boolean} [opts.preserveTrailingUnderscores=false]
 * @param {boolean} [opts.asciiOnly=false] If true, strips diacritics and drops non [a-z0-9_].
 * @param {boolean} [opts.allowNumbers=true] If false, numbers are removed.
 * @returns {string}
 */
function toSnakeCase(input, opts = {}) {
    const options = {
        lowercase: true,
        preserveLeadingUnderscores: false,
        preserveTrailingUnderscores: false,
        asciiOnly: false,
        allowNumbers: true,
        ...opts,
    };

    if (input == null) return "";

    // Convert to string safely
    let s = String(input);

    if (!s) return "";

    // Track leading/trailing underscores if requested
    const leading = options.preserveLeadingUnderscores
        ? (s.match(/^_+/) || [""])[0]
        : "";
    const trailing = options.preserveTrailingUnderscores
        ? (s.match(/_+$/) || [""])[0]
        : "";

    // Normalize to reduce weird Unicode differences and make diacritic stripping possible.
    // NFKD helps break accents from base letters.
    s = s.normalize("NFKD");

    // Optionally remove diacritics (works for many Latin scripts)
    if (options.asciiOnly) {
        // Remove combining marks
        s = s.replace(/[\u0300-\u036f]/g, "");
    }

    // Replace common separators with spaces to unify tokenization
    // Includes: hyphen, dash variants, underscores, dots, slashes, backslashes, plus, colon, etc.
    s = s.replace(/[\s\-_./\\+|:;]+/g, " ");

    // Insert boundaries for camelCase / PascalCase / acronym transitions.
    // 1) "fooBAR" -> "foo BAR" (boundary between lowercase/digit and uppercase)
    s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    // 2) "HTTPServer" -> "HTTP Server" (boundary between acronym and Capitalized word)
    s = s.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

    // Also separate letters and digits where appropriate: "version2Beta" -> "version 2 Beta"
    s = s.replace(/([A-Za-z])([0-9])/g, "$1 $2");
    s = s.replace(/([0-9])([A-Za-z])/g, "$1 $2");

    // Remove remaining punctuation (keep letters, numbers, and spaces).
    // If asciiOnly: keep only ASCII letters/numbers/spaces.
    if (options.asciiOnly) {
        s = s.replace(/[^A-Za-z0-9 ]+/g, " ");
    } else {
        // Best-effort Unicode letters/digits support.
        // Use Unicode property escapes when available; otherwise fall back to ASCII.
        try {
            // Keep: letters, marks (if any remain), digits, spaces
            s = s.replace(/[^\p{L}\p{N} ]+/gu, " ");
        } catch (err) {
            s = s.replace(/[^A-Za-z0-9 ]+/g, " ");
        }
    }

    // Collapse whitespace
    s = s.trim().replace(/\s+/g, " ");
    if (!s) return leading + trailing; // could be just underscores if you preserved them

    // Split into tokens
    let parts = s.split(" ").filter(Boolean);

    if (!options.allowNumbers) {
        parts = parts.map(p => p.replace(/[0-9]+/g, "")).filter(Boolean);
    }

    // Join as snake_case
    let out = parts.join("_");

    // Collapse multiple underscores defensively and trim unless preserved
    out = out.replace(/_+/g, "_");

    if (options.lowercase) out = out.toLowerCase();

    // Trim underscores, then re-apply preserved edges
    out = out.replace(/^_+|_+$/g, "");
    out = leading + out + trailing;

    // Final cleanup: collapse again in case preserved edges + empty middle create doubles
    out = out.replace(/_+/g, "_");

    return out;
}

function toCamelCase(input){
    let s = toSnakeCase(input, { lowercase: true });
    let parts = s.split('_');
    for(let i = 1; i < parts.length; i++){
        parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }
    return parts.join('');
}



module.exports = {
    stripExcessiveSpaces,
    flattenObject,
    toSnakeCase,
    toCamelCase,
    apricityReplacements,
    apricityColumnDefaults,
    humanizeString
};