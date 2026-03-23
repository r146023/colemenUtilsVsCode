const vscode = require('vscode');

/**
 * Markdown Lumber Table Commands for ColemenUtils
 * Finds markdown lumber estimation tables and updates computed columns + total price.
 */

/**
 * Register all markdown lumber-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerMarkdownLumberTableCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.updateMarkdownLumberTables', updateMarkdownLumberTablesCommand),
        vscode.commands.registerCommand('colemenutils.insertMarkdownLumberTable', insertMarkdownLumberTableCommand),
        vscode.workspace.onWillSaveTextDocument(async (event) => {
            const document = event.document;
            if (!isMarkdownDocument(document)) return;

            const updatedText = processMarkdownLumberTables(document.getText());
            if (updatedText === document.getText()) return;

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );

            event.waitUntil(Promise.resolve([
                vscode.TextEdit.replace(fullRange, updatedText)
            ]));
        })
    );
}

/**
 * Manual command to update markdown lumber tables in the active editor
 */
async function updateMarkdownLumberTablesCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    if (!isMarkdownDocument(document)) return;

    const originalText = document.getText();
    const updatedText = processMarkdownLumberTables(originalText);

    if (updatedText === originalText) return;

    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(originalText.length)
    );

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(fullRange, updatedText)]);
    await vscode.workspace.applyEdit(workEdits);
}

/**
 * Insert a starter lumber estimation markdown table at the cursor
 */
async function insertMarkdownLumberTableCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    if (!isMarkdownDocument(document)) return;

    const snippet = new vscode.SnippetString(
`Volume Variance: 0.25

| Title | Volume Req. | Length | Width | Height | Unit Price | Unit Volume | PPCU | Units Req. | Price | Notes | Purchased |
| ----- | ----------- | ------ | ----- | ------ | ---------- | ----------- | ---- | ---------- | ----- | ----- | --------- |
| $1    | $2          | $3     | $4    | $5     | $6         |             |      |            |       | $7    | $8        |

Total Price: 0
`
    );

    await editor.insertSnippet(snippet, editor.selection.active);
}

/**
 * Check whether the document is markdown
 * @param {vscode.TextDocument} document
 * @returns {boolean}
 */
function isMarkdownDocument(document) {
    if (!document) return false;
    if (document.languageId === 'markdown') return true;
    return /\.md$/i.test(document.fileName || '');
}

/**
 * Process all markdown lumber tables in the document text
 * @param {string} text
 * @returns {string}
 */
function processMarkdownLumberTables(text) {
    const lines = text.split(/\r?\n/);
    const blocks = findMarkdownTables(lines);

    if (blocks.length === 0) return text;

    const volumeVarianceRaw = findVolumeVarianceInDocument(lines);
    const effectiveVariance = normalizeVolumeVariance(volumeVarianceRaw);

    let outputLines = [...lines];

    // Process bottom-up so indices remain stable
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];

        if (shouldIgnoreTable(lines, block.startLine)) {
            continue;
        }

        const processed = processSingleLumberTableBlock(block.lines, effectiveVariance);
        if (processed == null) continue;

        const replaceStart = block.startLine;
        let replaceEnd = block.endLine;

        // Consume trailing blank lines after the table
        let scanIndex = replaceEnd + 1;
        while (
            scanIndex < outputLines.length &&
            typeof outputLines[scanIndex] === 'string' &&
            outputLines[scanIndex].trim() === ''
        ) {
            scanIndex++;
        }

        // If the next non-blank line is a Total Price line, consume it too
        if (
            scanIndex < outputLines.length &&
            typeof outputLines[scanIndex] === 'string' &&
            /^\s*Total\s+Price\s*:/i.test(outputLines[scanIndex].trim())
        ) {
            replaceEnd = scanIndex;
        }

        outputLines.splice(
            replaceStart,
            replaceEnd - replaceStart + 1,
            ...processed
        );
    }

    return outputLines.join('\n');
}

/**
 * Find a global volume variance in the document.
 * Example: "Volume Variance: 0.25"
 * @param {string[]} lines
 * @returns {number}
 */
function findVolumeVarianceInDocument(lines) {
    for (const line of lines) {
        const match = line.match(/^\s*Volume\s+Variance\s*:\s*([0-9]*\.?[0-9]+)\s*$/i);
        if (match) {
            const parsed = Number(match[1]);
            if (Number.isFinite(parsed)) return parsed;
        }
    }

    return 0.25;
}

/**
 * Normalize variance according to rule:
 * - default is 0.25
 * - if < 1 then add 1 (0.25 => 1.25)
 * @param {number} raw
 * @returns {number}
 */
function normalizeVolumeVariance(raw) {
    let value = Number(raw);
    if (!Number.isFinite(value)) value = 0.25;
    if (value < 1) value = value + 1;
    return value;
}

/**
 * Find candidate markdown table blocks
 * @param {string[]} lines
 * @returns {Array<{startLine:number,endLine:number,lines:string[]}>}
 */
function findMarkdownTables(lines) {
    const blocks = [];
    let i = 0;

    while (i < lines.length - 1) {
        if (!looksLikeTableRow(lines[i]) || !looksLikeSeparatorRow(lines[i + 1])) {
            i++;
            continue;
        }

        const startLine = i;
        let endLine = i + 1;
        i += 2;

        while (i < lines.length && looksLikeTableRow(lines[i])) {
            endLine = i;
            i++;
        }

        blocks.push({
            startLine,
            endLine,
            lines: lines.slice(startLine, endLine + 1)
        });
    }

    return blocks;
}

/**
 * Ignore table if nearest non-empty line above it is <!-- NO_AUTO -->
 * @param {string[]} lines
 * @param {number} tableStartLine
 * @returns {boolean}
 */
function shouldIgnoreTable(lines, tableStartLine) {
    for (let i = tableStartLine - 1; i >= 0; i--) {
        const value = lines[i].trim();
        if (value === '') continue;
        return /^<!--\s*NO_AUTO\s*-->$/i.test(value);
    }
    return false;
}

/**
 * Process one lumber table block
 * Returns replacement lines including the Total Price line
 * @param {string[]} tableLines
 * @param {number} effectiveVariance
 * @returns {string[] | null}
 */
function processSingleLumberTableBlock(tableLines, effectiveVariance) {
    if (tableLines.length < 2) return null;

    const headerCellsOriginal = splitMarkdownRow(tableLines[0]);
    const separatorCells = splitMarkdownRow(tableLines[1]);

    if (headerCellsOriginal.length === 0 || separatorCells.length === 0) return null;

    const normalizedHeaders = headerCellsOriginal.map(normalizeHeader);

    const volumeReqIndex = findRequiredColumnIndex(normalizedHeaders, 'volumeReq');
    const lengthIndex = findRequiredColumnIndex(normalizedHeaders, 'length');
    const widthIndex = findRequiredColumnIndex(normalizedHeaders, 'width');
    const heightIndex = findRequiredColumnIndex(normalizedHeaders, 'height');
    const unitPriceIndex = findRequiredColumnIndex(normalizedHeaders, 'unitPrice');

    if (
        volumeReqIndex === -1 ||
        lengthIndex === -1 ||
        widthIndex === -1 ||
        heightIndex === -1 ||
        unitPriceIndex === -1
    ) {
        return null;
    }

    const augmentedHeaders = [...headerCellsOriginal];

    const unitVolumeIndex = ensureColumn(augmentedHeaders, normalizedHeaders, 'Unit Volume', ['unit volume']);
    const ppcuIndex = ensureColumn(augmentedHeaders, normalizedHeaders, 'PPCU', ['ppcu']);
    const unitsReqIndex = ensureColumn(augmentedHeaders, normalizedHeaders, 'Units Req.', ['units req', 'units required']);
    const priceIndex = ensureColumn(augmentedHeaders, normalizedHeaders, 'Price', ['price']);

    const columnCount = augmentedHeaders.length;
    const rows = [];

    let detectedCurrency = '';

    for (let i = 2; i < tableLines.length; i++) {
        const rawCells = splitMarkdownRow(tableLines[i]);
        const row = fitCellCount(rawCells, columnCount);

        const volumeReq = parseNumber(row[volumeReqIndex]);
        const length = parseNumber(row[lengthIndex]);
        const width = parseNumber(row[widthIndex]);
        const height = parseNumber(row[heightIndex]);
        const unitPriceInfo = parsePrice(row[unitPriceIndex]);

        if (!detectedCurrency && unitPriceInfo.currency) {
            detectedCurrency = unitPriceInfo.currency;
        }

        const unitVolume = safeMultiply(length, width, height);
        const ppcu = unitVolume > 0 ? (unitPriceInfo.value / unitVolume) : 0;
        const unitsReq = unitVolume > 0
            ? Math.ceil((volumeReq / unitVolume) * effectiveVariance)
            : 0;
        const price = unitsReq * unitPriceInfo.value;

        row[unitVolumeIndex] = formatCompactNumber(unitVolume);
        row[ppcuIndex] = formatCompactDecimal(ppcu);
        row[unitsReqIndex] = formatWholeNumber(unitsReq);
        row[priceIndex] = formatMoney(price, detectedCurrency || unitPriceInfo.currency);

        rows.push(row);
    }

    const totalPrice = rows.reduce((sum, row) => {
        const parsed = parsePrice(row[priceIndex]);
        return sum + parsed.value;
    }, 0);

    const rebuiltRows = [
        augmentedHeaders,
        buildSeparatorRow(columnCount),
        ...rows
    ];

    const formattedTableLines = formatMarkdownTable(rebuiltRows);
    const totalPriceLine = `Total Price: ${formatMoney(totalPrice, detectedCurrency)}`;

    return [...formattedTableLines, '', totalPriceLine];
}

/**
 * Check if line looks like markdown table row
 * @param {string} line
 * @returns {boolean}
 */
function looksLikeTableRow(line) {
    if (!line) return false;
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) return false;
    if (!trimmed.endsWith('|')) return false;
    return trimmed.includes('|');
}

/**
 * Check if line looks like markdown separator row
 * @param {string} line
 * @returns {boolean}
 */
function looksLikeSeparatorRow(line) {
    if (!looksLikeTableRow(line)) return false;

    const cells = splitMarkdownRow(line);
    if (cells.length === 0) return false;

    return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

/**
 * Split markdown row into trimmed cells
 * @param {string} line
 * @returns {string[]}
 */
function splitMarkdownRow(line) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];
    return trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
}

/**
 * Normalize header for matching
 * @param {string} value
 * @returns {string}
 */
function normalizeHeader(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[_\-]+/g, ' ')
        .replace(/\./g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Find required column index
 * @param {string[]} normalizedHeaders
 * @param {'volumeReq'|'length'|'width'|'height'|'unitPrice'} type
 * @returns {number}
 */
function findRequiredColumnIndex(normalizedHeaders, type) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i];

        if (type === 'volumeReq') {
            if (/^volume\s*req(uired)?$/.test(header)) return i;
        }

        if (type === 'length') {
            if (/^length$/.test(header)) return i;
        }

        if (type === 'width') {
            if (/^width$/.test(header)) return i;
        }

        if (type === 'height') {
            if (/^height$/.test(header)) return i;
        }

        if (type === 'unitPrice') {
            if (/^unit\s*price$/.test(header)) return i;
        }
    }

    return -1;
}

/**
 * Ensure a computed column exists, otherwise append it
 * @param {string[]} headers
 * @param {string[]} normalizedHeaders
 * @param {string} title
 * @param {string[]} aliases
 * @returns {number}
 */
function ensureColumn(headers, normalizedHeaders, title, aliases) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
        if (aliases.includes(normalizedHeaders[i])) {
            return i;
        }
    }

    headers.push(title);
    normalizedHeaders.push(normalizeHeader(title));
    return headers.length - 1;
}

/**
 * Fit cells to expected count
 * @param {string[]} cells
 * @param {number} count
 * @returns {string[]}
 */
function fitCellCount(cells, count) {
    const next = [...cells];
    while (next.length < count) next.push('');
    if (next.length > count) return next.slice(0, count);
    return next;
}

/**
 * Parse generic numeric value, default 0
 * @param {string} raw
 * @returns {number}
 */
function parseNumber(raw) {
    if (raw == null) return 0;
    const text = String(raw).trim();
    if (text === '') return 0;

    const cleaned = text.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    if (cleaned === '') return 0;

    const value = Number(cleaned);
    if (!Number.isFinite(value)) return 0;

    return value;
}

/**
 * Parse price + currency
 * @param {string} raw
 * @returns {{value:number,currency:string}}
 */
function parsePrice(raw) {
    if (raw == null) return { value: 0, currency: '' };

    const text = String(raw).trim();
    if (text === '') return { value: 0, currency: '' };

    const currencyMatch = text.match(/[$€£¥]/);
    const currency = currencyMatch ? currencyMatch[0] : '';

    const numeric = text.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    if (numeric === '') return { value: 0, currency };

    const value = Number(numeric);
    if (!Number.isFinite(value)) return { value: 0, currency };

    return { value, currency };
}

/**
 * Safe multiply, returns 0 if any operand invalid
 * @param  {...number} values
 * @returns {number}
 */
function safeMultiply(...values) {
    for (const value of values) {
        if (!Number.isFinite(value)) return 0;
        if (value === 0) return 0;
    }

    return values.reduce((acc, value) => acc * value, 1);
}

/**
 * Format compact number up to 3 decimals
 * @param {number} value
 * @returns {string}
 */
function formatCompactNumber(value) {
    if (!Number.isFinite(value) || value === 0) return '0';

    const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
    if (Number.isInteger(rounded)) return String(rounded);

    return rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Format decimal up to 3 places, omitting leading zero for values between -1 and 1
 * Example: 0.013 -> .013
 * @param {number} value
 * @returns {string}
 */
function formatCompactDecimal(value) {
    if (!Number.isFinite(value) || value === 0) return '0';

    const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
    let text = rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

    if (text.startsWith('0.')) text = text.slice(1);
    if (text.startsWith('-0.')) text = '-' + text.slice(2);

    return text;
}

/**
 * Format integer-like output
 * @param {number} value
 * @returns {string}
 */
function formatWholeNumber(value) {
    if (!Number.isFinite(value) || value <= 0) return '0';
    return String(Math.ceil(value));
}

/**
 * Format money up to 3 decimals
 * @param {number} value
 * @param {string} currency
 * @returns {string}
 */
function formatMoney(value, currency) {
    if (!Number.isFinite(value)) value = 0;

    const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
    let text;

    if (Number.isInteger(rounded)) {
        text = String(rounded);
    }
    else {
        text = rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    }

    return `${currency}${text}`;
}

/**
 * Build placeholder separator row
 * @param {number} columnCount
 * @returns {string[]}
 */
function buildSeparatorRow(columnCount) {
    return new Array(columnCount).fill('---');
}

/**
 * Format markdown table columns to even widths
 * @param {string[][]} rows
 * @returns {string[]}
 */
function formatMarkdownTable(rows) {
    if (!rows || rows.length === 0) return [];

    const columnCount = rows[0].length;
    const widths = new Array(columnCount).fill(3);

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = fitCellCount(rows[rowIndex], columnCount);

        for (let col = 0; col < columnCount; col++) {
            const value = row[col] == null ? '' : String(row[col]);
            widths[col] = Math.max(widths[col], value.length);
        }
    }

    const output = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = fitCellCount(rows[rowIndex], columnCount);

        if (rowIndex === 1) {
            const sep = row.map((_, col) => '-'.repeat(Math.max(3, widths[col])));
            output.push(`| ${sep.join(' | ')} |`);
            continue;
        }

        const padded = row.map((cell, col) => {
            const value = cell == null ? '' : String(cell);
            return value.padEnd(widths[col], ' ');
        });

        output.push(`| ${padded.join(' | ')} |`);
    }

    return output;
}

module.exports = {
    registerMarkdownLumberTableCommands
};