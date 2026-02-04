const vscode = require('vscode');
const path = require('path');
const { 
    fileOrSelectionToArrayOfLines,
    hasSelection,
    getTextAsLinesArray
} = require('../helpers/editorHelpers');
const { getConfigValue } = require('../helpers/configHelpers');
/**
 * Sorting Commands Module for ColemenUtils
 * Handles all text sorting and line manipulation functionality
 */

/**
 * Register all sorting-related commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerSortingCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('colemenutils.shuffleLines', shuffleLines),
        vscode.commands.registerCommand('colemenutils.sortLines', sortLines),
        vscode.commands.registerCommand('colemenutils.sortLinesReversed', sortLinesReversed),
        vscode.commands.registerCommand('colemenutils.sortByLength', sortByLength),
        vscode.commands.registerCommand('colemenutils.sortByLengthReversed', sortByLengthReversed),
        vscode.commands.registerCommand('colemenutils.reverseLines', reverseLines)
    );


    // register auto-sort behavior for imageTags.txt
    registerAutoSorter(context);

}




// Debounce timers keyed by document URI
const autoSortDebounce = new Map();

/**
 * Register an automatic sorter that sorts imageTags.txt when Enter/newline is inserted.
 * - Only triggers for files named "imageTags.txt"
 * - Debounced to avoid multiple runs per single Enter
 * - Uses localeCompare with sensitivity 'base' for case-insensitive sorting
 */
function registerAutoSorter(context) {
    // const debounceMs = 200;

    // const onDidChange = (event) => {
    //     try {
    //         const doc = event.document;
    //         if (!doc || !doc.fileName) return;
    //         if (path.basename(doc.fileName) !== 'imageTags.txt') return;

    //         // Only trigger when a newline was inserted
    //         const newlineInserted = event.contentChanges && event.contentChanges.some(c => typeof c.text === 'string' && c.text.includes('\n'));
    //         if (!newlineInserted) return;

    //         const uriKey = doc.uri.toString();

    //         // Debounce per document
    //         const existing = autoSortDebounce.get(uriKey);
    //         if (existing) clearTimeout(existing);

    //         const timer = setTimeout(async () => {
    //             autoSortDebounce.delete(uriKey);

    //             // Make sure the document is still the same and find an editor
    //             const editor = vscode.window.visibleTextEditors.find(ed => ed.document.uri.toString() === uriKey);
    //             if (!editor) return;

    //             // Use current document text (may contain edits)
    //             const text = editor.document.getText();
    //             var val = text.replace(/(\r?\n|[;]+)/g, "__NEWLINE__");
    //             // val = val.replace("\n", "__NEWLINE__");
    //             // val = val.replace("\r", "__NEWLINE__");
    //             // val = val.replace(";", "__NEWLINE__");
    //             let lines = val.split("__NEWLINE__");
    //             console.log(`Tags Found: ${lines.length}`);



    //             let image_meta_tags = [];
    //             const valid_image_meta_tags = [
    //                 "high_quality","hq","ultra_high_res","ultra_high_resolution",
    //                 "high_quality","HD","high_resolution",
    //                 "low_quality","lq","low_res","low_resolution",
    //                 "medium_quality","medium_res","medium_resolution",

    //                 "motion_blur",
    //                 "image_size_sml","image_size_med","image_size_lrg",
    //                 "image_size_xsm","image_size_xlg",
    //                 "image_orientation_vertical","image_orientation_horizontal","image_orientation_square",
    //                 "image_orientation_portrait","image_orientation_landscape",
    //             ]


    //             let image_content_type_tags = [];
    //             const valid_image_content_type_tags = [
    //                 "photo","photograph","photography","picture","comic","drawing","sketch","illustration","digital_painting","stable_diffusion","cgi","render","photorealistic","photorealism","professional_photography","flash_photo","flash_photography","candid","casual","informal","amateur","home_made","multiple_perspective","selfie","studio_photography ","art_inspiration","art","drawing style","practice","painting","cartoon","rendering","hentai","erotic","erotica","NSFW","clean","safe_for_work","SFW","line_art","tasteful","artistic_nudity","retro","vintage",
    //                 "porn","general_porn","nsfw","erotic_art",
    //                 "simple_bg",
    //             ]
    //             const valid_perspective_tags = ["macro","close_up","perspective_isometric","perspective_side","lateral_view","perspective_behind","posterior_view","perspective_front","anterior_view","perspective_looking_down","high_angle_perspective","perspective_looking_up","low_angle_perspective","upside_down","perspective_profile","lateral_view","portrait","POV","point_of_view"];
    //             let perspective_tags = []

    //             const valid_location_tags = [
    //                 "inside","outside","bedroom","bedroom_area","bathroom","bathroom_area","living_room","living_room_area","kitchen","kitchen_area","grocery_store","public","mountains","river","water","forest","trees","plants","desert","snow","winter","backyard","park","grass","tree","swimming_pool","camping","no_location","unknown_location","shower_furniture","hotel_room","airplane","restaurant","inside_car","within_vehicle","canyon","farm","lake","ocean","beach",
    //                 "potted_plant","blanket","stuffed_animal","bedding","misc_items",
    //                 "artwork_decoration","decoration","white_wall"

    //             ];
    //             let location_tags = [];


    //             // let subject_count_tags = [];
    //             // let valid_subject_count_tags = [
    //             //     "1girl","2girls","3girls","4girls",
    //             //     "solo_female",
    //             //     "1boy","2boys","3boys",
    //             // ];

    //             let general_subject_tags = [];
    //             let valid_general_subject_tags = [
    //                 "1girl","2girls","3girls","4girls",
    //                 "solo_female",
    //                 "1boy","2boys","3boys",
    //                 "caucasian","african","latin","asian","indian",
    //                 "skinny","petite","gothic","pastel_gothic","tattoo","tanlines","fit","athletic","toned","pale",
    //                 "wet_skin","wet_hair"
    //             ];

    //             let head_tags = [];
    //             let valid_head_tags = [
    //                 "full_face","cephalon","head","oculus","mouth","eyes","nose","nasus","oris","upper_body","full_head",
    //                 "grin_expression","embarrassed_expression","embarrassedExpression","duck_face_expression","surprised_expression","surprisedExpression","smiling_expression","teeth",
    //                 "angry_expression","angryExpression","happy_expression","happyExpression","pain_expression","painExpression","neutral_expression",
    //                 "neutralExpression","scared_expression","scaredExpression","crying","sad_expression","sadExpression",
    //                 "looking_at_viewer","looking_at_camera","green_eyes","brown_eyes","blue_eyes","tongue","ear","auris",
    //                 "sunglasses","eye_wear ","glasses","braces","hat","one_eye_open","winking",
    //                 "biting_lip","rolling_eyes","closed_eyes","crossing_eyes","facial_hair","beard","necklace","neck","collar",
    //                 "mask","tiara","beanie_hat","baseball_hat","bucket_hat","visor_hat","cowboy_hat","scarf","choker_necklace","lipstick",
    //                 "makeup","running_makeup","headphones","blindfold","eye_wear","goggles","helmet","freckles","mascara",
    //                 "facial","cum","cum_on_face","cum_on_chin","purple_hair","green_hair","black_hair","short_hair",
    //                 "pink_hair","blue_hair","long_hair","brunette_hair","red_hair","blonde_hair","white_hair",
    //                 "no_hair","ponytail","pigtails","open_mouth","head_looking_to_side","head_looking_up","head_looking_down",
    //                 "blurred_face","censored_face","fangs","ball_gag","drooling","tongue_out","blushing","head_between_legs"
    //             ]

    //             let chest_tags = [];
    //             let valid_chest_tags = [
    //                 "under_boob","upper_body","side boob","lateral_mammary","boobs","small_boobs","small_tits","a_cup","puffy_nipples","piercings","pierced_nipples","huge_boobs","d_cup","huge_tits","c_cup","big_tits","big_boobs","medium_tits","medium_boobs","b_cup","chest","nipples","thorax","flat_chested","nipples_through_shirt","lifting_shirt","clothing","flashing","nip_slip","shirt","flashing_boob","jacket","coat","hoodie","bra","sweater","crop_top","tank_top","t_shirt","unitard","leotard",
    //                 "nipple_clamps","full_tit"
    //             ]
    //             let limb_tags = [];
    //             let valid_limb_tags = [
    //                 "full_arm","manus","acromial","forearm","antecubitis","shoulder","upper_limb","brachium","antebrachrium","wrist","upper_body","carpus","hands","elbow","upper_arm","bracelet","armpit","axilla","jewelry","cuffs",
    //                 "arms_behind_back","arms_forward","arms_extended_forward","arms_by_side","arms_up","arms crossed","hand_on_breast","hands","upper_body","hand_on_head","hand_on_ass","hand_on_face","hand_on_hip",
    //             ]

    //             // let subject_tags = [];

    //             let outTags = [];

    //             for (let i = 0; i < lines.length; i++) {
    //                 let line = lines[i].trim();
    //                 if (line.length === 0) continue;
    //                 if (line.startsWith("###")) continue;
    //                 console.log(`Processing Tag: ${line}`);

    //                 if (valid_image_content_type_tags.includes(line)) {
    //                     if(image_content_type_tags.includes(line)) continue;
    //                     image_content_type_tags.push(line);
    //                     // console.log(`--> ${line} : Matched as image content type tag`);
    //                     continue;
    //                 }
                    
    //                 if (valid_image_meta_tags.includes(line)) {
    //                     image_meta_tags.push(line);
    //                     // console.log(`--> ${line} : Matched as image meta tag`);
    //                     continue;
    //                 }

    //                 if (valid_perspective_tags.includes(line)) {
    //                     perspective_tags.push(line);
    //                     continue;
    //                 }

    //                 if (valid_location_tags.includes(line)) {
    //                     location_tags.push(line);
    //                     continue;
    //                 }
    //                 if (line.includes("_furniture") || line.includes("_flooring")){
    //                     location_tags.push(line);
    //                     continue;
    //                 }


    //                 if (valid_subject_count_tags.includes(line)) {
    //                     subject_count_tags.push(line);
    //                     continue;
    //                 }

    //                 if (valid_general_subject_tags.includes(line)) {
    //                     general_subject_tags.push(line);
    //                     continue;
    //                 }

    //                 if (valid_head_tags.includes(line)) {
    //                     head_tags.push(line);
    //                     continue;
    //                 }

    //                 if (valid_chest_tags.includes(line)) {
    //                     chest_tags.push(line);
    //                     continue;
    //                 }

    //                 if (valid_limb_tags.includes(line)) {
    //                     limb_tags.push(line);
    //                     continue;
    //                 }


    //                 outTags.push(line);
    //             }


    //             let output=[];

    //             var tag_delim = ";"



    //             const chunk = (list,target=[],delim=";")=>{
    //                 const chunkSize = 5;
    //                 const chunks = [];
    //                 for (let i = 0; i < list.length; i += chunkSize) {
    //                     chunks.push(list.slice(i, i + chunkSize));
    //                 }
    //                 for (let i = 0; i < chunks.length; i++) {
    //                     // var tag_line = chunks[i].join(`${delim}`);
    //                     target.push(`${chunks[i].join(delim)}`);
    //                     // target.push("\n");
    //                 }
    //                 return target;
    //             }


    //             if (image_content_type_tags.length > 0) {
    //                 output.push("\n### ------------------------------ IMAGE_CONTENT ------------------------------ ###")
    //                 output = chunk(image_content_type_tags,output,tag_delim);
    //                 // output.push("\n");
    //             }
    //             if (image_meta_tags.length > 0) {
    //                 image_meta_tags = [...new Set(image_meta_tags)];
    //                 image_meta_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------ IMAGE_META ------------------------------ ###")
    //                 output = chunk(image_meta_tags,output,tag_delim);
    //                 // output.push("\n");
    //             }
    //             if (perspective_tags.length > 0) {
    //                 perspective_tags = [...new Set(perspective_tags)];
    //                 perspective_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------ PERSPECTIVE ------------------------------ ###")
    //                 output = chunk(perspective_tags,output,tag_delim);
    //                 // output.push("\n");
    //             }
                
    //             if (location_tags.length > 0) {
    //                 location_tags = [...new Set(location_tags)];
    //                 location_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------ LOCATION ------------------------------ ###")
    //                 output = chunk(location_tags,output,tag_delim);
    //                 // output.push("\n");
    //                 // output.push(location_tags.join(tag_delim));
    //             }
    //             if (subject_count_tags.length > 0) {
    //                 subject_count_tags = [...new Set(subject_count_tags)];
    //                 subject_count_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------ SUBJECT_COUNT ------------------------------ ###")
    //                 output = chunk(subject_count_tags,output,tag_delim);
    //                 output.push("\n");
    //                 // output.push(subject_count_tags.join(tag_delim));
    //             }
    //             if (general_subject_tags.length > 0) {
    //                 general_subject_tags = [...new Set(general_subject_tags)]
    //                 general_subject_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------   GENERAL   ------------------------------ ###")
    //                 output = chunk(general_subject_tags,output,tag_delim);
    //                 output.push("\n");
    //                 // output.push(general_subject_tags.join(tag_delim));
    //             }
    //             if (head_tags.length > 0) {
    //                 head_tags = [...new Set(head_tags)];
    //                 head_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------     HEAD     ------------------------------ ###")
    //                 output = chunk(head_tags,output,tag_delim);
    //                 output.push("\n");
    //                 // output.push(head_tags.join(tag_delim));
    //             }
    //             if (chest_tags.length > 0) {
    //                 chest_tags = [...new Set(chest_tags)];
    //                 chest_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------     CHEST     ------------------------------ ###")
    //                 output = chunk(chest_tags,output,tag_delim);
    //                 // output.push("\n");
    //                 // output.push(head_tags.join(tag_delim));
    //             }
    //             if (limb_tags.length > 0) {
    //                 limb_tags = [...new Set(limb_tags)];
    //                 limb_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------     ARMS     ------------------------------ ###")
    //                 output = chunk(limb_tags,output,tag_delim);
    //                 // output.push("\n");
    //                 // output.push(head_tags.join(tag_delim));
    //             }
    //             if (outTags.length > 0) {
    //                 outTags = [...new Set(outTags)];
    //                 outTags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    //                 output.push("\n### ------------------------------   MISC TAGS   ------------------------------ ###")
    //                 output = chunk(outTags,output,tag_delim);
    //                 output.push("\n");
    //                 // output.push(outTags.join(tag_delim));
    //             }

    //             // output = output.concat(image_content_type_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(image_meta_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(perspective_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(location_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(subject_count_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(general_subject_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(head_tags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // output = output.concat(outTags.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    //             // // Option: keep empty lines? current behavior: remove empty lines then join sorted
    //             // const keepEmpty = !!getConfigValue('keepOriginalFormatting', false); // you can change or add a specific setting
    //             // const nonEmpty = lines.filter(l => l.trim() !== '');

    //             // // Sorting comparator: locale, case-insensitive
    //             // nonEmpty.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    //             // let output;
    //             // if (keepEmpty) {
    //             //     // Reconstruct preserving empty line positions: replace non-empty lines in original positions
    //             //     const outLines = [];
    //             //     let idx = 0;
    //             //     for (let i = 0; i < lines.length; i++) {
    //             //         if (lines[i].trim() === '') {
    //             //             outLines.push(lines[i]);
    //             //         } else {
    //             //             outLines.push(nonEmpty[idx++] || '');
    //             //         }
    //             //     }
    //             //     output = outLines.join('\n');
    //             // } else {
    //             //     output = nonEmpty.join('\n');
    //             // }

    //             var output_string = output.join('\n').trim();
    //             console.log('Auto-sort output generated.');
    //             console.log(output_string);

    //             // If output matches current text, skip edit
    //             if (output_string === text) return;

    //             // Replace entire document content
    //             const fullRange = new vscode.Range(
    //                 editor.document.positionAt(0),
    //                 editor.document.positionAt(text.length)
    //             );
    //             const edit = new vscode.WorkspaceEdit();
    //             edit.replace(editor.document.uri, fullRange, output_string);
    //             await vscode.workspace.applyEdit(edit);

    //             // Optionally save automatically; comment/uncomment as desired:
    //             // await editor.document.save();

    //         }, debounceMs);

    //         autoSortDebounce.set(uriKey, timer);

    //     } catch (err) {
    //         console.error('Auto-sort error:', err);
    //     }
    // };

    // Register listener and ensure it's disposed with the extension
    // context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(onDidChange));
}


async function reverseLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    const eol = doc.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";

    // VS Code supports multiple selections (multi-cursor)
    const sels = editor.selections;

    const hasAnySelection = hasSelection(editor);

    // Helper: build a full-line range covering the selection/cursor lines
    const lineRangeForSelection = (sel) => {
        const startLine = Math.min(sel.start.line, sel.end.line);
        const endLine = Math.max(sel.start.line, sel.end.line);

        const start = doc.lineAt(startLine).range.start;
        const end = doc.lineAt(endLine).range.end; // end of last line (no newline)
        return new vscode.Range(start, end);
    };

    if (!hasAnySelection) {
        // No selection anywhere -> reverse entire document lines
        const fullText = doc.getText();
        const lines = getTextAsLinesArray(editor).reverse();
        // const lines = fullText.split(/\r?\n/).reverse();
        const out = lines.join(eol);

        await editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                doc.positionAt(0),
                doc.positionAt(fullText.length)
            );
            editBuilder.replace(fullRange, out);
        });

        return;
    }

    // There is at least one real selection -> reverse per-selection, independently.
    // Sort selections by start line descending so edits don't shift later ranges.
    const sorted = [...sels].sort((a, b) => {
        const ar = lineRangeForSelection(a);
        const br = lineRangeForSelection(b);
        return br.start.line - ar.start.line || br.start.character - ar.start.character;
    });

    await editor.edit(editBuilder => {
        for (const sel of sorted) {
            if (sel.isEmpty) continue; // cursor-only: do nothing in "selection mode"

            const range = lineRangeForSelection(sel);
            const text = doc.getText(range);

            const lines = text.split(/\r?\n/).reverse();
            const out = lines.join(eol);

            editBuilder.replace(range, out);
        }
    });
}



/**
 * ### Shuffle Lines
 * **Command:** `colemenutils.shuffleLines`
 *
 * Randomly shuffles all lines in the current file.
 * This command uses the [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) algorithm to rearrange the lines in a random order.
 * Useful for randomizing lists, test data, or any content where order does not matter.
 *
 * **How to use:**
 * - Open the file you want to shuffle.
 * - Run the command via the Command Palette (`Ctrl+Shift+P` → "Shuffle Lines") or your assigned keybinding.
 * - All lines in the file will be randomly reordered.
 *
 * > **Note:** This command operates on the entire file, not just the selected lines.
 */
async function shuffleLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const lines = [];
    for (let i = 0; i < document.lineCount; i++) {
        lines.push(document.lineAt(i).text);
    }

    // Fisher-Yates shuffle
    for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
    }

    const output_string = lines.join('\n');
    const workEdits = new vscode.WorkspaceEdit();
    let range = new vscode.Range(0, 0, document.lineCount, 0);
    workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document alphabetically (A-Z).
 *
 * - Numbers and strings are sorted separately, with placement controlled by the
 *   `colemenutils.numberPlacementAlphaSort` setting ("before" or "after").
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortLines`
 *
 * @command colemenutils.sortLines
 * @description Sorts lines alphabetically (A-Z) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort Alphabetically A-Z" command from the Command Palette.
 * // 3. Lines will be sorted in place.
 */
async function sortLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];
    var sortableNumbers = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        if (!isNaN(lines[i]) && lines[i].trim() !== '') {
            sortableNumbers.push(Number(lines[i]));
            continue;
        }
        sortableValues.push(lines[i]);
    }

    var sortedValues = sortableValues.sort((a, b) => {
        const cleanA = a.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return cleanA.localeCompare(cleanB);
    });
    var sortedNumbers = sortableNumbers.sort((a, b) => a - b);

    var sortedLines = [];
    if (getConfigValue("numberPlacementAlphaSort", "before") === "before") {
        sortedLines = sortedNumbers.concat(sortedValues);
    } else {
        sortedLines = sortedValues.concat(sortedNumbers);
    }
    var outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        var sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        var emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    var output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document alphabetically in reverse order (Z-A).
 *
 * - Numbers and strings are sorted separately, with placement controlled by the
 *   `colemenutils.numberPlacementAlphaSort` setting ("before" or "after").
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortLinesReversed`
 *
 * @command colemenutils.sortLinesReversed
 * @description Sorts lines alphabetically (Z-A) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort Alphabetically Z-A (Reversed)" command from the Command Palette.
 * // 3. Lines will be sorted in reverse alphabetical order in place.
 */
async function sortLinesReversed() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];
    var sortableNumbers = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        if (!isNaN(lines[i]) && lines[i].trim() !== '') {
            sortableNumbers.push(Number(lines[i]));
            continue;
        }
        sortableValues.push(lines[i]);
    }

    var sortedValues = sortableValues.sort((a, b) => {
        const cleanA = a.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return cleanA.localeCompare(cleanB);
    });
    var sortedNumbers = sortableNumbers.sort((a, b) => a - b);

    sortedNumbers.reverse();
    sortedValues.reverse();

    var sortedLines = [];
    if (getConfigValue("numberPlacementAlphaSort", "before") === "before") {
        sortedLines = sortedNumbers.concat(sortedValues);
    } else {
        sortedLines = sortedValues.concat(sortedNumbers);
    }
    var outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        var sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        var emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    var output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document by length (shortest to longest).
 *
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortByLength`
 *
 * @command colemenutils.sortByLength
 * @description Sorts lines by length (shortest to longest) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort By Length Small to Large" command from the Command Palette.
 * // 3. Lines will be sorted by length in place.
 */
async function sortByLength() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        sortableValues.push(lines[i]);
    }

    // Sort lines by length (ascending)
    const sortedLines = sortableValues.slice().sort((a, b) => a.length - b.length);

    let outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        // Keep empty lines in their original positions
        let sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        // Remove empty lines, then add them back at the end
        const emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    const output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}

/**
 * Sorts lines in the current selection or entire document by length (longest to shortest).
 *
 * - Optionally preserves original formatting and empty lines if
 *   `colemenutils.keepOriginalFormatting` is true.
 * - Ignores empty lines and lines containing only newlines during sorting.
 *
 * **Command:** `colemenutils.sortByLengthReversed`
 *
 * @command colemenutils.sortByLengthReversed
 * @description Sorts lines by length (longest to shortest) in the selection or document.
 * @example
 * // To use:
 * // 1. Select lines or leave selection empty to sort the whole document.
 * // 2. Run the "Sort By Length Large to Small (Reversed)" command from the Command Palette.
 * // 3. Lines will be sorted by length in descending order in place.
 */
async function sortByLengthReversed() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let document = editor.document;
    // const config = vscode.workspace.getConfiguration('colemenutils');

    var d = fileOrSelectionToArrayOfLines(editor, true);
    if (d == null) return;
    var lines = d[0];
    var rrange = d[1];

    const orig_lines = lines;
    var sortableValues = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) continue;
        if (lines[i].match(/^\r?\n$/gm) != null) continue;
        sortableValues.push(lines[i]);
    }

    // Sort lines by length (ascending)
    const sortedLines = sortableValues.slice().sort((a, b) => a.length - b.length);
    sortedLines.reverse();

    let outputLines = [];

    if (getConfigValue("keepOriginalFormatting", true) === true) {
        // Keep empty lines in their original positions
        let sidx = 0;
        for (let i = 0; i < orig_lines.length; i++) {
            if (orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
                outputLines.push(orig_lines[i]);
                continue;
            }
            outputLines.push(sortedLines[sidx]);
            sidx++;
        }
    } else {
        // Remove empty lines, then add them back at the end
        const emptyLineCount = orig_lines.length - sortedLines.length;
        const arr = new Array(emptyLineCount).fill('\n');
        outputLines = sortedLines.concat(arr);
    }

    const output_string = outputLines.join('\n');

    const workEdits = new vscode.WorkspaceEdit();
    workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
    vscode.workspace.applyEdit(workEdits);
}


module.exports = {
    registerSortingCommands
};