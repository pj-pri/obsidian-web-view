/* Obsidian-style Vault App — main */

const { useState, useEffect, useMemo, useCallback, useRef } = React;

/* ---------- Icons (lucide-style inline SVG) ---------- */
const Icon = ({ name, size = 16 }) => {
  const paths = {
    'files': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 10 12 15 7 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    'folder': <><path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.18" stroke="currentColor"/></>,
    'folder-open': <><path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v.5H3z" fill="currentColor" fillOpacity="0.18" stroke="currentColor"/><path d="M3 10h18l-2 7.5a2 2 0 0 1-2 1.5H5a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.28" stroke="currentColor"/></>,
    'file': <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" fill="currentColor" fillOpacity="0.12" stroke="currentColor"/><path d="M13 3v5a2 2 0 0 0 2 2h5" stroke="currentColor"/><line x1="8" y1="13" x2="15" y2="13" stroke="currentColor" strokeOpacity="0.55"/><line x1="8" y1="16" x2="13" y2="16" stroke="currentColor" strokeOpacity="0.55"/></>,
    'search': <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    'chevron-right': <polyline points="10 17 15 12 10 7"/>,
    'chevron-down': <polyline points="7 10 12 15 17 10"/>,
    'graph': <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    'tag': <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></>,
    'x': <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    'plus': <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    'sun': <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    'moon': <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    'upload': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    'settings': <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    'command': <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>,
    'eye': <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    'edit': <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    'panel-right': <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></>,
    'panel-left': <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></>,
    'keyboard': <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="7" y1="9" x2="7" y2="9"/><line x1="11" y1="9" x2="11" y2="9"/><line x1="15" y1="9" x2="15" y2="9"/><line x1="7" y1="13" x2="7" y2="13"/><line x1="17" y1="9" x2="17" y2="9"/><line x1="17" y1="13" x2="17" y2="13"/><line x1="10" y1="16" x2="14" y2="16"/></>,
    'help': <><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2v.2"/><line x1="12" y1="17" x2="12" y2="17.01"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      {paths[name]}
    </svg>
  );
};

/* ---------- File tree helpers ---------- */

function SnippetToolbar({ taRef }) {
  const apply = (snip) => {
    const ta = taRef.current;
    if (!ta) return;
    window.applySnippet(ta, snip);
  };
  const shortcutFor = (key) => {
    if (key === 'bold') return MOD + ' B';
    if (key === 'italic') return MOD + ' I';
    if (key === 'link') return MOD + ' K';
    return null;
  };
  const toolbar = [
    { key: 'h1', cls: '', label: 'H1' },
    { key: 'h2', cls: '', label: 'H2' },
    { key: 'h3', cls: '', label: 'H3' },
    'div',
    { key: 'bold', cls: 'bold', label: 'B' },
    { key: 'italic', cls: 'italic', label: 'I' },
    { key: 'strike', cls: '', label: 'S̶' },
    { key: 'highlight', cls: '', label: '⬤', titleOverride: 'Highlight' },
    'div',
    { key: 'ul', cls: '', label: '•' },
    { key: 'ol', cls: '', label: '1.' },
    { key: 'task', cls: '', label: '☐' },
    'div',
    { key: 'wikilink', cls: '', label: '[[ ]]' },
    { key: 'link', cls: '', label: '🔗' },
    { key: 'tag', cls: '', label: '#' },
    'div',
    { key: 'quote', cls: '', label: '“”' },
    { key: 'code', cls: '', label: '<∕>' },
    { key: 'codeblock', cls: '', label: '{}' },
    { key: 'table2', cls: '', label: '⊞' },
    { key: 'hr', cls: '', label: '—' },
    'div',
    { key: 'daily', cls: '', label: '📅' },
    { key: 'date', cls: '', label: '📆' },
  ];
  return (
    <div className="snippet-toolbar">
      {toolbar.map((item, i) => {
        if (item === 'div') return <div key={'d'+i} className="snip-divider" />;
        const snip = window.SNIPPETS.find(s => s.key === item.key);
        if (!snip) return null;
        return (
          <button
            key={item.key}
            className={'snip-btn ' + item.cls}
            title={(() => {
              const base = (item.titleOverride || snip.title) + ' — ' + snip.sub;
              const sc = shortcutFor(item.key);
              return sc ? base + '  (' + sc + ')' : base;
            })()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(snip)}
          >
            {item.label}
          </button>
        );
      })}
      <div className="snip-hint">Type <kbd>/</kbd> for menu</div>
    </div>
  );
}

function SlashMenu({ query, index, onHover, onPick, anchor }) {
  const q = query.toLowerCase();
  const items = !q ? window.SNIPPETS :
    window.SNIPPETS.filter(s =>
      s.key.includes(q) || s.title.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
    );
  const itemsRef = React.useRef(null);
  React.useEffect(() => {
    const el = itemsRef.current?.querySelector('.sm-item.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [index]);
  return (
    <div className="slash-menu" style={{ top: anchor.top, left: anchor.left }}>
      <div className="sm-header">Insert — snippets</div>
      <div className="sm-list" ref={itemsRef}>
        {items.length === 0 && <div className="sm-empty">No matches</div>}
        {items.map((s, i) => (
          <div
            key={s.key}
            className={'sm-item ' + (i === index ? 'active' : '')}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => { e.preventDefault(); onPick(s); }}
          >
            <span className="sm-icon">{s.icon}</span>
            <div className="sm-text">
              <div className="sm-title">{s.title}</div>
              <div className="sm-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shortcuts registry + cheatsheet modal ---------- */
const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

const SHORTCUT_GROUPS = [
  {
    name: 'Navigation',
    items: [
      { keys: [MOD, 'P'], label: 'Open quick switcher / command palette' },
      { keys: ['Esc'], label: 'Close menu or dialog' },
      { keys: ['?'], label: 'Show this shortcuts sheet' },
      { keys: [MOD, '/'], label: 'Show this shortcuts sheet' },
    ],
  },
  {
    name: 'Formatting (in editor)',
    items: [
      { keys: [MOD, 'B'], label: 'Bold' },
      { keys: [MOD, 'I'], label: 'Italic' },
      { keys: [MOD, 'K'], label: 'Insert link' },
    ],
  },
  {
    name: 'Insert menu',
    items: [
      { keys: ['/'], label: 'Open snippet menu (line start or after space)' },
      { keys: ['↑', '↓'], label: 'Navigate menu items' },
      { keys: ['Enter'], label: 'Insert selected snippet' },
      { keys: ['Tab'], label: 'Insert selected snippet' },
    ],
  },
  {
    name: 'Files',
    items: [
      { keys: ['Click'], label: 'Open a note from the sidebar' },
      { keys: ['Click'], label: 'Toggle folder expand/collapse' },
      { keys: ['Right-click'], label: 'File/folder context menu (rename, delete)' },
      { keys: ['Drop'], label: 'Drop .md files anywhere to import' },
    ],
  },
];

function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

function ShortcutsModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sc-head">
          <div className="sc-title">
            <Icon name="keyboard" size={16} />
            <span>Keyboard shortcuts</span>
          </div>
          <button className="sc-close" onClick={onClose} title="Close (Esc)">
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="sc-body">
          {SHORTCUT_GROUPS.map(grp => (
            <div key={grp.name} className="sc-group">
              <div className="sc-group-name">{grp.name}</div>
              <div className="sc-rows">
                {grp.items.map((it, i) => (
                  <div key={i} className="sc-row">
                    <div className="sc-label">{it.label}</div>
                    <div className="sc-keys">
                      {it.keys.map((k, j) => (
                        <React.Fragment key={j}>
                          <Kbd>{k}</Kbd>
                          {j < it.keys.length - 1 && <span className="sc-plus">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="sc-foot">
          Press <Kbd>?</Kbd> anytime to open this sheet.
        </div>
      </div>
    </div>
  );
}

function buildTree(files) {
  const root = { folders: {}, files: [] };
  Object.keys(files).sort().forEach(path => {
    const parts = path.split('/');
    const fname = parts.pop();
    let node = root;
    parts.forEach(p => {
      if (!node.folders[p]) node.folders[p] = { folders: {}, files: [], name: p };
      node = node.folders[p];
    });
    node.files.push({ name: fname, path });
  });
  return root;
}

function TreeNode({ node, path, activeFile, onOpen, collapsed, toggle, onCtxMenu, depth = 0 }) {
  const folderKeys = Object.keys(node.folders).sort();
  return (
    <div>
      {folderKeys.map(fname => {
        const fpath = path ? `${path}/${fname}` : fname;
        const isCollapsed = collapsed.has(fpath);
        return (
          <div key={fpath}>
            <div
              className="tree-item"
              style={{ paddingLeft: 6 + depth * 14 }}
              onClick={() => toggle(fpath)}
              onContextMenu={(e) => { e.preventDefault(); onCtxMenu && onCtxMenu(e, 'folder', fpath); }}
            >
              <span className={`chevron ${isCollapsed ? 'collapsed' : ''}`}>
                <Icon name="chevron-down" size={12} />
              </span>
              <span className="file-icon folder"><Icon name={isCollapsed ? 'folder' : 'folder-open'} size={15} /></span>
              <span className="label">{fname}</span>
            </div>
            {!isCollapsed && (
              <TreeNode
                node={node.folders[fname]}
                path={fpath}
                activeFile={activeFile}
                onOpen={onOpen}
                collapsed={collapsed}
                toggle={toggle}
                onCtxMenu={onCtxMenu}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
      {node.files.map(f => (
        <div
          key={f.path}
          className={`tree-item ${activeFile === f.path ? 'active' : ''}`}
          style={{ paddingLeft: 6 + depth * 14 + 18 }}
          onClick={() => onOpen(f.path)}
          onContextMenu={(e) => { e.preventDefault(); onCtxMenu && onCtxMenu(e, 'file', f.path); }}
        >
          <span className="chevron hidden"></span>
          <span className="file-icon note"><Icon name="file" size={15} /></span>
          <span className="label">{f.name.replace(/\.md$/, '')}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Context menu ---------- */
function ContextMenu({ menu, onClose, onAction }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  return (
    <div
      className="ctx-menu"
      style={{ top: menu.y, left: menu.x }}
      onClick={e => e.stopPropagation()}
      onContextMenu={e => e.stopPropagation()}
    >
      {menu.type === 'file' && <>
        <button className="ctx-item" onMouseDown={() => onAction('rename', menu.path)}>Rename</button>
        <button className="ctx-item ctx-danger" onMouseDown={() => onAction('delete', menu.path)}>Delete</button>
        <div className="ctx-sep" />
        <button className="ctx-item" onMouseDown={() => { navigator.clipboard?.writeText(menu.path); onClose(); }}>Copy path</button>
      </>}
      {menu.type === 'folder' && <>
        <button className="ctx-item" onMouseDown={() => onAction('newNote', menu.path)}>New note here</button>
        <div className="ctx-sep" />
        <button className="ctx-item" onMouseDown={() => onAction('renameFolder', menu.path)}>Rename folder</button>
      </>}
    </div>
  );
}

/* ---------- Main App ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "viewMode": "split",
  "accentColor": "#7a5cff",
  "sidebarWidth": 260,
  "rightbarWidth": 300,
  "fontSize": 14,
  "graphInMain": false
}/*EDITMODE-END*/;

const SAMPLE_DEFAULT_FILE = 'Welcome.md';

function getVaultApiBaseUrl() {
  const configured = window.OBSIDIAN_WEB_VAULT_CONFIG?.apiBaseUrl || '';
  return configured.replace(/\/+$/, '');
}

function getVaultApiUrl(pathname = '/api/vault') {
  const base = getVaultApiBaseUrl();
  return base ? `${base}${pathname}` : pathname;
}

function encodePath(filePath) {
  return (filePath || '').split('/').map(encodeURIComponent).join('/');
}

function firstFilePath(fileMap, preferredPath) {
  const paths = Object.keys(fileMap).sort();
  if (preferredPath && fileMap[preferredPath]) return preferredPath;
  if (fileMap[SAMPLE_DEFAULT_FILE]) return SAMPLE_DEFAULT_FILE;
  return paths[0] || null;
}

function normalizeTabs(fileMap, tabs, fallbackPath) {
  const seen = new Set();
  const nextTabs = (tabs || []).filter((tab) => {
    if (!fileMap[tab] || seen.has(tab)) return false;
    seen.add(tab);
    return true;
  });
  if (!nextTabs.length && fallbackPath) nextTabs.push(fallbackPath);
  return nextTabs;
}

function App() {
  const [files, setFiles] = useState(() => ({ ...window.SAMPLE_VAULT }));
  const [openTabs, setOpenTabs] = useState([SAMPLE_DEFAULT_FILE]);
  const [activeTab, setActiveTab] = useState(SAMPLE_DEFAULT_FILE);
  const [collapsed, setCollapsed] = useState(new Set());
  const [rightTab, setRightTab] = useState('backlinks');
  const [theme, setTheme] = useState(TWEAK_DEFAULTS.theme);
  const [viewMode, setViewMode] = useState(TWEAK_DEFAULTS.viewMode);
  const [accentColor, setAccentColor] = useState(TWEAK_DEFAULTS.accentColor);
  const [sidebarWidth, setSidebarWidth] = useState(TWEAK_DEFAULTS.sidebarWidth);
  const [rightbarWidth, setRightbarWidth] = useState(TWEAK_DEFAULTS.rightbarWidth);
  const [fontSize, setFontSize] = useState(TWEAK_DEFAULTS.fontSize);
  const [graphInMain, setGraphInMain] = useState(TWEAK_DEFAULTS.graphInMain);
  const [search, setSearch] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightbar, setShowRightbar] = useState(true);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [vaultSource, setVaultSource] = useState('sample');
  const [vaultRoot, setVaultRoot] = useState('');
  const [vaultApiBase] = useState(() => getVaultApiBaseUrl());
  const [storageReady, setStorageReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved'|'saving'|'unsaved'|'error'
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, type: 'file'|'folder', path }
  const [serverSearchResults, setServerSearchResults] = useState(null); // null | Array

  // Persistence
  useEffect(() => {
    let cancelled = false;

    const readSavedState = () => {
      try {
        const raw = localStorage.getItem('obsidian-vault-state');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    };

    const applyVaultState = (nextFiles, source, preferredPath, savedState, nextRoot = '') => {
      const firstPath = firstFilePath(nextFiles, preferredPath);
      const nextTabs = normalizeTabs(nextFiles, savedState?.openTabs, firstPath);
      const nextActive = nextFiles[savedState?.activeTab] ? savedState.activeTab : (nextTabs[0] || firstPath);
      setFiles(nextFiles);
      setOpenTabs(nextTabs);
      setActiveTab(nextActive);
      setVaultSource(source);
      setVaultRoot(nextRoot);
    };

    const loadInitialState = async () => {
      const saved = readSavedState();
      try {
        const response = await fetch(getVaultApiUrl('/api/vault'), { cache: 'no-store' });
        if (!cancelled && response.ok) {
          const data = await response.json();
          applyVaultState(data.files || {}, 'server', data.defaultFile, saved, data.root || '');
          setStorageReady(true);
          return;
        }
      } catch (e) {}

      if (cancelled) return;
      if (saved?.files) {
        applyVaultState(saved.files, 'local', saved.activeTab, saved);
      } else {
        applyVaultState({ ...window.SAMPLE_VAULT }, 'sample', SAMPLE_DEFAULT_FILE, null);
      }
      setStorageReady(true);
    };

    void loadInitialState();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const payload = { activeTab, openTabs };
    if (vaultSource !== 'server') payload.files = files;
    localStorage.setItem('obsidian-vault-state', JSON.stringify(payload));
  }, [files, activeTab, openTabs, storageReady, vaultSource]);

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty('--interactive-accent', accentColor);
    document.documentElement.style.setProperty('--text-accent', accentColor);
    document.documentElement.style.setProperty('--graph-node', accentColor);
  }, [accentColor]);
  useEffect(() => {
    document.body.style.fontSize = fontSize + 'px';
  }, [fontSize]);

  // Tweaks protocol
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      else if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const persistTweak = (edits) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  };

  // File operations
  const openFile = useCallback((path) => {
    if (!openTabs.includes(path)) setOpenTabs(t => [...t, path]);
    setActiveTab(path);
    if (graphInMain) setGraphInMain(false);
  }, [openTabs, graphInMain]);
  const closeTab = useCallback((path, e) => {
    e?.stopPropagation();
    const idx = openTabs.indexOf(path);
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeTab === path) {
      setActiveTab(newTabs[Math.min(idx, newTabs.length - 1)] || null);
    }
  }, [openTabs, activeTab]);
  const toggleFolder = (p) => {
    setCollapsed(c => {
      const n = new Set(c);
      if (n.has(p)) n.delete(p); else n.add(p);
      return n;
    });
  };

  // Link click handler
  const handleInternalLink = useCallback((target) => {
    const candidates = Object.keys(files);
    let match = candidates.find(p => p === target + '.md' || p === target);
    if (!match) match = candidates.find(p => p.endsWith('/' + target + '.md') || p.endsWith('/' + target));
    if (match) {
      openFile(match);
    } else {
      const newPath = target + '.md';
      setFiles(f => ({ ...f, [newPath]: `# ${target}\n\n` }));
      openFile(newPath);
    }
  }, [files, openFile]);

  const handleTagClick = useCallback((tag) => {
    setRightTab('tags');
    setSearch('#' + tag);
  }, []);

  const updateContent = (path, content) => {
    setFiles(f => ({ ...f, [path]: content }));
  };

  // Context menu actions
  const handleCtxAction = async (action, targetPath) => {
    setCtxMenu(null);

    if (action === 'rename') {
      const oldBasename = targetPath.split('/').pop().replace(/\.md$/, '');
      const newName = prompt('Rename to:', oldBasename);
      if (!newName || newName === oldBasename) return;
      const dir = targetPath.includes('/') ? targetPath.split('/').slice(0, -1).join('/') + '/' : '';
      const newPath = dir + newName + (newName.endsWith('.md') ? '' : '.md');
      if (newPath === targetPath) return;

      if (vaultSource === 'server') {
        const r = await fetch(getVaultApiUrl('/api/vault/files/' + encodePath(targetPath)), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPath }),
        });
        if (!r.ok) { alert('Rename failed'); return; }
      }
      setFiles(f => { const n = { ...f }; n[newPath] = n[targetPath]; delete n[targetPath]; return n; });
      setOpenTabs(t => t.map(p => p === targetPath ? newPath : p));
      setActiveTab(a => a === targetPath ? newPath : a);
    }

    if (action === 'delete') {
      if (!confirm(`Move "${targetPath.split('/').pop()}" to .trash?`)) return;
      if (vaultSource === 'server') {
        const r = await fetch(getVaultApiUrl('/api/vault/files/' + encodePath(targetPath)), { method: 'DELETE' });
        if (!r.ok) { alert('Delete failed'); return; }
      }
      setFiles(f => { const n = { ...f }; delete n[targetPath]; return n; });
      closeTab(targetPath);
    }

    if (action === 'newNote') {
      const name = prompt('Note name:', '');
      if (!name) return;
      const filePath = (targetPath ? targetPath + '/' : '') + (name.endsWith('.md') ? name : name + '.md');
      const content = `# ${name.replace(/\.md$/, '')}\n\n`;
      if (vaultSource === 'server') {
        const r = await fetch(getVaultApiUrl('/api/vault/files/' + encodePath(filePath)), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!r.ok) { alert('Create failed'); return; }
      }
      setFiles(f => ({ ...f, [filePath]: content }));
      openFile(filePath);
    }

    if (action === 'renameFolder') {
      const oldName = targetPath.split('/').pop();
      const newName = prompt('Rename folder to:', oldName);
      if (!newName || newName === oldName) return;
      const parentDir = targetPath.includes('/') ? targetPath.split('/').slice(0, -1).join('/') + '/' : '';
      const newFolderPath = parentDir + newName;
      const toRename = Object.keys(files).filter(p => p === targetPath || p.startsWith(targetPath + '/'));
      for (const fp of toRename) {
        const newFilePath = newFolderPath + fp.slice(targetPath.length);
        if (vaultSource === 'server') {
          await fetch(getVaultApiUrl('/api/vault/files/' + encodePath(fp)), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPath: newFilePath }),
          });
        }
        setFiles(f => { const n = { ...f }; n[newFilePath] = n[fp]; delete n[fp]; return n; });
        setOpenTabs(t => t.map(p => p === fp ? newFilePath : p));
        setActiveTab(a => a === fp ? newFilePath : a);
      }
    }
  };

  // Backlinks for active
  const backlinks = useMemo(() => {
    if (!activeTab) return [];
    const targetName = activeTab.replace(/\.md$/, '').split('/').pop();
    const fullName = activeTab.replace(/\.md$/, '');
    const out = [];
    Object.entries(files).forEach(([p, content]) => {
      if (p === activeTab) return;
      const contexts = window.findBacklinkContexts(content, targetName);
      const fullContexts = fullName !== targetName ? window.findBacklinkContexts(content, fullName) : [];
      const all = [...contexts, ...fullContexts];
      if (all.length) {
        out.push({ path: p, contexts: all });
      }
    });
    return out;
  }, [activeTab, files]);

  // Outgoing links
  const outgoing = useMemo(() => {
    if (!activeTab || !files[activeTab]) return [];
    const links = window.extractLinks(files[activeTab]);
    return [...new Set(links)].map(t => {
      const candidates = Object.keys(files);
      const match = candidates.find(p => p === t + '.md' || p === t ||
                     p.endsWith('/' + t + '.md') || p.endsWith('/' + t));
      return { target: t, exists: !!match, path: match };
    });
  }, [activeTab, files]);

  // Graph data
  const graphData = useMemo(() => {
    const nodesMap = {};
    const linksArr = [];
    Object.keys(files).forEach(p => {
      const label = p.replace(/\.md$/, '').split('/').pop();
      nodesMap[p] = { id: p, label, degree: 0 };
    });
    Object.entries(files).forEach(([p, content]) => {
      const links = window.extractLinks(content);
      links.forEach(t => {
        const candidates = Object.keys(files);
        const targetPath = candidates.find(x => x === t + '.md' || x === t ||
                           x.endsWith('/' + t + '.md') || x.endsWith('/' + t));
        if (targetPath && targetPath !== p) {
          linksArr.push({ source: p, target: targetPath });
          nodesMap[p].degree++;
          nodesMap[targetPath].degree++;
        }
      });
    });
    return { nodes: Object.values(nodesMap), links: linksArr };
  }, [files]);

  // Tag aggregation
  const allTags = useMemo(() => {
    const counts = {};
    Object.entries(files).forEach(([p, content]) => {
      window.extractTags(content).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [files]);

  // Filtered tree by search
  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    if (q.startsWith('#')) {
      const tag = q.slice(1);
      const result = {};
      Object.entries(files).forEach(([p, c]) => {
        if (window.extractTags(c).some(t => t.toLowerCase().includes(tag))) result[p] = c;
      });
      return result;
    }
    const result = {};
    Object.entries(files).forEach(([p, c]) => {
      if (p.toLowerCase().includes(q) || c.toLowerCase().includes(q)) result[p] = c;
    });
    return result;
  }, [files, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setCmdOpen(true);
        setCmdQuery('');
        setCmdIndex(0);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(s => !s);
      }
      if (e.key === '?' && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(s => !s);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setCtxMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Command palette items
  const cmdItems = useMemo(() => {
    const q = cmdQuery.toLowerCase();
    const fileItems = Object.keys(files)
      .filter(p => !q || p.toLowerCase().includes(q))
      .slice(0, 30)
      .map(p => ({ label: p.replace(/\.md$/, ''), sub: p, action: () => openFile(p) }));
    return fileItems;
  }, [cmdQuery, files]);

  const runCmd = (item) => {
    item.action();
    setCmdOpen(false);
  };

  // Drop handling
  useEffect(() => {
    const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const onDragLeave = (e) => {
      if (e.target === document.documentElement) setDragOver(false);
    };
    const onDrop = async (e) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = [...(e.dataTransfer.files || [])].filter(f => f.name.endsWith('.md'));
      if (!dropped.length) return;
      const additions = {};
      for (const f of dropped) {
        const text = await f.text();
        additions[f.name] = text;
      }
      setFiles(curr => ({ ...curr, ...additions }));
      const first = Object.keys(additions)[0];
      if (first) openFile(first);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [openFile]);

  // Upload via input
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);
  const searchTimerRef = useRef(null);
  const [slashMenu, setSlashMenu] = useState(null);
  const handleFileUpload = async (e) => {
    const list = [...(e.target.files || [])].filter(f => f.name.endsWith('.md'));
    const additions = {};
    for (const f of list) {
      const text = await f.text();
      additions[f.name] = text;
    }
    setFiles(curr => ({ ...curr, ...additions }));
    const first = Object.keys(additions)[0];
    if (first) openFile(first);
    e.target.value = '';
  };

  const appClasses = [
    'app',
    !showSidebar && 'no-left',
    !showRightbar && 'no-right',
  ].filter(Boolean).join(' ');

  const activeContent = activeTab ? files[activeTab] || '' : '';

  // Auto-save to server
  useEffect(() => {
    if (vaultSource !== 'server' || !activeTab || !storageReady) return;
    setSaveStatus('unsaved');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const r = await fetch(getVaultApiUrl('/api/vault/files/' + encodePath(activeTab)), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: activeContent }),
        });
        setSaveStatus(r.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [activeContent, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Server-side search
  useEffect(() => {
    if (vaultSource !== 'server' || !search.trim()) { setServerSearchResults(null); return; }
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(getVaultApiUrl('/api/vault/search?q=' + encodeURIComponent(search)));
        if (r.ok) setServerSearchResults((await r.json()).results || []);
      } catch {}
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, vaultSource]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- Snippets / slash menu -----
  const pickSlashSnippet = useCallback((snip) => {
    const ta = textareaRef.current;
    if (!ta || !slashMenu) { setSlashMenu(null); return; }
    const v = ta.value;
    const end = ta.selectionStart;
    const start = slashMenu.triggerPos;
    ta.setSelectionRange(start, end);
    document.execCommand && document.execCommand('delete');
    window.applySnippet(ta, snip);
    setSlashMenu(null);
  }, [slashMenu]);

  const handleSlashTyping = useCallback((ta) => {
    const v = ta.value;
    const p = ta.selectionStart;
    let i = p - 1;
    while (i >= 0 && v[i] !== '\n' && v[i] !== '/') i--;
    if (i >= 0 && v[i] === '/') {
      const before = i === 0 ? '' : v[i - 1];
      if (i === 0 || before === '\n' || before === ' ') {
        const query = v.slice(i + 1, p);
        if (/^[a-zA-Z0-9]*$/.test(query)) {
          const rect = ta.getBoundingClientRect();
          const host = ta.parentElement.getBoundingClientRect();
          setSlashMenu({
            query,
            index: 0,
            anchor: { top: rect.top - host.top + 24, left: rect.left - host.left + 20 },
            triggerPos: i,
          });
          return;
        }
      }
    }
    setSlashMenu(null);
  }, []);

  const filteredSnippets = useMemo(() => {
    if (!slashMenu) return [];
    const q = slashMenu.query.toLowerCase();
    if (!q) return window.SNIPPETS;
    return window.SNIPPETS.filter(s =>
      s.key.includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.sub.toLowerCase().includes(q)
    );
  }, [slashMenu]);

  const handleEditorKey = useCallback((e) => {
    const ta = e.target;
    if (slashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenu(m => ({ ...m, index: Math.min(filteredSnippets.length - 1, m.index + 1) }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenu(m => ({ ...m, index: Math.max(0, m.index - 1) }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        const snip = filteredSnippets[slashMenu.index];
        if (snip) {
          e.preventDefault();
          pickSlashSnippet(snip);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenu(null);
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();
      const map = { b: 'bold', i: 'italic', k: 'link' };
      if (map[k]) {
        e.preventDefault();
        const s = window.SNIPPETS.find(x => x.key === map[k]);
        if (s) window.applySnippet(ta, s);
        return;
      }
    }
  }, [slashMenu, filteredSnippets, pickSlashSnippet]);

  // Image paste in editor — upload to server, insert markdown
  const handleEditorPaste = useCallback(async (e) => {
    if (vaultSource !== 'server' || !activeTab) return;
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find(it => it.type.startsWith('image/'));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const r = await fetch(getVaultApiUrl('/api/vault/attachments'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name || `image-${Date.now()}.png`, data: reader.result }),
        });
        if (!r.ok) return;
        const data = await r.json();
        const markdown = `![${data.filename}](${data.path})`;
        const ta = textareaRef.current;
        if (ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const current = files[activeTab] || '';
          updateContent(activeTab, current.slice(0, start) + markdown + current.slice(end));
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + markdown.length;
          });
        }
      } catch (err) {
        console.error('Attachment upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  }, [vaultSource, activeTab, files]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePreviewHtml = useMemo(() => {
    if (!activeTab) return '';
    return window.parseMarkdown(activeContent, { vaultFiles: Object.keys(files) });
  }, [activeContent, files, activeTab]);

  // Click handlers for links/tags in preview
  const previewRef = useRef(null);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const onClick = (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      if (a.dataset.link) handleInternalLink(a.dataset.link);
      else if (a.dataset.tag) handleTagClick(a.dataset.tag);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [activePreviewHtml, handleInternalLink, handleTagClick]);

  // Word/char count
  const stats = useMemo(() => {
    if (!activeContent) return { words: 0, chars: 0 };
    const text = activeContent.replace(/[#*>`[\]]/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars: activeContent.length };
  }, [activeContent]);

  // Save status label
  const saveStatusLabel = vaultSource === 'server'
    ? saveStatus === 'saving' ? 'saving…'
    : saveStatus === 'error' ? 'save error'
    : saveStatus === 'unsaved' ? 'unsaved'
    : 'saved'
    : null;

  return (
    <div
      className={appClasses}
      style={{
        '--sidebar-w': sidebarWidth + 'px',
        '--right-w': rightbarWidth + 'px',
      }}
    >
      {/* Titlebar */}
      <div className="titlebar">
        <div className="tb-traffic">
          <div className="dot r"></div>
          <div className="dot y"></div>
          <div className="dot g"></div>
        </div>
        <div className="tb-nav">
          <button title="Back">‹</button>
          <button title="Forward">›</button>
        </div>
        <div className="tb-title">
          {activeTab ? activeTab.replace(/\.md$/, '') : 'Obsidian'} — Knowledge Vault
        </div>
        <div style={{width: 60}}></div>
      </div>

      {/* Ribbon */}
      <div className="ribbon">
        <button
          className={`ribbon-btn ${showSidebar ? 'active' : ''}`}
          onClick={() => setShowSidebar(s => !s)}
          title="Files"
        >
          <Icon name="files" />
        </button>
        <button
          className="ribbon-btn"
          onClick={() => { setRightTab('tags'); setShowRightbar(true); }}
          title="Tags"
        >
          <Icon name="tag" />
        </button>
        <button
          className={`ribbon-btn ${graphInMain ? 'active' : ''}`}
          onClick={() => setGraphInMain(g => !g)}
          title="Graph view"
        >
          <Icon name="graph" />
        </button>
        <div className="ribbon-sep" />
        <button
          className="ribbon-btn"
          onClick={() => setCmdOpen(true)}
          title="Command palette (Cmd+P)"
        >
          <Icon name="command" />
        </button>
        <button
          className="ribbon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Upload .md files"
        >
          <Icon name="upload" />
        </button>
        <div style={{flex: 1}}></div>
        <button
          className="ribbon-btn"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts (?)"
        >
          <Icon name="keyboard" />
        </button>
        <button
          className="ribbon-btn"
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button
          className="ribbon-btn"
          onClick={() => setTweaksOpen(o => !o)}
          title="Tweaks"
        >
          <Icon name="settings" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown"
          multiple
          style={{display: 'none'}}
          onChange={handleFileUpload}
        />
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">Vault</span>
          <div className="sidebar-actions">
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload">
              <Icon name="upload" size={13} />
            </button>
            <button className="icon-btn" title="New note" onClick={async () => {
              const name = prompt('Note name:');
              if (!name) return;
              const filePath = name.endsWith('.md') ? name : name + '.md';
              const content = `# ${name.replace(/\.md$/, '')}\n\n`;
              if (vaultSource === 'server') {
                const r = await fetch(getVaultApiUrl('/api/vault/files/' + encodePath(filePath)), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ content }),
                });
                if (!r.ok) { alert('Create failed'); return; }
              }
              setFiles(f => ({ ...f, [filePath]: content }));
              openFile(filePath);
            }}>
              <Icon name="plus" size={13} />
            </button>
          </div>
        </div>
        <div className="sidebar-search">
          <input
            placeholder="Search or #tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="file-tree">
          {serverSearchResults !== null ? (
            /* Server search results */
            <div className="search-results">
              {serverSearchResults.length === 0 && (
                <div style={{padding: 20, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12}}>
                  No results for "{search}"
                </div>
              )}
              {serverSearchResults.map(r => (
                <div key={r.path} className="sr-item" onClick={() => openFile(r.path)}>
                  <div className="sr-path">{r.path.replace(/\.md$/, '')}</div>
                  {r.contexts.map((ctx, i) => (
                    <div key={i} className="sr-ctx">{ctx.line}</div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            /* Normal file tree */
            <>
              <TreeNode
                node={tree}
                path=""
                activeFile={activeTab}
                onOpen={openFile}
                collapsed={collapsed}
                toggle={toggleFolder}
                onCtxMenu={(e, type, path) => setCtxMenu({ x: e.clientX, y: e.clientY, type, path })}
              />
              {Object.keys(filteredFiles).length === 0 && (
                <div style={{padding: 20, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12}}>
                  No files match "{search}"
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="tab-bar">
          {openTabs.map(p => (
            <div
              key={p}
              className={`tab ${activeTab === p && !graphInMain ? 'active' : ''}`}
              onClick={() => { setActiveTab(p); setGraphInMain(false); }}
            >
              <span className="tab-label">{p.replace(/\.md$/, '').split('/').pop()}</span>
              <span className="tab-close" onClick={(e) => closeTab(p, e)}>
                <Icon name="x" size={12} />
              </span>
            </div>
          ))}
          {graphInMain && (
            <div className="tab active">
              <span className="tab-label">Graph view</span>
              <span className="tab-close" onClick={() => setGraphInMain(false)}>
                <Icon name="x" size={12} />
              </span>
            </div>
          )}
          <div style={{flex: 1, borderRight: 'none'}}></div>
          {activeTab && !graphInMain && (
            <div style={{display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4}}>
              <button
                className="icon-btn"
                onClick={() => setViewMode(m => m === 'source' ? 'split' : m === 'split' ? 'preview' : 'source')}
                title={`View: ${viewMode}`}
              >
                <Icon name={viewMode === 'source' ? 'edit' : viewMode === 'preview' ? 'eye' : 'panel-right'} size={13} />
              </button>
              <button
                className="icon-btn"
                onClick={() => setShowRightbar(s => !s)}
                title="Toggle right panel"
              >
                <Icon name="panel-right" size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="editor-host">
          {graphInMain ? (
            <div className="graph-fullpage">
              <GraphView
                nodes={graphData.nodes}
                links={graphData.links}
                activeId={activeTab}
                onNodeClick={openFile}
              />
            </div>
          ) : !activeTab ? (
            <div className="editor-empty">
              <div className="ee-illus">
                <Icon name="file" size={56} />
              </div>
              <h3>No note open</h3>
              <div className="ee-sub">Pick one from the sidebar, or try a shortcut:</div>
              <div className="ee-hints">
                <div className="ee-hint">
                  <div className="ee-hint-keys"><Kbd>{MOD}</Kbd><span className="sc-plus">+</span><Kbd>P</Kbd></div>
                  <div className="ee-hint-label">Quick switcher</div>
                </div>
                <div className="ee-hint">
                  <div className="ee-hint-keys"><Kbd>/</Kbd></div>
                  <div className="ee-hint-label">Insert menu</div>
                </div>
                <div className="ee-hint">
                  <div className="ee-hint-keys"><Kbd>{MOD}</Kbd><span className="sc-plus">+</span><Kbd>B</Kbd></div>
                  <div className="ee-hint-label">Bold</div>
                </div>
                <div className="ee-hint">
                  <div className="ee-hint-keys"><Kbd>{MOD}</Kbd><span className="sc-plus">+</span><Kbd>K</Kbd></div>
                  <div className="ee-hint-label">Link</div>
                </div>
              </div>
              <button className="ee-all-btn" onClick={() => setShortcutsOpen(true)}>
                <Icon name="keyboard" size={13} />
                <span>See all shortcuts</span>
                <Kbd>?</Kbd>
              </button>
            </div>
          ) : (
            <div className={`editor-split ${viewMode === 'source' ? 'source-only' : viewMode === 'preview' ? 'preview-only' : ''}`}>
              <div className="source-pane" style={{padding: 0, display: 'flex', flexDirection: 'column'}}>
                <SnippetToolbar taRef={textareaRef} />
                <div style={{flex: 1, overflow: 'auto', padding: '32px 8%', position: 'relative'}}>
                  <textarea
                    key={activeTab}
                    ref={textareaRef}
                    value={activeContent}
                    onChange={e => {
                      updateContent(activeTab, e.target.value);
                      handleSlashTyping(e.target);
                    }}
                    onKeyDown={handleEditorKey}
                    onPaste={handleEditorPaste}
                    onBlur={() => setTimeout(() => setSlashMenu(null), 150)}
                    onScroll={() => setSlashMenu(m => m ? null : m)}
                    spellCheck={false}
                  />
                  {slashMenu && (
                    <SlashMenu
                      query={slashMenu.query}
                      index={slashMenu.index}
                      onHover={(i) => setSlashMenu(m => m ? {...m, index: i} : m)}
                      onPick={(snip) => pickSlashSnippet(snip)}
                      anchor={slashMenu.anchor}
                    />
                  )}
                </div>
              </div>
              <div className="preview-pane" ref={previewRef}>
                <div
                  className="md-content"
                  dangerouslySetInnerHTML={{ __html: activePreviewHtml }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right bar */}
      <div className="rightbar">
        <div className="rightbar-tabs">
          <button className={`rightbar-tab ${rightTab === 'backlinks' ? 'active' : ''}`} onClick={() => setRightTab('backlinks')}>Backlinks</button>
          <button className={`rightbar-tab ${rightTab === 'outgoing' ? 'active' : ''}`} onClick={() => setRightTab('outgoing')}>Outgoing</button>
          <button className={`rightbar-tab ${rightTab === 'graph' ? 'active' : ''}`} onClick={() => setRightTab('graph')}>Graph</button>
          <button className={`rightbar-tab ${rightTab === 'tags' ? 'active' : ''}`} onClick={() => setRightTab('tags')}>Tags</button>
        </div>
        <div className="rightbar-content" style={{padding: rightTab === 'graph' ? 0 : undefined, display: rightTab === 'graph' ? 'flex' : undefined, flexDirection: rightTab === 'graph' ? 'column' : undefined}}>
          {rightTab === 'backlinks' && (
            <div>
              <div className="rb-section-header">
                Linked mentions <span className="count">{backlinks.length}</span>
              </div>
              {backlinks.length === 0 && <div className="backlink-empty">No backlinks yet.</div>}
              {backlinks.map(bl => (
                <div key={bl.path} className="backlink-item" onClick={() => openFile(bl.path)}>
                  <div className="bl-title">{bl.path.replace(/\.md$/, '').split('/').pop()}</div>
                  {bl.contexts.slice(0, 2).map((ctx, i) => (
                    <div key={i} className="bl-context">
                      <span dangerouslySetInnerHTML={{
                        __html: ctx.line.replace(
                          /\[\[([^\]]+)\]\]/g,
                          '<mark>[[$1]]</mark>'
                        )
                      }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {rightTab === 'outgoing' && (
            <div>
              <div className="rb-section-header">
                Outgoing links <span className="count">{outgoing.length}</span>
              </div>
              {outgoing.length === 0 && <div className="backlink-empty">No outgoing links.</div>}
              {outgoing.map((o, i) => (
                <div
                  key={i}
                  className="backlink-item"
                  onClick={() => o.exists ? openFile(o.path) : handleInternalLink(o.target)}
                  style={!o.exists ? { opacity: 0.6 } : {}}
                >
                  <div className="bl-title" style={!o.exists ? { color: 'var(--text-error)', fontStyle: 'italic' } : {}}>
                    {o.target} {!o.exists && <span style={{fontSize: 10}}>(new)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {rightTab === 'graph' && (
            <GraphView
              nodes={graphData.nodes}
              links={graphData.links}
              activeId={activeTab}
              onNodeClick={openFile}
            />
          )}
          {rightTab === 'tags' && (
            <div>
              <div className="rb-section-header">
                All tags <span className="count">{allTags.length}</span>
              </div>
              <div className="tags-list">
                {allTags.map(([tag, count]) => (
                  <div
                    key={tag}
                    className="tag-row"
                    onClick={() => setSearch('#' + tag)}
                  >
                    <span className="tg-name">#{tag}</span>
                    <span className="tg-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="statusbar">
        <div className="sb-item">{Object.keys(files).length} files</div>
        <div className="sb-item">·</div>
        <div className="sb-item">{graphData.links.length} links</div>
        {activeTab && <><div className="sb-item">·</div>
        <div className="sb-item">{stats.words} words, {stats.chars} chars</div></>}
        <div className="sb-item">·</div>
        <div className="sb-item" title={vaultApiBase || vaultRoot || 'Sample vault'}>
          {vaultSource === 'server' ? 'live vault' : vaultSource === 'local' ? 'local session' : 'sample vault'}
        </div>
        {saveStatusLabel && <>
          <div className="sb-item">·</div>
          <div className={`sb-item sb-save-status sb-save-${saveStatus}`}>{saveStatusLabel}</div>
        </>}
        <div className="sb-spacer"></div>
        <button className="sb-btn" onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts">
          <Icon name="keyboard" size={11} />
          <span>Shortcuts</span>
        </button>
        <button className="sb-btn" onClick={() => setCmdOpen(true)}>⌘P</button>
        <div className="sb-item">{theme}</div>
      </div>

      {/* Shortcuts modal */}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {/* Floating help button */}
      {!shortcutsOpen && !cmdOpen && !tweaksOpen && (
        <button
          className="help-fab"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Icon name="help" size={18} />
        </button>
      )}

      {/* Command palette */}
      {cmdOpen && (
        <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
            <input
              className="cmd-input"
              autoFocus
              placeholder="Quick switcher…"
              value={cmdQuery}
              onChange={e => { setCmdQuery(e.target.value); setCmdIndex(0); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIndex(i => Math.min(i + 1, cmdItems.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCmdIndex(i => Math.max(0, i - 1)); }
                else if (e.key === 'Enter' && cmdItems[cmdIndex]) runCmd(cmdItems[cmdIndex]);
              }}
            />
            <div className="cmd-list">
              {cmdItems.map((item, i) => (
                <div
                  key={i}
                  className={`cmd-item ${i === cmdIndex ? 'active' : ''}`}
                  onClick={() => runCmd(item)}
                  onMouseEnter={() => setCmdIndex(i)}
                >
                  <div>
                    <div>{item.label}</div>
                    <div style={{fontSize: 11, color: 'var(--text-faint)'}}>{item.sub}</div>
                  </div>
                </div>
              ))}
              {cmdItems.length === 0 && <div style={{padding: 20, textAlign: 'center', color: 'var(--text-faint)'}}>No matches</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tweaks */}
      {tweaksOpen && (
        <div className="tweaks-panel">
          <h4>Tweaks</h4>
          <div className="tweaks-row">
            <label>Theme</label>
            <div className="tweaks-seg">
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => { setTheme('dark'); persistTweak({ theme: 'dark' }); }}>Dark</button>
              <button className={theme === 'light' ? 'active' : ''} onClick={() => { setTheme('light'); persistTweak({ theme: 'light' }); }}>Light</button>
            </div>
          </div>
          <div className="tweaks-row">
            <label>View</label>
            <div className="tweaks-seg">
              <button className={viewMode === 'source' ? 'active' : ''} onClick={() => { setViewMode('source'); persistTweak({ viewMode: 'source' }); }}>Src</button>
              <button className={viewMode === 'split' ? 'active' : ''} onClick={() => { setViewMode('split'); persistTweak({ viewMode: 'split' }); }}>Split</button>
              <button className={viewMode === 'preview' ? 'active' : ''} onClick={() => { setViewMode('preview'); persistTweak({ viewMode: 'preview' }); }}>Prev</button>
            </div>
          </div>
          <div className="tweaks-row">
            <label>Accent</label>
            <input type="color" value={accentColor}
              onChange={e => { setAccentColor(e.target.value); persistTweak({ accentColor: e.target.value }); }}
              style={{width: 40, height: 22, border: 'none', background: 'none'}} />
          </div>
          <div className="tweaks-row">
            <label>Font</label>
            <input type="range" min="12" max="18" value={fontSize}
              onChange={e => { const v = +e.target.value; setFontSize(v); persistTweak({ fontSize: v }); }} />
            <span style={{color: 'var(--text-faint)', minWidth: 24}}>{fontSize}</span>
          </div>
          <div className="tweaks-row">
            <label>Sidebar w</label>
            <input type="range" min="180" max="400" value={sidebarWidth}
              onChange={e => { const v = +e.target.value; setSidebarWidth(v); persistTweak({ sidebarWidth: v }); }} />
          </div>
          <div className="tweaks-row">
            <label>Right w</label>
            <input type="range" min="200" max="480" value={rightbarWidth}
              onChange={e => { const v = +e.target.value; setRightbarWidth(v); persistTweak({ rightbarWidth: v }); }} />
          </div>
          <div className="tweaks-row" style={{marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--bg-modifier-border)'}}>
            <button
              onClick={() => { localStorage.removeItem('obsidian-vault-state'); location.reload(); }}
              style={{background: 'none', border: '1px solid var(--bg-modifier-border)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, flex: 1}}
            >
              {vaultSource === 'server' ? 'Reload from vault folder' : 'Reset vault to sample'}
            </button>
          </div>
        </div>
      )}

      {/* Drop overlay */}
      {dragOver && (
        <div className="drop-overlay">Drop .md files to import</div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onAction={handleCtxAction}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
