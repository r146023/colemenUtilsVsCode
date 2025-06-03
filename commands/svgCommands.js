const vscode = require('vscode');
// XML-JS might need error handling:
let convert;
try {
    convert = require('xml-js');
} catch (error) {
    console.error('xml-js package not found. SVG commands will not work.');
}

/**
 * SVG Commands Module for ColemenUtils
 * Handles all SVG processing utilities
 */

/**
 * Register all SVG-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerSvgCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.FormatSVGContentCMD', formatSVGContent),
        vscode.commands.registerCommand('colemenutils.CaptureSVGViewboxValue', captureSVGViewboxValue),
        vscode.commands.registerCommand('colemenutils.CaptureSVGBody', captureSVGBody)
    );
}

/**
 * Format SVG content by cleaning up groups and structure
 */
async function formatSVGContent() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    if (!convert) {
        vscode.window.showErrorMessage('xml-js package is required for SVG formatting. Please install it.');
        return;
    }
    
    if (editor.document.languageId !== 'xml') return;

    console.log("editor.document.fileName : ", editor.document.fileName);

    let document = editor.document;
    const documentText = document.getText();

    // Split the attributes into separate lines
    const splitLinesRegex = /\>\</gm;
    var xmlContent = documentText.replace(splitLinesRegex, ">\n<");
    xmlContent = xmlContent.replace(/<!DOCTYPE [^>]*>/gm, '');

    var options = { alwaysElements: true, ignoreComment: true };
    var rawXML = convert.xml2js(xmlContent, options);
    if (Object.keys(rawXML).length === 0) return;
    
    var rawElements = rawXML.elements[0].elements;
    var elements = [];

    const removeSuperfluousGroups = (tag) => {
        if (tag.name !== "g") return tag;
        if (tag.attributes == null) tag.attributes = [];
        if (tag.elements == null) tag.elements = [];
        const attributeCount = Object.keys(tag.attributes).length;
        const childCount = tag.elements.length;
        if (childCount === 0 && attributeCount === 0) return null;

        if (Object.keys(tag.attributes).length === 1) {
            if (tag.attributes.id != null) tag.attributes = [];
        }
        if (Object.keys(tag.attributes).length === 0) {
            if (childCount === 1) tag = removeSuperfluousGroups(tag.elements[0]);
            if (childCount > 1) {
                var tc = [];
                for (const child of Object.values(tag.elements)) {
                    tc.push(removeSuperfluousGroups(child));
                }
                return tc;
            }
        }
        return tag;
    };

    for (var child of Object.values(rawElements)) {
        if (child.type === "comment") continue;
        child = removeSuperfluousGroups(child);
        if (child != null) {
            if (Array.isArray(child)) {
                for (const value of Object.values(child)) {
                    elements.push(value);
                }
            } else {
                elements.push(child);
            }
        }
    }

    rawXML.elements[0].elements = elements;
    var compileOptions = { compact: false, ignoreComment: true, spaces: 4 };
    var finalContent = convert.js2xml(rawXML, compileOptions);

    let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
    var output_string = `${finalContent}`;
    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Capture SVG viewbox value and copy to clipboard
 */
async function captureSVGViewboxValue() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    if (editor.document.languageId !== 'xml') return;
    let document = editor.document;
    const documentText = document.getText();

    // Split the attributes into separate lines
    const splitLinesRegex = /\>\</gm;
    var content = documentText.replace(splitLinesRegex, ">\n<");

    const viewBoxRegex = /viewbox=['"]([\d.\s-]*)['"]/;
    const reg = new RegExp(viewBoxRegex, 'gmi');
    var result = reg.exec(content);
    if (result != null) {
        console.log("result : ", result);
        console.log("result[1] : ", result[1]);
        vscode.env.clipboard.writeText(result[1]);
    }
}

/**
 * Capture SVG body content and copy to clipboard
 */
async function captureSVGBody() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    if (!convert) {
        vscode.window.showErrorMessage('xml-js package is required for SVG processing. Please install it.');
        return;
    }
    
    if (editor.document.languageId !== 'xml') return;
    let document = editor.document;
    const documentText = document.getText();

    // Split the attributes into separate lines
    const splitLinesRegex = /\>\</gm;
    var xmlContent = documentText.replace(splitLinesRegex, ">\n<");
    var options = { alwaysElements: true, ignoreComment: true };
    var rawXML = convert.xml2js(xmlContent, options);
    var rawElements = rawXML.elements[0].elements;
    var elements = [];

    const removeSuperfluousGroups = (tag) => {
        if (tag.name !== "g") return tag;
        if (tag.attributes == null) tag.attributes = [];
        if (tag.elements == null) tag.elements = [];
        const attributeCount = Object.keys(tag.attributes).length;
        const childCount = tag.elements.length;
        if (childCount === 0 && attributeCount === 0) return null;

        if (Object.keys(tag.attributes).length === 1) {
            if (tag.attributes.id != null) tag.attributes = [];
        }
        if (Object.keys(tag.attributes).length === 0) {
            if (childCount === 1) {
                tag = removeSuperfluousGroups(tag.elements[0]);
            }
        }
        return tag;
    };

    for (var child of Object.values(rawElements)) {
        if (child.type === "comment") continue;
        child = removeSuperfluousGroups(child);
        if (child != null) elements.push(child);
    }

    rawXML.elements[0].elements = elements;
    var compileOptions = { compact: false, ignoreComment: true, spaces: 4 };

    var tmpWrap = {
        name: "TEMPORARY",
        elements: elements
    };
    var finalContent = convert.js2xml(tmpWrap, compileOptions);
    vscode.env.clipboard.writeText(finalContent);
}

module.exports = {
    registerSvgCommands
};