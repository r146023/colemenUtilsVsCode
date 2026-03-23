const vscode = require('vscode');

/**
 * Markdown BOM Table Commands for ColemenUtils
 * Finds markdown BOM-style tables and updates totals.
 */

/**
 * Register all markdown BOM-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerMarkdownBomTableCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.updateMarkdownBomTables', updateMarkdownBomTablesCommand),
        vscode.workspace.onWillSaveTextDocument(async (event) => {
            const document = event.document;
            if (!isMarkdownDocument(document)) return;

            const updatedText = processMarkdownBomTables(document.getText());
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
 * Manual command to update markdown BOM tables in the active editor
 */
async function updateMarkdownBomTablesCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    if (!isMarkdownDocument(document)) return;

    const originalText = document.getText();
    const updatedText = processMarkdownBomTables(originalText);

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
 * Process all markdown BOM tables in the document text
 * @param {string} text
 * @returns {string}
 */
function processMarkdownBomTables(text) {
    const lines = text.split(/\r?\n/);
    const blocks = findMarkdownTables(lines);

    if (blocks.length === 0) return text;

    let outputLines = [...lines];

    // Apply replacements from bottom to top so line indices remain stable
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];

        if (shouldIgnoreTable(lines, block.startLine)) {
            continue;
        }

        const processed = processSingleTableBlock(block.lines);
        if (processed == null) continue;

        outputLines.splice(
            block.startLine,
            block.endLine - block.startLine + 1,
            ...processed
        );
    }

    return outputLines.join('\n');
}

/**
 * Find candidate markdown table blocks
 * A block is:
 *   header row
 *   separator row
 *   0+ body rows
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
 * Determine whether a table should be ignored because it is preceded by:
 * <!-- NO_AUTO_SUM -->
 * allowing optional blank lines between comment and table
 * @param {string[]} lines
 * @param {number} tableStartLine
 * @returns {boolean}
 */
function shouldIgnoreTable(lines, tableStartLine) {
    for (let i = tableStartLine - 1; i >= 0; i--) {
        const value = lines[i].trim();

        if (value === '') continue;
        return /^<!--\s*NO_AUTO_SUM\s*-->$/i.test(value);
    }

    return false;
}

/**
 * Process a single markdown table block
 * Returns null if the table should be ignored because required columns were not found.
 * @param {string[]} tableLines
 * @returns {string[] | null}
 */
function processSingleTableBlock(tableLines) {
    if (tableLines.length < 2) return null;

    const headerCells = splitMarkdownRow(tableLines[0]);
    const separatorCells = splitMarkdownRow(tableLines[1]);

    if (headerCells.length === 0) return null;
    if (separatorCells.length === 0) return null;

    const columnCount = headerCells.length;

    const normalizedHeaders = headerCells.map(normalizeHeader);
    const qtyIndex = findColumnIndex(normalizedHeaders, 'qty');
    const priceIndex = findColumnIndex(normalizedHeaders, 'price');
    const totalIndex = findColumnIndex(normalizedHeaders, 'total');

    if (qtyIndex === -1 || priceIndex === -1 || totalIndex === -1) {
        return null;
    }

    const rows = [];
    for (let i = 2; i < tableLines.length; i++) {
        const cells = splitMarkdownRow(tableLines[i]);
        const normalized = fitCellCount(cells, columnCount);
        rows.push(normalized);
    }

    // Separate normal rows from existing TOTAL rows
    const dataRows = [];
    let detectedCurrency = '';

    for (const row of rows) {
        if (isTotalRow(row)) {
            if (!detectedCurrency) {
                detectedCurrency = detectCurrencyFromRow(row, priceIndex, totalIndex);
            }
            continue;
        }

        if (!detectedCurrency) {
            detectedCurrency = detectCurrencyFromRow(row, priceIndex, totalIndex);
        }

        const qty = parseQuantity(row[qtyIndex]);
        const price = parsePrice(row[priceIndex]).value;
        const rowTotal = qty * price;

        row[totalIndex] = formatMoney(rowTotal, detectedCurrency);
        dataRows.push(row);
    }

    if (!detectedCurrency) {
        detectedCurrency = detectCurrencyFromHeaderOrRows(headerCells, rows, priceIndex, totalIndex);
    }

    const sumQty = dataRows.reduce((acc, row) => acc + parseQuantity(row[qtyIndex]), 0);
    const sumTotal = dataRows.reduce((acc, row) => acc + (parseQuantity(row[qtyIndex]) * parsePrice(row[priceIndex]).value), 0);

    const totalRow = createTotalRow(columnCount, {
        qtyIndex,
        priceIndex,
        totalIndex
    }, sumQty, sumTotal, detectedCurrency);

    const rebuiltRows = [headerCells, buildSeparatorRow(columnCount), ...dataRows, totalRow];

    return formatMarkdownTable(rebuiltRows);
}

/**
 * Check if a line looks like a markdown table row
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
 * Check if a line looks like a markdown separator row
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
 * Split a markdown row into cells
 * @param {string} line
 * @returns {string[]}
 */
function splitMarkdownRow(line) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];

    const inner = trimmed.slice(1, -1);
    return inner.split('|').map((cell) => cell.trim());
}

/**
 * Normalize header text for matching
 * @param {string} value
 * @returns {string}
 */
function normalizeHeader(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[_\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Find a recognized column index
 * @param {string[]} normalizedHeaders
 * @param {'qty'|'price'|'total'} type
 * @returns {number}
 */
function findColumnIndex(normalizedHeaders, type) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i];

        if (type === 'qty') {
            if (/^(qty|quantity)$/.test(header)) return i;
        }

        if (type === 'price') {
            if (/^(price|unit price)$/.test(header)) return i;
        }

        if (type === 'total') {
            if (/^(total|subtotal|sub total)$/.test(header)) return i;
        }
    }

    return -1;
}

/**
 * Fit cells to the expected column count
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
 * Determine if a row is a TOTAL row
 * @param {string[]} row
 * @returns {boolean}
 */
function isTotalRow(row) {
    return row.some((cell) => /^total$/i.test(String(cell || '').trim()));
}

/**
 * Parse quantity as number, defaulting invalid values to 0
 * @param {string} raw
 * @returns {number}
 */
function parseQuantity(raw) {
    if (raw == null) return 0;

    const cleaned = String(raw)
        .replace(/,/g, '')
        .trim();

    if (cleaned === '') return 0;

    const value = Number(cleaned);
    if (!Number.isFinite(value)) return 0;

    return value;
}

/**
 * Parse price and detect currency symbol
 * @param {string} raw
 * @returns {{value:number,currency:string}}
 */
function parsePrice(raw) {
    if (raw == null) return { value: 0, currency: '' };

    const text = String(raw).trim();
    if (text === '') return { value: 0, currency: '' };

    const currencyMatch = text.match(/[$€£¥]/);
    const currency = currencyMatch ? currencyMatch[0] : '';

    const numeric = text.replace(/[^0-9.\-]/g, '');
    if (numeric.trim() === '') return { value: 0, currency };

    const value = Number(numeric);
    if (!Number.isFinite(value)) return { value: 0, currency };

    return { value, currency };
}

/**
 * Detect currency from row price/total cells
 * @param {string[]} row
 * @param {number} priceIndex
 * @param {number} totalIndex
 * @returns {string}
 */
function detectCurrencyFromRow(row, priceIndex, totalIndex) {
    const priceCurrency = parsePrice(row[priceIndex]).currency;
    if (priceCurrency) return priceCurrency;

    const totalCurrency = parsePrice(row[totalIndex]).currency;
    if (totalCurrency) return totalCurrency;

    return '';
}

/**
 * Detect currency from any available rows
 * @param {string[]} headerCells
 * @param {string[][]} rows
 * @param {number} priceIndex
 * @param {number} totalIndex
 * @returns {string}
 */
function detectCurrencyFromHeaderOrRows(headerCells, rows, priceIndex, totalIndex) {
    for (const row of rows) {
        const detected = detectCurrencyFromRow(row, priceIndex, totalIndex);
        if (detected) return detected;
    }
    return '';
}

/**
 * Format money value
 * Keeps integers compact (e.g. $30) and decimals trimmed to max 2 digits
 * @param {number} value
 * @param {string} currency
 * @returns {string}
 */
function formatMoney(value, currency) {
    if (!Number.isFinite(value)) value = 0;

    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;

    let str;
    if (Number.isInteger(rounded)) {
        str = String(rounded);
    } else {
        str = rounded.toFixed(2).replace(/\.?0+$/, (match, offset, full) => {
            return full.includes('.') ? full.replace(/0+$/, '').replace(/\.$/, '') : full;
        });
    }

    return `${currency}${str}`;
}

/**
 * Create TOTAL row
 * @param {number} columnCount
 * @param {{qtyIndex:number,priceIndex:number,totalIndex:number}} indices
 * @param {number} sumQty
 * @param {number} sumTotal
 * @param {string} currency
 * @returns {string[]}
 */
function createTotalRow(columnCount, indices, sumQty, sumTotal, currency) {
    const row = new Array(columnCount).fill('');
    row[0] = 'TOTAL';
    row[indices.qtyIndex] = String(sumQty);
    row[indices.priceIndex] = '';
    row[indices.totalIndex] = formatMoney(sumTotal, currency);
    return row;
}

/**
 * Build a simple separator row placeholder structure
 * @param {number} columnCount
 * @returns {string[]}
 */
function buildSeparatorRow(columnCount) {
    return new Array(columnCount).fill('---');
}

/**
 * Format the markdown table with even column widths
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

    // Ensure separator row width matches column width
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
    registerMarkdownBomTableCommands
};