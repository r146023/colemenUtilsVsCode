// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const figlet = require('figlet');
const crypto = require('crypto');
// import * as vscode from 'vscode';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const config = vscode.workspace.getConfiguration('colemenutils');

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "colemenutils" is now active!');



	//  #     #    #     #####  #     # ### #     #  #####
	//  #     #   # #   #     # #     #  #  ##    # #     #
	//  #     #  #   #  #       #     #  #  # #   # #
	//  ####### #     #  #####  #######  #  #  #  # #  ####
	//  #     # #######       # #     #  #  #   # # #     #
	//  #     # #     # #     # #     #  #  #    ## #     #
	//  #     # #     #  #####  #     # ### #     #  #####



	let defaultHashSelectionCMD = vscode.commands.registerCommand('colemenutils.defaultHashSelection', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;

		await editor.edit(editBuilder => {
			for (const selection of selections) {
				const text = editor.document.getText(selection);
				if (!text) continue;
				const hash = crypto.createHash(config.get('defaultHashAlgo', 'MD5')).update(text, 'utf8').digest('hex');
				editBuilder.replace(selection, hash);
			}
		});
	});
	context.subscriptions.push(defaultHashSelectionCMD);

	let sha1HashSelectionCMD = vscode.commands.registerCommand('colemenutils.sha1HashSelection', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;

		await editor.edit(editBuilder => {
			for (const selection of selections) {
				const text = editor.document.getText(selection);
				if (!text) continue;
				const hash = crypto.createHash('sha1').update(text, 'utf8').digest('hex');
				editBuilder.replace(selection, hash);
			}
		});
	});
	context.subscriptions.push(sha1HashSelectionCMD);

	let md5HashSelectionCMD = vscode.commands.registerCommand('colemenutils.md5HashSelection', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;

		await editor.edit(editBuilder => {
			for (const selection of selections) {
				const text = editor.document.getText(selection);
				if (!text) continue;
				const hash = crypto.createHash('md5').update(text, 'utf8').digest('hex');
				editBuilder.replace(selection, hash);
			}
		});
	});
	context.subscriptions.push(md5HashSelectionCMD);

	let sha512HashSelectionCMD = vscode.commands.registerCommand('colemenutils.sha512HashSelection', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;

		await editor.edit(editBuilder => {
			for (const selection of selections) {
				const text = editor.document.getText(selection);
				if (!text) continue;
				const hash = crypto.createHash('sha512').update(text, 'utf8').digest('hex');
				editBuilder.replace(selection, hash);
			}
		});
	});
	context.subscriptions.push(sha512HashSelectionCMD);

	let sha256HashSelectionCMD = vscode.commands.registerCommand('colemenutils.sha256HashSelection', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;

		await editor.edit(editBuilder => {
			for (const selection of selections) {
				const text = editor.document.getText(selection);
				if (!text) continue;
				const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
				editBuilder.replace(selection, hash);
			}
		});
	});
	context.subscriptions.push(sha256HashSelectionCMD);

	// encode or decode the selected text to base64
	let base64EncodeDecodeCMD = vscode.commands.registerCommand('colemenutils.base64EncodeDecode', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;

		await editor.edit(editBuilder => {
			for (const selection of selections) {
				let text = editor.document.getText(selection);
				if (!text) continue;

				// Try to decode, if fails, encode
				let result;
				try {
					// Try decode
					const decoded = Buffer.from(text, 'base64').toString('utf8');
					// If decoding and re-encoding matches, it's valid base64, so decode
					if (Buffer.from(decoded, 'utf8').toString('base64') === text.replace(/\s/g, '')) {
						result = decoded;
					} else {
						throw new Error();
					}
				} catch (e) {
					// Not valid base64, encode
					result = Buffer.from(text, 'utf8').toString('base64');
				}
				editBuilder.replace(selection, result);
			}
		});
	});
	context.subscriptions.push(base64EncodeDecodeCMD);







	let asciiBannerCMD = vscode.commands.registerCommand('colemenutils.asciiBanner', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;
		await editor.edit(editBuilder => {
			for (const selection of selections) {
				const text = editor.document.getText(selection) || '';
				if (!text.trim()) continue;
				const font = config.get('bannerFont', 'Banner');
				let banner = figlet.textSync(text, { font:font,horizontalLayout: 'default', verticalLayout: 'default' });
				// Replace all non-space characters with #
				banner = banner.replace(/[^\s]/g, '#');
				// Remove trailing spaces from each line and filter out empty lines
				banner = banner
					.split('\n')
					.map(line => line.replace(/\s+$/, '')) // remove trailing spaces
					.filter(line => line.length > 0) // remove empty lines
					.join('\n');
				editBuilder.replace(selection, banner);
			}
		});
	});
	context.subscriptions.push(asciiBannerCMD);


	let insertBoxHeaderCMD = vscode.commands.registerCommand('colemenutils.insertBoxHeader', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;
		const BOX_WIDTH = config.get('headerWidth', 80);;
		await editor.edit(editBuilder => {
			for (const selection of selections) {
				let text = editor.document.getText(selection).trim();
				let rangeToReplace = selection;
				// If nothing is selected, use the content of the current line and replace the whole line
				if (selection.isEmpty) {
					const line = editor.document.lineAt(selection.active.line);
					text = line.text.trim();
					// @ts-ignore
					rangeToReplace = line.range;
				}
				const content = ` ${text} `;
				const pad = BOX_WIDTH - 4 - content.length;
				const padLeft = Math.floor(pad / 2);
				const padRight = pad - padLeft + 2;
				const centered = ' '.repeat(padLeft) + content + ' '.repeat(padRight);
				const header =
					'/* ' + '-'.repeat(BOX_WIDTH - 4) + ' */\n' +
					'/*' + centered + '*/\n' +
					'/* ' + '-'.repeat(BOX_WIDTH - 4) + ' */';
				editBuilder.replace(rangeToReplace, header);
			}
		});
	});
	context.subscriptions.push(insertBoxHeaderCMD);

	let insertSingleLineHeaderCMD = vscode.commands.registerCommand('colemenutils.insertSingleLineHeader', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const selections = editor.selections;
		const BOX_WIDTH = config.get('headerWidth', 80);
		await editor.edit(editBuilder => {
			for (const selection of selections) {
				let text = editor.document.getText(selection).trim();
				let rangeToReplace = selection;
				// If nothing is selected, use the content of the current line and replace the whole line
				if (selection.isEmpty) {
					const line = editor.document.lineAt(selection.active.line);
					text = line.text.trim();
					// @ts-ignore
					rangeToReplace = line.range;
				}
				const content = ` ${text} `;
				const pad = BOX_WIDTH - 2 - content.length;
				const padLeft = Math.floor(pad / 2)-2;
				const padRight = pad - padLeft-2;
				// const centered = ' '.repeat(padLeft) + content + ' '.repeat(padRight);
				const header =
					'/*' + '-'.repeat(padLeft) +
					content +
					'-'.repeat(padRight) + '*/';
				editBuilder.replace(rangeToReplace, header);
			}
		});
	});
	context.subscriptions.push(insertSingleLineHeaderCMD);


	vscode.workspace.onDidChangeTextDocument(async event => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || event.document !== editor.document) return;




		if (editor.selections.length <= 1) return;

		// For each change (usually one per cursor)
		for (let i = 0; i < event.contentChanges.length; i++) {
			const change = event.contentChanges[i];
			const selection = editor.selections[i];
			if (!selection) continue;

			// Get the original text at the change location (before the change)
			const start = change.range.start;
			const end = change.range.end;

			// Only process insertions (not deletions)
			if (change.text.length === 0) continue;

			// The text just inserted by the user
			const insertedText = change.text;

			// The original text that was replaced (if any)
			const originalText = event.document.getText(new vscode.Range(start, end));

			// Match the casing of the original text for this cursor
			const newText = matchCasing(originalText, insertedText);

			// If casing needs to be fixed, apply the edit
			if (newText !== insertedText) {
				await editor.edit(editBuilder => {
					editBuilder.replace(
						new vscode.Range(start, start.translate(0, insertedText.length)),
						newText
					);
				}, { undoStopAfter: false, undoStopBefore: false });
			}
		}
	});

	let insertUUIDsCMD = vscode.commands.registerCommand('colemenutils.insertUUIDs', async function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			await editor.edit(editBuilder => {
				for (const selection of editor.selections) {
					// Replace selection or insert at cursor
					editBuilder.replace(selection, generateUUIDv4());
				}
			});
		}
	});
	context.subscriptions.push(insertUUIDsCMD);

	// Insert a new line above the current line
	let clearCurrentLineCMD = vscode.commands.registerCommand('colemenutils.clearCurrentLine', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				const line = editor.document.lineAt(selection.active.line);
				editBuilder.delete(line.range);
			});
		});
	});
	context.subscriptions.push(clearCurrentLineCMD);

	// Select the current line and move the cursor to the end of the line
	let selectCurrentLineCMD = vscode.commands.registerCommand('colemenutils.selectCurrentLine', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const newSelections = editor.selections.map(selection => {
			const line = editor.document.lineAt(selection.active.line);
			// Select from start to end of the current line, but keep the cursor at the start
			return new vscode.Selection(line.range.start, line.range.end);
		});
		editor.selections = newSelections;
		editor.revealRange(editor.selections[0]);
	});
	context.subscriptions.push(selectCurrentLineCMD);



	// Toggle a markdown block quote on the selected lines
	let toggleBlockQuoteCMD = vscode.commands.registerCommand('colemenutils.toggleBlockQuote', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		editor.edit(editBuilder => {
			const selections = editor.selections;
			const linesDone = new Set();

			selections.forEach(selection => {
				const startLine = selection.start.line;
				const endLine = selection.end.line;

				for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
					if (linesDone.has(lineNum)) continue; // Avoid duplicate edits for overlapping selections
					linesDone.add(lineNum);

					const line = editor.document.lineAt(lineNum);
					const text = line.text;

					// Toggle block quote: if line starts with "> ", remove it; else, add "> "
					if (/^\s*> /.test(text)) {
						// Remove one level of block quote
						const newText = text.replace(/^(\s*)> /, '$1');
						editBuilder.replace(line.range, newText);
					} else {
						// Add block quote
						editBuilder.replace(line.range, '> ' + text);
					}
				}
			});
		});
	});
	context.subscriptions.push(toggleBlockQuoteCMD);


	let addMarkdownHeader = vscode.commands.registerCommand('colemenutils.addMarkdownHeader', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				const line = editor.document.lineAt(selection.active.line);
				if (!line.text.trim().startsWith('#')) {
					editBuilder.insert(line.range.start, '# ');
				}else{
					editBuilder.insert(line.range.start, "#");

				}
			});
		});
	});
	context.subscriptions.push(addMarkdownHeader);

	// Remove leading header pound sign from the beginning of the line
	let removeMarkdownHeader = vscode.commands.registerCommand('colemenutils.removeMarkdownHeader', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				const line = editor.document.lineAt(selection.active.line);
				const match = line.text.match(/^(\s*)#\s*/);
				if (match) {
					const start = line.range.start.translate(0, match[1].length);
					const end = line.range.start.translate(0, match[0].length);
					editBuilder.delete(new vscode.Range(start, end));
				}
			});
		});
	});
	context.subscriptions.push(removeMarkdownHeader);



	let ReverseSlashesInWindowsPathsCMD = vscode.commands.registerCommand('colemenutils.reverseSlashesInWindowsPaths', function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const edits = [];
			editor.selections.forEach(selection => {
				const line = document.lineAt(selection.active.line);
				// Regex to match Windows file paths anywhere in the line (e.g., C:/foo/bar, D:/baz, etc.)
				const newText = line.text.replace(/([A-Za-z]:[\\/][^'"`]*)/g, (match) => {
					return match.replace(/\\/g, '\/');
				});
				if (newText !== line.text) {
					edits.push({
						range: line.range,
						text: newText
					});
				}
			});
			if (edits.length > 0) {
				editor.edit(editBuilder => {
					edits.forEach(edit => {
						editBuilder.replace(edit.range, edit.text);
					});
				});
			}
		}
	});
	context.subscriptions.push(ReverseSlashesInWindowsPathsCMD);

	let LinesToStringArrayCMD = vscode.commands.registerCommand('colemenutils.LinesToStringArray', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();

			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
			const result = documentText.split(/\r?\n/);
			var indices = [];
			result.forEach((element) => {
				if(element.length > 0){
					element = element.replace(/^\"/,'');
					element = element.replace(/[\"|,]*$/,'');


					// if(element.toLowerCase() === "true"){
					// 	indices.push("true");
					// 	return;
					// }
					// if(element.toLowerCase() === "false"){
					// 	indices.push("false");
					// 	return;
					// }

                    // if (!isNaN(Number(element)) && element.trim() !== '') {
                    //     indices.push(Number(element));
                    //     return;
                    // }

					indices.push(`"${element}"`);
				}
			});


			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = `[${indices.join(',')}]`;

			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array with (limited) type guessing.`);
		}
	});
	context.subscriptions.push(LinesToStringArrayCMD);


	let LinesToFormattedArrayCMD = vscode.commands.registerCommand('colemenutils.LinesToFormattedArray', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;
		const config = vscode.workspace.getConfiguration('colemenutils');

		var d = fileOrSelectionToArrayOfLines(editor,true);
		if(d == null) return;
		var lines = d[0];
		var rrange = d[1];

		var indices = [];
		lines.forEach((element) => {
			if(element.length > 0 && element !== "\n"){
				element = element.replace(/^\"/,'');
				element = element.replace(/[\"|,]*$/,'');


				if(element.toLowerCase() === "true"){
					indices.push("true");
					return;
				}
				if(element.toLowerCase() === "false"){
					indices.push("false");
					return;
				}

				if (!isNaN(Number(element)) && element.trim() !== '') {
					indices.push(Number(element));
					return;
				}

				indices.push(`"${element}"`);
			}
		});

		var output_string = `[${indices.join(',')}]`;
		const workEdits = new vscode.WorkspaceEdit();
		workEdits.set(document.uri, [vscode.TextEdit.replace(rrange,output_string)]); // give the edits
		vscode.workspace.applyEdit(workEdits)


	});
	context.subscriptions.push(LinesToFormattedArrayCMD);



	let LinesToImageTagCMD = vscode.commands.registerCommand('colemenutils.LinesToImageTag', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();

			// @Mstep [] get all of the delimiters to be single semicolons
			var content = documentText.replace(/[;,\s]+/gmi,"\n");
			// @Mstep [] remove empty lines
			var indices = [];
			content.split(/\r?\n/).forEach((element) => {
				if(element.length > 0){
					var value = `${element}`
					indices.push(value);
				}
			});

			content = [...new Set(indices)].sort().join(';')

			// @Mstep [] get all of the delimiters to be single semicolons do it twice just incase.
			content = content.replace(/[;,\s]+/gmi,";");


			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = `${content}`;
			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			vscode.env.clipboard.writeText(output_string);
			// ColemenUtils.appendLine(`Converting new lines to an array with (limited) type guessing.`);
		}
	});
	context.subscriptions.push(LinesToImageTagCMD);

	let ImageTagsToLinesCMD = vscode.commands.registerCommand('colemenutils.ImageTagsToLinesCMD', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();



			// @Mstep [] remove empty lines
			// var indices = [];
			// content.split(/[;,\s]+/gmi).forEach((element) => {
			// 	if(element.length > 0){
			// 		var value = `${element}`
			// 		indices.push(value);
			// 	}
			// });

			// content = [...new Set(indices)].sort().join('\n')

			// @Mstep [] get all of the delimiters to be single semicolons do it twice just incase.
			var content = documentText.replace(/[;,\s]+/gmi,"\n");


			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = `${content}`;
			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			vscode.env.clipboard.writeText(output_string);
			// ColemenUtils.appendLine(`Converting new lines to an array with (limited) type guessing.`);
		}
	});
	context.subscriptions.push(ImageTagsToLinesCMD);



	let explodeByDelimCMD = vscode.commands.registerCommand('colemenutils.explodeByDelim', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			let documentText = document.getText();

			var dlim = mostCommonNonAlphanumeric(documentText);
			if(dlim == null) return;



			documentText = documentText.replace(RegExp(`[${dlim}]{2}`,'gm'),"__DELIM__");
			var matches = documentText.matchAll(/(['"])(.*?)\1/gmi)
			for(const match of matches){
				var escaped = match[0].replace(RegExp(dlim,'gm'),'__QUOTED_DELIM__');
				documentText = documentText.replace(match[0],escaped);
			}

			// @Mstep [] get all of the delimiters to be single semicolons do it twice just incase.

			var content = documentText.replace(RegExp(dlim,'gmi'),"\n");
			content = content.replace(/__QUOTED_DELIM__/gm,dlim);
			content = content.replace(/__DELIM__/gm,dlim);

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = `${content}`;
			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			vscode.env.clipboard.writeText(output_string);
			// ColemenUtils.appendLine(`Converting new lines to an array with (limited) type guessing.`);
		}
	});
	context.subscriptions.push(explodeByDelimCMD);


	//   #####  #     #  #####
	//  #     # #     # #     #
	//  #       #     # #
	//   #####  #     # #  ####
	//        #  #   #  #     #
	//  #     #   # #   #     #
	//   #####     #     #####



	let FormatSVGContentCMD = vscode.commands.registerCommand('colemenutils.FormatSVGContentCMD', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			if (editor.document.languageId !== 'xml') return

			console.log("editor.document.fileName : ",editor.document.fileName);


			let document = editor.document;
			const documentText = document.getText();

			// @Mstep [] Split the attributes into separate lines
			const splitLinesRegex = /\>\</gm;
			var content = documentText.replace(splitLinesRegex,">\n<");
			content = content.replace(/<!DOCTYPE [^>]*>/gm, '');





			// var parse = require('xml-parser');
			// var inspect = require('util').inspect;

			var convert = require('xml-js');
			var options = {alwaysElements:true,ignoreComment:true};
			var rawXML = convert.xml2js(content, options);
			if(Object.keys(rawXML).length === 0) return;
			// console.log("rawXML : ",rawXML);
			// console.log(inspect(rawXML, { colors: true, depth: Infinity }));
			var rawElements = rawXML.elements[0].elements;
			// console.log(inspect(rawElements, { colors: true, depth: Infinity }));
			var elements = [];

			const removeSuperfluousGroups=(tag)=>{
				if(tag.name !== "g") return tag;
				if(tag.attributes == null) tag.attributes = [];
				if(tag.elements == null) tag.elements = [];
				const attributeCount = Object.keys(tag.attributes).length
				const childCount = tag.elements.length
				if(childCount === 0 && attributeCount === 0) return null;

				if(Object.keys(tag.attributes).length === 1){
					if(tag.attributes.id != null)tag.attributes = [];
					// console.log("Removed id attribute from group");
				}
				if(Object.keys(tag.attributes).length === 0){
					// console.log("Group has no attributes");
					if(childCount === 1) tag = removeSuperfluousGroups(tag.elements[0]);
					if(childCount > 1){
						var tc = []
						for (const child of Object.values(tag.elements)) {
							tc.push(removeSuperfluousGroups(child));
						}
						return tc
					}
				}
				return tag
			}


			for (var child of Object.values(rawElements)) {
				if(child.type === "comment") continue
				// console.log("==================== CHILD");
				child = removeSuperfluousGroups(child)
				if(child != null) {
					if(Array.isArray(child)){
						for (const value of Object.values(child)) {
							elements.push(value);
						}
					}
					else{
						elements.push(child);
					}

				}
				// if(child.elements.length === 0) continue;

			}

			// console.log("filtered elements : ",elements);

			rawXML.elements[0].elements = elements
			var compileOptions = {compact: false, ignoreComment: true, spaces: 4};
			content = convert.js2xml(rawXML,compileOptions);




			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = `${content}`;
			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(FormatSVGContentCMD);


	let CaptureSVGViewboxValueCMD = vscode.commands.registerCommand('colemenutils.CaptureSVGViewboxValue', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			if (editor.document.languageId !== 'xml') return
			let document = editor.document;
			const documentText = document.getText();


			// @Mstep [] Split the attributes into separate lines
			const splitLinesRegex = /\>\</gm;
			var content = documentText.replace(splitLinesRegex,">\n<");

			const viewBoxRegex = /viewbox=['"]([\d.\s-]*)['"]/
			// const reg = new RegExp('viewbox=.([0-9\s.]*)','gmi')
			const reg = new RegExp(viewBoxRegex,'gmi')
			var result = reg.exec(content)
			if(result != null){
				console.log("result : ",result);
				console.log("result[1] : ",result[1]);

				vscode.env.clipboard.writeText(result[1]);
			}
		}
	});
	context.subscriptions.push(CaptureSVGViewboxValueCMD);

	let CaptureSVGBodyCMD = vscode.commands.registerCommand('colemenutils.CaptureSVGBody', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			if (editor.document.languageId !== 'xml') return
			let document = editor.document;
			const documentText = document.getText();





			// @Mstep [] Split the attributes into separate lines
			const splitLinesRegex = /\>\</gm;
			var content = documentText.replace(splitLinesRegex,">\n<");
			var convert = require('xml-js');
			var options = {alwaysElements:true,ignoreComment:true};
			var rawXML = convert.xml2js(content, options);
			var rawElements = rawXML.elements[0].elements;
			var elements = [];

			const removeSuperfluousGroups=(tag)=>{
				if(tag.name !== "g") return tag;
				if(tag.attributes == null) tag.attributes = [];
				if(tag.elements == null) tag.elements = [];
				const attributeCount = Object.keys(tag.attributes).length
				const childCount = tag.elements.length
				if(childCount === 0 && attributeCount === 0) return null;

				if(Object.keys(tag.attributes).length === 1){
					if(tag.attributes.id != null)tag.attributes = [];
				}
				if(Object.keys(tag.attributes).length === 0){
					if(childCount === 1){
						tag = removeSuperfluousGroups(tag.elements[0]);
					}
				}
				return tag
			}


			for (var child of Object.values(rawElements)) {
				if(child.type === "comment") continue
				child = removeSuperfluousGroups(child)
				if(child != null) elements.push(child);

			}

			// console.log("filtered elements : ",elements);

			rawXML.elements[0].elements = elements
			var compileOptions = {compact: false, ignoreComment: true, spaces: 4};

			var tmpWrap = {
				name:"TEMPORARY",
				elements:elements
			}
			var content = convert.js2xml(tmpWrap,compileOptions)
			vscode.env.clipboard.writeText(content);

		}
	});
	context.subscriptions.push(CaptureSVGBodyCMD);




	let ComponentToMultiLineCMD = vscode.commands.registerCommand('colemenutils.ComponentToMultiLine', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			console.log("editor.document.languageId: ",editor.document.languageId);
			if (editor.document.languageId !== 'javascript' && editor.document.languageId !== 'typescript') return
			let document = editor.document;
			const documentText = document.getText();
			// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

			let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
			// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')
			var content = editor.document.getText(editor.selection);
			const {text} = editor.document.lineAt(editor.selection.active.line);
			console.log("text : ",text);
			console.log("content : ",content);

			var baseIndent = ""

			// @Mstep [] determine the indentation of the line
			const indentRegex = /^\s*/gm
			var result = text.match(indentRegex)
			if(result.length > 0) baseIndent = result[0]


			if(content.length === 0){
				content = text.replace(indentRegex,"");
			}
			// console.log("result : ",result);


			// const TabSize = editor.options.tabSize

			// const closeTagRegex = /(>)/gm;
			// content = content.replace(closeTagRegex,"__NEW_LINE__$1");
			const closeComponentRegex = /(<\/|\/>)/gm;
			content = content.replace(closeComponentRegex,"\n__BASE_INDENT__$1");
			const PropSplitRegex = /\s+([a-zA-Z0-9-]*)=/gm;
			content = content.replace(PropSplitRegex,"__NEW_LINE__$1=");
			const newLineRegex = /__NEW_LINE__/gm;
			content = content.replace(newLineRegex,`\n${baseIndent}    `);


			const baseIndentRegex = /__BASE_INDENT__/gm;
			content = content.replace(baseIndentRegex,baseIndent);
			// var lines = fileToArrayOfLines(editor);
			// var lines = contents.split(/\r?\n/)
			// var line_count = lines.length
			// // var sorted = lines.sort()
			// // var output_string = sorted.sort().join('\n');
			var output_string = `${baseIndent}${content}\n`;

			const workEdits = new vscode.WorkspaceEdit();
			// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(ComponentToMultiLineCMD);





	let CommentConsoleLogLinesCMD = vscode.commands.registerCommand('colemenutils.commentConsoleLogLines', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			console.log("editor.document.languageId: ",editor.document.languageId);
			if (editor.document.languageId !== 'javascript' && editor.document.languageId !== 'typescript') return
			let document = editor.document;
			const documentText = document.getText();

			const splitLinesRegex = /(^[\s]{2,}[^/])(\s*console.log)/gm;
			var content = documentText.replace(splitLinesRegex,"$1// $2");

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,content)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(CommentConsoleLogLinesCMD);



	let LinesToArrayCMD = vscode.commands.registerCommand('colemenutils.linesToArray', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();

			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
			const result = documentText.split(/\r?\n/);
			var indices = [];
			result.forEach((element) => {
				if(element.length > 0){
					indices.push(`${element}`);
				}
			});

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = `[${indices.join(',')}]`;

			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(LinesToArrayCMD);

	let StripEmptyLines = vscode.commands.registerCommand('colemenutils.stripEmptyLines', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");

			// output_string = documentText.replace(/\r?\n/,'');
			const result = documentText.split(/\r?\n/);
			var indices = [];
			result.forEach((element) => {
				if(element.length > 0){
					indices.push(`${element}`);
				}
			});

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = indices.join('\n');

			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(StripEmptyLines);

	let ToSingleLine = vscode.commands.registerCommand('colemenutils.toSingleLine', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");

			// var output_string = documentText.replace(/[\r\n]*/,'');
			const result = documentText.split(/\r?\n/);
			var indices = [];
			result.forEach((element) => {
				if(element.length > 0){
					indices.push(`${element}`);
				}
			});

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			var output_string = indices.join('');

			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(ToSingleLine);

	let MinifyFile = vscode.commands.registerCommand('colemenutils.minifyFile', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			// const documentText = document.getText();
			let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");

			var lines = fileToArrayOfLines(editor);
			ColemenUtils.appendLine(JSON.stringify(lines));

			var output_string = minify(lines);

			// var output_string = lines.join('');

			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(MinifyFile);



	//   #####  ######     #     #####  #######  #####
	//  #     # #     #   # #   #     # #       #     #
	//  #       #     #  #   #  #       #       #
	//   #####  ######  #     # #       #####    #####
	//        # #       ####### #       #             #
	//  #     # #       #     # #     # #       #     #
	//   #####  #       #     #  #####  #######  #####



	let StripTrailingSpacesCMD = vscode.commands.registerCommand('colemenutils.stripTrailingSpaces', function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const documentText = document.getText();
			// Remove trailing spaces from each line
			const output_string = documentText.replace(/[ \t]+$/gm, '');
			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range, output_string)]);
			vscode.workspace.applyEdit(workEdits);
		}
	});
	context.subscriptions.push(StripTrailingSpacesCMD);

	// Replace occurences of multiple spaces with a single space
	let StripExcessiveSpacesCMD = vscode.commands.registerCommand('colemenutils.stripExcessiveSpaces', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		let rrange;
		if (editor.selection.isEmpty) {
			// No selection: use the whole document
			rrange = new vscode.Range(
				0, 0,
				editor.document.lineCount - 1,
				editor.document.lineAt(editor.document.lineCount - 1).text.length
			);
		} else {
			// Use the selection
			rrange = editor.selection;
		}
		const document = editor.document;
		const documentText = document.getText(rrange);
		// Remove excessive spaces from each line
		const output_string = documentText.replace(/[ \t]+/gm, ' ');
		const workEdits = new vscode.WorkspaceEdit();
		// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
		workEdits.set(document.uri, [vscode.TextEdit.replace(rrange, output_string)]);
		vscode.workspace.applyEdit(workEdits);
	});
	context.subscriptions.push(StripExcessiveSpacesCMD);


	// let StripTrailingSpaces = vscode.commands.registerCommand('colemenutils.stripTrailingSpaces', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();
	// 		var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(StripTrailingSpaces);

	let shuffleLinesCMD = vscode.commands.registerCommand('colemenutils.shuffleLines', function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
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
	});
	context.subscriptions.push(shuffleLinesCMD);

	let StripDuplicateLines = vscode.commands.registerCommand('colemenutils.stripDuplicateLines', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

			var lines = fileToArrayOfLines(editor);
			var output_string = [...new Set(lines)].join('\n');
			// output_string = output_string.replace('__NEW_LINE__','\n')

			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(StripDuplicateLines);

	let StripSelectedDuplicate = vscode.commands.registerCommand('colemenutils.stripSelectedDuplicate', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

			let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
			// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')
			const contents = editor.document.getText(editor.selection);
			// var lines = fileToArrayOfLines(editor);
			var lines = contents.split(/\r?\n/)
			var line_count = lines.length
			// var sorted = lines.sort()
			// var output_string = sorted.sort().join('\n');
			var output_string = [...new Set(lines)].join('\n');

			const workEdits = new vscode.WorkspaceEdit();
			// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(StripSelectedDuplicate);

	// let SortSelected = vscode.commands.registerCommand('colemenutils.sortSelected', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();
	// 		const contents = editor.document.getText(editor.selection);
	// 		let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
	// 		// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

	// 		// var lines = fileToArrayOfLines(editor);
	// 		var lines = contents.split(/\r?\n/)
	// 		var line_count = lines.length
	// 		var sorted = lines.sort()
	// 		var output_string = sorted.sort().join('\n');

	// 		// const currentLineRange = editor.document.lineAt(editor.selection.active.line).range;

	// 		// editor.selection.end.line
	// 		// output_string = output_string.replace('__NEW_LINE__','\n')
	// 		// ColemenUtils.appendLine(`editor.selection.active.line: ${editor.selection.active.line}`);
	// 		// ColemenUtils.appendLine(`editor.selection.start.line: ${editor.selection.start.line}`);
	// 		// ColemenUtils.appendLine(`editor.selection.end.line: ${editor.selection.end.line}`);
	// 		// ColemenUtils.appendLine(`sorted: ${sorted}`);
	// 		// ColemenUtils.appendLine(`line_count: ${line_count}`);

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
	// 		let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(SortSelected);

	// let SortSelectedReversed = vscode.commands.registerCommand('colemenutils.sortSelectedReversed', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();

	// 		const contents = editor.document.getText(editor.selection);
	// 		// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
	// 		// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

	// 		// var lines = fileToArrayOfLines(editor);
	// 		var lines = contents.split(/\r?\n/)
	// 		var line_count = lines.length
	// 		var sorted = lines.sort()
	// 		var output_string = lines.reverse().join('\n');

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(SortSelectedReversed);







	//  #       ### #     # #######     #####  ####### ######  ####### ### #     #  #####
	//  #        #  ##    # #          #     # #     # #     #    #     #  ##    # #     #
	//  #        #  # #   # #          #       #     # #     #    #     #  # #   # #
	//  #        #  #  #  # #####       #####  #     # ######     #     #  #  #  # #  ####
	//  #        #  #   # # #                # #     # #   #      #     #  #   # # #     #
	//  #        #  #    ## #          #     # #     # #    #     #     #  #    ## #     #
	//  ####### ### #     # #######     #####  ####### #     #    #    ### #     #  #####




	let SortLines = vscode.commands.registerCommand('colemenutils.sortLines', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;
		const config = vscode.workspace.getConfiguration('colemenutils');

		var d = fileOrSelectionToArrayOfLines(editor,true);
		if(d == null) return;
		var lines = d[0];
		var rrange = d[1];


		const orig_lines = lines;
		var sortableValues = [];
		var sortableNumbers = [];

		for (let i = 0; i < lines.length; i++) {
			if(lines[i].length === 0) continue;
			if(lines[i].match(/^\r?\n$/gm) != null) continue;
			if (!isNaN(lines[i]) && lines[i].trim() !== '') {
				sortableNumbers.push(Number(lines[i]));
				continue
			}
			sortableValues.push(lines[i]);
		}

		// console.log("sortableValues : ",sortableValues);
		// console.log("sortableNumbers : ",sortableNumbers);

		var sortedValues = sortableValues.sort((a, b) => {
			const cleanA = a.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
			const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
			return cleanA.localeCompare(cleanB);
		});
		var sortedNumbers = sortableNumbers.sort((a, b) => a - b);
		// console.log("sortedValues : ",sortedValues);
		// console.log("sortedNumbers : ",sortedNumbers);


		var sortedLines = [];
		if(config.get("numberPlacementAlphaSort","before")==="before"){
			sortedLines = sortedNumbers.concat(sortedValues);
		}else{
			sortedLines = sortedValues.concat(sortedNumbers);
		}
		var outputLines = [];

		if(config.get("keepOriginalFormatting",true)===true){
			// console.log("==== keepOriginalFormatting === true");
			var sidx = 0;
			for(let i = 0; i < orig_lines.length; i++) {
				if(orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
					outputLines.push(orig_lines[i]);
					continue
				}
				outputLines.push(sortedLines[sidx]);
				sidx++;
			}
		}else{
			var emptyLineCount = orig_lines.length - sortedLines.length;
			// console.log("emptyLineCount: ",emptyLineCount);
			const arr = new Array(emptyLineCount).fill('\n');
			outputLines = sortedLines.concat(arr);
		}

		var output_string = outputLines.join('\n');


		// console.log("rrange : ",rrange);

		const workEdits = new vscode.WorkspaceEdit();
		workEdits.set(document.uri, [vscode.TextEdit.replace(rrange,output_string)]); // give the edits
		vscode.workspace.applyEdit(workEdits)
	});
	context.subscriptions.push(SortLines);

	let SortLinesReversed = vscode.commands.registerCommand('colemenutils.sortLinesReversed', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;

		const config = vscode.workspace.getConfiguration('colemenutils');
		var d = fileOrSelectionToArrayOfLines(editor,true);
		if(d == null) return;
		var lines = d[0];
		var rrange = d[1];


		const orig_lines = lines;
		var sortableValues = [];
		var sortableNumbers = [];

		for (let i = 0; i < lines.length; i++) {
			if(lines[i].length === 0) continue;
			if(lines[i].match(/^\r?\n$/gm) != null) continue;
			if (!isNaN(lines[i]) && lines[i].trim() !== '') {
				sortableNumbers.push(Number(lines[i]));
				continue
			}
			sortableValues.push(lines[i]);
		}

		// console.log("sortableValues : ",sortableValues);
		// console.log("sortableNumbers : ",sortableNumbers);

		var sortedValues = sortableValues.sort((a, b) => {
			const cleanA = a.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
			const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
			return cleanA.localeCompare(cleanB);
		});
		var sortedNumbers = sortableNumbers.sort((a, b) => a - b);
		// console.log("sortedValues : ",sortedValues);
		// console.log("sortedNumbers : ",sortedNumbers);
		sortedNumbers.reverse();
		sortedValues.reverse();

		var sortedLines = [];
		if(config.get("numberPlacementAlphaSort","before")==="before"){
			sortedLines = sortedNumbers.concat(sortedValues);
		}else{
			sortedLines = sortedValues.concat(sortedNumbers);
		}
		var outputLines = [];

		if(config.get("keepOriginalFormatting",true)===true){
			// console.log("==== keepOriginalFormatting === true");
			var sidx = 0;
			for(let i = 0; i < orig_lines.length; i++) {
				if(orig_lines[i].length === 0 || orig_lines[i].match(/^\r?\n$/gm) != null) {
					outputLines.push(orig_lines[i]);
					continue
				}
				outputLines.push(sortedLines[sidx]);
				sidx++;
			}
		}else{
			var emptyLineCount = orig_lines.length - sortedLines.length;
			// console.log("emptyLineCount: ",emptyLineCount);
			const arr = new Array(emptyLineCount).fill('\n');
			outputLines = sortedLines.concat(arr);
		}

		var output_string = outputLines.join('\n');


		// console.log("rrange : ",rrange);

		const workEdits = new vscode.WorkspaceEdit();
		workEdits.set(document.uri, [vscode.TextEdit.replace(rrange,output_string)]); // give the edits
		vscode.workspace.applyEdit(workEdits)
	});
	context.subscriptions.push(SortLinesReversed);




	let SortByLength = vscode.commands.registerCommand('colemenutils.sortByLength', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;

		const config = vscode.workspace.getConfiguration('colemenutils');
		var d = fileOrSelectionToArrayOfLines(editor, true);
		if (d == null) return;
		var lines = d[0];
		var rrange = d[1];

		const orig_lines = lines;
		var sortableValues = [];


		for (let i = 0; i < lines.length; i++) {
			if(lines[i].length === 0) continue;
			if(lines[i].match(/^\r?\n$/gm) != null) continue;
			sortableValues.push(lines[i]);
		}

		// Sort lines by length (ascending)
		const sortedLines = sortableValues.slice().sort((a, b) => a.length - b.length);

		let outputLines = [];

		if (config.get("keepOriginalFormatting", true) === true) {
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
	});
	context.subscriptions.push(SortByLength);

		let SortByLengthReversed = vscode.commands.registerCommand('colemenutils.sortByLengthReversed', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;

		const config = vscode.workspace.getConfiguration('colemenutils');
		var d = fileOrSelectionToArrayOfLines(editor, true);
		if (d == null) return;
		var lines = d[0];
		var rrange = d[1];

		const orig_lines = lines;
		var sortableValues = [];


		for (let i = 0; i < lines.length; i++) {
			if(lines[i].length === 0) continue;
			if(lines[i].match(/^\r?\n$/gm) != null) continue;
			sortableValues.push(lines[i]);
		}

		// Sort lines by length (ascending)
		const sortedLines = sortableValues.slice().sort((a, b) => a.length - b.length);

		sortedLines.reverse();

		let outputLines = [];

		if (config.get("keepOriginalFormatting", true) === true) {
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
	});
	context.subscriptions.push(SortByLengthReversed);





	// let SortSelectedByLength = vscode.commands.registerCommand('colemenutils.sortSelectedByLength', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();

	// 		const contents = editor.document.getText(editor.selection);
	// 		// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
	// 		// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

	// 		// var lines = fileToArrayOfLines(editor);
	// 		var lines = contents.split(/\r?\n/)
	// 		var line_count = lines.length
	// 		// var sorted = lines.sort()
	// 		const asc = lines.sort((a,b) => a.length - b.length);
	// 		var output_string = asc.reverse().join('\n');
	// 		// var output_string = lines.reverse().join('\n');

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(SortSelectedByLength);

	// let SortSelectedByLengthReversed = vscode.commands.registerCommand('colemenutils.sortSelectedByLengthReversed', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();

	// 		const contents = editor.document.getText(editor.selection);
	// 		// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
	// 		// var output_string = documentText.replace(/\s+[^\S\r\n]$/gm,'')

	// 		// var lines = fileToArrayOfLines(editor);
	// 		var lines = contents.split(/\r?\n/)
	// 		var line_count = lines.length
	// 		// var sorted = lines.sort()
	// 		const asc = lines.sort((a,b) => a.length - b.length);
	// 		var output_string = asc.join('\n');
	// 		// var output_string = lines.reverse().join('\n');

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(SortSelectedByLengthReversed);

	// let SortLinesByLength = vscode.commands.registerCommand('colemenutils.sortLinesByLength', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();

	// 		var lines = fileToArrayOfLines(editor);
	// 		const asc = lines.sort((a,b) => a.length - b.length);
	// 		var output_string = asc.reverse().join('\n');

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(SortLinesByLength);

	// let SortLinesByLengthReversed = vscode.commands.registerCommand('colemenutils.sortLinesByLengthReversed', function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if(editor){
	// 		let document = editor.document;
	// 		const documentText = document.getText();

	// 		var lines = fileToArrayOfLines(editor);
	// 		const asc = lines.sort((a,b) => a.length - b.length);
	// 		var output_string = asc.join('\n');

	// 		const workEdits = new vscode.WorkspaceEdit();
	// 		let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
	// 		workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
	// 		vscode.workspace.applyEdit(workEdits)
	// 	}
	// });
	// context.subscriptions.push(SortLinesByLengthReversed);









	let applyNewLines = vscode.commands.registerCommand('colemenutils.applyNewLines', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");

			var lines = fileToArrayOfLines(editor);

			var new_lines = [];
			lines.forEach(line => {
				var lineArray = line.split(/\\n/);
				lineArray.forEach(newLine => {
					var skip_push = false;
					newLine = newLine.replace(/\<\/?b\>/gi,'');
					// newLine = newLine.replace("</b>",'');
					newLine = newLine.replace(/\<br\s*\/\>/gi,'');
					if(new_lines.length > 0){
						var prev_line = new_lines[new_lines.length-1];
						ColemenUtils.appendLine(JSON.stringify(prev_line));
						var prev_arr = new_lines[new_lines.length-1].match(/=\>$/gmi);
						if(prev_arr != null){
							newLine = newLine.replace(/^\s*/gmi,'');

							new_lines[new_lines.length-1] = `${new_lines[new_lines.length-1]} ${newLine}`
							ColemenUtils.appendLine(JSON.stringify(prev_arr));
							skip_push = true;
						}

					}
					if(skip_push == false) new_lines.push(newLine);
				});
			});
			// const asc = lines.sort((a,b) => a.length - b.length);
			var output_string = new_lines.join('\n');

			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(applyNewLines);


	let escapeAllSingleBackSlash = vscode.commands.registerCommand('colemenutils.escapeAllSingleBackSlash', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");

			var lines = fileToArrayOfLines(editor);

			var new_lines = [];
			lines.forEach(line => {
				new_lines.push(line.replace(/(?<!\\)\\(?!\\)/gmi,'\\\\'));
			});
			// const asc = lines.sort((a,b) => a.length - b.length);
			var output_string = new_lines.join('\n');

			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(escapeAllSingleBackSlash);

	let EscapeSelectedSingleBackSlash = vscode.commands.registerCommand('colemenutils.escapeSelectedSingleBackSlash', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();

			const contents = editor.document.getText(editor.selection);

			var lines = contents.split(/\r?\n/)
			var new_lines = [];
			lines.forEach(line => {
				new_lines.push(line.replace(/(?<!\\)\\(?!\\)/gmi,'\\\\'));
			});
			var output_string = new_lines.join('\n');


			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(editor.selection.start.line,0,editor.selection.end.line+1,0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(EscapeSelectedSingleBackSlash);


	let singleToDoubleQuote = vscode.commands.registerCommand('colemenutils.singleToDoubleQuote', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			// const documentText = document.getText();

			// const contents = editor.document.getText(editor.selection);

			var lines = fileToArrayOfLines(editor);
			var new_lines = [];
			lines.forEach(line => {
				new_lines.push(line.replaceAll("'",'"'));
			});
			var output_string = new_lines.join('\n');


			const workEdits = new vscode.WorkspaceEdit();
			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
		}
	});
	context.subscriptions.push(singleToDoubleQuote);


	let linesToListDelimiterUniqueCMD = vscode.commands.registerCommand('colemenutils.linesToListDelimiterUnique', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;
		const config = vscode.workspace.getConfiguration('colemenutils');
		// const documentText = document.getText();
		const del = config.get("linesToListDelimiter",",");

		// commaSplitText = commaSplitText.replace(/[\n]{2,}/g,"\n")
		// const result = commaSplitText.split(/\r?\n/);

		var d = fileOrSelectionToArrayOfLines(editor);
		if (d == null) return;
		var lines = d[0];
		var rrange = d[1];

		// var commaSplitText = documentText.replace(del,"\n")
		// commaSplitText = commaSplitText.replace(/[\n]{2,}/g,"\n")

		lines = [...new Set(lines)];


		var indices = [];
		lines.forEach((element) => {
			indices.push(element.replace(/\s$/,""))
		});

		// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
		var output_string = `${indices.join(del)}`;
		output_string = output_string.replace(/[,]{2,}/g,",")

		const workEdits = new vscode.WorkspaceEdit();
		workEdits.set(document.uri, [vscode.TextEdit.replace(rrange,output_string)]); // give the edits
		vscode.workspace.applyEdit(workEdits)


		// if(editor){
		// 	let document = editor.document;
		// 	const documentText = document.getText();

		// 	// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
        //     var commaSplitText = documentText.replace(",","\n")
        //     //Split the document by new lines
		// 	commaSplitText = commaSplitText.replace(/[\n]{2,}/g,"\n")
        //     const result = commaSplitText.split(/\r?\n/);
		// 	var lines = fileToArrayOfLines(editor);
		// 	lines = [...new Set(lines)];


		// 	var indices = [];
		// 	lines.forEach((element) => {
		// 		indices.push(element.replace(/\s$/,""))

		// 	// 	if(element.length > 0 && element != " "){
		// 	// 		if(!indices.includes(`${element}`)){
		// 	// 			indices.push(`${element}`);
		// 	// 		}
		// 	// 	}
		// 	});

		// 	let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
		// 	var output_string = `${indices.join(',')}`;
		// 	output_string = output_string.replace(/[,]{2,}/g,",")

		// 	const workEdits = new vscode.WorkspaceEdit();
		// 	workEdits.set(document.uri, [vscode.TextEdit.replace(range,output_string)]); // give the edits
		// 	vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		// }
	});
	context.subscriptions.push(linesToListDelimiterUniqueCMD);


	let linesToListDelimiterCMD = vscode.commands.registerCommand('colemenutils.linesToListDelimiter', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		let document = editor.document;
		const config = vscode.workspace.getConfiguration('colemenutils');

		const del = config.get("linesToListDelimiter",",");


		var d = fileOrSelectionToArrayOfLines(editor);
		if (d == null) return;
		var lines = d[0];
		var rrange = d[1];


		var indices = [];
		lines.forEach((element) => {
			indices.push(element.replace(/\s$/,""))
		});

		// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
		var output_string = `${indices.join(del)}`;
		output_string = output_string.replace(/[,]{2,}/g,",")

		const workEdits = new vscode.WorkspaceEdit();
		workEdits.set(document.uri, [vscode.TextEdit.replace(rrange,output_string)]); // give the edits
		vscode.workspace.applyEdit(workEdits)

	});
	context.subscriptions.push(linesToListDelimiterCMD);




	let prepApricityComment = vscode.commands.registerCommand('colemenutils.prepApricityComment', function () {
		// Convert a json string into an apricity comment
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();
			if(documentText.startsWith("_apricity_") == true){
				vscode.window.showWarningMessage("This is already an apricity comment!");
				vscode.env.clipboard.writeText(documentText)
				return
			}

			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
            // var a = documentText.replace("params","p")
            // Strip quotes from around the keys
			// const regex = new RegExp('\\"([a-zA-Z0-9_\\s]*)\\":', 'gm')

			var a = apricityReplacements(documentText,false);

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);

			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,a)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(prepApricityComment);

	let formatApricityComment = vscode.commands.registerCommand('colemenutils.formatApricityComment', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			var documentText = document.getText();

			if(documentText.startsWith("_apricity_") == false){
				vscode.window.showWarningMessage("This is not an apricity comment!");
				documentText = apricityReplacements(documentText,false);

				// return
			}

			var a = apricityReplacements(documentText,true);

			console.log(a);
			var obj = JSON.parse(a);
			obj = apricityColumnDefaults(obj)

			a = JSON.stringify(obj, null, 4); // 4 spaces as indent

			let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			// var output_string = `${indices.join(',')}`;
			// output_string = output_string.replace(/[,]{2,}/g,",")

			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,a)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(formatApricityComment);





	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('colemenutils.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ColemenUtils!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}


function apricityReplacements(value,reverse=false){
	var a = value;

	const commonReplacements = [
		["The id of the","tiot"],
		[" associated to this ","asstt"],
		["The unix timestamp of when this was created","tsdesc"],
		["The unix timestamp of when this was deleted, null otherwise","deltsds"],
		["The unix timestamp of when this was last modified, null otherwise","mdtsds"],
		["The ID used to externally identify the row","hashiddsc"],
		["The Primary Key of the table","priddsc"],
		// ["\\[0-9a-zA-Z\\]\\*","r0aA"],
	]
	const valueAbbreviations = [
		["false","fF"],
		["true","tT"],
		["null","nN"],
	]


	// [abbreviation, attribute_name, regex_synonyms, regex_ignored_values]
	const keyAbbreviations = [
		["q_pp","query_params","(query_p|q_pp|query_params)","(fF|nN)"],
		["u_pp","url_params",undefined,"(fF|nN)"],
		["b_pp","body_params",undefined,"(fF|nN)"],
		["vds","validation","validations?","(fF|nN)"],
		["rqd","required",undefined,"(fF|nN)"],
		["nlbl","nullable",undefined,"(fF|nN)"],
		["phnum","phone_number",undefined,"(fF|nN)"],
		["mnva","min_value",undefined,"(fF|nN)"],
		["mxva","max_value",undefined,"(fF|nN)"],
		["mxle","max_length",undefined,"(fF|nN)"],
		["mnle","min_length",undefined,"(fF|nN)"],
		["bool","boolean",undefined,"(fF|nN)"],
		["anumon","alpha_numeric_only",undefined,"(fF|nN)"],
		["numo","numeric_only",undefined,"(fF|nN)"],
		["vaopt","value_options",undefined,"(fF|nN)"],
		["rgx","regex",undefined,"(fF|nN)"],
		["ipad","is_ip_address","(ip(\\s?|_)address|is_ip)","(fF|nN)"],
		["cc","create"],
		["rr","read"],
		["uu","update"],
		["dd","delete"],
		["dsc","description"],
		["opt","options"],
		["ssm","susurrus_methods"],
		["ists","is_timestamp","(is_timestamp|unix_timestamp)","(fF|nN)"],
		["isem","is_email","(is_email|email)","(fF|nN)"],
		["hid","hash_id",undefined,"(fF|nN)"],
		["dft","default",undefined,"(fF|nN)"],
		["url","is_url","(is_url|url)","(fF|nN)"],
	]

	if(reverse == false){
		// @Mstep [] remove quotes from keys.
		var a = a.replace(/\"([a-zA-Z0-9_\s]*)\":/gm,"$1:")

		keyAbbreviations.forEach(abbr => {
			var abbrev = abbr[0];
			var name = abbr[1];
			var syn = abbr[2];
			var ignore = abbr[3];

			var re = new RegExp(`${name}:\\s*`,"gm");
			if(syn != undefined){
				re = new RegExp(`${syn}:\\s*`,"gm");
			}
			a = a.replace(re,`${abbrev}:`)
		});

		valueAbbreviations.forEach(abbr => {
			var re = new RegExp(`:\\s*${abbr[0]}`,"gm");
			a = a.replace(re,`:${abbr[1]}`)
		});

		commonReplacements.forEach(abbr => {
			var re = new RegExp(`${abbr[0]}`,"gm");
			a = a.replace(re,`\$${abbr[1]}`)
		});

		// @Mstep [] remove keys that have empty arrays as a value.
		a = a.replace(/[a-zA-Z0-9_]*:\s*(\[\s*\]|\{\s*\}),?/gm,"")
		a = a.replace(/[a-zA-Z0-9_]*:\s*(\[\s*\]|\{\s*\}),?/gm,"")
		a = a.replace(/[a-zA-Z0-9_]*:\s*(\[\s*\]|\{\s*\}),?/gm,"")
		a = a.replace(/[a-zA-Z0-9_]*:\s*(\[\s*\]|\{\s*\}),?/gm,"")


		keyAbbreviations.forEach(abbr => {
			var abbrev = abbr[0];
			var name = abbr[1];
			var syn = abbr[2];
			var ignore = abbr[3];
			if(ignore != undefined){
				// console.log(`${abbr[0]}:\\s*${abbr[2]},`);
				var re = new RegExp(`${abbrev}:\\s*${ignore},`,"gm");
				a = a.replace(re,'')

				var re = new RegExp(`${abbrev}:\\s*${ignore}\\s*\}`,"gm");
				a = a.replace(re,'}')

			}
		});

		a = a.replace(/validation:\{\s*\},/gm," ")
		a = a.replace(/,\s*\}/gm,"}")
		a = a.replace(/^\s*\n/gm,"")
		a = a.replace(/^:\s*\{/gm,"")
		a = a.replace(/^\s*/gm,"")
		a = a.replace(/(\r\n|\r|\n)/gm,"")
		a = `_apricity_${a}`
		vscode.env.clipboard.writeText(a)
		vscode.window.showInformationMessage("Converted to Apricity comment and saved to clipboard.")
	}
	else{
		a = a.replace(/^_apricity_/gm,'')



		keyAbbreviations.forEach(abbr => {
			var re = new RegExp(`${abbr[0]}:\\s*`,"gm");
			a = a.replace(re,`${abbr[1]}:`)

			if(abbr.length == 4){
				var re = new RegExp(`${abbr[2]}:\\s*`,"gm");
				a = a.replace(re,`${abbr[1]}:`)
			}
		});

		valueAbbreviations.forEach(abbr => {
			var re = new RegExp(`:\\s*${abbr[1]}`,"gm");
			a = a.replace(re,`:${abbr[0]}`)
		});

		commonReplacements.forEach(abbr => {
			var re = new RegExp(`\\$${abbr[1]}`,"gm");
			a = a.replace(re,`${abbr[0]}`)
		});


		// @Mstep [] add quotes to the keys
		a = a.replace(/([a-zA-Z0-9_]*):/gm,'"$1":')

	}

	return a;

}

function apricityColumnDefaults(obj){
	const crud_types = ["create","read","update","delete"];
	const default_column_options = {
		"query_params":false,
		"url_params":false,
		"body_params":false,
		"susurrus_methods":[],
		"required":false,
		"default":"__VALUE_NOT_SET__",
		"validation": {
			"hash_id":false,
			"boolean":false,
			"ip_address":false,
			"phone_number":false,
			"is_email":false,
			"url":false,
			"regex":null,
			"min_value":null,
			"max_value":null,
			"min_length":null,
			"max_length":null,
			"alpha_numeric_only":false,
			"numeric_only":false,
			"value_options":null,
		},
	}
	if(obj['description'] == undefined) obj['description'] = "";
	if(obj['ct'] == undefined) obj['ct'] = "column";
	if(obj['options'] == undefined) obj['options'] = {};

	crud_types.forEach(crud => {
		if(obj['options'][crud] == undefined) obj['options'][crud] = default_column_options;
		else{
			for (var key in default_column_options) {
				if(key == "validation"){
					if(obj['options'][crud][key] == undefined){
						obj['options'][crud][key] = default_column_options['validation']
					}
					else{
						for (var validation in default_column_options['validation']) {
							if(obj['options'][crud][key][validation] == undefined){
								obj['options'][crud][key][validation] = default_column_options['validation'][validation]
							}
						}
					}
				}
				else{
					if(obj['options'][crud][key] == undefined){
						obj['options'][crud][key] = default_column_options[key]
					}
				}

			}
		}

	});


	var crud_order = [
		"query_params",
		"url_params",
		"body_params",
		"required",
		"default",
		"nullable",
		"susurrus_methods",
		"validation"
	]
	var valid_order = [
		"hash_id",
		"boolean",
		"ip_address",
		"phone_number",
		"is_email",
		"url",
		"regex",
		"min_value",
		"max_value",
		"min_length",
		"max_length",
		"alpha_numeric_only",
		"numeric_only",
		"value_options"
	]

	var newObj = Object.assign({}, obj);
	newObj["options"]={
		"create":Object.assign({}, obj['options']['create']),
		"read":{},
		"update":{},
		"delete":{},
	},


	crud_types.forEach(crud => {
		// console.log(`ordering the crud options ${crud}.`);

		crud_order.forEach(crudO => {
			if(crudO == "validation"){
				// @Mstep [] create the validation key on the crud options object.
				newObj['options'][crud][crudO] = {};

				valid_order.forEach(validO => {
					if(obj['options'][crud][crudO][validO] != undefined){
						// console.log(`standard validation key found: ${validO} => ${obj['options'][crud][crudO][validO]}`);
						newObj['options'][crud][crudO][validO] = obj['options'][crud][crudO][validO]
					}
				})

				for (var key in obj['options'][crud][crudO]) {
					if(valid_order.includes(key) == false){
						console.log(`custom validation key found: ${key} => ${obj['options'][crud][crudO][key]}`);
						newObj['options'][crud][crudO][key] = obj['options'][crud][crudO][key]
					}
				}
			}
			else{

				if(obj['options'][crud][crudO] != undefined){
					newObj['options'][crud][crudO] = obj['options'][crud][crudO]
				}
			}
		})
		// @Mstep [] add all keys not specifically defined in the crud_order
		for (var key in obj['options'][crud]) {
			if(crud_order[key] == undefined){
				newObj['options'][crud][key] = obj['options'][crud][key]
			}
		}




		// crud_order.reverse().forEach(crudO => {
		// 	if(obj['options'][crud][crudO] != undefined){
		// 		newObj['options'][crud][crudO] = obj['options'][crud][crudO]
		// 	}
		// });


		// var new_crud = {
		// 	"query_params":obj['options'][crud]["query_params"],
		// 	"url_params":obj['options'][crud]["url_params"],
		// 	"body_params":obj['options'][crud]["body_params"],
		// 	"required":obj['options'][crud]["required"],
		// 	"susurrus_methods":obj['options'][crud]["susurrus_methods"],
		// 	"validation":obj['options'][crud]["validation"],
		// }
		// obj['options'][crud] = new_crud;
		// for (var key in obj['options'][crud]) {
		// 	if(key == "query_params"){
		// 		obj['options'][crud]
		// 	}
		// }


	});
	obj = newObj;



	return obj;
}


function stripExcessiveSpaces(string){
	// if(Array.isArray(string)){
	// 	var newArray = [];
	// 	string.forEach((element) => {
	// 		if(typeof element == "string"){
	// 			var line = element.replace(/\s+/,'');
	// 			newArray.push(line);
	// 		}else{
	// 			newArray.push(element);
	// 		}
	// 	});
	// 	return newArray;
	// }
	return string.replace(/\s+/,' ');
}

function stripEmptyLines(lines){
	var indices = [];
	lines.forEach((element) => {
		if(element.length > 0){
			indices.push(`${element}`);
		}
	});

	return indices;
}


function toSingleLine(lines){
	var indices = [];
	lines.forEach((element) => {
		indices.push(`${element}`);
	});

	return indices.join('');
}

function minify(lines){
	var newLines = [];
	lines.forEach((element) => {
		newLines.push(stripExcessiveSpaces(element));
	});
	return newLines.join('');
}

function fileToArrayOfLines(editor,keepEmptyLines=false){
	if(editor){
		let document = editor.document;
		var text = document.getText();

		if(keepEmptyLines){
			text = text.replace(/\r?\n/g,'\n__NEW_LINE__')
		}
		var lines = text.split(/\r?\n/);
		// var newLines = [];
		// lines.forEach(element => {
		// 	if(element.length > 0){
		// 		newLines.push(element);
		// 	}
		// });
		return lines;
	}
	return false;
}


function fileOrSelectionToArrayOfLines(editor,keepEmptyLines=false){
	if (!editor) return;

	let rrange;
	let fullDoc = false;
	if (editor.selection.isEmpty) {
		if (editor.document.lineCount === 0) return;
		// No selection: use the whole document
		rrange = new vscode.Range(
			0, 0,
			editor.document.lineCount - 1,
			editor.document.lineAt(editor.document.lineCount - 1).text.length
		);
	} else {
		// Use the selection
		rrange = editor.selection;
		fullDoc=true;
	}
	var text = editor.document.getText(rrange);
	// text = text.replace(/[\n\s]*$/g,'');
	// if(keepEmptyLines && fullDoc == true){
	// 	text = text.replace(/\r?\n/g,'\n__NEW_LINE__')
	// }
	var lines = text.split(/\r?\n/);
	if(keepEmptyLines===false && fullDoc == true){
		var x = []
		for (var i = 0; i < lines.length; i++) {
			if(lines[i].length > 0){
				x.push(lines[i]);
			}
		}
		lines = x;
	}
	return [lines,rrange];
}

function flattenObject(ob,delim=".") {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}


module.exports = {
	activate,
	deactivate
}



function matchCasing(original, replacement) {
    if (!original) return replacement;

    // ALL UPPERCASE
    if (original === original.toUpperCase()) {
        return replacement.toUpperCase();
    }
    // all lowercase
    if (original === original.toLowerCase()) {
        return replacement.toLowerCase();
    }
    // Title Case (First letter uppercase, rest lowercase)
    if (
        original[0] === original[0].toUpperCase() &&
        original.slice(1) === original.slice(1).toLowerCase()
    ) {
        return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }
    // snake_case
    if (/^[a-z0-9_]+$/.test(original) && original.includes('_')) {
        return replacement
            .replace(/([A-Z])/g, '_$1') // handle camelCase/PascalCase input
            .replace(/[\s\-]+/g, '_')   // spaces/dashes to underscores
            .toLowerCase();
    }
    // PascalCase
    if (/^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/.test(original)) {
        return replacement
            .replace(/[_\-\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
            .replace(/^(.)/, (m) => m.toUpperCase());
    }
    // camelCase
    if (/^[a-z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/.test(original)) {
        let pascal = replacement
            .replace(/[_\-\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
            .replace(/^(.)/, (m) => m.toUpperCase());
        return pascal[0].toLowerCase() + pascal.slice(1);
    }
    // fallback: return as-is
    return replacement;
}


function generateUUIDv4() {
    // Generates a RFC4122 version 4 UUID using Math.random (not cryptographically secure)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let selectedLinesStatusBarItem;

function updateSelectedLinesStatusBar() {
    const config = vscode.workspace.getConfiguration('colemenutils');
    if (!config.get('showSelectedLinesStatus', true)) {
        if (selectedLinesStatusBarItem) selectedLinesStatusBarItem.hide();
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        if (selectedLinesStatusBarItem) selectedLinesStatusBarItem.hide();
        return;
    }
    const selections = editor.selections;
    let totalLines = 0;
    selections.forEach(sel => {
        totalLines += sel.end.line - sel.start.line + 1;
    });
    if (!selectedLinesStatusBarItem) {
        selectedLinesStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
        selectedLinesStatusBarItem.command = undefined;
    }
    selectedLinesStatusBarItem.text = `☵ ${totalLines} lines`;
    selectedLinesStatusBarItem.show();
}

vscode.window.onDidChangeTextEditorSelection(updateSelectedLinesStatusBar);
vscode.window.onDidChangeActiveTextEditor(updateSelectedLinesStatusBar);

// Call once on activation
updateSelectedLinesStatusBar();

function mostCommonNonAlphanumeric(str) {
    const counts = {};
    for (const char of str) {
        if (/[^a-zA-Z0-9 \n\r'"]/.test(char)) {
            counts[char] = (counts[char] || 0) + 1;
        }
    }
    let maxChar = null;
    let maxCount = 0;
    for (const [char, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxChar = char;
            maxCount = count;
        }
    }
    return maxChar;
}




//  #     #                                                 #######                                            #####
//  #     # #  ####  #    # #      #  ####  #    # #####       #    #####    ##   # #      # #    #  ####     #     # #####    ##    ####  ######  ####
//  #     # # #    # #    # #      # #    # #    #   #         #    #    #  #  #  # #      # ##   # #    #    #       #    #  #  #  #    # #      #
//  ####### # #      ###### #      # #      ######   #         #    #    # #    # # #      # # #  # #          #####  #    # #    # #      #####   ####
//  #     # # #  ### #    # #      # #  ### #    #   #         #    #####  ###### # #      # #  # # #  ###          # #####  ###### #      #           #
//  #     # # #    # #    # #      # #    # #    #   #         #    #   #  #    # # #      # #   ## #    #    #     # #      #    # #    # #      #    #
//  #     # #  ####  #    # ###### #  ####  #    #   #         #    #    # #    # # ###### # #    #  ####      #####  #      #    #  ####  ######  ####



let trailingSpacesDecorationType;

function getTrailingSpacesDecorationType() {
    const config = vscode.workspace.getConfiguration('colemenutils');
    const color = config.get('trailingSpacesHighlightColor', 'rgba(255,0,0,0.3)');
    return vscode.window.createTextEditorDecorationType({
        backgroundColor: color,
        borderRadius: '2px'
    });
}

function highlightTrailingSpaces() {
    const config = vscode.workspace.getConfiguration('colemenutils');
    if (!config.get('highlightTrailingSpaces', true)) {
        if (trailingSpacesDecorationType && vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.setDecorations(trailingSpacesDecorationType, []);
        }
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Re-create decoration type if color changed
    if (trailingSpacesDecorationType) trailingSpacesDecorationType.dispose();
    trailingSpacesDecorationType = getTrailingSpacesDecorationType();

    const regEx = /[ \t]+$/gm;
    const text = editor.document.getText();
    const decorations = [];
    let match;
    while ((match = regEx.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        decorations.push({ range: new vscode.Range(startPos, endPos) });
    }
    editor.setDecorations(trailingSpacesDecorationType, decorations);
}

// Update highlights on relevant events
vscode.window.onDidChangeActiveTextEditor(highlightTrailingSpaces);
vscode.workspace.onDidChangeTextDocument(highlightTrailingSpaces);
vscode.window.onDidChangeTextEditorSelection(highlightTrailingSpaces);
vscode.workspace.onDidChangeConfiguration(e => {
    if (
        e.affectsConfiguration('colemenutils.highlightTrailingSpaces') ||
        e.affectsConfiguration('colemenutils.trailingSpacesHighlightColor')
    ) {
        highlightTrailingSpaces();
    }
});

// Call once on activation
highlightTrailingSpaces();
















