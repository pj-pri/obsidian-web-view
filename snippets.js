/* Markdown snippets + slash-command palette for the source textarea.
   Exports: window.SNIPPETS, window.useSnippets
*/

// A snippet defines:
//  - key: unique
//  - title, sub, icon (emoji-ish single char for toolbar)
//  - category: format | block | insert
//  - insert(sel, ctx) => { text, cursorOffset?, selOffset?, replaceLine? }
//      sel: currently selected text
//      returns text to insert/replace and where to put cursor

window.SNIPPETS = [
  // Headings
  { key: 'h1', title: 'Heading 1', sub: '# H1', icon: 'H1', category: 'block',
    insert: (sel) => ({ text: `# ${sel || 'Heading 1'}`, replaceLine: true }) },
  { key: 'h2', title: 'Heading 2', sub: '## H2', icon: 'H2', category: 'block',
    insert: (sel) => ({ text: `## ${sel || 'Heading 2'}`, replaceLine: true }) },
  { key: 'h3', title: 'Heading 3', sub: '### H3', icon: 'H3', category: 'block',
    insert: (sel) => ({ text: `### ${sel || 'Heading 3'}`, replaceLine: true }) },

  // Inline format
  { key: 'bold', title: 'Bold', sub: '**text**', icon: 'B', category: 'format',
    insert: (sel) => sel
      ? { text: `**${sel}**` }
      : { text: `**bold**`, selStart: 2, selEnd: 6 } },
  { key: 'italic', title: 'Italic', sub: '*text*', icon: 'I', category: 'format',
    insert: (sel) => sel
      ? { text: `*${sel}*` }
      : { text: `*italic*`, selStart: 1, selEnd: 7 } },
  { key: 'strike', title: 'Strikethrough', sub: '~~text~~', icon: 'S', category: 'format',
    insert: (sel) => sel
      ? { text: `~~${sel}~~` }
      : { text: `~~strike~~`, selStart: 2, selEnd: 8 } },
  { key: 'code', title: 'Inline code', sub: '`code`', icon: '</>', category: 'format',
    insert: (sel) => sel
      ? { text: `\`${sel}\`` }
      : { text: '`code`', selStart: 1, selEnd: 5 } },
  { key: 'highlight', title: 'Highlight', sub: '==text==', icon: '▓', category: 'format',
    insert: (sel) => sel
      ? { text: `==${sel}==` }
      : { text: '==highlight==', selStart: 2, selEnd: 11 } },

  // Lists
  { key: 'ul', title: 'Bulleted list', sub: '- item', icon: '•', category: 'block',
    insert: () => ({ text: `- item`, replaceLine: true, selStart: 2, selEnd: 6 }) },
  { key: 'ol', title: 'Numbered list', sub: '1. item', icon: '1.', category: 'block',
    insert: () => ({ text: `1. item`, replaceLine: true, selStart: 3, selEnd: 7 }) },
  { key: 'task', title: 'Task checkbox', sub: '- [ ] todo', icon: '☐', category: 'block',
    insert: (sel) => ({ text: `- [ ] ${sel || 'task'}`, replaceLine: true,
                       selStart: sel ? undefined : 6, selEnd: sel ? undefined : 10 }) },
  { key: 'taskdone', title: 'Task (done)', sub: '- [x] done', icon: '☑', category: 'block',
    insert: (sel) => ({ text: `- [x] ${sel || 'task'}`, replaceLine: true }) },

  // Links
  { key: 'wikilink', title: 'Wiki link', sub: '[[Note]]', icon: '[[]]', category: 'insert',
    insert: (sel) => sel
      ? { text: `[[${sel}]]` }
      : { text: '[[Note]]', selStart: 2, selEnd: 6 } },
  { key: 'link', title: 'Link', sub: '[label](url)', icon: '🔗', category: 'insert',
    insert: (sel) => ({
      text: `[${sel || 'label'}](https://)`,
      selStart: (sel ? sel.length : 5) + 3,
      selEnd: (sel ? sel.length : 5) + 11,
    }) },
  { key: 'image', title: 'Image', sub: '![alt](url)', icon: '🖼', category: 'insert',
    insert: (sel) => ({
      text: `![${sel || 'alt'}](https://)`,
      selStart: (sel ? sel.length : 3) + 4,
      selEnd: (sel ? sel.length : 3) + 12,
    }) },
  { key: 'tag', title: 'Tag', sub: '#tag', icon: '#', category: 'insert',
    insert: (sel) => ({ text: `#${sel || 'tag'}`,
                       selStart: sel ? undefined : 1, selEnd: sel ? undefined : 4 }) },

  // Blocks
  { key: 'quote', title: 'Blockquote', sub: '> ...', icon: '"', category: 'block',
    insert: (sel) => ({ text: `> ${sel || 'quote'}`, replaceLine: true,
                       selStart: sel ? undefined : 2, selEnd: sel ? undefined : 7 }) },
  { key: 'codeblock', title: 'Code block', sub: '```lang', icon: '{}', category: 'block',
    insert: (sel) => ({
      text: '```js\n' + (sel || 'code') + '\n```',
      replaceLine: true,
      selStart: 6,
      selEnd: 6 + (sel ? sel.length : 4),
    }) },
  { key: 'hr', title: 'Divider', sub: '---', icon: '—', category: 'block',
    insert: () => ({ text: '\n---\n', replaceLine: false }) },
  { key: 'callout-note', title: 'Callout — note', sub: '> [!note]', icon: 'ℹ', category: 'block',
    insert: (sel) => ({
      text: `> [!note]\n> ${sel || 'Your note here'}`,
      replaceLine: true,
    }) },
  { key: 'callout-warn', title: 'Callout — warning', sub: '> [!warning]', icon: '⚠', category: 'block',
    insert: (sel) => ({
      text: `> [!warning]\n> ${sel || 'Be careful'}`,
      replaceLine: true,
    }) },

  // Tables
  { key: 'table2', title: 'Table (2 cols)', sub: '| a | b |', icon: '⊞', category: 'block',
    insert: () => ({
      text: '| Col 1 | Col 2 |\n| --- | --- |\n| a | b |\n| c | d |',
      replaceLine: true,
    }) },
  { key: 'table3', title: 'Table (3 cols)', sub: '| a | b | c |', icon: '⊞⊞', category: 'block',
    insert: () => ({
      text: '| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n|   |   |   |\n|   |   |   |',
      replaceLine: true,
    }) },

  // Specials
  { key: 'daily', title: 'Daily note header', sub: 'date + sections', icon: '📅', category: 'insert',
    insert: () => {
      const d = new Date().toISOString().slice(0, 10);
      return { text: `# ${d}\n\n## 🌅 Morning\n- \n\n## 🧠 Thoughts\n\n\n## 🌙 Evening\n- \n\n#daily`, replaceLine: true };
    } },
  { key: 'date', title: 'Today\'s date', sub: 'YYYY-MM-DD', icon: '📆', category: 'insert',
    insert: () => ({ text: new Date().toISOString().slice(0, 10) }) },
  { key: 'time', title: 'Now (HH:MM)', sub: 'time', icon: '🕒', category: 'insert',
    insert: () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return { text: `${hh}:${mm}` };
    } },
];

/* ---------- Applier: runs a snippet against a textarea ---------- */
window.applySnippet = function applySnippet(ta, snippet) {
  const v = ta.value;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const sel = v.slice(s, e);

  const res = snippet.insert(sel, { value: v, selStart: s, selEnd: e });
  if (!res) return;

  let insertAt = s;
  let removeUntil = e;
  let text = res.text;

  if (res.replaceLine) {
    // Replace the current line content (or insert at start of empty line)
    let ls = s;
    while (ls > 0 && v[ls - 1] !== '\n') ls--;
    let le = e;
    while (le < v.length && v[le] !== '\n') le++;
    const currentLine = v.slice(ls, le);
    if (currentLine.trim() === '') {
      insertAt = ls;
      removeUntil = le;
    } else {
      // Append on a new line after current paragraph
      insertAt = le;
      removeUntil = le;
      text = '\n' + text;
    }
  }

  const newVal = v.slice(0, insertAt) + text + v.slice(removeUntil);
  // Compute caret
  let caretStart, caretEnd;
  if (res.selStart != null) {
    const base = insertAt + (res.replaceLine && text.startsWith('\n') ? 1 : 0);
    caretStart = base + res.selStart;
    caretEnd = base + (res.selEnd ?? res.selStart);
  } else {
    caretStart = caretEnd = insertAt + text.length;
  }

  ta.value = newVal;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
  ta.setSelectionRange(caretStart, caretEnd);
};
