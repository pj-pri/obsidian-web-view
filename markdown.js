/* Tiny Markdown parser with Obsidian extensions:
   - [[wiki links]] with optional |alias
   - #tags
   - Standard markdown: headings, bold, italic, code, links, lists, quotes, hr, tasks
*/

window.parseMarkdown = function parseMarkdown(src, opts = {}) {
  const { vaultFiles = [], onLinkClick = '' } = opts;
  const existingNotes = new Set(
    vaultFiles.map(f => f.replace(/\.md$/, '')).flatMap(f => {
      const parts = f.split('/');
      return [f, parts[parts.length - 1]];
    })
  );

  const escHtml = s => s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // Protect code blocks first
  const codeBlocks = [];
  src = src.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    codeBlocks.push(`<pre><code class="lang-${lang}">${escHtml(code)}</code></pre>`);
    return `\x00CB${i}\x00`;
  });

  const inline = (text) => {
    // Escape first
    text = escHtml(text);

    // Inline code
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

    // Standard markdown links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, l, u) =>
      `<a href="${u}" target="_blank" rel="noreferrer">${l}</a>`);

    // Bold + italic
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    text = text.replace(/(^|\s)_([^_\n]+)_/g, '$1<em>$2</em>');

    // Tags #word (not followed by more hashes; allow alphanumeric/underscore/-/slash)
    text = text.replace(/(^|\s)#([a-zA-Z][\w/-]*)/g, (m, sp, tag) =>
      `${sp}<a href="#" class="tag" data-tag="${tag}">#${tag}</a>`);

    // Restore inline code
    text = text.replace(/\x00IC(\d+)\x00/g, (_, i) => codes[+i]);

    return text;
  };

  const lines = src.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Protected code block
    if (line.startsWith('\x00CB')) {
      out.push(line);
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$|^_{3,}$|^\*{3,}$/.test(line.trim())) {
      out.push('<hr>');
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${inline(quoteLines.join('\n')).replace(/\n/g, '<br>')}</blockquote>`);
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
        let content = m[2];
        const task = content.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          const checked = task[1].toLowerCase() === 'x';
          out.push(`<li class="task"><input type="checkbox"${checked ? ' checked' : ''} disabled>${inline(task[2])}</li>`);
        } else {
          out.push(`<li>${inline(content)}</li>`);
        }
        i++;
      }
      out.push(`</${tag}>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Paragraph (collect until blank or block)
    const pLines = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^#{1,6}\s/.test(lines[i]) &&
           !/^>\s?/.test(lines[i]) &&
           !/^\s*-\s+/.test(lines[i]) &&
           !/^\s*\d+\.\s+/.test(lines[i]) &&
           !lines[i].startsWith('\x00CB') &&
           !/^-{3,}$|^_{3,}$|^\*{3,}$/.test(lines[i].trim())) {
      pLines.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(pLines.join('\n')).replace(/\n/g, '<br>')}</p>`);
  }

  let html = out.join('\n');
  // Restore code blocks
  html = html.replace(/\x00CB(\d+)\x00/g, (_, i) => codeBlocks[+i]);
  return html;
};

/* ---------- Link extraction (for backlinks & graph) ---------- */
window.extractLinks = function extractLinks(src) {
  const links = [];
  const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    links.push(m[1].trim());
  }
  return links;
};

window.extractTags = function extractTags(src) {
  const tags = new Set();
  const re = /(^|\s)#([a-zA-Z][\w/-]*)/g;
  let m;
  while ((m = re.exec(src)) !== null) tags.add(m[2]);
  return [...tags];
};

/* ---------- Find backlink contexts ---------- */
window.findBacklinkContexts = function(src, targetName) {
  const out = [];
  const lines = src.split('\n');
  const re = new RegExp(`\\[\\[${targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\|[^\\]]+)?(?:#[^\\]|]+)?\\]\\]`, 'g');
  // simpler re:
  const re2 = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  lines.forEach((line, idx) => {
    let m;
    re2.lastIndex = 0;
    while ((m = re2.exec(line)) !== null) {
      if (m[1].trim() === targetName) {
        out.push({ line: line.trim(), lineNo: idx + 1 });
        break;
      }
    }
  });
  return out;
};
