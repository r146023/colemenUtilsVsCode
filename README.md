# ColemenUtils VSCode Extension

A comprehensive utility extension for Visual Studio Code that provides a wide range of text formatting, development, and productivity commands to streamline your coding workflow.

## 🚀 Features Overview

ColemenUtils is packed with powerful commands organized into logical categories to help you format, process, and manipulate text efficiently. Whether you're working with code, markdown, JSON, or plain text, this extension has tools to make your workflow faster and more productive.

## 📋 Command Categories

### 🔐 Hashing & Encoding

Secure your data and encode/decode text with various algorithms.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Hash Selection** | Hash selected text using the default algorithm | `colemenutils.defaultHashSelection` |
| **MD5 Hash Selection** | Generate MD5 hash of selected text | `colemenutils.md5HashSelection` |
| **SHA1 Hash Selection** | Generate SHA1 hash of selected text | `colemenutils.sha1HashSelection` |
| **SHA256 Hash Selection** | Generate SHA256 hash of selected text | `colemenutils.sha256HashSelection` |
| **SHA512 Hash Selection** | Generate SHA512 hash of selected text | `colemenutils.sha512HashSelection` |
| **Base64 Encode/Decode** | Toggle Base64 encoding/decoding of selected text | `colemenutils.base64EncodeDecode` |

### 🖼️ SVG Utilities

Specialized tools for working with SVG files.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Format SVG Content** | Reformat SVG content for better readability | `colemenutils.FormatSVGContentCMD` |
| **Capture SVG Viewbox Value** | Extract and copy the viewBox attribute to clipboard | `colemenutils.CaptureSVGViewboxValue` |
| **Capture SVG Body Value** | Extract and copy the SVG body content to clipboard | `colemenutils.CaptureSVGBody` |

### 📝 Markdown & Text Formatting

Enhanced markdown editing and text banner creation.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Toggle Block Quote** | Toggle block quote formatting for selected lines | `colemenutils.toggleBlockQuote` |
| **Add Markdown Header** | Add a markdown header to current line/selection | `colemenutils.addMarkdownHeader` |
| **Remove Markdown Header** | Remove markdown header from current line/selection | `colemenutils.removeMarkdownHeader` |
| **Convert to ASCII Banner** | Convert selected text to ASCII art banner | `colemenutils.asciiBanner` |
| **Insert Box Header** | Insert a decorative box header | `colemenutils.insertBoxHeader` |
| **Insert Single Line Header** | Insert a single line header separator | `colemenutils.insertSingleLineHeader` |

### 📊 Line & Array Utilities

Transform lines into various array and list formats.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Lines to Array of Strings** | Convert each line to a quoted string in an array | `colemenutils.LinesToStringArray` |
| **Lines to Array of Typed Values** | Convert lines to typed values (strings, numbers, booleans) | `colemenutils.LinesToFormattedArray` |
| **Lines to Image Tag Array** | Convert lines to HTML image tag array | `colemenutils.LinesToImageTag` |
| **Image Tags to Lines** | Convert image tag array back to lines | `colemenutils.ImageTagsToLinesCMD` |
| **Lines to Array (no formatting)** | Convert lines to array without quotes | `colemenutils.linesToArray` |
| **Lines to Unique Delimited List** | Convert lines to unique, delimited list | `colemenutils.linesToListDelimiterUnique` |
| **Lines to Delimited List** | Convert lines to delimited list | `colemenutils.linesToListDelimiter` |
| **Explode by Delimiter** | Split text by most common delimiter into lines | `colemenutils.explodeByDelim` |

### 🔄 Sorting & Shuffling

Organize your content with various sorting algorithms.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Sort Alphabetically A-Z** | Sort lines alphabetically ascending | `colemenutils.sortLines` |
| **Sort Alphabetically Z-A** | Sort lines alphabetically descending | `colemenutils.sortLinesReversed` |
| **Sort By Length Small to Large** | Sort lines by length (shortest first) | `colemenutils.sortByLength` |
| **Sort By Length Large to Small** | Sort lines by length (longest first) | `colemenutils.sortByLengthReversed` |
| **Shuffle Lines** | Randomize line order | `colemenutils.shuffleLines` |

### 🧹 Whitespace & Cleanup

Clean up and organize your text with precision.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Strip Empty Lines** | Remove all empty lines from document | `colemenutils.stripEmptyLines` |
| **Strip Trailing Spaces** | Remove trailing spaces from each line | `colemenutils.stripTrailingSpaces` |
| **Strip Excessive Spaces** | Replace multiple spaces with single space | `colemenutils.stripExcessiveSpaces` |
| **Keep Unique** | Remove duplicate lines, keeping only unique ones | `colemenutils.stripDuplicateLines` |
| **Keep Unique Selected** | Remove duplicates from selection only | `colemenutils.stripSelectedDuplicate` |
| **Normalize Blank Lines** | Reduce excessive blank lines to maximum of 2 | `colemenutils.normalizeBlankLines` |

### ✂️ Selection & Line Editing

Powerful line manipulation and editing commands.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Select Current Line** | Select the entire current line(s) | `colemenutils.selectCurrentLine` |
| **Clear Current Line** | Clear content of current line(s) | `colemenutils.clearCurrentLine` |
| **Format Component to Multiline** | Format JSX component properties to multiple lines | `colemenutils.ComponentToMultiLine` |
| **Reverse Windows Paths** | Convert forward slashes to backslashes in paths | `colemenutils.reverseSlashesInWindowsPaths` |
| **Apply New Lines to File** | Insert new lines at specified positions | `colemenutils.applyNewLines` |
| **Collapse to Single Line** | Collapse selection/document to single line | `colemenutils.toSingleLine` |
| **Minify File** | Remove unnecessary whitespace from file | `colemenutils.minifyFile` |

### 🔤 Quoting & Escaping

Handle quotes and escape characters efficiently.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Escape All Single Backslashes** | Escape all single backslashes in document | `colemenutils.escapeAllSingleBackSlash` |
| **Escape Selected Single Backslashes** | Escape single backslashes in selection | `colemenutils.escapeSelectedSingleBackSlash` |
| **Single to Double Quotes** | Convert single quotes to double quotes | `colemenutils.singleToDoubleQuote` |

### 🏷️ Auto Rename Tag

Automatically rename paired HTML/XML tags as you type.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Enable Auto Rename Tag** | Enable automatic tag pair renaming | `colemenutils.enableAutoRenameTag` |
| **Disable Auto Rename Tag** | Disable automatic tag pair renaming | `colemenutils.disableAutoRenameTag` |
| **Toggle Auto Rename Tag** | Toggle auto-rename functionality | `colemenutils.toggleAutoRenameTag` |
| **Rename Tag** | Manually rename tag pairs | `colemenutils.renameTag` |

**Supported Languages:**
- HTML, XML, XHTML, SVG
- JavaScript, JSX, TypeScript, TSX
- Vue, PHP, ERB, Handlebars

### 🎨 Bracket Colorizer

Visual bracket matching with customizable colors.

- **Real-time bracket pair colorization**
- **Customizable color schemes**
- **Multiple highlight styles** (color, background, border, underline, glow)
- **Active scope highlighting**
- **Performance optimized**

### 📊 JSON Utilities

Comprehensive JSON processing and transformation tools.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Format JSON** | Pretty-print JSON with proper indentation | `colemenutils.formatJson` |
| **Minify JSON** | Remove whitespace from JSON | `colemenutils.minifyJson` |
| **Validate JSON** | Check JSON syntax and show errors | `colemenutils.validateJson` |
| **JSON to TypeScript Interface** | Generate TypeScript interfaces from JSON | `colemenutils.jsonToTypeScript` |
| **JSON to CSV** | Convert JSON array to CSV format | `colemenutils.jsonToCsv` |
| **JSON to YAML** | Convert JSON to YAML format | `colemenutils.jsonToYaml` |
| **Extract JSON Keys** | Get all keys from JSON object | `colemenutils.extractJsonKeys` |
| **Flatten JSON** | Flatten nested JSON structure | `colemenutils.flattenJson` |
| **Unflatten JSON** | Restore flattened JSON to nested structure | `colemenutils.unflattenJson` |

### 🐛 Debug Commands

Manage debug statements across multiple languages.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Comment Out All Prints** | Comment out print/console statements | `colemenutils.commentOutAllPrints` |
| **Uncomment All Prints** | Uncomment print/console statements | `colemenutils.uncommentAllPrints` |
| **Remove All Prints** | Delete all print/console statements | `colemenutils.removeAllPrints` |
| **Toggle Print Comments** | Toggle comment state of print statements | `colemenutils.togglePrintComments` |
| **Strip All Comments** | Remove all comments from code | `colemenutils.stripAllComments` |

**Supported Languages:**
- JavaScript, TypeScript, JSX, TSX
- Python, PHP, Rust
- Shell scripts (Bash, PowerShell, Batch)

### 🔧 Other Utilities

Additional productivity tools.

| Command | Description | Command ID |
|---------|-------------|------------|
| **Insert UUID** | Generate and insert UUID at cursor position | `colemenutils.insertUUIDs` |
| **Comment Console Log Calls** | Comment out console.log statements | `colemenutils.commentConsoleLogLines` |

### 📦 Barrel Generation (JavaScript/TypeScript)

Automatically generate barrel files for better project organization.

- **Auto barrel file creation** for directories
- **Smart detection** of JS/TS projects
- **Exclude management** for specific files/directories
- **Configurable export patterns**

## ⌨️ Keyboard Shortcuts

### Markdown Keybindings

| Shortcut | Command | When |
|----------|---------|------|
| `Ctrl+Shift+B` | Toggle Block Quote | Markdown files |
| `Ctrl+B` | Bold Selection | Markdown files |
| `Ctrl+I` | Italic Selection | Markdown files |
| `Ctrl+Up` | Add Markdown Header | Markdown files |
| `Ctrl+Down` | Remove Markdown Header | Markdown files |

### General Keybindings

| Shortcut | Command | When |
|----------|---------|------|
| `Ctrl+Shift+Delete` | Clear Current Line | Any editor |
| `Ctrl+L` | Select Current Line | Any editor |
| `Ctrl+Q` | Comment Line | Any editor |
| `Ctrl+D` | Duplicate Selection | Any editor |
| `Ctrl+U` | Transform to Lowercase | Any editor |
| `Alt+Shift+U` | Transform to Uppercase | Any editor |
| `Alt+0` | Fold All | Any editor |
| `Shift+Alt+0` | Unfold All | Any editor |
| `Shift+Alt+X` | Insert Box Header | Any editor |
| `Alt+X` | Insert Single Line Header | Any editor |
| `Ctrl+Shift+Up` | Move Lines Up | Any editor |
| `Ctrl+Shift+Down` | Move Lines Down | Any editor |

## ⚙️ Configuration

Customize ColemenUtils behavior through VS Code settings.

### Auto Rename Tag Settings

```json
{
  "colemenutils.autoRenameTag.enabled": true,
  "colemenutils.autoRenameTag.delay": 100
}
```

### Bracket Colorizer Settings

```json
{
  "colemenutils.bracketColorizer.enabled": true,
  "colemenutils.bracketColorizer.colors": [
    "#FFD700", "#DA70D6", "#87CEEB", "#98FB98", "#F0E68C"
  ],
  "colemenutils.bracketColorizer.highlightStyle": "color",
  "colemenutils.bracketColorizer.fontWeight": "bold"
}
```

### Whitespace Settings

```json
{
  "colemenutils.highlightTrailingSpaces": true,
  "colemenutils.trailingSpacesHighlightColor": "rgba(255,0,0,0.3)"
}
```

### Sorting Settings

```json
{
  "colemenutils.ignoreSpecialCharacters": true,
  "colemenutils.numberPlacementAlphaSort": "before",
  "colemenutils.keepOriginalFormatting": false
}
```

### General Settings

```json
{
  "colemenutils.linesToListDelimiter": ",",
  "colemenutils.showSelectedLinesStatus": true,
  "colemenutils.headerWidth": 80,
  "colemenutils.defaultHashAlgo": "MD5",
  "colemenutils.bannerFont": "Banner",
  "colemenutils.json.indentSize": 2
}
```

## 🎯 Context Menus

Right-click in the editor to access organized command submenus:

- **📝 Format** - Text formatting and processing commands
- **🔄 Sort** - Sorting and organization commands  
- **🔐 Hash** - Hashing and encoding commands (when text selected)
- **🐛 Debug** - Debug and print statement management (in supported languages)
- **🖼️ SVG Format** - SVG-specific formatting commands (in SVG files)
- **🏷️ Tags** - Auto rename tag controls (in supported files)

## 🚀 Usage Examples

### Converting Lines to Arrays

**Input:**
```
apple
banana
cherry
```

**Lines to String Array Result:**
```javascript
['apple', 'banana', 'cherry']
```

**Lines to Typed Array Result:**
```javascript
apple
banana
cherry
```

### Auto Rename Tag in Action

**Before:** `<div>Content</div>`
**Edit:** Change `div` to `section`
**After:** `<section>Content</section>` ✨ (automatically updated)

### JSON Formatting

**Input:** `{"name":"John","age":30,"active":true}`

**Formatted Result:**
```json
{
  "name": "John",
  "age": 30,
  "active": true
}
```

### Explode by Delimiter

**Input:** `apple,banana,cherry;grape`
**Result:** (splits by most common delimiter `,`)
```
apple
banana
cherry;grape
```

### Bracket Colorization

```javascript
function example() {          // Level 0 - Gold
  if (condition) {            // Level 1 - Purple  
    array.map((item) => {     // Level 2 - Blue
      return item.value;      // Level 3 - Green
    });
  }
}
```

### Sort by Length

**Input:**
```
a
hello
hi
JavaScript
```

**Small to Large Result:**
```
a
hi
hello
JavaScript
```

### Hash Generation

**Input:** `Hello World`
**MD5 Result:** `b10a8db164e0754105b7a99be72e3fe5`

## 📦 Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "ColemenUtils"
4. Click Install

Or install from command line:
```bash
code --install-extension colemenutils
```

## 🆕 Recent Features

### Version Latest
- ✅ **Auto Rename Tag** - Real-time paired tag renaming
- ✅ **Bracket Colorizer** - Visual bracket matching with custom styles
- ✅ **Enhanced JSON Tools** - Comprehensive JSON processing suite
- ✅ **Debug Command Improvements** - Multi-language print statement management
- ✅ **Normalize Blank Lines** - Smart whitespace management
- ✅ **Improved Sorting** - Advanced sorting with configuration options

## 🐛 Known Issues

- Auto Rename Tag may occasionally miss deeply nested structures
- Bracket Colorizer performance may slow down on very large files (>10k lines)
- Some regex operations may not work in older VS Code versions

## 🤝 Contributing

Feature requests and bug reports are welcome! This extension is actively maintained and improved based on user feedback.

## 📄 License

This extension is provided as-is for productivity enhancement. Please use responsibly.

---

**Enjoy streamlined coding with ColemenUtils!** 🚀✨

*Transform your VS Code workflow with powerful text processing, intelligent formatting, and productivity-boosting utilities all in one comprehensive extension.*