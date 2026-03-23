const vscode = require('vscode');
const { pad } = require('../helpers/editorHelpers');


// TODO []: (command,dailyContractManager) Add a command to sort the tasks by completion status
// TODO []: (command,dailyContractManager) Add a command to sort the tasks by completion TIMESTAMP (newest to oldest or vice versa)


let _contractSaveTimeout = null;
/** @type {Set<string>} */
let _suppressNextContractSave = new Set();

function isContractMarkdownEditor(editor) {
    if (!editor) return false;

    const doc = editor.document;

    if (doc.languageId !== "markdown") return false;
    if (doc.uri.scheme !== "file") return false;

    const base = (doc.uri.path.split("/").pop() || "").toLowerCase();

    return (
        base.includes("daily contract") ||
        base.includes("weekly contract")
    );
}
async function refreshContractContext() {
    const ok = isContractMarkdownEditor(vscode.window.activeTextEditor);

    await vscode.commands.executeCommand(
        "setContext",
        "colemenutils.isContractMarkdown",
        ok
    );
}


/**
 * Utility Commands Module for ColemenUtils
 * Handles miscellaneous utilities
 */

/**
 * Register all utility commands
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function registerDailyContractCommands(context) {
    registerDailyContractOnSave(context);
    vscode.window.onDidChangeActiveTextEditor(refreshContractContext),
    vscode.workspace.onDidOpenTextDocument(refreshContractContext),
    vscode.workspace.onDidCloseTextDocument(refreshContractContext),
    vscode.workspace.onDidChangeTextDocument((e) => {
        const active = vscode.window.activeTextEditor.document;
        if (active && e.document.uri.toString() === active.uri.toString()) {
            refreshContractContext();
        }
    })

    context.subscriptions.push(
        // vscode.commands.registerCommand('colemenutils.helloWorld', helloWorld),
        vscode.commands.registerCommand('colemenutils.dailyContractSetDate', dailyContractSetDate),
        vscode.commands.registerCommand('colemenutils.dailyContractGenerateSummary', dailyContractGenerateSummary),

    );
}

function formatDateForTodo(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isDailyOrWeeklyContract(document) {
    console.log("document.languageId: ", document.languageId);
    if(document.languageId !== 'markdown') {
        // vscode.window.showErrorMessage('This command only works in markdown files.');
        return false;
    }
    if(!document.fileName.toLowerCase().includes('daily contract') && !document.fileName.toLowerCase().includes('weekly contract')) {
        // vscode.window.showErrorMessage('This command only works in daily/weekly contract files.');
        return false;
    }
    return true;
}


function countTasks(document) {
    // const TODO_REGEX = /(\b(?:-\s*\[\s*\]\s*)?\b(?:TODO|FIXME)\s*|\b(?:TODO|FIXME)\s*\[\s*\])/gi;
    // const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\b)/gi;
    const TODO_REGEX = /(?:(-\s*\[\s*\]\s*)\s*(TODO|FIXME|BUG)\s*|\b(TODO|FIXME|BUG)\s*\[\s*\])/gi;
    const TODO_COMPLETE_REGEX = /(?:-\s*\[[xX]\]\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\]|\bXXX\s*\[\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\])/gi;

    let incompleteTasks = 0;
    let completedTasks = 0;
    let content = document.getText();
    // var completed = TODO_COMPLETE_REGEX.exec(content)
    // var completed = [...content.matchAll(TODO_COMPLETE_REGEX)].length
    // var incomplete = TODO_REGEX.exec(content)
    if(typeof content === "string"){
        ;
        completedTasks = [...content.matchAll(TODO_COMPLETE_REGEX)].length;
        incompleteTasks = [...content.matchAll(TODO_REGEX)].length;
    }

    return {
        total_tasks:incompleteTasks + completedTasks,
        incomplete: incompleteTasks,
        complete: completedTasks,
    };
}

// /**
//  * Display hello world message
//  */
// async function helloWorld() {
//     vscode.window.showInformationMessage('Hello World from ColemenUtils!');
// }

/**
 * Locate the line starting with "date:" in the current markdown file and update
 * it to today's date in YYYY-MM-DD format.
 * Only works in files with "daily contract" or "weekly contract" in the filename.
 */
async function dailyContractSetDate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    if(isDailyOrWeeklyContract(document) === false) return;
    // if(document.languageId !== 'markdown') {
    //     vscode.window.showErrorMessage('This command only works in markdown files.');
    //     return;
    // }
    // if(!document.fileName.toLowerCase().includes('daily contract') && !document.fileName.toLowerCase().includes('weekly contract')) {
    //     vscode.window.showErrorMessage('This command only works in daily/weekly contract files.');
    //     return;
    // }

    const edits = [];

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.text.toLowerCase().includes('date:')) {
            console.log("Found date line: " + line.text);
            const indentation = line.text.match(/^\s*/)[0];
            const newText = indentation + 'date: ' + formatDateForTodo(new Date());
            edits.push({
                range: line.range,
                text: newText
            });
        }

    }

    if (edits.length > 0) {
        await editor.edit(editBuilder => {
            edits.forEach(edit => {
                editBuilder.replace(edit.range, edit.text);
            });
        });
        // vscode.window.showInformationMessage(`Updated Daily Contract Date.`);
    } else {
        // vscode.window.showInformationMessage('No console.log lines found to comment.');
    }
}


function genSingleSummaryLine(line,label,value,edits){
    if(!line.text.toLowerCase().includes(label)) edits;
    var text = line.text.toLowerCase();
    if(text.match(new RegExp(`^\\s*${label}\\s*:\\s*\\d*`, 'gi'))) {
        const indentation = line.text.match(/^\s*/)[0];
        const subIndent = line.text.match(new RegExp(`^\\s*${label}(\\s*)`, 'i'))[1];
        var newLine = indentation + label + subIndent + ": " + value;
        edits.push({
            range: line.range,
            text: newLine
        });
        // return {
            // range: line.range,
            // text: newLine
        // }
    }
    return edits;
}

async function dailyContractGenerateSummary() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    if(isDailyOrWeeklyContract(document) === false) return;

    var taskCounts = countTasks(document);
    // console.log("Task counts: ", taskCounts);


    if(document.getText().includes("## Summary") === false) {
        var appendContent = ["## Summary", `total_tasks: ${taskCounts.total_tasks}`, `complete_tasks: ${taskCounts.complete}`, `incomplete_tasks: ${taskCounts.incomplete}`, `completion: ${Math.round((taskCounts.complete / (taskCounts.total_tasks || 1)) * 100)}%`].join('\n');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(document.lineCount, 0), '\n' + appendContent);
        });
        return;
    }

    var edits = [];

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        // var text = line.text.toLowerCase();

        edits = genSingleSummaryLine(line,'complete_tasks', taskCounts.complete,edits);
        edits = genSingleSummaryLine(line,'total_tasks', taskCounts.total_tasks,edits);
        edits = genSingleSummaryLine(line,'incomplete_tasks', taskCounts.incomplete,edits);
        edits = genSingleSummaryLine(line,'completion', Math.round((taskCounts.complete / (taskCounts.total_tasks || 1)) * 100) + '%',edits);

    }

    if (edits.length > 0) {
        await editor.edit(editBuilder => {
            edits.forEach(edit => {
                editBuilder.replace(edit.range, edit.text);
            }, {
                undoStopBefore: false,
                undoStopAfter: false
            });
        });
        // vscode.window.showInformationMessage(`Updated Daily Contract Date.`);
    } else {
        // vscode.window.showInformationMessage('No tasks lines found in contract.');
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
/**
 * @param {vscode.ExtensionContext} context
 */
function registerDailyContractOnSave(context) {
    const disposable = vscode.workspace.onDidSaveTextDocument(async (doc) => {
        try {
            // Only markdown daily/weekly contracts
            if (doc.languageId !== "markdown") return;
            if (doc.uri.scheme !== "file") return;

            const baseName = (doc.uri.path.split("/").pop() || "").toLowerCase();
            const isDaily = baseName.includes("daily contract");
            const isWeekly = baseName.includes("weekly contract");
            if (!isDaily && !isWeekly) return;

            const uriStr = doc.uri.toString();

            // Prevent infinite loop: if we just re-saved due to our own edit, ignore once
            if (_suppressNextContractSave.has(uriStr)) {
                _suppressNextContractSave.delete(uriStr);
                return;
            }

            // Debounce: multiple rapid saves -> one summary update
            clearTimeout(_contractSaveTimeout);
            _contractSaveTimeout = setTimeout(async () => {
                try {
                    // Ensure we operate on the *active* editor for that doc (your command uses activeTextEditor)
                    const editor = vscode.window.visibleTextEditors.find(
                        (e) => e.document.uri.toString() === uriStr
                    );

                    // If not currently visible, don't try to mutate via editor.edit (your implementation relies on editor)
                    if (!editor) return;

                    // Temporarily make it active so your command works without refactor
                    await vscode.window.showTextDocument(editor.document, editor.viewColumn, true);

                    // Run summary generation (this will dirty the buffer)
                    await vscode.commands.executeCommand("colemenutils.dailyContractGenerateSummary");

                    // If we changed the doc, save it immediately so the tab doesn't stay dirty
                    if (editor.document.isDirty) {
                        _suppressNextContractSave.add(uriStr);
                        await editor.document.save();
                    }
                } catch (err) {
                    console.error("dailyContract post-save summary+resave failed", err);
                }
            }, 150);
        } catch (err) {
            console.error("dailyContract onSave failed", err);
        }
    });

    context.subscriptions.push(disposable);
}
// function registerDailyContractOnSave(context) {
//   const disposable = vscode.workspace.onDidSaveTextDocument(async (doc) => {
//     try {
//       // Only markdown
//       if (doc.languageId !== "markdown") return;

//       // Only real files (skip untitled / virtual schemes)
//       if (doc.uri.scheme !== "file") return;

//       const baseName = (doc.uri.path.split("/").pop() || "").toLowerCase();

//       // Only files whose name includes these phrases
//       const isDaily = baseName.includes("daily contract");
//       const isWeekly = baseName.includes("weekly contract");
//       if (!isDaily && !isWeekly) return;

//       // Run your command
//       await vscode.commands.executeCommand("colemenutils.dailyContractGenerateSummary", {
//         uri: doc.uri.toString(),
//       });
//     } catch (err) {
//       console.error("dailyContract onSave failed", err);
//     }
//   });

//   context.subscriptions.push(disposable);
// }





module.exports = {
    registerDailyContractCommands
};