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



module.exports = {
    stripExcessiveSpaces,
    flattenObject,
    apricityReplacements,
    apricityColumnDefaults,
    humanizeString
};