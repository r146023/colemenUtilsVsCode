const vscode = require("vscode");
const { getConfigValue } = require("../helpers/configHelpers");

/**
 * "vscode-color-picker" clone behavior, but with a better default:
 * - If `colorpickerlanguages` is EMPTY or missing -> enable everywhere (scheme-based).
 * - If it's a non-empty array -> enable only for those language IDs (like the original extension).
 *
 * Color formats supported:
 *   #rgb #rgba #rrggbb #rrggbbaa
 *   rgb(r,g,b) rgba(r,g,b,a)
 *   hsl(h,s%,l%) hsla(h,s%,l%,a)
 */

function activateVscodeColorPickerDecorator(context) {
  const controller = new VscodeColorPickerController();
  context.subscriptions.push(controller);

  controller.refreshRegistrations();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      // Re-register on ANY config change because:
      // - scheme registration vs language list can flip
      // - users may change languages array or extension settings
      if (
        e.affectsConfiguration("colorpickerlanguages") ||
        e.affectsConfiguration("vscode-color-picker") ||
        e.affectsConfiguration("colemenutils.vscodeColorPicker") // if you ever mirror keys
      ) {
        controller.refreshRegistrations();
      }
    })
  );
}

function deactivateVscodeColorPickerDecorator() {}

class VscodeColorPickerController {
  constructor() {
    this._disposed = false;
    this._registrations = [];
    this._tokenCache = new Map(); // uri -> tokens for formatting preservation
    this._modeCacheKey = ""; // avoids re-registering if nothing changed
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._disposeRegistrations();
    this._tokenCache.clear();
  }

  refreshRegistrations() {
    if (this._disposed) return;

    // Read the original extension key
    const langsRaw = getConfigValue("colorPickerLanguages", []);
    const languageIds = Array.isArray(langsRaw)
      ? langsRaw.map((x) => String(x || "").trim()).filter(Boolean)
      : [];

    // Decide mode:
    // - empty list => global (scheme-based)
    // - non-empty => per-language
    const modeKey =
      languageIds.length === 0
        ? "mode:global:file+untitled"
        : `mode:languages:${languageIds.sort().join("|")}`;

    if (modeKey === this._modeCacheKey) return; // no-op
    this._modeCacheKey = modeKey;

    this._disposeRegistrations();

    const provider = new ColorProvider(this._tokenCache);

    if (languageIds.length === 0) {
      // ✅ Default: work everywhere
      // file + untitled covers most editors; add "vscode-userdata" if you want settings UI too.
      this._registrations.push(
        vscode.languages.registerColorProvider([{ scheme: "file" }, { scheme: "untitled" }], provider)
      );
      return;
    }

    // 🔒 Explicit languages list (matches original extension pattern)
    for (const langId of languageIds) {
      this._registrations.push(vscode.languages.registerColorProvider({ language: langId }, provider));
    }
  }

  _disposeRegistrations() {
    for (const d of this._registrations) {
      try {
        d.dispose();
      } catch(e) {}
    }
    this._registrations = [];
  }
}

class ColorProvider {
  constructor(tokenCache) {
    this._tokenCache = tokenCache;
  }

  provideDocumentColors(document, token) {
    const text = document.getText();
    const uriKey = document.uri.toString();

    const tokens = [];
    const infos = [];

    // hex OR rgb/rgba OR hsl/hsla
    // Prefer 8/6/4/3 and prevent partial matches with (?![0-9a-fA-F])
    const re =
    /(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F]))|(\brgba?\(\s*[^)]*\))|(\bhsla?\(\s*[^)]*\))/g;

    let m;
    while ((m = re.exec(text)) !== null) {
      const matchText = m[0];
      const start = m.index;
      const end = start + matchText.length;

      const parsed = parseColorLiteral(matchText);
      if (!parsed) continue;

      const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
      infos.push(new vscode.ColorInformation(range, parsed.color));

      tokens.push({
        rangeKey: rangeKey(range),
        format: parsed.format,
        original: matchText,
      });
    }

    this._tokenCache.set(uriKey, tokens);
    return infos;
  }

  provideColorPresentations(color, context, token) {
    const doc = context.document;
    const uriKey = doc.uri.toString();
    const tokens = this._tokenCache.get(uriKey) || [];

    const key = rangeKey(context.range);
    const t = tokens.find((x) => x.rangeKey === key);

    if (t && t.format) {
      return [new vscode.ColorPresentation(formatColor(color, t.format))];
    }

    // fallback
    return [new vscode.ColorPresentation(rgbaString(color))];
  }
}

/* -----------------------------
   Parsing
------------------------------ */

function parseColorLiteral(s) {
  const str = String(s).trim();

  // Hex
  if (str[0] === "#") {
    const hex = str.slice(1);
    if (![3, 4, 6, 8].includes(hex.length)) return null;
    const rgba = hexToRgba(hex);
    if (!rgba) return null;
    return {
      color: new vscode.Color(rgba.r, rgba.g, rgba.b, rgba.a),
      format: {
        kind: "hex",
        digits: hex.length, // 3/4/6/8
        upper: /[A-F]/.test(hex),
      },
    };
  }

  // rgb()/rgba()
  const rgbm = str.match(/^rgba?\(\s*(.+)\s*\)$/i);
  if (rgbm) {
    const inside = rgbm[1];
    const parts = splitFuncArgs(inside);
    if (parts.length !== 3 && parts.length !== 4) return null;

    const r = parseRgbPart(parts[0]);
    const g = parseRgbPart(parts[1]);
    const b = parseRgbPart(parts[2]);
    if (r == null || g == null || b == null) return null;

    let a = 1;
    const hasAlpha = parts.length === 4;
    if (hasAlpha) {
      a = parseAlpha(parts[3]);
      if (a == null) return null;
    }

    return {
      color: new vscode.Color(r / 255, g / 255, b / 255, a),
      format: {
        kind: hasAlpha ? "rgba" : "rgb",
        spaceAfterComma: /,\s+/.test(inside),
      },
    };
  }

  // hsl()/hsla()
  const hslm = str.match(/^hsla?\(\s*(.+)\s*\)$/i);
  if (hslm) {
    const inside = hslm[1];
    const parts = splitFuncArgs(inside);
    if (parts.length !== 3 && parts.length !== 4) return null;

    const h = parseHue(parts[0]);
    const sat = parsePercent(parts[1]);
    const lit = parsePercent(parts[2]);
    if (h == null || sat == null || lit == null) return null;

    let a = 1;
    const hasAlpha = parts.length === 4;
    if (hasAlpha) {
      a = parseAlpha(parts[3]);
      if (a == null) return null;
    }

    const rgb = hslToRgb(h, sat, lit);
    return {
      color: new vscode.Color(rgb.r, rgb.g, rgb.b, a),
      format: {
        kind: hasAlpha ? "hsla" : "hsl",
        spaceAfterComma: /,\s+/.test(inside),
      },
    };
  }

  return null;
}

function splitFuncArgs(inside) {
  return inside
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function parseRgbPart(s) {
  if (!/^-?\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0 || n > 255) return null;
  return n;
}

function parseAlpha(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 1) return null;
  return n;
}

function parseHue(s) {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  let h = n % 360;
  if (h < 0) h += 360;
  return h;
}

function parsePercent(s) {
  const m = s.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n / 100;
}

/* -----------------------------
   Formatting
------------------------------ */

function formatColor(color, fmt) {
  switch (fmt.kind) {
    case "hex": {
      const hex = rgbaToHex(color, fmt.digits);
      return fmt.upper ? hex.toUpperCase() : hex.toLowerCase();
    }
    case "rgb":
      return rgbString(color, fmt.spaceAfterComma);
    case "rgba":
      return rgbaString(color, fmt.spaceAfterComma);
    case "hsl":
      return hslString(color, fmt.spaceAfterComma);
    case "hsla":
      return hslaString(color, fmt.spaceAfterComma);
    default:
      return rgbaString(color);
  }
}

function rgbString(color, spaceAfterComma = true) {
  const sep = spaceAfterComma ? ", " : ",";
  const r = clamp255(Math.round(color.red * 255));
  const g = clamp255(Math.round(color.green * 255));
  const b = clamp255(Math.round(color.blue * 255));
  return `rgb(${r}${sep}${g}${sep}${b})`;
}

function rgbaString(color, spaceAfterComma = true) {
  const sep = spaceAfterComma ? ", " : ",";
  const r = clamp255(Math.round(color.red * 255));
  const g = clamp255(Math.round(color.green * 255));
  const b = clamp255(Math.round(color.blue * 255));
  const a = clamp01(color.alpha);
  return `rgba(${r}${sep}${g}${sep}${b}${sep}${trimAlpha(a)})`;
}

function hslString(color, spaceAfterComma = true) {
  const sep = spaceAfterComma ? ", " : ",";
  const hsl = rgbToHsl(color.red, color.green, color.blue);
  return `hsl(${Math.round(hsl.h)}${sep}${Math.round(hsl.s * 100)}%${sep}${Math.round(hsl.l * 100)}%)`;
}

function hslaString(color, spaceAfterComma = true) {
  const sep = spaceAfterComma ? ", " : ",";
  const hsl = rgbToHsl(color.red, color.green, color.blue);
  return `hsla(${Math.round(hsl.h)}${sep}${Math.round(hsl.s * 100)}%${sep}${Math.round(
    hsl.l * 100
  )}%${sep}${trimAlpha(clamp01(color.alpha))})`;
}

/* -----------------------------
   Conversions
------------------------------ */

function hexToRgba(hex) {
  const h = hex.trim();
  if (![3, 4, 6, 8].includes(h.length)) return null;

  let r,
    g,
    b,
    a = 255;

  if (h.length === 3 || h.length === 4) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
    if (h.length === 4) a = parseInt(h[3] + h[3], 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16);
  }

  if (![r, g, b, a].every(Number.isFinite)) return null;

  return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
}

function rgbaToHex(color, digits) {
  const r = clamp255(Math.round(color.red * 255));
  const g = clamp255(Math.round(color.green * 255));
  const b = clamp255(Math.round(color.blue * 255));
  const a = clamp255(Math.round(color.alpha * 255));

  const rr = toHex2(r);
  const gg = toHex2(g);
  const bb = toHex2(b);
  const aa = toHex2(a);

  if (digits === 3 || digits === 4) {
    const can3 = rr[0] === rr[1] && gg[0] === gg[1] && bb[0] === bb[1];
    const can4 = can3 && aa[0] === aa[1];

    if (digits === 3 && can3) return `#${rr[0]}${gg[0]}${bb[0]}`;
    if (digits === 4 && can4) return `#${rr[0]}${gg[0]}${bb[0]}${aa[0]}`;

    return digits === 4 ? `#${rr}${gg}${bb}${aa}` : `#${rr}${gg}${bb}`;
  }

  if (digits === 8) return `#${rr}${gg}${bb}${aa}`;
  return `#${rr}${gg}${bb}`;
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (0 <= hp && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (1 <= hp && hp < 2) {
    r1 = x;
    g1 = c;
  } else if (2 <= hp && hp < 3) {
    g1 = c;
    b1 = x;
  } else if (3 <= hp && hp < 4) {
    g1 = x;
    b1 = c;
  } else if (4 <= hp && hp < 5) {
    r1 = x;
    b1 = c;
  } else if (5 <= hp && hp < 6) {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return { r: r1 + m, g: g1 + m, b: b1 + m };
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

/* -----------------------------
   Helpers
------------------------------ */

function toHex2(n) {
  const s = n.toString(16);
  return s.length === 1 ? "0" + s : s;
}

function clamp255(n) {
  return Math.max(0, Math.min(255, n));
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function trimAlpha(a) {
  if (a === 0) return "0";
  if (a === 1) return "1";
  return a.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function rangeKey(range) {
  return `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`;
}

module.exports = {
  activateVscodeColorPickerDecorator,
  deactivateVscodeColorPickerDecorator,
};
