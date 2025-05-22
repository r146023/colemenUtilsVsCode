
	let prepApricityComment = vscode.commands.registerCommand('colemenutils.prepApricityComment', function () {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			let document = editor.document;
			const documentText = document.getText();

			// let ColemenUtils = vscode.window.createOutputChannel("ColemenUtils");
            var a = documentText.replace("params","p")
            // Strip quotes from around the keys
            a = a.replaceAll(/\"([a-zA-Z0-9_\s]*)\":/,"$1:")
            a = a.replaceAll(/susurrus_methods:\s*\[\],?/," ")
            a = a.replaceAll("true","1")
            a = a.replaceAll("false","0")
            a = a.replaceAll(/"forms":\s*\[\]/," ")
            a = a.replaceAll(/"required":\s*0/," ")
            // //Split the document by new lines
			// commaSplitText = commaSplitText.replace(/[\n]{2,}/g,"\n")
            // const result = commaSplitText.split(/\r?\n/);
			// var lines = fileToArrayOfLines(editor);
			// lines = [...new Set(lines)];
			
			
			// var indices = [];
			// lines.forEach((element) => {
			// 	indices.push(element.replace(/\s$/,""))
				
			// // 	if(element.length > 0 && element != " "){
			// // 		if(!indices.includes(`${element}`)){
			// // 			indices.push(`${element}`);
			// // 		}
			// // 	}
			// });

			// let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
			// var output_string = `${indices.join(',')}`;
			// output_string = output_string.replace(/[,]{2,}/g,",")
			
			const workEdits = new vscode.WorkspaceEdit();
			workEdits.set(document.uri, [vscode.TextEdit.replace(range,a)]); // give the edits
			vscode.workspace.applyEdit(workEdits)
			// ColemenUtils.appendLine(`Converting new lines to an array without formatting.`);
		}
	});
	context.subscriptions.push(prepApricityComment);