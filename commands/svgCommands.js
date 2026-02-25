const vscode = require('vscode');
const { getText } = require('../helpers/editorHelpers');
const { toCamelCase } = require('../helpers/textHelpers');
// XML-JS might need error handling:
let convert;
try {
    convert = require('xml-js');
} catch (error) {
    console.error('xml-js package not found. SVG commands will not work.');
}





function isSvgEditor(editor) {
    if (!editor) return false;

    const doc = editor.document;
    const valid_langs = ["xml","svg","html","typescriptreact","jsx","tsx"];

    // if (doc.languageId !== "xml") return false;
    if (!valid_langs.includes(doc.languageId)) return false;
    if (doc.uri.scheme !== "file") return false;
    // return true;
    const base = (doc.uri.path.split("/").pop() || "").toLowerCase();

    return (
        base.includes(".svg")||
        base.includes(".jsx")||
        base.includes(".tsx")
    );
}

async function refreshSvgContext() {
    const ok = isSvgEditor(vscode.window.activeTextEditor);

    await vscode.commands.executeCommand(
        "setContext",
        "colemenutils.isXmlSvg",
        ok
    );
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
    vscode.window.onDidChangeActiveTextEditor(refreshSvgContext),
    vscode.workspace.onDidOpenTextDocument(refreshSvgContext),
    vscode.workspace.onDidCloseTextDocument(refreshSvgContext),
    vscode.workspace.onDidChangeTextDocument((e) => {
        const active = vscode.window.activeTextEditor.document;
        if (active && e.document.uri.toString() === active.uri.toString()) {
            refreshSvgContext();
        }
    })
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.FormatSVGContentCMD', formatSVGContent),
        vscode.commands.registerCommand('colemenutils.CaptureSVGViewboxValue', captureSVGViewboxValue),
        vscode.commands.registerCommand('colemenutils.CaptureSVGBody', captureSVGBody),
        vscode.commands.registerCommand('colemenutils.SVGPropsToJSX', SVGPropsToJSX)
    );
}

const SVG_KEBAB_TO_CAMEL = [
    ["alignment-baseline","alignmentBaseline"],
    ["baseline-shift","baselineShift"],
    ["clip-path","clipPath"],
    ["clip-rule","clipRule"],
    ["color-interpolation","colorInterpolation"],
    ["color-interpolation-filters","colorInterpolationFilters"],
    ["color-profile","colorProfile"],
    ["color-rendering","colorRendering"],
    ["dominant-baseline","dominantBaseline"],
    ["enable-background","enableBackground"],
    ["fill-opacity","fillOpacity"],
    ["fill-rule","fillRule"],
    ["flood-color","floodColor"],
    ["flood-opacity","floodOpacity"],
    ["font-family","fontFamily"],
    ["font-size","fontSize"],
    ["font-size-adjust","fontSizeAdjust"],
    ["font-stretch","fontStretch"],
    ["font-style","fontStyle"],
    ["font-variant","fontVariant"],
    ["font-weight","fontWeight"],
    ["glyph-name","glyphName"],
    ["glyph-orientation-horizontal","glyphOrientationHorizontal"],
    ["glyph-orientation-vertical","glyphOrientationVertical"],
    ["horiz-adv-x","horizAdvX"],
    ["horiz-origin-x","horizOriginX"],
    ["image-rendering","imageRendering"],
    ["letter-spacing","letterSpacing"],
    ["lighting-color","lightingColor"],
    ["marker-end","markerEnd"],
    ["marker-mid","markerMid"],
    ["marker-start","markerStart"],
    ["marker-height","markerHeight"],
    ["marker-units","markerUnits"],
    ["marker-width","markerWidth"],
    ["mask-content-units","maskContentUnits"],
    ["mask-units","maskUnits"],
    ["num-octaves","numOctaves"],
    ["paint-order","paintOrder"],
    ["path-length","pathLength"],
    ["pointer-events","pointerEvents"],
    ["preserve-alpha","preserveAlpha"],
    ["preserve-aspect-ratio","preserveAspectRatio"],
    ["primitive-units","primitiveUnits"],
    ["ref-x","refX"],
    ["ref-y","refY"],
    ["shape-rendering","shapeRendering"],
    ["specular-constant","specularConstant"],
    ["specular-exponent","specularExponent"],
    ["spread-method","spreadMethod"],
    ["stop-color","stopColor"],
    ["stop-opacity","stopOpacity"],
    ["stroke-dasharray","strokeDasharray"],
    ["stroke-dashoffset","strokeDashoffset"],
    ["stroke-linecap","strokeLinecap"],
    ["stroke-linejoin","strokeLinejoin"],
    ["stroke-miterlimit","strokeMiterlimit"],
    ["stroke-opacity","strokeOpacity"],
    ["stroke-width","strokeWidth"],
    ["text-anchor","textAnchor"],
    ["text-decoration","textDecoration"],
    ["text-rendering","textRendering"],
    ["transform-origin","transformOrigin"],
    ["unicode-bidi","unicodeBidi"],
    ["vector-effect","vectorEffect"],
    ["vert-adv-y","vertAdvY"],
    ["vert-origin-x","vertOriginX"],
    ["vert-origin-y","vertOriginY"],
    ["word-spacing","wordSpacing"],
    ["writing-mode","writingMode"],

    // Filters / fe*
    ["base-frequency","baseFrequency"],
    ["diffuse-constant","diffuseConstant"],
    ["edge-mode","edgeMode"],
    ["kernel-matrix","kernelMatrix"],
    ["kernel-unit-length","kernelUnitLength"],
    ["key-points","keyPoints"],
    ["key-splines","keySplines"],
    ["key-times","keyTimes"],
    ["length-adjust","lengthAdjust"],
    ["limiting-cone-angle","limitingConeAngle"],
    ["order","order"],
    ["pattern-content-units","patternContentUnits"],
    ["pattern-transform","patternTransform"],
    ["pattern-units","patternUnits"],
    ["points-at-x","pointsAtX"],
    ["points-at-y","pointsAtY"],
    ["points-at-z","pointsAtZ"],
    ["result","result"],
    ["scale","scale"],
    ["std-deviation","stdDeviation"],
    ["stitch-tiles","stitchTiles"],
    ["surface-scale","surfaceScale"],
    ["target-x","targetX"],
    ["target-y","targetY"],
    ["view-box","viewBox"],
    ["x-channel-selector","xChannelSelector"],
    ["y-channel-selector","yChannelSelector"],

    // xlink era (still encountered)
    ["xlink:actuate","xlinkActuate"],
    ["xlink:arcrole","xlinkArcrole"],
    ["xlink:href","xlinkHref"],
    ["xlink:role","xlinkRole"],
    ["xlink:show","xlinkShow"],
    ["xlink:title","xlinkTitle"],
    ["xlink:type","xlinkType"],
];



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

/**
 * Convert SVG properties from kebab-case to camelCase for JSX compatibility
 */
async function SVGPropsToJSX() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    var txt = String(getText(editor));
    var ignores = [
        "viewBox",
        "xmlns",
        "xmlns:serif",
        "xmlns:xlink",
        "xml:space",

    ]

    // @Mstep [] first go through the known replacements.
    for(const [kebab, camel] of SVG_KEBAB_TO_CAMEL){
        const regex = new RegExp(`${kebab}=(["'])`, 'g');
        const replacement = `${camel}=$1`;
        txt = txt.replace(regex, replacement);
    }

    // @Mstep [] now do a general scan for any remaining kebab-case attributes.
    for (const match of txt.matchAll(/([a-zA-Z0-9-:]*)=(["'])/g)) {
        if(!match[1] || !match[2]) continue;
        if(match[1].length < 2) continue;
        if(ignores.includes(match[1])) continue;


        const original = match[1];
        var camel = toCamelCase(match[1]);
        if(camel === original) continue;
        var full = `${camel}=${match[2]}`;
        // console.log("full : ",full);
        txt = txt.replace(match[0], full);
    }



    const output_string = txt;
    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}


module.exports = {
    registerSvgCommands
};