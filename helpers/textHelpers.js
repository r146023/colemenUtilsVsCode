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

module.exports = {
    stripExcessiveSpaces,
    flattenObject,
    apricityReplacements,
    apricityColumnDefaults
};