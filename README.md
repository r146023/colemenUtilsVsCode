# colemenutils README

This is just a quick extension of various commands, snippets and keybindings that I find useful.

## Commands

### Line Sorting
You can sort the lines of a file using commands or the context menu

- Shuffle Lines
- Sort Alphabetically A-Z
- Sort Alphabetically Z-A
- Sort by length large to small
- Sort by length small to large
![alt text](20250521183528.gif)


By Default it will keep the formatting of spaces in the document, you can shut that off if you want. 

Numbers are also sorted, you can specify if they should be before or after the alphabetic items.


---

### Lines to Array of Strings
This will convert each line of the file into an indice of an array and wrap each element in quotes.

---

### Lines to Array without formatting
This will convert each line of the file into an indice of an array without adding quotes to each element like "Lines to Array of Strings".

---

### Convert the lines to a comma delimited unique list
Very similar to **Lines to Array without formatting** except this will keep only unique lines and create a list from them.


### Insert UUID
Generate a random UUID for every cursor.

![alt text](20250521181319.gif)


---

## **Formatting Commands**


### Reverse Windows Paths
This will locate any windows file paths on the current line and reverse the slashes within it.

```
Z:\Structure\Ra9\2022\22-0026 - colemenVsCodeExtension\colemenutils

Z:/Structure/Ra9/2022/22-0026 - colemenVsCodeExtension/colemenutils
```

---


### Escape All Single Backslashes
Replace all single backslashes '\\' in the file with a double backslash '\\\\'

---


### Lines to Array of Typed Values

Take each line of the file and concatenate them into a square bracketed array.

This will wrap strings in quotes and keep numbers and booleans as they were.

![alt text](20250521180657.gif)

---

### Explode by Delimiter
Finds the most commonly occuring non-alphanumeric character and splits the file by it.

It ignores spaces, newlines, carriage returns, double and single quotes.

Delimiters that are wrapped within quotes, like "daphne, you bitch" will be ignored as well.
You can also escape the delimiter by doubling it:

> one waffle, two waffle, red waffle, blue waffle => one waffle,, two waffle,, red waffle,, blue waffle

![alt text](20250521175300~1.gif)

---

### Escape Selected Single Backslashes
Replace all single backslashes '\\' with a double backslash '\\\\' in the currently selected text.

---

### Single to Double quotes
Replace all single Qutoes `'` with double quotes `"` in the file.

---





### Strip empty lines from the document
Remove all empty lines from the file.

![alt text](20250521185004.gif)


---

### Strip & Highlight Trailing Spaces

![alt text](20250521184552.gif)

---

### Collapse to Single Line
Remove all new lines from the file, so it will be a single line.

---

### Minify File
Inspired by the Simple Minifier extension, this will make the file smaller in the simplest possible way by removing all new lines and replaces multiple consecutive spaces with a single space.

---

### Delete trailing spaces
Remove trailing spaces from all lines in the file.

---

### Keep Unique
Keep only the unique lines in the file.

---

### Keep Unique from Selected
Keep only the unique lines from the selection.

---
### Delete trailing spaces
Remove spaces from the end of all lines in the document.






.

---
---
## SVG Files

### [SVG] Format an SVG file to be less shitty
This will modify an SVG file to remove superfluous tags and nesting, its not perfect and will miss stuff occasionally.
But it is very handy for minimizing the amount of text in an SVG.

---

### [SVG] Capture SVG Viewbox value
This will locate the viewbox property of an SVG and copy it to the clipboard.

---

### [SVG] Capture SVG body value.
This will locate the body of an SVG and copy it to the clipboard.



### **Sorting**
---

`Sort All Lines Alphabetically A-Z`\
Sort every line in the file alphabetically from a to z.

Sort Selected Lines A-Z`\
Sort the selected lines in alphabetical order from a to z.

---
``

`Sort Selected Lines Alphabetically Z-A (Reversed)`\
Sort the selected lines in reverse alphabetical order from z to a.


`Sort All Lines Alphabetically Z-A (Reversed)`\
Sort every line in the file in reverse alphabetical order from z to a.

---

`Sort All Lines By Length Large to Small`\
Sort every line in the file by length from largest to smallest.

`Sort Selected Lines By Length Large to Small`\
Sort selected lines by length from largest to smallest.

---

`Sort All Lines By Length Small to Large`\
Sort every line in the file by length from smallest to largest.

`Sort Selected Lines By Length Small to Large`\
Sort selected lines by length from smallest to largest.

---



## Keybindings

### General Keybindings

- **Ctrl+Shift+Delete** – Remove all content from the current line, but keep the line and cursor position unchanged.
- **Ctrl+D** – Duplicate the current selection or line.
- **Ctrl+Q** – Toggle line comment on the current line or selection.
- **Ctrl+L** – Expand the selection to the entire line.
- **Alt+Shift+I** – Select all occurrences of the current selection in the editor and, if in a notebook, select all find matches as well.
- **Alt+Shift+Tab** – Move to the previous selection match.
- **Ctrl+Tab** – Move to the next selection match.


- **Alt+Shift+U** – Transform the selected text to uppercase.
- **Ctrl+U** – Transform the selected text to lowercase.

- **Alt+0** – Fold all regions in the editor.
- **Shift+Alt+0** – Unfold all regions in the editor.

### Markdown Keybindings

- **Ctrl+B** – Wrap the selected text in `**` to make it bold. If no text is selected, inserts `****` and places the cursor in the middle.
- **Ctrl+I** – Wrap the selected text in `*` to make it italic. If no text is selected, inserts `**` and places the cursor in the middle.
- **Ctrl+Up** – Add a `#` to the beginning of the current line (Markdown header).
- **Ctrl+Down** – Remove a `#` from the beginning of the current line (Markdown header).

**Ctrl+Shift+B** – Toggles a Markdown block quote (`> `) at the start of each selected line.  
If a line already starts with `> `, it removes one level of block quote (supports nested block quotes).  
If not, it adds `> ` at the start. Works with multiple lines and selections.

### Line Manipulation

- **Ctrl+Shift+Up** – Move the current line or selection up.
- **Ctrl+Shift+Down** – Move the current line or selection down.












## Keybindings


### General Keybindings


### [General] Clear Current Line
**control+Shift+Delete** – Remove all content from the current line, but keep the line and cursor position unchanged.

### [General] Select All Highlights
**alt+shift+i** – Selects all occurrences of the current selection in the editor and, if in a notebook, selects all find matches as well.





---

### Markdown Keybindings

### [MD] Add Header
**control+up** - Add a `#` to the beginning of the current line

---

### [MD] Remove Header
**control+down** - Remove a `#` from beginning of the current line

---

### [MD] Bold
**control+b** - Wrap the selected text in `**` to make it bold.

---

### [MD] Italic
**control+i** - Wrap the selected text in `*` to make it bold.




Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:



> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

This extension does not have any requirements or dependencies.

---

## Extension Settings

This extension currently does not have any settings.

---

## Known Issues

Nope

---

## Release Notes

This is the first release of the extension.




##
To compile a package to the vsix use the command : vsce package
to install the vsix : 