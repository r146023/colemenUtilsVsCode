# colemenutils README

This is simply an extension of various commands, snippets and keybindings that I find useful.


## Commands



### Hashing & Encoding

| Title                 | Description                                         | Command ID                        |
| --------------------- | --------------------------------------------------- | --------------------------------- |
| Hash Selection        | Hash selected text using the default algorithm. | colemenutils.defaultHashSelection |
| MD5 Hash Selection    | Hash selected text using MD5.                   | colemenutils.md5HashSelection     |
| SHA512 Hash Selection | Hash selected text using SHA512.                | colemenutils.sha512HashSelection  |
| SHA1 Hash Selection   | Hash selected text using SHA1.                  | colemenutils.sha1HashSelection    |
| SHA256 Hash Selection | Hash selected text using SHA256.                | colemenutils.sha256HashSelection  |
| Base64 Encode/Decode  | Encode or decode the selected text as Base64.       | colemenutils.base64EncodeDecode   |

---

### SVG Utilities

| Title                     | Description                                     | Command ID                          |
| ------------------------- | ----------------------------------------------- | ----------------------------------- |
| Format SVG Content        | Reformat SVG content for better readability.    | colemenutils.FormatSVGContentCMD    |
| Capture SVG Viewbox Value | Extract the viewBox attribute from SVG content. | colemenutils.CaptureSVGViewboxValue |
| Capture SVG Body Value    | Extract the body content from SVG.              | colemenutils.CaptureSVGBody         |

---

### Markdown & Text Formatting

| Title                     | Description                                                      | Command ID                          |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| Toggle Block Quote        | Toggle block quote formatting for the selected lines (Markdown). | colemenutils.toggleBlockQuote       |
| Add Markdown Header       | Add a Markdown header to the current line or selection.          | colemenutils.addMarkdownHeader      |
| Remove Markdown Header    | Remove a Markdown header from the current line or selection.     | colemenutils.removeMarkdownHeader   |
| Convert to ASCII Banner   | Convert the selected text to an ASCII art banner.                | colemenutils.asciiBanner            |
| Insert Box Header         | Insert a box header.                                             | colemenutils.insertBoxHeader        |
| Insert Single Line Header | Insert a single line header.                                     | colemenutils.insertSingleLineHeader |

---

### Line & Array Utilities

| Title                                                        | Description                                                 | Command ID                              |
| ------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------- |
| Lines to Array of Strings                                    | Convert each line to a quoted string in an array.           | colemenutils.LinesToStringArray         |
| [Lines to Array of Typed Values](#linestoarrayoftypedvalues) | Convert each line to a typed value in an array.             | colemenutils.LinesToFormattedArray      |
| Lines to Image Tag Array                                     | Convert each line to an image tag in an array.              | colemenutils.LinesToImageTag            |
| Image Tags to Lines                                          | Convert image tag array back to lines.                      | colemenutils.ImageTagsToLinesCMD        |
| Lines to Array (no formatting)                               | Convert lines to an array without quotes.                   | colemenutils.linesToArray               |
| Lines to Unique Delimited List                               | Convert lines to a unique, delimited list.                  | colemenutils.linesToListDelimiterUnique |
| Lines to Delimited List                                      | Convert lines to a delimited list.                          | colemenutils.linesToListDelimiter       |
| [Explode by Delimiter](#ExplodeByDelimiter)                  | Split the selected text by a delimiter into multiple lines. | colemenutils.explodeByDelim             |

---

### Sorting & Shuffling

| Title                              | Description                                     | Command ID                        |
| ---------------------------------- | ----------------------------------------------- | --------------------------------- |
| Sort Alphabetically A-Z            | Sort lines alphabetically (A-Z).                | colemenutils.sortLines            |
| Sort Alphabetically Z-A (Reversed) | Sort lines alphabetically (Z-A).                | colemenutils.sortLinesReversed    |
| Sort By Length Small to Large      | Sort lines by length (shortest to longest).     | colemenutils.sortByLength         |
| Sort By Length Large to Small      | Sort lines by length (longest to shortest).     | colemenutils.sortByLengthReversed |
| Shuffle Lines                      | Shuffle the lines in the document or selection. | colemenutils.shuffleLines         |

---

### Whitespace & Cleanup

| Title                                         | Description                                       | Command ID                          |
| --------------------------------- | ------------------------------------------------- | ----------------------------------- |
| [Strip Empty Lines](#stripEmptyLines)         | Remove all empty lines from the document.         | colemenutils.stripEmptyLines        |
| [Strip Trailing Spaces](#striptrailingspaces) | Remove trailing spaces from each line.            | colemenutils.stripTrailingSpaces    |
| Strip Excessive Spaces     | Replace multiple spaces with a single space.      | colemenutils.stripExcessiveSpaces   |
| Keep Unique                | Remove duplicate lines, keeping only unique ones. | colemenutils.stripDuplicateLines    |
| Keep Unique Selected       | Remove duplicate lines from the selection.        | colemenutils.stripSelectedDuplicate |

---

### Selection & Line Editing

| Title                         | Description                                                     | Command ID                                |
| ----------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| Select Current Line           | Select the entire current line(s).                              | colemenutils.selectCurrentLine            |
| Clear Current Line            | Clear the content of the current line(s).                       | colemenutils.clearCurrentLine             |
| Format Component to Multiline | Format a JSX component to have each property on its own line.   | colemenutils.ComponentToMultiLine         |
| Reverse Windows Paths         | Replace forward slashes with backslashes in Windows file paths. | colemenutils.reverseSlashesInWindowsPaths |
| Apply New Lines to File       | Insert new lines into the file at specified positions.          | colemenutils.applyNewLines                |
| Collapse to Single Line       | Collapse the selection or document to a single line.            | colemenutils.toSingleLine                 |
| Minify File                   | Minify the current file content.                                | colemenutils.minifyFile                   |

---

### Quoting & Escaping

| Title                                  | Description                                                 | Command ID                                 |
| -------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Escape All Single Backslashes (\)      | Escape all single backslashes in the selection or document. | colemenutils.escapeAllSingleBackSlash      |
| Escape Selected Single Backslashes (\) | Escape single backslashes in the selection.                 | colemenutils.escapeSelectedSingleBackSlash |
| Single to Double Quotes                | Convert single quotes to double quotes in the selection.    | colemenutils.singleToDoubleQuote           |

---

### Other Utilities

| Title                      | Description                                          | Command ID                          |
| -------------------------- | ---------------------------------------------------- | ----------------------------------- |
| Comment Console Log Calls  | Comment out all `console.log` calls in the document. | colemenutils.commentConsoleLogLines |
| [Insert UUID](#InsertUUID) | Insert a new UUID at the cursor position.            | colemenutils.insertUUIDs            |

















### Line Sorting
You can sort the lines of a file using commands or the context menu

- Shuffle Lines
- Sort Alphabetically A-Z
- Sort Alphabetically Z-A
- Sort by length large to small
- Sort by length small to large



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


### Insert UUID {#InsertUUID}
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


### Lines to Array of Typed Values {#linestoarrayoftypedvalues}

Take each line of the file and concatenate them into a square bracketed array.

This will wrap strings in quotes and keep numbers and booleans as they were.

![alt text](20250521180657.gif)

---

### Explode by Delimiter {#ExplodeByDelimiter}
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





### Strip empty lines from the document {#stripEmptyLines}
Remove all empty lines from the file.

![alt text](20250521185004.gif)


---

### Strip & Highlight Trailing Spaces {#striptrailingspaces}

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




## Keybindings

Below are the default keybindings provided by this extension. You can customize these in your VS Code keybindings settings.


### Markdown Keybindings

| Keybinding   | Description                         | When                   | Command ID                        |
| ------------ | ----------------------------------- | ---------------------- | --------------------------------- |
| Ctrl+Shift+B | Toggle block quote in Markdown      | Markdown, editor focus | colemenutils.toggleBlockQuote     |
| Ctrl+B       | Bold selected text in Markdown      | Markdown, editor focus | editor.action.insertSnippet       |
| Ctrl+I       | Italicize selected text in Markdown | Markdown, editor focus | editor.action.insertSnippet       |
| Ctrl+Up      | Add Markdown header                 | Markdown, editor focus | colemenutils.addMarkdownHeader    |
| Ctrl+Down    | Remove Markdown header              | Markdown, editor focus | colemenutils.removeMarkdownHeader |



| Keybinding        | Description                                | When         | Command ID                                |
| ----------------- | ------------------------------------------ | ------------ | ----------------------------------------- |
| Ctrl+Shift+Delete | Clear the current line                     | Editor focus | colemenutils.clearCurrentLine             |
| Alt+Shift+I       | Select all highlights and notebook matches | Any          | runCommands (select highlights, notebook) |
| Ctrl+L            | Select the current line                    | Editor focus | colemenutils.selectCurrentLine            |
| Alt+Shift+Tab     | Previous selection match                   | Any          | runCommands (previous selection match)    |
| Ctrl+Tab          | Next selection match                       | Any          | runCommands (next selection match)        |
| Ctrl+Shift+Down   | Move lines down                            | Any          | runCommands (move lines down)             |
| Ctrl+Shift+Up     | Move lines up                              | Any          | runCommands (move lines up)               |
| Alt+Shift+U       | Transform selection to uppercase           | Any          | runCommands (transform to uppercase)      |
| Ctrl+U            | Transform selection to lowercase           | Any          | runCommands (transform to lowercase)      |
| Ctrl+Q            | Comment/uncomment current line             | Any          | runCommands (comment line)                |
| Alt+0             | Fold all code regions                      | Any          | runCommands (fold all)                    |
| Shift+Alt+0       | Unfold all code regions                    | Any          | runCommands (unfold all)                  |
| Shift+Alt+X       | Insert a box header                        | Editor focus | colemenutils.insertBoxHeader              |
| Alt+X             | Insert a single line header                | Editor focus | colemenutils.insertSingleLineHeader       |
| Ctrl+D            | Duplicate the current selection            | Any          | runCommands (duplicate selection)         |













## Configuration

You can customize the behavior of ColemenUtils through the following settings in your VS Code `settings.json` or the Settings UI.

### White Space Settings

| Setting                                      | Type    | Default           | Description                                                        |
|-----------------------------------------------|---------|-------------------|--------------------------------------------------------------------|
| `colemenutils.highlightTrailingSpaces`        | boolean | `true`            | Highlight trailing spaces in the document.                         |
| `colemenutils.trailingSpacesHighlightColor`   | string  | `rgba(255,0,0,0.3)` | Highlight color for trailing spaces (CSS color value).             |

### Sorting Settings

| Setting                                         | Type    | Default   | Description                                                                                 |
|--------------------------------------------------|---------|-----------|---------------------------------------------------------------------------------------------|
| `colemenutils.ignoreSpecialCharactersCharacters` | boolean | `true`    | Ignore non-alphanumeric characters when sorting alphabetically.                              |
| `colemenutils.numberPlacementAlphaSort`          | string  | `before`  | Place numeric values before or after alphabetic values when sorting. (`before` or `after`)   |
| `colemenutils.keepOriginalFormatting`            | boolean | `false`   | If true, the original formatting of the lines will be preserved when sorting.                |

### General Settings

| Setting                                 | Type    | Default   | Description                                                                                 |
|------------------------------------------|---------|-----------|---------------------------------------------------------------------------------------------|
| `colemenutils.linesToListDelimiter`      | string  | `,`       | The delimiter to use when converting lines to a list. Used in the `linesToList` command.     |
| `colemenutils.showSelectedLinesStatus`   | boolean | `true`    | Show the number of selected lines in the status bar.                                        |
| `colemenutils.headerWidth`               | number  | `80`      | Width of the generated header block.                                                        |
| `colemenutils.defaultHashAlgo`           | string  | `MD5`     | The default hash algorithm to use for hashing. Options: `MD5`, `SHA1`, `SHA256`, `SHA512`.  |
| `colemenutils.bannerFont`                | string  | `Banner`  | Font to use for ASCII banners.                                                              |












