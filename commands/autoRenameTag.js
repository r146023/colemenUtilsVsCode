


// THIS STILL NEEDS WORK!!!



























// const vscode = require('vscode');

// /**
//  * Auto Rename Tag Module for ColemenUtils
//  * Automatically renames paired HTML/XML tags when one is edited
//  */

// let isRenaming = false;
// let lastChange = null;

// /**
//  * Register auto rename tag functionality
//  * @param {vscode.ExtensionContext} context - VS Code extension context
//  */
// function registerAutoRenameTag(context) {
//     // Register the document change listener
//     const documentChangeListener = vscode.workspace.onDidChangeTextDocument(handleDocumentChange);
    
//     // Register commands for manual control
//     context.subscriptions.push(
//         documentChangeListener,
//         vscode.commands.registerCommand('colemenutils.enableAutoRenameTag', enableAutoRenameTag),
//         vscode.commands.registerCommand('colemenutils.disableAutoRenameTag', disableAutoRenameTag),
//         vscode.commands.registerCommand('colemenutils.toggleAutoRenameTag', toggleAutoRenameTag),
//         vscode.commands.registerCommand('colemenutils.renameTag', manualRenameTag)
//     );
// }

// /**
//  * Handle document changes
//  */
// async function handleDocumentChange(event) {
//     // Skip if disabled, currently renaming, or unsupported file
//     if (!isAutoRenameEnabled() || isRenaming || !isSupportedFileType(event.document.languageId)) {
//         return;
//     }

//     // Only process small changes (typical of tag editing)
//     if (event.contentChanges.length !== 1) return;
    
//     const change = event.contentChanges[0];
    
//     // Skip large changes (paste, etc.)
//     if (change.text.length > 10 || change.rangeLength > 10) return;

//     // Faster debounce for better responsiveness
//     clearTimeout(lastChange);
//     lastChange = setTimeout(async () => {
//         await processDocumentChange(event.document);
//     }, 50); // Reduced to 50ms for faster response
// }

// /**
//  * Debug version of processDocumentChange
//  */
// async function processDocumentChange(document) {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor || editor.document !== document) {
//         console.log('No editor or document mismatch');
//         return;
//     }

//     const position = editor.selection.active;
//     console.log('Cursor position:', position.line, position.character);
    
//     const tagInfo = findTagAtPosition(document, position);
//     console.log('Found tag info:', tagInfo);
    
//     if (tagInfo) {
//         console.log('Updating matching tag for:', tagInfo.tagName);
//         await updateMatchingTag(document, tagInfo);
//     } else {
//         console.log('No tag found at cursor position');
//     }
// }

// /**
//  * Find tag information at current cursor position
//  */
// function findTagAtPosition(document, position) {
//     try {
//         const line = document.lineAt(position.line);
//         const lineText = line.text;
//         const cursorPos = position.character;
        
//         // Check if cursor is inside a tag name
//         // Look for opening tag pattern: <tagname
//         const openingTagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)/g;
//         let match;
        
//         while ((match = openingTagRegex.exec(lineText)) !== null) {
//             const tagStart = match.index + 1; // After '<'
//             const tagEnd = tagStart + match[1].length;
            
//             // Check if cursor is within the tag name
//             if (cursorPos >= tagStart && cursorPos <= tagEnd) {
//                 return {
//                     tagName: match[1],
//                     isClosingTag: false,
//                     lineNumber: position.line,
//                     startChar: tagStart,
//                     endChar: tagEnd
//                 };
//             }
//         }
        
//         // Look for closing tag pattern: </tagname
//         const closingTagRegex = /<\/([a-zA-Z][a-zA-Z0-9-]*)/g;
        
//         while ((match = closingTagRegex.exec(lineText)) !== null) {
//             const tagStart = match.index + 2; // After '</'
//             const tagEnd = tagStart + match[1].length;
            
//             // Check if cursor is within the tag name
//             if (cursorPos >= tagStart && cursorPos <= tagEnd) {
//                 return {
//                     tagName: match[1],
//                     isClosingTag: true,
//                     lineNumber: position.line,
//                     startChar: tagStart,
//                     endChar: tagEnd
//                 };
//             }
//         }
        
//         return null;
//     } catch (error) {
//         console.log('Error finding tag at position:', error);
//         return null;
//     }
// }

// /**
//  * Simplified updateMatchingTag
//  */
// async function updateMatchingTag(document, tagInfo) {
//     const text = document.getText();
//     let matchingTagInfo = null;
    
//     if (tagInfo.isClosingTag) {
//         matchingTagInfo = findMatchingOpeningTag(text, tagInfo);
//     } else {
//         matchingTagInfo = findMatchingClosingTag(text, tagInfo);
//     }
    
//     console.log('Found matching tag:', matchingTagInfo);
    
//     if (matchingTagInfo) {
//         console.log(`Renaming ${matchingTagInfo.tagName} to ${tagInfo.tagName}`);
//         await performTagRename(document, matchingTagInfo, tagInfo.tagName);
//     }
// }

// /**
//  * Find matching closing tag (CORRECTED LOGIC)
//  */
// function findMatchingClosingTag(text, openingTagInfo) {
//     const lines = text.split('\n');
//     let depth = 1; // Start with 1 because we're looking for the match to our opening tag
    
//     console.log(`Looking for closing tag to match opening on line ${openingTagInfo.lineNumber}`);
    
//     // Search forwards from the line AFTER the opening tag
//     for (let i = openingTagInfo.lineNumber + 1; i < lines.length; i++) {
//         const line = lines[i];
//         console.log(`Checking line ${i}: ${line}`);
        
//         // Count opening tags on this line (increases depth)
//         const openingTags = line.match(/<([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g);
//         if (openingTags) {
//             const realOpeningTags = openingTags.filter(tag => 
//                 !tag.includes('</') && !tag.endsWith('/>')
//             );
//             depth += realOpeningTags.length;
//             console.log(`Found ${realOpeningTags.length} opening tags, depth now: ${depth}`);
//         }
        
//         // Count closing tags on this line (decreases depth)
//         const closingTags = line.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/g);
//         if (closingTags) {
//             console.log(`Found ${closingTags.length} closing tags`);
            
//             for (const closingTag of closingTags) {
//                 depth--;
//                 console.log(`Processing closing tag, depth now: ${depth}`);
                
//                 if (depth === 0) {
//                     // This is our matching closing tag!
//                     const tagMatch = closingTag.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)/);
//                     console.log(`✅ Found matching closing tag: ${tagMatch[1]} on line ${i}`);
//                     return {
//                         tagName: tagMatch[1],
//                         isClosingTag: true,
//                         lineNumber: i
//                     };
//                 }
//             }
//         }
//     }
    
//     console.log('No matching closing tag found');
//     return null;
// }

// /**
//  * Find matching opening tag with proper nesting support
//  */
// function findMatchingOpeningTag(text, closingTagInfo) {
//     const lines = text.split('\n');
//     let depth = 0; // Track nesting depth
    
//     console.log(`Looking for opening tag to match closing on line ${closingTagInfo.lineNumber}`);
    
//     // Search backwards from closing tag line
//     for (let i = closingTagInfo.lineNumber; i >= 0; i--) {
//         const line = lines[i];
//         console.log(`Checking line ${i}: ${line}`);
        
//         // Count all closing tags on this line
//         const allClosingTags = line.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/g);
//         if (allClosingTags) {
//             depth += allClosingTags.length;
//             console.log(`Found ${allClosingTags.length} closing tags, depth now: ${depth}`);
//         }
        
//         // Count all opening tags on this line
//         const allOpeningTags = line.match(/<([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g);
//         if (allOpeningTags) {
//             // Filter out self-closing tags and closing tags
//             const realOpeningTags = allOpeningTags.filter(tag => 
//                 !tag.includes('</') && !tag.endsWith('/>')
//             );
//             console.log(`Found ${realOpeningTags.length} opening tags`);
            
//             for (const openingTag of realOpeningTags) {
//                 depth--;
//                 console.log(`Depth now: ${depth}`);
                
//                 if (depth === 0) {
//                     // This is our matching opening tag
//                     const tagMatch = openingTag.match(/<([a-zA-Z][a-zA-Z0-9-]*)/);
//                     console.log(`Found matching opening tag: ${tagMatch[1]} on line ${i}`);
//                     return {
//                         tagName: tagMatch[1],
//                         isClosingTag: false,
//                         lineNumber: i
//                     };
//                 }
//             }
//         }
//     }
    
//     console.log('No matching opening tag found');
//     return null;
// }

// /**
//  * Get the original tag info by finding what was actually in the document
//  */
// function getOriginalTagInfo(document, modifiedTagInfo) {
//     // For now, let's try a simpler approach - search for any tag pattern
//     const line = document.lineAt(modifiedTagInfo.lineNumber);
//     const lineText = line.text;
    
//     if (modifiedTagInfo.isClosingTag) {
//         // For closing tags, find the actual tag name in the line
//         const match = lineText.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)/);
//         if (match) {
//             return {
//                 ...modifiedTagInfo,
//                 tagName: match[1]
//             };
//         }
//     } else {
//         // For opening tags, find the actual tag name in the line
//         const match = lineText.match(/<([a-zA-Z][a-zA-Z0-9-]*)/);
//         if (match) {
//             return {
//                 ...modifiedTagInfo,
//                 tagName: match[1]
//             };
//         }
//     }
    
//     return modifiedTagInfo;
// }

// /**
//  * Perform the actual tag rename
//  */
// async function performTagRename(document, targetTag, newTagName) {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor || editor.document !== document) return;

//     isRenaming = true;

//     try {
//         const line = document.lineAt(targetTag.lineNumber);
//         let newLineText;
        
//         if (targetTag.isClosingTag) {
//             // Replace closing tag
//             newLineText = line.text.replace(
//                 new RegExp(`<\\/${targetTag.tagName}(\\s*>)`),
//                 `</${newTagName}$1`
//             );
//         } else {
//             // Replace opening tag
//             newLineText = line.text.replace(
//                 new RegExp(`<${targetTag.tagName}(\\s|>)`),
//                 `<${newTagName}$1`
//             );
//         }
        
//         if (newLineText !== line.text) {
//             await editor.edit(editBuilder => {
//                 editBuilder.replace(line.range, newLineText);
//             });
//         }
        
//     } catch (error) {
//         console.log('Error performing tag rename:', error);
//     } finally {
//         setTimeout(() => {
//             isRenaming = false;
//         }, 100);
//     }
// }

// /**
//  * Manual rename tag command
//  */
// async function manualRenameTag() {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) {
//         vscode.window.showWarningMessage('No active editor found');
//         return;
//     }

//     const document = editor.document;
    
//     if (!isSupportedFileType(document.languageId)) {
//         vscode.window.showWarningMessage('Auto rename tag is not supported for this file type');
//         return;
//     }

//     const position = editor.selection.active;
//     const tagInfo = findTagAtPosition(document, position);
    
//     if (!tagInfo) {
//         vscode.window.showWarningMessage('Place cursor inside a tag name to rename it');
//         return;
//     }

//     const newTagName = await vscode.window.showInputBox({
//         prompt: `Enter new tag name (currently: ${tagInfo.tagName})`,
//         value: tagInfo.tagName,
//         validateInput: (value) => {
//             if (!value || !value.trim()) {
//                 return 'Tag name cannot be empty';
//             }
//             if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(value.trim())) {
//                 return 'Invalid tag name';
//             }
//             return null;
//         }
//     });

//     if (!newTagName || newTagName === tagInfo.tagName) {
//         return;
//     }

//     await performBothTagRename(document, tagInfo, newTagName.trim());
//     vscode.window.showInformationMessage(`Renamed "${tagInfo.tagName}" to "${newTagName}"`);
// }

// /**
//  * Rename both tags manually
//  */
// async function performBothTagRename(document, currentTag, newTagName) {
//     isRenaming = true;
    
//     try {
//         const text = document.getText();
//         let matchingTag = null;
        
//         if (currentTag.isClosingTag) {
//             matchingTag = findMatchingOpeningTag(text, currentTag);
//         } else {
//             matchingTag = findMatchingClosingTag(text, currentTag);
//         }
        
//         // Rename current tag
//         await performTagRename(document, currentTag, newTagName);
        
//         // Rename matching tag if found
//         if (matchingTag) {
//             await performTagRename(document, matchingTag, newTagName);
//         }
        
//     } finally {
//         setTimeout(() => {
//             isRenaming = false;
//         }, 200);
//     }
// }

// // ============================================================================
// // UTILITY FUNCTIONS
// // ============================================================================

// /**
//  * Check if auto rename is enabled
//  */
// function isAutoRenameEnabled() {
//     const config = vscode.workspace.getConfiguration('colemenutils');
//     return config.get('autoRenameTag.enabled', true);
// }

// /**
//  * Check if file type is supported
//  */
// function isSupportedFileType(languageId) {
//     const supportedTypes = [
//         'html', 'xml', 'xhtml', 'svg',
//         'javascript', 'javascriptreact', 'jsx',
//         'typescript', 'typescriptreact', 'tsx',
//         'vue', 'php', 'erb', 'handlebars'
//     ];
//     return supportedTypes.includes(languageId);
// }

// /**
//  * Enable auto rename tag
//  */
// async function enableAutoRenameTag() {
//     const config = vscode.workspace.getConfiguration('colemenutils');
//     await config.update('autoRenameTag.enabled', true, vscode.ConfigurationTarget.Global);
//     vscode.window.showInformationMessage('Auto Rename Tag enabled');
// }

// /**
//  * Disable auto rename tag
//  */
// async function disableAutoRenameTag() {
//     const config = vscode.workspace.getConfiguration('colemenutils');
//     await config.update('autoRenameTag.enabled', false, vscode.ConfigurationTarget.Global);
//     vscode.window.showInformationMessage('Auto Rename Tag disabled');
// }

// /**
//  * Toggle auto rename tag
//  */
// async function toggleAutoRenameTag() {
//     const config = vscode.workspace.getConfiguration('colemenutils');
//     const isEnabled = config.get('autoRenameTag.enabled', true);
//     await config.update('autoRenameTag.enabled', !isEnabled, vscode.ConfigurationTarget.Global);
//     vscode.window.showInformationMessage(`Auto Rename Tag ${!isEnabled ? 'enabled' : 'disabled'}`);
// }

// module.exports = {
//     registerAutoRenameTag
// };