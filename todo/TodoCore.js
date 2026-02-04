// path : todo/TodoCore.js
"use strict";

const vscode = require("vscode");

/**
 * Your formats:
 *   // TODO []: (backend,database) do that one thing
 *   // XXX [2026-01-30 16:22:19]: (backend,database) do that one thing
 *
 * Semantics:
 *   TODO => Open
 *   XXX  => Done (timestamp = completion time)
 *
 * Comment prefix is forgiving: //, #, --, ;, /*, <!--
 */
const TODO_RE =
  /^\s*(?:\/\/|#|--|;|\/\*+|<!--)\s*(TODO|XXX)\s*\[([^\]]*)\]\s*:\s*\(([^)]*)\)\s*(.*?)\s*(?:\*\/|-->|)?\s*$/;

const DEFAULT_OPTIONS = {
  includeGlobs: [
    "**/*.{ts,tsx,js,jsx,cjs,mjs,php,py,rs,go,java,cs,md,txt,css,scss,html,json,yml,yaml}",
  ],
  excludeGlobs: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/out/**",
    "**/.git/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/.cache/**",
    "**/vendor/**",
  ],
  maxFiles: 4000,
  maxTodos: 15000,
  scanHeadLinesOnly: null, // number or null. If set, only scan first N lines per file.
};

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function uniqSorted(arr) {
  return Array.from(new Set(arr))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeTags(tagBlob) {
    if (!tagBlob) return [];
    return tagBlob
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase());
}

function parseTimestamp(bracketText) {
    const s = (bracketText || "").trim();
    return s || "";
}

function makeExcludeGlob(excludeGlobs) {
    if (!excludeGlobs || excludeGlobs.length === 0) return undefined;
    return excludeGlobs.length === 1 ? excludeGlobs[0] : `{${excludeGlobs.join(",")}}`;
}

function safeJson(obj) {
    // Prevent breaking the webview via </script> etc.
    return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * Scan workspace files for TODO/XXX items.
 *
 * @param {object} options
 * @returns {Promise<Array<{
 *   status:"open"|"done",
 *   kind:"TODO"|"XXX",
 *   timestamp:string,
 *   tags:string[],
 *   message:string,
 *   uri:vscode.Uri,
 *   line:number,
 *   column:number,
 *   raw:string
 * }>>}
 */
async function scanWorkspaceTodos(options = {}) {
    const opt = { ...DEFAULT_OPTIONS, ...options };
    const exclude = makeExcludeGlob(opt.excludeGlobs);

    // Find files
    let uris = [];
    for (const pattern of opt.includeGlobs) {
        const found = await vscode.workspace.findFiles(pattern, exclude, opt.maxFiles);
        uris = uris.concat(found);
        if (uris.length >= opt.maxFiles) break;
    }

    // De-dupe URIs
    const seen = new Set();
    uris = uris.filter((u) => {
        const k = u.toString();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });

    const results = [];

    for (const uri of uris) {
        if (results.length >= opt.maxTodos) break;

        let doc;
        try {
        doc = await vscode.workspace.openTextDocument(uri);
        } catch (err) {
        continue;
        }

        const lineCount = doc.lineCount;
        const limit =
        typeof opt.scanHeadLinesOnly === "number" && opt.scanHeadLinesOnly > 0
            ? Math.min(lineCount, opt.scanHeadLinesOnly)
            : lineCount;

        for (let i = 0; i < limit; i++) {
        if (results.length >= opt.maxTodos) break;

        const line = doc.lineAt(i);
        const text = line.text;

        const m = text.match(TODO_RE);
        if (!m) continue;

        const token = /** @type {"TODO"|"XXX"} */ (m[1]); // // TODO []: (javascript,frontend)  XXX
        const bracket = m[2];
        const tagBlob = m[3];
        const msg = (m[4] || "").trim();

        const status = /** @type {"open"|"done"} */ (token === "TODO" ? "open" : "done");
        const timestamp = /** @type {string} */ (token === "XXX" ? parseTimestamp(bracket) : "");

        const tags = /** @type {string[]} */ (normalizeTags(tagBlob));

        // Column: start of TODO/XXX token
        const idx = text.toUpperCase().indexOf(token);
        const col = idx >= 0 ? idx : 0;

        results.push({
            status: status,
            kind: token,
            timestamp: timestamp,
            tags: tags,
            message: msg,
            uri: /** @type {vscode.Uri} */ (uri),
            line: i,
            column: col,
            raw: text.trim(),
        });
    }
}

    // Sort:
    //   Open first.
    //   Done next, newest completion first if timestamp exists.
    //   Then file/line as stable tiebreakers.
    results.sort((a, b) => {
        if (a.status !== b.status) return a.status === "open" ? -1 : 1;

        if (a.status === "done") {
        if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
            // Works well for "YYYY-MM-DD HH:mm:ss"
            return a.timestamp < b.timestamp ? 1 : -1;
        }
        if (a.timestamp && !b.timestamp) return -1;
        if (!a.timestamp && b.timestamp) return 1;
        }

        const fa = vscode.workspace.asRelativePath(a.uri);
        const fb = vscode.workspace.asRelativePath(b.uri);
        if (fa !== fb) return fa.localeCompare(fb);
        return a.line - b.line;
    });

    return results;
}

/**
 * Converts raw scan results into a webview-friendly payload.
 * @param {Array} todos
 */
function buildTodoPayload(todos) {
  const tags = uniqSorted(todos.flatMap((t) => t.tags));
  return {
    todos: todos.map((t) => ({
      id: `${t.uri.toString()}::${t.line}::${t.column}`,
      status: t.status, // open|done
      kind: t.kind, // TODO|XXX (original)
      timestamp: t.timestamp || "",
      tags: t.tags,
      message: t.message,
      file: vscode.workspace.asRelativePath(t.uri),
      line: t.line + 1, // human
      col: t.column,
      raw: t.raw,
      uri: t.uri.toString(),
    })),
    tags,
    stats: {
      total: todos.length,
      open: todos.filter((t) => t.status === "open").length,
      done: todos.filter((t) => t.status === "done").length,
    },
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Builds the Webview HTML for the sidebar view.
 * @param {vscode.Webview} webview
 */
function buildHtml(webview) {
  const nonce = String(Math.random()).slice(2);

  const boot = safeJson({
    defaultStatus: "open",
  });

  return /* html */ `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Todos</title>
  <style>
    :root {
      --pad: 10px;
      --br: 12px;
      --muted: rgba(255,255,255,.62);
      --muted2: rgba(255,255,255,.42);
      --bg: rgba(255,255,255,.05);
      --bg2: rgba(255,255,255,.08);
      --line: rgba(255,255,255,.09);
      --shadow: 0 10px 30px rgba(0,0,0,.25);
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
    }
    html, body {
      padding: 0;
      margin: 0;
      font-family: var(--sans);
      color: rgba(255,255,255,.92);
      background: transparent;
    }
    .wrap {
      padding: var(--pad);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toolbar {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 8px;
      align-items: center;
    }
    .toolbar2 {
      display: flex;
      flex-direction: row;
      grid-template-columns: auto auto 1fr;
      gap: 8px;
      align-items: center;
    }
    input[type="text"], select {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.2);
      color: rgba(255,255,255,.92);
      outline: none;
    }
    input[type="text"]:focus, select:focus {
      border-color: rgba(255,255,255,.2);
      background: rgba(0,0,0,.26);
    }
    .btn {
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.2);
      color: rgba(255,255,255,.9);
      cursor: pointer;
      user-select: none;
    }
    .btn:hover { background: rgba(255,255,255,.08); }
    .btn:active { background: rgba(255,255,255,.12); }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(0,0,0,.18);
      font-size: 12px;
      color: var(--muted);
      user-select: none;
    }
    .toggle {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      cursor: pointer;
      user-select: none;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(0,0,0,.18);
      color: var(--muted);
      font-size: 12px;
      justify-self: start;
    }
    .toggle input { transform: translateY(1px); }
    .meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .metaStatsWrapper{
        display:none;
        /* display:flex; */
        width:100%;
        justify-content:space-evenly;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 2px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: var(--br);
      background: rgba(0,0,0,.18);
      box-shadow: var(--shadow);
      padding: 10px;
      cursor: pointer;
    }
    .card:hover { background: rgba(255,255,255,.06); }
    .row1 {
      display: flex;
      gap: 10px;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .title {
      font-weight: 650;
      font-size: 13px;
      line-height: 1.25;
      color: rgba(255,255,255,.92);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 80%;
    }
    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--line);
      color: rgba(255,255,255,.82);
      background: rgba(0,0,0,.2);
      flex: 0 0 auto;
    }
    .badge.open { color: rgba(255,255,255,.9); }
    .badge.done { color: rgba(180,255,200,.9); }
    .row2 {
      color: var(--muted);
      font-size: 12px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .file {
      font-family: var(--mono);
      font-size: 11px;
      color: rgba(255,255,255,.78);
    }
    .ts {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted2);
    }
    .tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .tag {
      font-family: var(--mono);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,.06);
      color: rgba(255,255,255,.78);
    }
    .empty {
      border: 1px dashed var(--line);
      border-radius: var(--br);
      padding: 14px;
      color: var(--muted);
      background: rgba(0,0,0,.12);
    }
    .small {
      font-size: 11px;
      color: var(--muted2);
    }
    .footer {
      margin-top: 4px;
      color: var(--muted2);
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
  </style>
</head>

<body>
  <div class="wrap">
    <div class="toolbar">
      <input id="search" type="text" placeholder="Search message, tags, file..." />
      <button class="btn" id="refresh">Refresh</button>
      <select id="status">
        <option value="open">Open</option>
        <option value="done">Done</option>
        <option value="all">All</option>
      </select>
    </div>

    <div class="toolbar2">
      <select id="tag">
        <option value="">Any tag</option>
      </select>

      <div class="toggle" id="autoRefreshWrap" title="Auto refresh on save">
        <input id="autoRefresh" type="checkbox" />
        <span>Rescan on save</span>
      </div>

      <div class="metaStatsWrapper">
        <div class="meta">
            <div class="pill" id="counts">…</div>
            <div class="pill" id="shown">…</div>
        </div>
      </div>
    </div>

    <div class="list" id="list">
      <div class="empty">Scanning…</div>
    </div>

    <div class="footer">
      <div id="scanInfo" class="small"></div>
      <div class="small">Click an item to jump to source.</div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const BOOT = ${boot};

    let ALL = [];
    let TAGS = [];
    let SETTINGS = { autoRefreshOnSave: true };

    const elSearch = document.getElementById("search");
    const elRefresh = document.getElementById("refresh");
    const elStatus = document.getElementById("status");
    const elTag = document.getElementById("tag");
    const elList = document.getElementById("list");
    const elCounts = document.getElementById("counts");
    const elShown = document.getElementById("shown");
    const elScanInfo = document.getElementById("scanInfo");
    const elAutoRefresh = document.getElementById("autoRefresh");
    const elAutoRefreshWrap = document.getElementById("autoRefreshWrap");

    elStatus.value = BOOT.defaultStatus || "open";

    function setTagOptions(tags) {
        const current = elTag.value;
        elTag.innerHTML = '<option value="">Any tag</option>';
        for (const t of tags) {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            elTag.appendChild(opt);
        }
        if ([...elTag.options].some(o => o.value === current)) elTag.value = current;
    }

    function normalize(s) {
        return (s || "").toLowerCase();
    }

    function matchesSearchSingle(todo, qo) {
        const nq = normalize(qo);
        var mustInclude = filter=>!filter.startsWith("!");
        var mustNotInclude = filter=>filter.startsWith("!");
        const hayFields = [
            todo.message,
            todo.file,
            ...(todo.tags || []),
            todo.timestamp || "",
            todo.raw || ""
        ];
        var result = false;
        for (const hf of hayFields) {
            if (normalize(hf).includes(mustInclude)) result = true;
        }

        if (mustNotInclude(nq)) {
            mustInclude = nq.slice(1);
            for (const hf of hayFields) {
                if (!normalize(hf).includes(mustInclude)) result = true;
            }
        }
        return result;
    }

    function matchesSearch(todo, q) {
        if (!q) return true;

        var qopts = q.split(" ").filter(Boolean);
        var matches = 0;
        for (const qo of qopts) {
            if (matchesSearchSingle(todo, qo)) matches++;
        }
        if (matches === qopts.length) return true;

        // Fallback: treat entire query as a single blob

        const hay = [
            todo.message,
            todo.file,
            (todo.tags || []).join(" "),
            todo.timestamp || "",
            todo.raw || ""
        ].join(" ").toLowerCase();

        return hay.includes(q);
    }

    function filterByTags(todos, tags){
        if (!tags || tags.length === 0) return true;


        var searchTags = tags || [];
        if (typeof tags === "string"){
            searchTags = tags.split(" ").map(t=>t.trim()).filter(Boolean);
        }
        var requiredTags = searchTags.filter(t=>!t.startsWith("!"));
        var excludedTags = searchTags.filter(t=>t.startsWith("!"));

        var output = []
        for(const todo of todos){
            var keep = 0;
            var hasExcluded = false;
            var todoTags = todo.tags || [];
            if(typeof todoTags === "string"){
                todoTags = todoTags.split(" ").map(t=>t.trim()).filter(Boolean);
            }

            if(todoTags.length === 0) continue;
            for (const t of requiredTags){
                for (const tt of todoTags){
                    if (tt === t) {
                        keep++
                        continue;
                    };
                    if (tt.startsWith(t)) keep++;
                }
                if (todo.message.includes(t)){
                    keep++;
                }
                if(todo.file.includes(t)){
                    keep++;
                }
            }
            for (const t of excludedTags){
                if (todoTags.includes(t.slice(1))) hasExcluded = true;
            }

            if (keep>=requiredTags.length && hasExcluded===false) output.push(todo);

        }

        return output;
    }


    function render() {
      const q = normalize(elSearch.value.trim());
      const status = elStatus.value;
      const tag = elTag.value;

      let filtered = ALL.slice();

      if (status !== "all") filtered = filtered.filter(t => t.status === status);
      <!-- if (tag) filtered = filtered.filter(t => (t.tags || []).includes(tag)); -->
      <!-- if (q) filtered = filtered.filter(t => matchesSearch(t, q)); -->
      if (q.length > 0){
        <!-- console.log("Filtering by search:", q); -->
        filtered = filterByTags(filtered, q)
      }

      const open = ALL.filter(t => t.status === "open").length;
      const done = ALL.filter(t => t.status === "done").length;
      elCounts.textContent = \`Total \${ALL.length} · Open \${open} · Done \${done}\`;
      elShown.textContent = \`Showing \${filtered.length}\`;

      if (filtered.length === 0) {
        elList.innerHTML = '<div class="empty">No items match the current filters.</div>';
        return;
      }

      elList.innerHTML = "";
      for (const t of filtered) {
        const card = document.createElement("div");
        card.className = "card";
        card.addEventListener("click", () => vscode.postMessage({ type: "open", payload: t }));

        const badgeClass = t.status === "open" ? "open" : "done";
        const badgeText = t.status === "open" ? "OPEN" : "DONE";

        const row1 = document.createElement("div");
        row1.className = "row1";

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = t.message || "(no message)";

        const badge = document.createElement("div");
        badge.className = "badge " + badgeClass;
        badge.textContent = badgeText;

        row1.appendChild(title);
        row1.appendChild(badge);

        const row2 = document.createElement("div");
        row2.className = "row2";

        const file = document.createElement("div");
        file.className = "file";
        file.textContent = \`\${t.file}:\${t.line}\`;
        row2.appendChild(file);

        if (t.status === "done" && t.timestamp) {
            const ts = document.createElement("div");
            ts.className = "ts";
            ts.textContent = t.timestamp;
            row2.appendChild(ts);
        }

        const tagsWrap = document.createElement("div");
        tagsWrap.className = "tags";

        const tags = (t.tags || []);
        if (tags.length === 0) {
            const tagEl = document.createElement("div");
            tagEl.className = "tag";
            tagEl.textContent = "(no tags)";
            tagsWrap.appendChild(tagEl);
        } else {
            for (const tg of tags) {
                const tagEl = document.createElement("div");
                tagEl.className = "tag";
                tagEl.textContent = tg;
                tagsWrap.appendChild(tagEl);
            }
        }

        card.appendChild(row1);
        card.appendChild(row2);
        card.appendChild(tagsWrap);

        elList.appendChild(card);
      }
    }

    function applySettings() {
      elAutoRefresh.checked = !!SETTINGS.autoRefreshOnSave;
    }

    elRefresh.addEventListener("click", () => vscode.postMessage({ type: "refresh" }));
    elSearch.addEventListener("input", () => render());
    elStatus.addEventListener("change", () => render());
    elTag.addEventListener("change", () => render());

    elAutoRefreshWrap.addEventListener("click", (e) => {
      if (e.target === elAutoRefresh) return;
      elAutoRefresh.checked = !elAutoRefresh.checked;
      vscode.postMessage({ type: "toggleAutoRefresh", payload: { enabled: elAutoRefresh.checked }});
    });
    elAutoRefresh.addEventListener("change", () => {
      vscode.postMessage({ type: "toggleAutoRefresh", payload: { enabled: elAutoRefresh.checked }});
    });

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "settings") {
        SETTINGS = msg.payload || SETTINGS;
        applySettings();
        return;
      }

      if (msg.type === "data") {
        const p = msg.payload || {};
        ALL = Array.isArray(p.todos) ? p.todos : [];
        TAGS = Array.isArray(p.tags) ? p.tags : [];

        setTagOptions(TAGS);

        elScanInfo.textContent = p.scannedAt ? \`Scanned: \${p.scannedAt}\` : "";
        render();
      }
    });

    vscode.postMessage({ type: "ready" });
  </script>
</body>
</html>`;
}

module.exports = {
  DEFAULT_OPTIONS,
  debounce,
  scanWorkspaceTodos,
  buildTodoPayload,
  buildHtml,
};
