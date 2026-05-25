let notes = JSON.parse(localStorage.getItem("notes")) || [];

const THEME_KEY = "theme";

// Auto-save configuration
const AUTO_SAVE_KEY = 'draft';
const AUTO_SAVE_DELAY = 2000; // ms of inactivity before saving
let autoSaveTimer = null;

function scheduleAutoSave(){
    const statusEl = document.getElementById('saveStatus');
    if(statusEl) statusEl.textContent = 'Saving...';
    if(autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(()=>{
        saveDraft();
        if(statusEl) {
            const time = new Date();
            statusEl.textContent = 'Saved';
            // briefly show saved then clear after 2s
            setTimeout(()=>{ if(statusEl) statusEl.textContent = ''; }, 2000);
        }
        autoSaveTimer = null;
    }, AUTO_SAVE_DELAY);
}

function saveDraft(){
    const title = document.getElementById('noteTitle')?.value || '';
    const content = document.getElementById('noteInput')?.value || '';
    const tags = document.getElementById('noteTags')?.value || '';
    const subject = document.getElementById('noteSubject')?.value || '';

    const draft = {
        title, content, tags, subject, savedAt: Date.now()
    };
    try{ localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft)); }catch(e){ console.warn('Failed to save draft', e); }
}

function restoreDraft(){
    try{
        const raw = localStorage.getItem(AUTO_SAVE_KEY);
        if(!raw) return false;
        const draft = JSON.parse(raw);
        // If editor already has content, skip auto-restoring to avoid overwriting
        const currentContent = document.getElementById('noteInput')?.value || '';
        const currentTitle = document.getElementById('noteTitle')?.value || '';
        if(currentContent || currentTitle) return false;

        if(draft.title) document.getElementById('noteTitle').value = draft.title;
        if(draft.content) document.getElementById('noteInput').value = draft.content;
        if(draft.tags) document.getElementById('noteTags').value = draft.tags;
        if(draft.subject) document.getElementById('noteSubject').value = draft.subject;

        const statusEl = document.getElementById('saveStatus');
        if(statusEl) statusEl.textContent = 'Restored draft';
        setTimeout(()=>{ if(statusEl) statusEl.textContent = ''; }, 2000);
        return true;
    }catch(e){ return false; }
}

function clearDraft(){
    try{ localStorage.removeItem(AUTO_SAVE_KEY); }catch(e){}
}

// UI state
let searchQuery = "";
let filterTags = [];
let filterSubject = "";
let globalTags = [];

const TAGS_KEY = 'allTags';

function loadGlobalTags(){
    try{ globalTags = JSON.parse(localStorage.getItem(TAGS_KEY)) || []; }catch(e){ globalTags = []; }
}

function saveGlobalTags(){
    try{ localStorage.setItem(TAGS_KEY, JSON.stringify(globalTags)); }catch(e){}
}

function addGlobalTags(tags){
    if(!Array.isArray(tags)) return;
    tags.forEach(t=>{
        const val = String(t).trim();
        if(!val) return;
        const exists = globalTags.some(gt=>gt.toLowerCase() === val.toLowerCase());
        if(!exists) globalTags.push(val);
    });
    saveGlobalTags();
}

function renderSuggestedTags(){
    const container = document.getElementById('suggestedTags');
    if(!container) return;
    // compute tag counts from notes
    const counts = {};
    notes.forEach(n=> (n.tags||[]).forEach(t=>{ const k=t; counts[k] = (counts[k]||0)+1 }));
    // merge globalTags with counts, sort by count desc then name
    const list = Array.from(new Set([].concat(globalTags, Object.keys(counts))));
    list.sort((a,b)=> (counts[b]||0) - (counts[a]||0) || a.localeCompare(b));
    container.innerHTML = list.map(t=>`<button type="button" class="suggested-tag" onclick="applyTagFilter(${JSON.stringify(t)})">${escapeHtml(t)}${counts[t] ? ' ('+counts[t]+')' : ''}</button>`).join(' ');
}

function applyTagFilter(tag){
    if(!tag) return;
    filterTags = [String(tag)];
    const filterTagsInput = document.getElementById('filterTags');
    if(filterTagsInput) filterTagsInput.value = tag;
    displayNotes();
}

normalizeNotes();
displayNotes();
initTheme();

function normalizeNotes(){
    // Convert old string notes into structured objects
    notes = notes.map(n => {
        if(typeof n === 'string'){
            const lines = n.split('\n').map(l=>l.trim()).filter(Boolean);
            return {
                id: Date.now() + Math.floor(Math.random()*1000),
                title: lines[0] || '',
                content: lines.slice(1).join('\n') || lines[0] || '',
                tags: [],
                subject: '',
                pinned: false,
                favorite: false
            };
        }
        // Already structured, ensure keys exist
        return {
            id: n.id || (Date.now() + Math.floor(Math.random()*1000)),
            title: n.title || '',
            content: n.content || '',
            tags: Array.isArray(n.tags) ? n.tags : (n.tags ? String(n.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
            subject: n.subject || '',
            pinned: !!n.pinned,
            favorite: !!n.favorite
        };
    });

    localStorage.setItem('notes', JSON.stringify(notes));
    // load and sync tags
    loadGlobalTags();
    // seed global tags from notes
    notes.forEach(n=> addGlobalTags(n.tags||[]));
    renderSuggestedTags();
}

function addNote() {
    let title = document.getElementById("noteTitle").value.trim();
    let input = document.getElementById("noteInput");
    let noteText = input.value.trim();
    let tagsText = document.getElementById('noteTags').value.trim();
    let subjectText = document.getElementById('noteSubject').value.trim();

    if(noteText === ""){
        alert("Please enter a note");
        return;
    }

    const newNote = {
        id: Date.now(),
        title: title,
        content: noteText,
        tags: tagsText ? tagsText.split(',').map(t=>t.trim()).filter(Boolean) : [],
        subject: subjectText || '',
        pinned: false
    };

    notes.unshift(newNote);

    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById('noteTitle').value = '';
    document.getElementById('noteInput').value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('noteSubject').value = '';

    refreshFilters();
    displayNotes();

    // Clear any saved draft after successful save
    clearDraft();

    // update global tags list and suggestions
    addGlobalTags(newNote.tags);
    renderSuggestedTags();
}

function displayNotes(){
    let container = document.getElementById("notesContainer");
    let pinnedContainer = document.getElementById('pinnedContainer');
    const pinnedSection = document.getElementById('pinnedSection');
    container.innerHTML = "";
    pinnedContainer.innerHTML = "";

    const q = searchQuery.trim();
    const tagsFilter = filterTags.map(t=>t.toLowerCase());
    const subjectFilter = filterSubject.toLowerCase();

    const favoritesContainer = document.getElementById('favoritesContainer');
    const favoritesSection = document.getElementById('favoritesSection');

    notes.forEach((note)=>{
        const combined = (note.title + ' ' + note.content).toLowerCase();

        // Filter by search query
        if(q){
            if(!combined.includes(q.toLowerCase())) return;
        }

        // Filter by tags
        if(tagsFilter.length){
            const noteTags = (note.tags || []).map(t=>t.toLowerCase());
            const hasTag = tagsFilter.every(t=>noteTags.includes(t));
            if(!hasTag) return;
        }

        // Filter by subject
        if(subjectFilter){
            if((note.subject || '').toLowerCase() !== subjectFilter) return;
        }

        const titleHtml = note.title ? `<div class="note-title">${escapeHtml(note.title)}</div>` : '';

        // Render markdown to HTML safely and then highlight text nodes
        let rawHtml = '';
        try{
            if(window.marked){
                rawHtml = marked.parse(note.content || '');
            } else {
                rawHtml = escapeHtml(note.content || '');
            }
        }catch(e){
            rawHtml = escapeHtml(note.content || '');
        }

        const safeHtml = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(rawHtml) : rawHtml;

        // Use a temporary element to perform text-node highlighting
        const tmp = document.createElement('div');
        tmp.innerHTML = safeHtml;
        if(q) highlightInElement(tmp, q);
        const contentHtml = `<div class="note-content">${tmp.innerHTML}</div>`;
        const subjectHtml = note.subject ? `<div class="note-subject">Subject: ${escapeHtml(note.subject)}</div>` : '';
        const tagsHtml = (note.tags || []).length ? `<div class="note-tags">${note.tags.map(t=>`<button type="button" class="tag" onclick="applyTagFilter(${JSON.stringify(t)})">${escapeHtml(t)}</button>`).join('')}</div>` : '';

        // Favorite & Pin buttons
        const favBtn = `<button class="favorite-btn ${note.favorite ? 'active' : ''}" onclick="toggleFavorite('${note.id}')" aria-label="Toggle favorite">${note.favorite ? '★' : '☆'}</button>`;
        const pinBtn = `<button class="pin-btn" onclick="togglePin('${note.id}')" aria-label="Toggle pin">${note.pinned ? 'Unpin' : 'Pin'}</button>`;

        const noteHtml = `
            <div class="note">
                ${favBtn}
                ${pinBtn}
                ${titleHtml}
                ${contentHtml}
                ${subjectHtml}
                ${tagsHtml}
                <button class="delete-btn" onclick="deleteNote('${note.id}')" aria-label="Delete note">X</button>
            </div>
        `;

        if(note.favorite){
            // favorites shown in dedicated section
            if(favoritesContainer) favoritesContainer.innerHTML += noteHtml;
        } else if(note.pinned){
            pinnedContainer.innerHTML += noteHtml;
        } else {
            container.innerHTML += noteHtml;
        }
    });

    // Show or hide pinned section
    if(pinnedContainer.children.length){
        pinnedSection.style.display = '';
    } else {
        pinnedSection.style.display = 'none';
    }
    if(favoritesContainer && favoritesSection){
        if(favoritesContainer.children.length){
            favoritesSection.style.display = '';
        } else {
            favoritesSection.style.display = 'none';
        }
    }

    // refresh suggested tag counts
    renderSuggestedTags();
}

// Walk DOM and wrap matching text in <mark> elements (case-insensitive)
function highlightInElement(element, query){
    if(!query) return;
    const q = String(query).trim();
    if(!q) return;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'ig');

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(textNode => {
        const parent = textNode.parentNode;
        if(!parent) return;
        const text = textNode.nodeValue;
        if(!re.test(text)) return;
        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        text.replace(re, (match, offset) => {
            const before = text.slice(lastIndex, offset);
            if(before) frag.appendChild(document.createTextNode(before));
            const mark = document.createElement('mark');
            mark.className = 'highlight';
            mark.textContent = match;
            frag.appendChild(mark);
            lastIndex = offset + match.length;
            return match;
        });
        const after = text.slice(lastIndex);
        if(after) frag.appendChild(document.createTextNode(after));
        parent.replaceChild(frag, textNode);
    });
}

function deleteNote(id){
    const idx = notes.findIndex(n=>String(n.id) === String(id));
    if(idx === -1) return;
    notes.splice(idx,1);

    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );

    refreshFilters();
    displayNotes();
}

function togglePin(id){
    const idx = notes.findIndex(n=>String(n.id) === String(id));
    if(idx === -1) return;
    notes[idx].pinned = !notes[idx].pinned;
    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes();
}

function toggleFavorite(id){
    const idx = notes.findIndex(n=>String(n.id) === String(id));
    if(idx === -1) return;
    notes[idx].favorite = !notes[idx].favorite;
    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes();
}

function refreshFilters(){
    // Populate subjects dropdown
    const select = document.getElementById('filterSubject');
    if(!select) return;
    const subjects = Array.from(new Set(notes.map(n=> (n.subject||'').trim()).filter(Boolean)));
    const current = select.value;
    select.innerHTML = '<option value="">All subjects</option>' + subjects.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    select.value = current || '';
}

// Search and filter input wiring
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const filterTagsInput = document.getElementById('filterTags');
    const filterSubjectSelect = document.getElementById('filterSubject');
    const livePreviewToggle = document.getElementById('livePreviewToggle');
    const livePreview = document.getElementById('livePreview');
    const noteInput = document.getElementById('noteInput');
    const titleInput = document.getElementById('noteTitle');
    const tagsInput = document.getElementById('noteTags');
    const subjectInput = document.getElementById('noteSubject');
    const saveStatus = document.getElementById('saveStatus');

    if(searchInput){
        searchInput.addEventListener('input', (e)=>{
            searchQuery = e.target.value;
            displayNotes();
        });
    }

    if(filterTagsInput){
        filterTagsInput.addEventListener('input', (e)=>{
            const txt = e.target.value.trim();
            filterTags = txt ? txt.split(',').map(t=>t.trim()).filter(Boolean) : [];
            displayNotes();
        });
    }

    if(filterSubjectSelect){
        filterSubjectSelect.addEventListener('change', (e)=>{
            filterSubject = e.target.value;
            displayNotes();
        });
    }

    refreshFilters();
    // Restore any unsaved draft if present
    restoreDraft();
    // Wire autosave to inputs
    [noteInput, titleInput, tagsInput, subjectInput].forEach(inp=>{
        if(!inp) return;
        inp.addEventListener('input', ()=>{
            scheduleAutoSave();
        });
    });
    // Wire suggested tag add
    const newTagInput = document.getElementById('newTagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    if(addTagBtn && newTagInput){
        addTagBtn.addEventListener('click', ()=>{
            const v = (newTagInput.value||'').trim();
            if(!v) return;
            addGlobalTags([v]);
            newTagInput.value = '';
            renderSuggestedTags();
        });
        newTagInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); addTagBtn.click(); } });
    }
    // Live preview handling
    if(noteInput && livePreview && livePreviewToggle){
        const updatePreview = () => {
            const isOn = livePreviewToggle.checked;
            livePreview.setAttribute('aria-hidden', isOn ? 'false' : 'true');
            if(!isOn){
                livePreview.style.display = 'none';
                return;
            }
            livePreview.style.display = 'block';
            const raw = noteInput.value || '';
            let html = raw;
            try{ html = window.marked ? marked.parse(raw) : escapeHtml(raw); }catch(e){ html = escapeHtml(raw); }
            const safe = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(html) : html;
            livePreview.innerHTML = safe;
        };

        noteInput.addEventListener('input', updatePreview);
        livePreviewToggle.addEventListener('change', updatePreview);
    }
});

function initTheme(){
    const toggleBtn = document.getElementById("themeToggle");

    const savedTheme = localStorage.getItem(THEME_KEY); // "light" | "dark" | null
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : (systemPrefersDark ? "dark" : "light");

    applyTheme(initialTheme, false);

    if(toggleBtn){
        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next, true);
        });
    }
}

function applyTheme(theme, persist){
    document.documentElement.setAttribute('data-theme', theme);

    if(persist){
        localStorage.setItem(THEME_KEY, theme);
    }
}

function escapeHtml(str){
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeRegExp(string){
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightHtml(text, query){
    if(!query) return escapeHtml(text);
    const q = escapeRegExp(query.trim());
    if(!q) return escapeHtml(text);
    const re = new RegExp(`(${q})`, 'ig');
    return escapeHtml(text).replace(re, '<mark class="highlight">$1</mark>');
}

