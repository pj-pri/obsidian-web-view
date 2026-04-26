/* Tiny Markdown parser with Obsidian extensions:
   - frontmatter (YAML key: value)
   - [[wiki links]] with optional |alias
   - #tags, headings with IDs, tables, tasks (togglable), code blocks
*/

window.parseFrontmatter = function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: src };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) return;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      meta[key] = val;
    }
  });
  return { meta, body: src.slice(match[0].length) };
};

window.parseMarkdown = function parseMarkdown(src, opts = {}) {
  const { vaultFiles = [] } = opts;
  const existingNotes = new Set(
    vaultFiles.map(f => f.replace(/\.md$/, '')).flatMap(f => {
      const parts = f.split('/');
      return [f, parts[parts.length - 1]];
    })
  );

  const { meta, body } = window.parseFrontmatter(src);
  src = body;

  const escHtml = s => s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const slugify = s => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  // Protect fenced code blocks
  const codeBlocks = [];
  src = src.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const langClass = lang ? ` class="language-${escHtml(lang)}"` : '';
    codeBlocks.push(`<pre><code${langClass}>${escHtml(code.replace(/\n$/, ''))}</code></pre>`);
    return `\x00CB${idx}\x00`;
  });

  const inline = (text) => {
    text = escHtml(text);
    const codes = [];
    text = text.replace(/`([^`]+)`/g, (_, c) => {
      codes.push(`<code>${c}</code>`);
      return `\x00IC${codes.length - 1}\x00`;
    });
    // Wiki links [[Note|alias]] or [[Note#heading]] or [[Note]]
    text = text.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      target = target.trim();
      const label = (alias || target).trim();
      const exists = existingNotes.has(target) || existingNotes.has(target + '.md');
      const cls = exists ? 'internal-link' : 'internal-link unresolved';
      return `<a href="#" class="${cls}" data-link="${escHtml(target)}">${escHtml(label)}</a>`;
    });
    // Standard [text](url) links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, l, u) =>
      `<a href="${u}" target="_blank" rel="noreferrer">${l}</a>`);
    // Bold / italic
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    text = text.replace(/(^|\s)_([^_\n]+)_/g, '$1<em>$2</em>');
    // Strikethrough
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    // Highlight ==text==
    text = text.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    // Tags
    text = text.replace(/(^|\s)#([a-zA-Z][\w/-]*)/g, (m, sp, tag) =>
      `${sp}<a href="#" class="tag" data-tag="${tag}">#${tag}</a>`);
    text = text.replace(/\x00IC(\d+)\x00/g, (_, i) => codes[+i]);
    return text;
  };

  const isTableRow = line => /^\|.*\|/.test(line.trim());
  const isTableSep = line => /^\|[\s\-:|]+\|$/.test(line.trim());

  const lines = src.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Protected code block
    if (line.startsWith('\x00CB')) { out.push(line); i++; continue; }

    // Heading (with id for anchor navigation)
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const id = slugify(text.replace(/[*_[\]]/g, ''));
      out.push(`<h${level} id="${escHtml(id)}">${inline(text)}</h${level}>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^-{3,}$|^_{3,}$|^\*{3,}$/.test(line.trim())) { out.push('<hr>'); i++; continue; }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const headers = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
        i++;
      }
      const thead = `<thead><tr>${headers.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead>`;
      const tbody = rows.length
        ? `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
        : '';
      out.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const ql = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { ql.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${inline(ql.join('\n')).replace(/\n/g, '<br>')}</blockquote>`);
      continue;
    }

    // Lists (unordered / ordered / tasks)
    const ulMatch = line.match(/^(\s*)-\s+(.*)$/);
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (ulMatch || olMatch) {
      const isOl = !!olMatch;
      const tag = isOl ? 'ol' : 'ul';
      out.push(`<${tag}>`);
      while (i < lines.length) {
        const m = lines[i].match(isOl ? /^(\s*)\d+\.\s+(.*)$/ : /^(\s*)-\s+(.*)$/);
        if (!m) break;
        const task = m[2].match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          const checked = task[1].toLowerCase() === 'x';
          // Store original raw line for toggle identification
          const rawLine = lines[i];
          out.push(`<li class="task-item"><input type="checkbox"${checked ? ' checked' : ''} data-task-line="${escHtml(rawLine)}">${inline(task[2])}</li>`);
        } else {
          out.push(`<li>${inline(m[2])}</li>`);
        }
        i++;
      }
      out.push(`</${tag}>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Paragraph
    const pLines = [line]; i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^#{1,6}\s/.test(lines[i]) && !/^>\s?/.test(lines[i]) &&
           !/^\s*-\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) &&
           !lines[i].startsWith('\x00CB') &&
           !/^-{3,}$|^_{3,}$|^\*{3,}$/.test(lines[i].trim()) &&
           !isTableRow(lines[i])) {
      pLines.push(lines[i]); i++;
    }
    out.push(`<p>${inline(pLines.join('\n')).replace(/\n/g, '<br>')}</p>`);
  }

  let html = out.join('\n');
  html = html.replace(/\x00CB(\d+)\x00/g, (_, i) => codeBlocks[+i]);

  // Frontmatter block
  const metaKeys = Object.keys(meta);
  if (metaKeys.length > 0) {
    const rows = metaKeys.map(key => {
      const val = meta[key];
      const display = Array.isArray(val)
        ? val.map(t => `<a href="#" class="tag" data-tag="${escHtml(t)}">#${escHtml(t)}</a>`).join(' ')
        : escHtml(String(val));
      return `<div class="fm-row"><span class="fm-key">${escHtml(key)}</span><span class="fm-val">${display}</span></div>`;
    }).join('');
    html = `<div class="frontmatter-block">${rows}</div>` + html;
  }

  return html;
};

/* ---------- TOC extraction ---------- */
window.extractToc = function extractToc(src) {
  const { body } = window.parseFrontmatter(src);
  const toc = [];
  const re = /^(#{1,6})\s+(.*)$/gm;
  let m;
  while ((m = re.exec(body)) !== null) {
    const text = m[2].replace(/[*_[\]`]/g, '').trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    toc.push({ level: m[1].length, text, id });
  }
  return toc;
};

/* ---------- Link extraction (for backlinks & graph) ---------- */
window.extractLinks = function extractLinks(src) {
  const links = [];
  const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(src)) !== null) links.push(m[1].trim());
  return links;
};

window.extractTags = function extractTags(src) {
  const tags = new Set();
  const re = /(^|\s)#([a-zA-Z][\w/-]*)/g;
  let m;
  while ((m = re.exec(src)) !== null) tags.add(m[2]);
  return [...tags];
};

window.findBacklinkContexts = function(src, targetName) {
  const out = [];
  const lines = src.split('\n');
  const re2 = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  lines.forEach((line, idx) => {
    let m;
    re2.lastIndex = 0;
    while ((m = re2.exec(line)) !== null) {
      if (m[1].trim() === targetName) { out.push({ line: line.trim(), lineNo: idx + 1 }); break; }
    }
  });
  return out;
};
