/* ══════════════════════════════════════════════════════
   Student Notes App — Main Script
   Google Keep-style features + Auth integration
   ══════════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────────────
// CONSTANTS & STATE
// ─────────────────────────────────────────────────────
const NOTES_KEY    = 'sna_notes';
const LABELS_KEY   = 'sna_labels';
const THEME_KEY    = 'sna_theme';
const VIEW_KEY     = 'sna_view_mode'; // 'grid' or 'list'
const DRAFT_KEY    = 'sna_draft';

let notes         = [];
let labels        = [];   // [{id, name}]
let currentView   = 'notes'; // notes | reminders | archive | trash | label:NAME
let gridMode      = 'grid';  // grid | list
let searchQuery   = '';
let activeNoteId  = null;    // currently open in modal
let inputColor    = '';      // selected color for new note
let inputLabels   = [];      // selected labels for new note
let isChecklistMode = false;
let checklistItems = [];     // [{text, checked}]
let inputImage    = null;    // used as background image (base64 or URL)
let currentLabelFilter = null;
let isInputPinned = false;

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501696461415-6bd6660c6742?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop'
];

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initTheme();
  initAuth();
  buildPalettePickers();
  buildSidebar();
  wireEvents();
  renderAll();
  restoreDraft();
});

function loadData() {
  try { notes  = JSON.parse(localStorage.getItem(NOTES_KEY))  || []; } catch(e) { notes = []; }
  try { labels = JSON.parse(localStorage.getItem(LABELS_KEY)) || []; } catch(e) { labels = []; }
  // Normalize old notes
  notes = notes.map(n => normalizeNote(n));
}

function normalizeNote(n) {
  if (typeof n === 'string') {
    return {
      id: idNow(), title: '', content: n, tags: [], labels: [],
      color: '', bgImage: null, pinned: false, archived: false, trashed: false,
      checklist: null, image: null, reminder: null, history: [],
      createdAt: Date.now(), updatedAt: Date.now()
    };
  }
  return {
    id:        n.id        || idNow(),
    title:     n.title     || '',
    content:   n.content   || n.text || '',
    tags:      Array.isArray(n.tags)   ? n.tags   : [],
    labels:    Array.isArray(n.labels) ? n.labels : [],
    color:     n.color     || '',
    bgImage:   n.bgImage   || null,
    pinned:    !!n.pinned,
    archived:  !!n.archived,
    trashed:   !!n.trashed,
    checklist: Array.isArray(n.checklist) ? n.checklist : null,
    image:     n.image     || null,
    reminder:  n.reminder  || null,
    history:   Array.isArray(n.history) ? n.history : [],
    createdAt: n.createdAt || Date.now(),
    updatedAt: n.updatedAt || Date.now(),
    trashedAt: n.trashedAt || null
  };
}

function saveNotes() {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch(e) {}
}

function saveLabels() {
  try { localStorage.setItem(LABELS_KEY, JSON.stringify(labels)); } catch(e) {}
}

function idNow() {
  return Date.now() + '_' + Math.floor(Math.random() * 1e6);
}

// ─────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}

// ─────────────────────────────────────────────────────
// AUTH UI
// ─────────────────────────────────────────────────────
function initAuth() {
  const user = authGetCurrentUser();
  const signInBtn  = document.getElementById('navSignInBtn');
  const avatarBtn  = document.getElementById('navAvatarBtn');

  if (user) {
    signInBtn?.classList.add('hidden');
    if (avatarBtn) {
      avatarBtn.classList.remove('hidden');
      avatarBtn.textContent = user.avatar || user.name?.charAt(0)?.toUpperCase() || 'U';
    }
    const dropdownName  = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    if (dropdownName)  dropdownName.textContent  = user.name  || 'User';
    if (dropdownEmail) dropdownEmail.textContent = user.email || '';
    if (dropdownAvatar) dropdownAvatar.textContent = user.avatar || 'U';
  } else {
    signInBtn?.classList.remove('hidden');
    avatarBtn?.classList.add('hidden');
  }

  // Avatar dropdown toggle
  avatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('userDropdown');
    dd?.classList.toggle('hidden');
    avatarBtn.setAttribute('aria-expanded', !dd?.classList.contains('hidden'));
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    document.getElementById('userDropdown')?.classList.add('hidden');
  });
}

function handleLogout() {
  authLogout();
  showToast('Signed out successfully');
  setTimeout(() => window.location.reload(), 800);
}

function checkProtected(e, url) {
  if (!authIsLoggedIn()) {
    e.preventDefault();
    window.location.href = 'auth.html?next=' + encodeURIComponent(url);
  }
}

// ─────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────
function buildSidebar() {
  renderSidebarLabels();
}

function renderSidebarLabels() {
  const container = document.getElementById('sidebarLabels');
  if (!container) return;
  if (!labels.length) { container.innerHTML = ''; return; }
  container.innerHTML = labels.map(l => `
    <button class="sidebar-label-item ${currentView === 'label:'+l.id ? 'active' : ''}"
            onclick="showLabelView('${l.id}')" aria-label="Label: ${escHtml(l.name)}">
      <span>🏷️</span>
      <span class="nav-label">${escHtml(l.name)}</span>
    </button>
  `).join('');
}

let sidebarCollapsed = false;
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const main      = document.getElementById('mainContent');

  toggleBtn?.addEventListener('click', () => {
    if (window.innerWidth <= 800) {
      // Mobile: slide in/out
      sidebar?.classList.toggle('mobile-open');
      overlay?.classList.toggle('open');
    } else {
      // Desktop: collapse/expand
      sidebarCollapsed = !sidebarCollapsed;
      sidebar?.classList.toggle('collapsed', sidebarCollapsed);
      main?.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    }
  });
});

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

// ─────────────────────────────────────────────────────
// VIEW MANAGEMENT
// ─────────────────────────────────────────────────────
function showView(view) {
  currentView = view;
  currentLabelFilter = null;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav-item, .sidebar-label-item').forEach(el => el.classList.remove('active'));
  const navMap = { notes: 'navNotes', reminders: 'navReminders', archive: 'navArchive', trash: 'navTrash' };
  if (navMap[view]) document.getElementById(navMap[view])?.classList.add('active');

  // Toggle views
  const views = ['notesView', 'remindersView', 'archiveView', 'trashView', 'labelView'];
  views.forEach(v => document.getElementById(v)?.classList.add('hidden'));
  const viewMap = { notes: 'notesView', reminders: 'remindersView', archive: 'archiveView', trash: 'trashView' };
  document.getElementById(viewMap[view] || 'notesView')?.classList.remove('hidden');

  // Show/hide note input
  const inputWrapper = document.getElementById('noteInputWrapper');
  if (inputWrapper) inputWrapper.style.display = (view === 'notes') ? '' : 'none';

  renderAll();
  closeSidebar();
}

function showLabelView(labelId) {
  currentView = 'label:' + labelId;
  currentLabelFilter = labelId;

  document.querySelectorAll('.sidebar-nav-item, .sidebar-label-item').forEach(el => el.classList.remove('active'));

  const views = ['notesView', 'remindersView', 'archiveView', 'trashView', 'labelView'];
  views.forEach(v => document.getElementById(v)?.classList.add('hidden'));
  document.getElementById('labelView')?.classList.remove('hidden');

  const inputWrapper = document.getElementById('noteInputWrapper');
  if (inputWrapper) inputWrapper.style.display = '';

  renderSidebarLabels();
  renderLabelView();
  closeSidebar();
}

function setView(mode) {
  gridMode = mode;
  localStorage.setItem(VIEW_KEY, mode);
  document.getElementById('gridViewBtn')?.classList.toggle('active', mode === 'grid');
  document.getElementById('listViewBtn')?.classList.toggle('active', mode === 'list');
  document.querySelectorAll('.notes-grid').forEach(g => {
    g.classList.toggle('list-view', mode === 'list');
  });
}

// ─────────────────────────────────────────────────────
// RENDER ALL
// ─────────────────────────────────────────────────────
function renderAll() {
  const q = searchQuery.trim().toLowerCase();
  const activeNotes = notes.filter(n => !n.archived && !n.trashed);

  const filtered = q
    ? activeNotes.filter(n =>
        (n.title  || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tags   || []).some(t => t.toLowerCase().includes(q)) ||
        (n.labels || []).some(lid => {
          const l = labels.find(x => x.id === lid);
          return l && l.name.toLowerCase().includes(q);
        })
      )
    : activeNotes;

  const pinned  = filtered.filter(n => n.pinned);
  const others  = filtered.filter(n => !n.pinned);

  renderGrid('pinnedContainer', pinned);
  renderGrid('notesContainer',  others);

  const pinnedSec = document.getElementById('pinnedSection');
  if (pinnedSec) pinnedSec.style.display = pinned.length ? '' : 'none';

  const otherTitle = document.getElementById('othersSectionTitle');
  if (otherTitle) otherTitle.style.display = (pinned.length && others.length) ? '' : 'none';

  const empty = document.getElementById('emptyState');
  if (empty) empty.classList.toggle('hidden', filtered.length > 0);

  // Archive
  renderGrid('archiveContainer', notes.filter(n => n.archived && !n.trashed));
  const archiveEmpty = document.getElementById('archiveEmpty');
  if (archiveEmpty) archiveEmpty.style.display = notes.filter(n => n.archived && !n.trashed).length ? 'none' : '';

  // Trash
  renderGrid('trashContainer', notes.filter(n => n.trashed));
  const trashEmpty = document.getElementById('trashEmpty');
  if (trashEmpty) trashEmpty.style.display = notes.filter(n => n.trashed).length ? 'none' : '';

  // Reminders
  const withReminder = filtered.filter(n => n.reminder);
  renderGrid('remindersContainer', withReminder);

  // Apply saved view mode
  const saved = localStorage.getItem(VIEW_KEY) || 'grid';
  if (saved !== gridMode) setView(saved);

  renderSidebarLabels();
}

function renderLabelView() {
  const container = document.getElementById('labelContainer');
  if (!container) return;
  const labelNotes = notes.filter(n => !n.archived && !n.trashed && (n.labels || []).includes(currentLabelFilter));
  renderGrid('labelContainer', labelNotes);
  const empty = document.getElementById('labelEmpty');
  if (empty) empty.style.display = labelNotes.length ? 'none' : '';
}

function renderGrid(containerId, noteList) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  noteList.forEach(note => {
    container.appendChild(buildNoteCard(note));
  });
  if (gridMode === 'list') container.classList.add('list-view');
  else container.classList.remove('list-view');
}

// ─────────────────────────────────────────────────────
// NOTE CARD BUILDER
// ─────────────────────────────────────────────────────
function buildNoteCard(note) {
  const div = document.createElement('div');
  div.className = `note-card color-${note.color || 'default'} ${note.bgImage ? 'has-bg-image' : ''}`;
  div.id = `note-${note.id}`;
  if (note.bgImage) {
    div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${note.bgImage}')`;
  }
  div.setAttribute('data-id', note.id);

  let html = '';

  // Image (Inline image uploaded by user)
  if (note.image) {
    html += `<div class="note-card-img-container" style="width: calc(100% + 28px); margin: -14px -14px 12px -14px; overflow: hidden; border-radius: var(--radius) var(--radius) 0 0;">
      <img src="${note.image}" alt="Note image" class="note-card-img" style="width: 100%; max-height: 220px; object-fit: cover; display: block;">
    </div>`;
  }

  // Pin button
  html += `<button class="note-pin-btn" onclick="togglePin('${note.id}',event)"
           title="${note.pinned ? 'Unpin note' : 'Pin note'}" aria-label="${note.pinned ? 'Unpin note' : 'Pin note'}">
           ${note.pinned ? '<span class="material-icons">push_pin</span>' : '<span class="material-icons-outlined">push_pin</span>'}
           </button>`;

  // Title
  if (note.title) {
    html += `<div class="note-title">${highlightText(escHtml(note.title), searchQuery)}</div>`;
  }

  // Content or checklist
  if (note.checklist && note.checklist.length) {
    html += '<div class="note-checklist">';
    const shown = note.checklist.slice(0, 8);
    shown.forEach(item => {
      html += `<div class="note-checklist-item ${item.checked ? 'checked' : ''}">
        <input type="checkbox" ${item.checked ? 'checked' : ''} disabled>
        <span>${highlightText(escHtml(item.text), searchQuery)}</span>
      </div>`;
    });
    if (note.checklist.length > 8) {
      html += `<div class="note-date">+ ${note.checklist.length - 8} more items</div>`;
    }
    html += '</div>';
  } else if (note.content) {
    let rendered = '';
    try {
      rendered = window.marked ? marked.parse(note.content) : escHtml(note.content);
      if (window.DOMPurify) rendered = DOMPurify.sanitize(rendered);
    } catch(e) { rendered = escHtml(note.content); }
    // Highlight search in rendered
    html += `<div class="note-content">${rendered}</div>`;
  }

  // Labels
  if (note.labels && note.labels.length) {
    html += '<div class="note-labels">';
    note.labels.forEach(lid => {
      const label = labels.find(l => l.id === lid);
      if (label) html += `<span class="note-label-chip">${escHtml(label.name)}</span>`;
    });
    html += '</div>';
  }

  // Reminder badge
  if (note.reminder) {
    const dt = new Date(note.reminder);
    const now = new Date();
    const overdue = dt < now;
    html += `<div class="note-reminder" style="${overdue ? 'background:rgba(242,139,130,0.1);color:var(--danger)' : ''}">
      🔔 ${dt.toLocaleDateString(undefined, {month:'short',day:'numeric'})}${
        dt.getHours() !== 0 ? ' ' + dt.toLocaleTimeString(undefined, {hour:'2-digit',minute:'2-digit'}) : ''}
    </div>`;
  }

  // Hover action bar
  const isTrash   = note.trashed;
  const isArchive = note.archived;

  html += '<div class="note-action-bar" onclick="event.stopPropagation()">';
  if (isTrash) {
    html += `<button class="icon-btn" title="Restore" onclick="restoreNote('${note.id}',event)" aria-label="Restore"><span class="material-icons-outlined">restore</span></button>`;
    html += `<button class="icon-btn" title="Delete forever" onclick="deleteForever('${note.id}',event)" aria-label="Delete forever" style="color:var(--danger)"><span class="material-icons-outlined">delete_forever</span></button>`;
  } else {
    html += `
      <div style="position:relative">
        <button class="icon-btn" title="Background options" onclick="togglePalettePicker(event,'${note.id}')" aria-label="Background options"><span class="material-icons-outlined">palette</span></button>
        <div class="palette-picker-popup hidden" id="pp_${note.id}"></div>
      </div>
      <div style="position:relative">
        <button class="icon-btn" title="Remind me" aria-label="Remind me" onclick="toggleReminderPicker(event,'${note.id}')"><span class="material-icons-outlined">add_alert</span></button>
        <div class="reminder-picker-popup hidden" id="rem_${note.id}"></div>
      </div>
      <button class="icon-btn" title="Add image" onclick="triggerModalImageUploadForNote('${note.id}', event)" aria-label="Add image"><span class="material-icons-outlined">image</span></button>
      <button class="icon-btn" title="${isArchive ? 'Unarchive' : 'Archive'}" onclick="${isArchive ? 'unarchiveNote' : 'archiveNote'}('${note.id}',event)" aria-label="${isArchive ? 'Unarchive' : 'Archive'}"><span class="material-icons-outlined">${isArchive ? 'unarchive' : 'archive'}</span></button>
      <div style="position:relative">
        <button class="icon-btn" title="More" onclick="toggleMoreMenu(event,'${note.id}')" aria-label="More"><span class="material-icons-outlined">more_vert</span></button>
        <div class="more-menu-popup hidden" id="more_${note.id}">
           <button class="more-menu-item" onclick="trashNote('${note.id}',event)">Delete note</button>
           <button class="more-menu-item" onclick="toggleLabelPicker(event,'${note.id}')">Add label</button>
           <button class="more-menu-item" onclick="copyNote('${note.id}',event)">Make a copy</button>
           <button class="more-menu-item" onclick="showVersionHistory('${note.id}',event)">Version history</button>
        </div>
        <div class="label-picker-popup hidden" id="lp_${note.id}"></div>
      </div>
    `;
  }
  html += '</div>';

  div.innerHTML = html;

  // Click to open modal (not on buttons)
  div.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('.color-picker-popup') || e.target.closest('.label-picker-popup') || e.target.closest('.image-picker-popup') || e.target.closest('.more-menu-popup') || e.target.closest('.reminder-picker-popup')) return;
    if (!note.trashed) openNoteModal(note.id);
  });

  return div;
}

// ─────────────────────────────────────────────────────
// NOTE INPUT — Google Keep style
// ─────────────────────────────────────────────────────
function expandNoteInput(mode) {
  const collapsed = document.getElementById('noteCollapsed');
  const expanded  = document.getElementById('noteExpanded');
  collapsed?.classList.add('hidden');
  expanded?.classList.add('open');
  if (mode === 'checklist') {
    isChecklistMode = true;
    document.getElementById('noteInput')?.classList.add('hidden');
    document.getElementById('noteChecklistArea')?.classList.remove('hidden');
    if (!document.getElementById('checklistItems').children.length) addChecklistItem();
  }
  document.getElementById('noteTitle')?.focus();
}

function closeNoteInput() {
  const collapsed = document.getElementById('noteCollapsed');
  const expanded  = document.getElementById('noteExpanded');
  collapsed?.classList.remove('hidden');
  expanded?.classList.remove('open');
  // Reset
  isChecklistMode = false;
  checklistItems  = [];
  inputColor      = '';
  inputLabels     = [];
  inputImage      = null;
  isInputPinned   = false;
  const pinBtn = document.getElementById('inputPinBtn');
  if (pinBtn) pinBtn.innerHTML = '<span class="material-icons-outlined">push_pin</span>';
  document.getElementById('noteTitle').value  = '';
  document.getElementById('noteInput').value  = '';
  document.getElementById('noteTags').value   = '';
  document.getElementById('noteDueDate').value = '';
  document.getElementById('checklistItems').innerHTML = '';
  document.getElementById('noteInput')?.classList.remove('hidden');
  document.getElementById('noteChecklistArea')?.classList.add('hidden');
  const prev = document.getElementById('noteImgPreview');
  if (prev) { prev.innerHTML = ''; prev.classList.add('hidden'); }
  clearDraft();
}

// ─────────────────────────────────────────────────────
// INLINE IMAGE UPLOADS
// ─────────────────────────────────────────────────────
function triggerImageUpload() {
  document.getElementById('imageUploadInput').click();
}
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    // Determine context based on if the picker is open.
    // If it's for the new note background:
    selectGalleryImage(event.target.result, '');
  };
  reader.readAsDataURL(file);
}

function removeInputImage() {
  inputImage = null;
  const prev = document.getElementById('noteImgPreview');
  if (prev) {
    prev.classList.add('hidden');
    prev.innerHTML = '';
  }
}

function triggerModalImageUpload() {
  document.getElementById('modalImageInput').click();
}
function handleModalImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    // Assume it's for background picker inside modal
    selectGalleryImage(event.target.result, 'modal');
  };
  reader.readAsDataURL(file);
}

function toggleChecklistMode() {
  isChecklistMode = !isChecklistMode;
  const textarea  = document.getElementById('noteInput');
  const clArea    = document.getElementById('noteChecklistArea');
  textarea?.classList.toggle('hidden', isChecklistMode);
  clArea?.classList.toggle('hidden', !isChecklistMode);
  if (isChecklistMode && !document.getElementById('checklistItems').children.length) {
    addChecklistItem();
  }
}

function addChecklistItem(text = '', checked = false) {
  const list = document.getElementById('checklistItems');
  if (!list) return;
  const id   = idNow();
  const div  = document.createElement('div');
  div.className = 'checklist-item';
  div.innerHTML = `
    <input type="checkbox" id="ci_${id}" ${checked ? 'checked' : ''} onchange="updateChecklistItem('${id}', this.checked)">
    <input type="text" class="checklist-item-text" placeholder="List item" value="${escHtml(text)}"
           data-ci-id="${id}" onkeydown="checklistKeydown(event, this)">
    <button class="checklist-item-del" type="button" onclick="removeChecklistItem('${id}')">✕</button>
  `;
  list.appendChild(div);
  div.querySelector('.checklist-item-text')?.focus();
}

function checklistKeydown(e, input) {
  if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }
  if (e.key === 'Backspace' && !input.value) {
    e.preventDefault();
    const id = input.getAttribute('data-ci-id');
    removeChecklistItem(id);
  }
}

function removeChecklistItem(id) {
  const el = document.querySelector(`[data-ci-id="${id}"]`)?.closest('.checklist-item');
  el?.remove();
}

function updateChecklistItem(id, checked) {}

function gatherChecklist(listId) {
  const list = document.getElementById(listId);
  if (!list) return null;
  const items = [];
  list.querySelectorAll('.checklist-item').forEach(row => {
    const textInput = row.querySelector('.checklist-item-text');
    const checkbox  = row.querySelector('input[type="checkbox"]');
    const text = textInput ? textInput.value.trim() : '';
    if (text) items.push({ text, checked: checkbox ? checkbox.checked : false });
  });
  return items.length ? items : null;
}

// Image upload
function triggerImageUpload() {
  expandNoteInput();
  document.getElementById('imageUploadInput')?.click();
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    inputImage = ev.target.result;
    const prev = document.getElementById('noteImgPreview');
    if (prev) {
      prev.classList.remove('hidden');
      prev.innerHTML = `<img src="${inputImage}" alt="Note image" style="max-height:200px;width:100%;object-fit:cover;border-radius:12px 12px 0 0;">
        <button class="remove-img" onclick="removeInputImage()" type="button" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;color:white;border-radius:50%;width:28px;height:28px;font-size:14px;cursor:pointer;">✕</button>`;
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function removeInputImage() {
  inputImage = null;
  const prev = document.getElementById('noteImgPreview');
  if (prev) { prev.innerHTML = ''; prev.classList.add('hidden'); }
}

function toggleInputPin() {
  isInputPinned = !isInputPinned;
  document.getElementById('inputPinBtn').innerHTML = isInputPinned 
    ? '<span class="material-icons">push_pin</span>' 
    : '<span class="material-icons-outlined">push_pin</span>';
}

// ─────────────────────────────────────────────────────
// ADD NOTE
// ─────────────────────────────────────────────────────
function addNote() {
  const title   = (document.getElementById('noteTitle')?.value || '').trim();
  const content = (document.getElementById('noteInput')?.value || '').trim();
  const tagsStr = (document.getElementById('noteTags')?.value  || '').trim();
  const due     = (document.getElementById('noteDueDate')?.value || '').trim();

  const checklist = isChecklistMode ? gatherChecklist('checklistItems') : null;

  if (!title && !content && !checklist && !inputImage) {
    closeNoteInput();
    return;
  }

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  const note = {
    id:        idNow(),
    title,
    content,
    tags,
    labels:    [...inputLabels],
    color:     inputColor,
    pinned:    isInputPinned,
    archived:  false,
    trashed:   false,
    checklist: checklist,
    image:     inputImage,
    reminder:  due ? new Date(due).getTime() : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  notes.unshift(note);
  saveNotes();
  closeNoteInput();
  renderAll();
  showToast('Note saved');

  // Schedule reminder notification if set
  if (note.reminder) scheduleReminder(note);
}

// ─────────────────────────────────────────────────────
// DRAFT AUTO-SAVE
// ─────────────────────────────────────────────────────
let draftTimer = null;
function scheduleDraftSave() {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 1500);
}
function saveDraft() {
  const draft = {
    title: document.getElementById('noteTitle')?.value || '',
    content: document.getElementById('noteInput')?.value || '',
    savedAt: Date.now()
  };
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch(e) {}
}
function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft.title || draft.content) {
      // Silently load, don't expand automatically
    }
  } catch(e) {}
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch(e) {}
}

// ─────────────────────────────────────────────────────
// PIN / ARCHIVE / TRASH / DELETE
// ─────────────────────────────────────────────────────
function togglePin(id, e) {
  e?.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  note.updatedAt = Date.now();
  saveNotes();
  renderAll();
  showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
}

function toggleModalPin() {
  if (!activeNoteId) return;
  const note = notes.find(n => n.id === activeNoteId);
  if (note) {
    note.pinned = !note.pinned;
    document.getElementById('modalPinBtn').innerHTML = note.pinned 
      ? '<span class="material-icons">push_pin</span>' 
      : '<span class="material-icons-outlined">push_pin</span>';
    saveNotes();
    renderAll();
  }
}

function archiveNote(id, e) {
  e?.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.archived = true;
  note.updatedAt = Date.now();
  saveNotes();
  renderAll();
  showToast('Note archived', 'undo', () => { note.archived = false; saveNotes(); renderAll(); });
}

function unarchiveNote(id, e) {
  e?.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.archived = false;
  note.updatedAt = Date.now();
  saveNotes();
  renderAll();
  showToast('Note unarchived');
}

function trashNote(id, e) {
  e?.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.trashed   = true;
  note.trashedAt = Date.now();
  note.updatedAt = Date.now();
  saveNotes();
  renderAll();
  showToast('Note moved to Trash', 'undo', () => { note.trashed = false; note.trashedAt = null; saveNotes(); renderAll(); });
}

function restoreNote(id, e) {
  e?.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.trashed = false;
  note.trashedAt = null;
  note.updatedAt = Date.now();
  saveNotes();
  renderAll();
  showToast('Note restored');
}

function deleteForever(id, e) {
  e?.stopPropagation();
  if (!confirm('Delete this note forever? This cannot be undone.')) return;
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  renderAll();
  showToast('Note deleted permanently');
}

function emptyTrash() {
  const trashedCount = notes.filter(n => n.trashed).length;
  if (!trashedCount) return;
  if (!confirm(`Permanently delete ${trashedCount} note${trashedCount > 1 ? 's' : ''}?`)) return;
  notes = notes.filter(n => !n.trashed);
  saveNotes();
  renderAll();
  showToast('Trash emptied');
}

function copyNote(id, e) {
  e?.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  const copy = {
    ...JSON.parse(JSON.stringify(note)),
    id: idNow(),
    title: note.title ? 'Copy of ' + note.title : '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const idx = notes.findIndex(n => n.id === id);
  notes.splice(idx + 1, 0, copy);
  saveNotes();
  renderAll();
  showToast('Note copied');
}

// ─────────────────────────────────────────────────────
// NOTE EDIT MODAL
// ─────────────────────────────────────────────────────
function openNoteModal(id) {
  activeNoteId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  // Populate modal
  document.getElementById('modalTitle').value   = note.title   || '';
  document.getElementById('modalContent').value = note.content || '';

  // Image
  const imgContainer = document.getElementById('modalImgContainer');
  const imgEl        = document.getElementById('modalImg');
  if (note.image && imgContainer && imgEl) {
    imgEl.src = note.image;
    imgContainer.classList.remove('hidden');
  } else {
    imgContainer?.classList.add('hidden');
  }

  // Checklist
  const clArea = document.getElementById('modalChecklistArea');
  const clList = document.getElementById('modalChecklistItems');
  if (note.checklist && note.checklist.length && clArea && clList) {
    clArea.classList.remove('hidden');
    document.getElementById('modalContent').style.display = 'none';
    clList.innerHTML = '';
    note.checklist.forEach(item => addModalChecklistItem(item.text, item.checked));
  } else {
    clArea?.classList.add('hidden');
    document.getElementById('modalContent').style.display = '';
  }

  // Labels
  renderModalLabels(note.labels || []);

  // Color & Background Image
  const modal = document.getElementById('noteModal');
  if (modal) {
    modal.className = 'note-modal' + (note.color ? ' color-' + note.color : '') + (note.bgImage ? ' has-bg-image' : '');
    if (note.bgImage) {
      modal.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${note.bgImage}')`;
    } else {
      modal.style.backgroundImage = '';
    }
  }

  // Date
  const dateEl = document.getElementById('modalDate');
  if (dateEl) {
    const d = new Date(note.updatedAt || note.createdAt);
    dateEl.textContent = 'Edited ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Open overlay
  const overlay = document.getElementById('noteModalOverlay');
  overlay?.classList.add('open');
  document.getElementById('modalTitle')?.focus();
}

function addModalChecklistItem(text = '', checked = false) {
  const list = document.getElementById('modalChecklistItems');
  if (!list) return;
  const id = idNow();
  const div = document.createElement('div');
  div.className = 'checklist-item';
  div.innerHTML = `
    <input type="checkbox" id="mci_${id}" ${checked ? 'checked' : ''}>
    <input type="text" class="checklist-item-text" placeholder="List item" value="${escHtml(text)}"
           data-ci-id="${id}" onkeydown="checklistKeydown(event, this)">
    <button class="checklist-item-del" type="button" onclick="removeChecklistItem('${id}')">✕</button>
  `;
  list.appendChild(div);
}

function renderModalLabels(labelIds) {
  const container = document.getElementById('modalLabels');
  if (!container) return;
  container.innerHTML = (labelIds || []).map(lid => {
    const l = labels.find(x => x.id === lid);
    if (!l) return '';
    return `<div class="note-modal-label-chip">
      <span>${escHtml(l.name)}</span>
      <button class="remove-label-btn" onclick="removeLabelFromModal('${lid}')" aria-label="Remove label">✕</button>
    </div>`;
  }).join('');
}

function removeLabelFromModal(labelId) {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  note.labels = (note.labels || []).filter(id => id !== labelId);
  renderModalLabels(note.labels);
  saveNotes();
}

function saveAndCloseModal() {
  const note = notes.find(n => n.id === activeNoteId);
  if (note) {
    const oldTitle = note.title || '';
    const oldContent = note.content || '';
    const oldChecklist = note.checklist ? JSON.parse(JSON.stringify(note.checklist)) : null;

    const newTitle   = (document.getElementById('modalTitle')?.value   || '').trim();
    const newContent = (document.getElementById('modalContent')?.value || '').trim();
    
    let newChecklist = null;
    const clArea = document.getElementById('modalChecklistArea');
    if (clArea && !clArea.classList.contains('hidden')) {
      newChecklist = gatherChecklist('modalChecklistItems');
    }

    // Check if anything actually changed
    const titleChanged = oldTitle !== newTitle;
    const contentChanged = oldContent !== newContent;
    const checklistChanged = JSON.stringify(oldChecklist) !== JSON.stringify(newChecklist);

    if (titleChanged || contentChanged || checklistChanged) {
      if (!note.history) note.history = [];
      note.history.push({
        title: oldTitle,
        content: oldContent,
        checklist: oldChecklist,
        updatedAt: note.updatedAt || note.createdAt || Date.now()
      });
      if (note.history.length > 10) {
        note.history.shift();
      }

      note.title = newTitle;
      note.content = newContent;
      note.checklist = newChecklist;
      note.updatedAt = Date.now();
      saveNotes();
      renderAll();
    }
  }
  activeNoteId = null;
  document.getElementById('noteModalOverlay')?.classList.remove('open');
  closeAllPopups();
}

function closeNoteModal(e) {
  if (e?.target === document.getElementById('noteModalOverlay')) {
    saveAndCloseModal();
  }
}

function archiveModalNote() {
  const id = activeNoteId;
  saveAndCloseModal();
  archiveNote(id);
}
function trashModalNote() {
  const id = activeNoteId;
  saveAndCloseModal();
  trashNote(id);
}
function copyModalNote() {
  const id = activeNoteId;
  saveAndCloseModal();
  copyNote(id);
}

function triggerModalImageUpload() {
  document.getElementById('modalImageInput')?.click();
}
function handleModalImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    note.image = ev.target.result;
    const imgEl = document.getElementById('modalImg');
    const imgContainer = document.getElementById('modalImgContainer');
    if (imgEl) imgEl.src = note.image;
    imgContainer?.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function removeModalImage() {
  const note = notes.find(n => n.id === activeNoteId);
  if (note) {
    note.image = null;
    note.updatedAt = Date.now();
    saveNotes();
    renderAll();
  }
  const imgContainer = document.getElementById('modalImgContainer');
  if (imgContainer) imgContainer.classList.add('hidden');
}

// ─────────────────────────────────────────────────────
// COLOR PICKER
// ─────────────────────────────────────────────────────
const COLOR_NAMES = ['', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'darkblue', 'purple', 'pink', 'brown', 'gray'];
const COLOR_LABELS_DARK = {
  '': '#2d2e30', red: '#5c2b29', orange: '#614a19', yellow: '#635d19',
  green: '#345920', teal: '#16504b', blue: '#2d555e', darkblue: '#1e3a5f',
  purple: '#42275e', pink: '#5b2245', brown: '#442b17', gray: '#3c3f43'
};
const COLOR_LABELS_LIGHT = {
  '': '#ffffff', red: '#f28b82', orange: '#fbbc04', yellow: '#fdd663',
  green: '#ccff90', teal: '#a7ffeb', blue: '#cbf0f8', darkblue: '#aecbfa',
  purple: '#d7aefb', pink: '#fdcfe8', brown: '#e6c9a8', gray: '#e8eaed'
};

function buildPalettePickers() {
  // Build all static pickers (input card + modal)
  ['inputPalettePicker', 'modalPalettePicker'].forEach(id => {
    const picker = document.getElementById(id);
    if (!picker) return;
    buildPalettePickerHTML(picker, id === 'inputPalettePicker' ? null : 'modal');
  });
}

function buildPalettePickerHTML(picker, context) {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const colorMap = theme === 'dark' ? COLOR_LABELS_DARK : COLOR_LABELS_LIGHT;

  // Active state detection
  let currentColor = '';
  let currentImage = null;
  if (!context || context === '') {
    currentColor = inputColor;
    currentImage = inputImage;
  } else if (context === 'modal') {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      currentColor = note.color || '';
      currentImage = note.bgImage || null;
    }
  } else {
    const note = notes.find(n => n.id === context);
    if (note) {
      currentColor = note.color || '';
      currentImage = note.bgImage || null;
    }
  }

  let html = '<div class="palette-popup-content" onclick="event.stopPropagation()">';

  // --- Row 1: Colors ---
  html += '<div class="palette-row colors-row">';
  COLOR_NAMES.forEach(c => {
    const bg = colorMap[c] || colorMap[''];
    const label = c || 'Default';
    const isActive = currentColor === c;
    const activeBadge = isActive ? '<span class="material-icons active-check">check</span>' : '';
    
    if (c === '') {
      // Slashed circle
      html += `
        <button class="palette-swatch color-swatch swatch-none ${isActive ? 'active' : ''}" 
                style="background:${bg};" 
                onclick="selectColor('${c}', '${context || ''}'); event.stopPropagation();" 
                title="${label}" aria-label="${label} color">
          <span class="material-icons-outlined">format_color_reset</span>
          ${activeBadge}
        </button>
      `;
    } else {
      html += `
        <button class="palette-swatch color-swatch ${isActive ? 'active' : ''}" 
                style="background:${bg};" 
                onclick="selectColor('${c}', '${context || ''}'); event.stopPropagation();" 
                title="${label}" aria-label="${label} color">
          ${activeBadge}
        </button>
      `;
    }
  });
  html += '</div>';

  // Divider
  html += '<hr class="palette-divider" />';

  // --- Row 2: Background Images ---
  html += '<div class="palette-row images-row">';
  
  // No Image Swatch
  const isNoImageActive = !currentImage;
  const noImageCheck = isNoImageActive ? '<span class="material-icons active-check">check</span>' : '';
  html += `
    <button class="palette-swatch image-swatch swatch-none ${isNoImageActive ? 'active' : ''}" 
            onclick="selectGalleryImage('', '${context || ''}'); event.stopPropagation();" 
            title="No image" aria-label="No background image">
      <span class="material-icons-outlined">hide_image</span>
      ${noImageCheck}
    </button>
  `;

  // Gallery Swatches
  BACKGROUND_IMAGES.forEach((url, idx) => {
    const isActive = currentImage === url;
    const activeCheck = isActive ? '<span class="material-icons active-check">check</span>' : '';
    html += `
      <button class="palette-swatch image-swatch ${isActive ? 'active' : ''}" 
              onclick="selectGalleryImage('${url}', '${context || ''}'); event.stopPropagation();" 
              title="Background ${idx + 1}" aria-label="Background image ${idx + 1}">
        <img src="${url}" class="palette-img-thumbnail" />
        ${activeCheck}
      </button>
    `;
  });
  
  html += '</div>';
  
  // Add computer upload button at the bottom of the popup (Google Keep style)
  html += `
    <div class="palette-upload-footer">
      <button class="more-menu-item" style="width:100%; text-align:left; display:flex; align-items:center;" onclick="triggerImageUploadContext('${context || ''}'); event.stopPropagation();">
         <span class="material-icons-outlined" style="margin-right:8px; font-size:18px;">folder</span> Upload from computer
      </button>
    </div>
  `;

  html += '</div>';
  picker.innerHTML = html;
}

function togglePalettePicker(e, context) {
  e.stopPropagation();
  closeAllPopups();

  let picker;
  if (context === null) {
    picker = document.getElementById('inputPalettePicker');
  } else if (context === 'modal') {
    picker = document.getElementById('modalPalettePicker');
  } else {
    // Note card context = note ID
    picker = document.getElementById('pp_' + context);
  }
  if (!picker) return;
  
  // Dynamically rebuild content to highlight active states correctly
  buildPalettePickerHTML(picker, context);
  picker.classList.toggle('hidden');
  
  // Position near button
  picker.style.top  = '40px';
  picker.style.left = '0';
}

function selectColor(color, context) {
  if (!context || context === '') {
    // New note input
    inputColor = color;
    const card = document.getElementById('noteInputCard');
    if (card) {
      card.className = 'note-input-card' + (color ? ' color-' + color : '');
    }
  } else if (context === 'modal') {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      note.color = color;
      note.updatedAt = Date.now();
      const modal = document.getElementById('noteModal');
      if (modal) modal.className = 'note-modal' + (color ? ' color-' + color : '') + (note.bgImage ? ' has-bg-image' : '');
      saveNotes();
      renderAll();
    }
  } else {
    // Note card
    const note = notes.find(n => n.id === context);
    if (note) {
      note.color = color;
      note.updatedAt = Date.now();
      saveNotes();
      renderAll();
    }
  }
  closeAllPopups();
}

// ─────────────────────────────────────────────────────
// LABEL PICKER
// ─────────────────────────────────────────────────────
function toggleLabelPicker(e, context) {
  e.stopPropagation();
  closeAllPopups();

  let picker;
  if (context === null) {
    picker = document.getElementById('inputLabelPicker');
  } else if (context === 'modal') {
    picker = document.getElementById('modalLabelPicker');
  } else {
    picker = document.getElementById('lp_' + context);
  }
  if (!picker) return;

  const note = context && context !== 'modal' ? notes.find(n => n.id === context) : null;
  const modalNote = context === 'modal' ? notes.find(n => n.id === activeNoteId) : null;
  const currentLabels = note ? (note.labels || []) : modalNote ? (modalNote.labels || []) : inputLabels;

  picker.innerHTML = `
    <input class="label-picker-search" placeholder="Search labels" oninput="filterLabelPicker(this, '${context || ''}')">
    <div class="lp-items">
    ${labels.length === 0 ? '<div style="padding:8px;font-size:0.85rem;color:var(--text2)">No labels yet. Create one in the sidebar.</div>' :
      labels.map(l => {
        const checked = currentLabels.includes(l.id);
        return `<div class="label-picker-item" onclick="toggleNoteLabel('${l.id}','${context || ''}')">
          <input type="checkbox" ${checked ? 'checked' : ''} onclick="event.stopPropagation()">
          <span>${escHtml(l.name)}</span>
        </div>`;
      }).join('')}
    </div>`;
  picker.classList.remove('hidden');
}

function filterLabelPicker(input, context) {
  const q = input.value.toLowerCase();
  input.closest('.label-picker-popup').querySelectorAll('.label-picker-item').forEach(item => {
    const name = item.querySelector('span')?.textContent?.toLowerCase() || '';
    item.style.display = name.includes(q) ? '' : 'none';
  });
}

function toggleNoteLabel(labelId, context) {
  if (!context || context === '') {
    // Input
    const idx = inputLabels.indexOf(labelId);
    if (idx === -1) inputLabels.push(labelId);
    else inputLabels.splice(idx, 1);
  } else if (context === 'modal') {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    note.labels = note.labels || [];
    const idx = note.labels.indexOf(labelId);
    if (idx === -1) note.labels.push(labelId);
    else note.labels.splice(idx, 1);
    renderModalLabels(note.labels);
    saveNotes();
  } else {
    const note = notes.find(n => n.id === context);
    if (!note) return;
    note.labels = note.labels || [];
    const idx = note.labels.indexOf(labelId);
    if (idx === -1) note.labels.push(labelId);
    else note.labels.splice(idx, 1);
    saveNotes();
    renderAll();
  }
  // Refresh picker checkboxes
  const picker = context === 'modal' ? document.getElementById('modalLabelPicker') :
                 !context ? document.getElementById('inputLabelPicker') :
                 document.getElementById('lp_' + context);
  if (picker) {
    const currentLabels = context === 'modal'
      ? (notes.find(n => n.id === activeNoteId)?.labels || [])
      : !context ? inputLabels
      : (notes.find(n => n.id === context)?.labels || []);
    picker.querySelectorAll('.label-picker-item').forEach(item => {
      const cb = item.querySelector('input[type="checkbox"]');
      if (!cb) return;
      const id = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if (id) cb.checked = currentLabels.includes(id);
    });
  }
}

// Close all popups
function closeAllPopups() {
  document.querySelectorAll('.palette-picker-popup, .label-picker-popup, .more-menu-popup, .reminder-picker-popup').forEach(el => {
    el.classList.add('hidden');
  });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.palette-picker-popup') && 
      !e.target.closest('.label-picker-popup') &&
      !e.target.closest('.more-menu-popup') &&
      !e.target.closest('.reminder-picker-popup')) {
    closeAllPopups();
  }
});

// ─────────────────────────────────────────────────────
// PALETTE PICKER & MORE MENU
// ─────────────────────────────────────────────────────

function triggerImageUploadContext(context) {
  closeAllPopups();
  if (!context || context === '') {
    // For new note input background
    triggerImageUpload();
  } else if (context === 'modal') {
    // For modal background
    triggerModalImageUpload();
  } else {
    // For saved note background
    activeNoteId = context;
    triggerModalImageUpload(); 
  }
}

// Additional trigger specifically for adding an INLINE image to a saved note via action bar
function triggerModalImageUploadForNote(noteId, event) {
  if (event) event.stopPropagation();
  closeAllPopups();
  activeNoteId = noteId;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const note = notes.find(n => n.id === noteId);
      if (note) {
         note.image = ev.target.result;
         note.updatedAt = Date.now();
         saveNotes();
         renderAll();
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function selectGalleryImage(url, context) {
  if (!context || context === '') {
    inputImage = url;
    const inputCard = document.getElementById('noteInputCard');
    if (inputCard) {
      if (url) {
        inputCard.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${url}')`;
        inputCard.classList.add('has-bg-image');
      } else {
        inputCard.style.backgroundImage = '';
        inputCard.classList.remove('has-bg-image');
      }
    }
    expandNoteInput();
  } else if (context === 'modal') {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      note.bgImage = url;
      note.updatedAt = Date.now();
      const modal = document.getElementById('noteModal');
      if (modal) {
        if (url) {
          modal.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${url}')`;
          modal.classList.add('has-bg-image');
        } else {
          modal.style.backgroundImage = '';
          modal.classList.remove('has-bg-image');
        }
      }
      saveNotes();
      renderAll(); // To update the background in the grid too
    }
  } else {
    const note = notes.find(n => n.id === context);
    if (note) {
      note.bgImage = url;
      note.updatedAt = Date.now();
      saveNotes();
      renderAll();
    }
  }
  closeAllPopups();
}

function toggleMoreMenu(e, context) {
  e.stopPropagation();
  closeAllPopups();
  let menu = context === null ? document.getElementById('inputMoreMenu') :
             context === 'modal' ? document.getElementById('modalMoreMenu') :
             document.getElementById('more_' + context);
             
  if (menu) {
    menu.classList.remove('hidden');
  }
}

// ─────────────────────────────────────────────────────
// REMINDER PICKER
// ─────────────────────────────────────────────────────
function toggleReminderPicker(e, context) {
  e.stopPropagation();
  closeAllPopups();
  
  let picker = context === null ? document.getElementById('inputReminderPicker') :
               context === 'modal' ? document.getElementById('modalReminderPicker') :
               document.getElementById('rem_' + context);
               
  if (picker) {
    if (picker.innerHTML === '') {
      buildReminderPickerHTML(picker, context);
    }
    picker.classList.toggle('hidden');
  }
}

function buildReminderPickerHTML(picker, context) {
  let html = `
    <div class="reminder-popup-header">Remind me later</div>
    <div class="reminder-popup-info">Your reminders are saved in Google Tasks</div>
    
    <div class="reminder-popup-item" onclick="setReminder('tomorrow', '${context || ''}')">
      <span class="reminder-popup-item-label">Tomorrow</span>
      <span class="reminder-popup-item-time">08:00</span>
    </div>
    
    <div class="reminder-popup-item" onclick="setReminder('next_week', '${context || ''}')">
      <span class="reminder-popup-item-label">Next week</span>
      <span class="reminder-popup-item-time">Mon, 08:00</span>
    </div>
    
    <div class="reminder-popup-custom">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:8px;">schedule</span>
      Select date and time
    </div>
  `;
  picker.innerHTML = html;
}

function setReminder(type, context) {
  // Demo logic for setting reminder
  closeAllPopups();
  showToast('Reminder saved (Demo)');
}

// ─────────────────────────────────────────────────────
// LABELS MANAGER
// ─────────────────────────────────────────────────────
function openLabelsModal() {
  renderLabelsList();
  document.getElementById('labelsModalOverlay')?.classList.add('open');
  document.getElementById('newLabelInput')?.focus();
}

function closeLabelsModal(e) {
  if (!e || e.target === document.getElementById('labelsModalOverlay')) {
    document.getElementById('labelsModalOverlay')?.classList.remove('open');
    buildSidebar();
    renderAll();
  }
}

function createLabel() {
  const input = document.getElementById('newLabelInput');
  const name  = (input?.value || '').trim();
  if (!name) return;
  if (labels.some(l => l.name.toLowerCase() === name.toLowerCase())) {
    showToast('Label already exists');
    return;
  }
  labels.push({ id: idNow(), name });
  saveLabels();
  renderLabelsList();
  buildSidebar();
  if (input) input.value = '';
  showToast('Label created');
}

function deleteLabel(id) {
  const label = labels.find(l => l.id === id);
  if (!label) return;
  labels = labels.filter(l => l.id !== id);
  // Remove from all notes
  notes.forEach(n => { n.labels = (n.labels || []).filter(lid => lid !== id); });
  saveLabels();
  saveNotes();
  renderLabelsList();
  buildSidebar();
  renderAll();
  showToast('Label deleted');
}

function renderLabelsList() {
  const container = document.getElementById('labelsList');
  if (!container) return;
  if (!labels.length) {
    container.innerHTML = '<div style="color:var(--text2);font-size:0.88rem;padding:8px 0;">No labels yet. Create one above.</div>';
    return;
  }
  container.innerHTML = labels.map(l => `
    <div class="label-list-item" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:4px 0;">
      <button class="icon-btn" onclick="deleteLabel('${l.id}')" title="Delete label" aria-label="Delete label ${escHtml(l.name)}" style="color:var(--text2);background:none;border:none;cursor:pointer;display:flex;align-items:center;">
        <span class="material-icons-outlined" style="font-size:18px;">delete</span>
      </button>
      <input type="text" class="label-edit-input" id="lbl_input_${l.id}" value="${escHtml(l.name)}" 
             onchange="updateLabelName('${l.id}', this.value)"
             style="flex:1;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--text);font-family:var(--font);font-size:0.9rem;outline:none;padding:4px 0;"
             onfocus="this.style.borderBottom='1px solid var(--accent)'"
             onblur="this.style.borderBottom='1px solid transparent'">
      <button class="icon-btn" onclick="focusLabelInput('${l.id}')" title="Rename label" style="color:var(--text2);background:none;border:none;cursor:pointer;display:flex;align-items:center;">
        <span class="material-icons-outlined" style="font-size:18px;">edit</span>
      </button>
    </div>
  `).join('');
}

function updateLabelName(id, newName) {
  const name = (newName || '').trim();
  if (!name) return;
  const label = labels.find(l => l.id === id);
  if (!label) return;
  
  if (label.name === name) return;

  if (labels.some(l => l.id !== id && l.name.toLowerCase() === name.toLowerCase())) {
    showToast('Label already exists');
    renderLabelsList();
    return;
  }

  label.name = name;
  saveLabels();
  buildSidebar();
  renderAll();
  showToast('Label updated');
}

function focusLabelInput(id) {
  const input = document.getElementById('lbl_input_' + id);
  if (input) {
    input.focus();
    input.select();
  }
}

// ─────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────
function wireEvents() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('searchClearBtn');

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearBtn?.classList.toggle('visible', !!searchQuery);
    renderAll();
  });

  clearBtn?.addEventListener('click', () => {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    clearBtn.classList.remove('visible');
    renderAll();
  });

  // Note input auto-save draft
  ['noteTitle', 'noteInput'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', scheduleDraftSave);
  });

  // Expand note input on keyboard Enter in collapsed state
  const collapsed = document.getElementById('noteCollapsed');
  collapsed?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') expandNoteInput();
  });

  // Keyboard shortcut: Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('noteModalOverlay')?.classList.contains('open')) {
        closeNoteInput();
      } else {
        saveAndCloseModal();
      }
      closeLabelsModal();
      closeAllPopups();
    }
    // Ctrl+S / Cmd+S saves
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (document.getElementById('noteExpanded')?.classList.contains('open')) {
        addNote();
      } else if (document.getElementById('noteModalOverlay')?.classList.contains('open')) {
        saveAndCloseModal();
      }
    }
  });

  // Labels modal close on overlay click (already handled via onclick, but also via Escape)
  document.getElementById('labelsModalOverlay')?.addEventListener('click', closeLabelsModal);
}

// ─────────────────────────────────────────────────────
// REMINDER / NOTIFICATION
// ─────────────────────────────────────────────────────
function scheduleReminder(note) {
  if (!note.reminder) return;
  const now  = Date.now();
  const diff = note.reminder - now;
  if (diff <= 0) return;
  if (Notification && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
  setTimeout(() => {
    if (Notification && Notification.permission === 'granted') {
      new Notification('Student Notes Reminder', {
        body: note.title || note.content?.slice(0, 80) || 'You have a note reminder!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📝</text></svg>'
      });
    }
  }, diff);
}

// ─────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────
function showToast(message, undoLabel, undoFn) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  if (undoLabel && undoFn) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo';
    btn.textContent = 'UNDO';
    btn.addEventListener('click', () => {
      undoFn();
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
    toast.appendChild(btn);
  }
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ─────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightText(html, query) {
  if (!query || !query.trim()) return html;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(q, 'gi'), match => `<mark class="highlight">${match}</mark>`);
}

// ─────────────────────────────────────────────────────
// VERSION HISTORY DIALOG
// ─────────────────────────────────────────────────────
function showVersionHistory(noteId, event) {
  event?.stopPropagation();
  closeAllPopups();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  // Create modal container if it doesn't exist
  let historyModal = document.getElementById('historyModal');
  if (!historyModal) {
    historyModal = document.createElement('div');
    historyModal.id = 'historyModal';
    historyModal.className = 'modal-overlay';
    historyModal.onclick = () => historyModal.classList.remove('open');
    document.body.appendChild(historyModal);
  }

  const historyList = note.history && note.history.length ? note.history : [];
  
  let listHtml = '';
  if (historyList.length === 0) {
    listHtml = `<div style="text-align:center;color:var(--text2);padding:20px 0;">No previous versions recorded yet. Edits you make in the editor modal will appear here.</div>`;
  } else {
    // Show newest first
    const reversedHistory = [...historyList].reverse();
    reversedHistory.forEach((ver, index) => {
      const actualIndex = historyList.length - 1 - index;
      const d = new Date(ver.updatedAt);
      const timeStr = d.toLocaleString();
      let previewText = ver.content ? ver.content.substring(0, 100) : '';
      if (ver.content && ver.content.length > 100) previewText += '...';
      if (ver.checklist && ver.checklist.length) {
        previewText = `[Checklist] ${ver.checklist.map(i => `${i.checked ? '☑' : '☐'} ${i.text}`).join(', ')}`;
      }
      listHtml += `
        <div style="padding:12px;border-bottom:1px solid var(--border-soft);display:flex;justify-content:space-between;align-items:center;gap:15px;">
          <div style="flex:1;">
            <div style="font-weight:500;font-size:0.9rem;color:var(--text);margin-bottom:4px;">${escHtml(ver.title || 'Untitled Note')}</div>
            <div style="font-size:0.8rem;color:var(--text2);margin-bottom:4px;word-break:break-all;">${escHtml(previewText)}</div>
            <div style="font-size:0.75rem;color:var(--accent);">${timeStr}</div>
          </div>
          <button onclick="restoreVersion('${note.id}', ${actualIndex}, event)" style="background:var(--accent);border:none;color:black;padding:6px 12px;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:500;white-space:nowrap;">Restore</button>
        </div>
      `;
    });
  }

  historyModal.innerHTML = `
    <div class="note-modal" onclick="event.stopPropagation()" style="max-width:450px;max-height:60vh;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border-soft);">
        <h3 style="margin:0;font-size:1.1rem;font-weight:600;flex:1;">Version History</h3>
        <button onclick="document.getElementById('historyModal').classList.remove('open')" style="background:none;border:none;color:var(--text2);cursor:pointer;display:flex;align-items:center;"><span class="material-icons">close</span></button>
      </div>
      <div style="overflow-y:auto;padding:10px 20px;flex:1;">
        ${listHtml}
      </div>
    </div>
  `;

  historyModal.classList.add('open');
}

function restoreVersion(noteId, versionIndex, event) {
  event?.stopPropagation();
  const note = notes.find(n => n.id === noteId);
  if (!note || !note.history || !note.history[versionIndex]) return;

  const ver = note.history[versionIndex];
  
  // Record current version as a new history item before restoring
  if (!note.history) note.history = [];
  note.history.push({
    title: note.title || '',
    content: note.content || '',
    checklist: note.checklist ? JSON.parse(JSON.stringify(note.checklist)) : null,
    updatedAt: Date.now()
  });

  // Restore the selected version
  note.title = ver.title;
  note.content = ver.content;
  note.checklist = ver.checklist ? JSON.parse(JSON.stringify(ver.checklist)) : null;
  note.updatedAt = Date.now();

  saveNotes();
  renderAll();
  
  // Close the history modal
  document.getElementById('historyModal')?.classList.remove('open');
  
  // If the edit modal was open, refresh it
  if (activeNoteId === noteId) {
    openNoteModal(noteId);
  }
  
  showToast('Note version restored');
}
