let notes = (JSON.parse(localStorage.getItem("notes")) || []).map(n => 
    typeof n === 'string' 
        ? { text: n, title: "", tags: "", subject: "", folder: "", archived: false, pinned: false, date: "Created: " + new Date().toLocaleString() } 
        : { 
            ...n, 
            pinned: n.pinned || false, 
            archived: n.archived || false 
          }
);
let folders = JSON.parse(localStorage.getItem("folders")) || [];
let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let attendance = JSON.parse(localStorage.getItem("attendance")) || {};

// Data Migration
notes = notes.map((note, index) => {
    if (typeof note === "string") {
        return { id: Date.now() + index, text: note, status: 'todo', pinned: false };
    }
    if (note.pinned === undefined) {
        note.pinned = false;
    }
    return note;
});
localStorage.setItem("notes", JSON.stringify(notes));
let currentView = "list";
const THEME_KEY = "theme";


let currentView = "list"; // default view

displayNotes();
initTheme();

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

let currentView = "list"; // default view

normalizeNotes();

displayNotes();
initTheme();
setupInputListeners();
updateSidebar();

function toggleView() {
    currentView = currentView === "list" ? "board" : "list";
    let btn = document.getElementById("toggleViewBtn");
    btn.innerText = currentView === "list" ? "Switch to Board View" : "Switch to List View";
    
    let listContainer = document.getElementById("notesContainer");
    let boardContainer = document.getElementById("kanbanBoard");

    if (currentView === "list") {
        listContainer.classList.remove("hidden");
        boardContainer.classList.add("hidden");
    } else {
        listContainer.classList.add("hidden");
        boardContainer.classList.remove("hidden");
    }
    
    displayNotes();
}

function addNote() {

    const input = document.getElementById("noteInput");
    const titleInput = document.getElementById("noteTitle");
    const tagsInput = document.getElementById("noteTags");
    const subjectInput = document.getElementById("noteSubject");
    const folderInput = document.getElementById("noteFolder");
    
    const noteText = input.value.trim();
    const titleText = titleInput.value.trim();

    let title = document.getElementById("noteTitle").value.trim();
    let input = document.getElementById("noteInput");
    let titleInput = document.getElementById("noteTitle");
    let tagsInput = document.getElementById("noteTags");
    let subjectInput = document.getElementById("noteSubject");
    
    let noteText = input.value.trim();
    let titleText = titleInput.value.trim();

    if(noteText === ""){
        alert("Please enter a note");
        return;
    }


    notes.push({ 
        text: noteText, 
        title: titleText,
        tags: tagsInput.value,
        subject: subjectInput.value,
        date: "Created: " + new Date().toLocaleString() 
    });

    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );

    input.value = "";
    titleInput.value = "";
    tagsInput.value = "";
    subjectInput.value = "";

    let newNote = {
        id: Date.now(),
        text: noteText,
        status: 'todo',
    if (notes.some(n => n.text === noteText)) {



    if(noteText === "" && titleText === ""){
        alert("Please enter a title or note content");
        return;
    }


    notes.push({ 
        text: noteText, 
        title: titleText,
        tags: tagsInput.value,
        subject: subjectInput.value,
        folder: folderInput.value,
        archived: false,
        pinned: false,
        date: "Created: " + new Date().toLocaleString() 
    });

    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );

    input.value = "";
    titleInput.value = "";
    tagsInput.value = "";
    subjectInput.value = "";

    notes.push({ text: noteText, date: "Created: " + new Date().toLocaleString() });
    let dueDate = document.getElementById('noteDueDate')?.value || '';

    const newNote = {
        id: Date.now(),
        title: title,
        content: noteText,
        tags: tagsText ? tagsText.split(',').map(t=>t.trim()).filter(Boolean) : [],
        subject: subjectText || '',
        folderId: folderId || '',
        sections: gatherSectionsFromEditor(),
        pinned: false,
        dueDate: dueDate,
        status: 'todo'
    };

    notes.push(newNote);

    localStorage.setItem("notes", JSON.stringify(notes));
    input.value = "";

    document.getElementById('noteTitle').value = '';
    document.getElementById('noteInput').value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('noteSubject').value = '';
    const folderSelect = document.getElementById('noteFolder'); if(folderSelect) folderSelect.value = '';
    const dateInput = document.getElementById('noteDueDate'); if(dateInput) dateInput.value = '';


    displayNotes();
}

function displayNotes(){
    const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    let container = document.getElementById("notesContainer");
    const showArchived = document.getElementById("showArchived")?.checked || false;
    const searchQuery = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const sortOrder = document.getElementById("sortOrder")?.value || "";

    container.innerHTML = "";

    pinnedContainer.innerHTML = "";

    const q = searchQuery.trim();
    const tagsFilter = filterTags.map(t=>t.toLowerCase());
    const subjectFilter = filterSubject.toLowerCase();

    const favoritesContainer = document.getElementById('favoritesContainer');
    const favoritesSection = document.getElementById('favoritesSection');

    const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (currentView === "board") {
        let todoContainer = document.querySelector("#todo .kanban-content");
        let doingContainer = document.querySelector("#doing .kanban-content");
        let doneContainer = document.querySelector("#done .kanban-content");
        if(todoContainer) todoContainer.innerHTML = "";
        if(doingContainer) doingContainer.innerHTML = "";
        if(doneContainer) doneContainer.innerHTML = "";
    }

    sortedNotes.forEach((note)=>{
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

        // Filter by folder (include descendants)
        if(currentFolder){
            const allowed = getDescendantFolderIds(currentFolder).concat([String(currentFolder)]);
            if(!allowed.includes(String(note.folderId || ''))) return;
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



    // Sort Logic: Pinned first, then by the selected Sort Order
    notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        
        if (sortOrder === "asc") return (a.title || a.text).localeCompare(b.title || b.text);
        if (sortOrder === "desc") return (b.title || b.text).localeCompare(a.title || a.text);
        return 0;
    });


    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No notes found. Start by adding your first note above!</p>
            </div>
        `;
        return;
    }

    notes.forEach((note,index)=>{
        if (!!note.archived !== showArchived) return;
        if (searchQuery) {
            const matches = 
                (note.title || "").toLowerCase().includes(searchQuery) ||
                (note.text || "").toLowerCase().includes(searchQuery) ||
                (note.tags || "").toLowerCase().includes(searchQuery) ||
                (note.subject || "").toLowerCase().includes(searchQuery);
            if (!matches) return;
        }

        const tagsHtml = note.tags ? note.tags.split(',').map(t => `<span class="note-tag">#${t.trim()}</span>`).join('') : '';
        
        container.innerHTML += `
            <div class="note ${note.pinned ? 'pinned' : ''} ${note.archived ? 'archived' : ''}">
                <div class="note-actions">
                    <button class="icon-btn pin-btn" onclick="togglePin(${index})" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${note.pinned ? '📍' : '📌'}
                    </button>
                    <button class="icon-btn archive-btn" onclick="toggleArchive(${index})" title="${note.archived ? 'Restore' : 'Archive'}">
                        ${note.archived ? '📥' : '📦'}
                    </button>
                    <button class="icon-btn edit-btn" onclick="editNote(${index})" aria-label="Edit">✎</button>
                    <button class="icon-btn delete-btn" onclick="deleteNote(${index})" aria-label="Delete">✕</button>
                </div>
                ${note.title ? `<strong class="note-title">${escapeHtml(note.title)}</strong>` : ''}
                <div class="note-text">${renderMarkdown(note.text)}</div>
                <div class="note-footer" style="margin-top:10px">
                    ${tagsHtml}
                </div>
                <div class="note-date">${note.date}</div>
            </div>
        `;
    });
}


    // Sort Logic: Pinned first, then by the selected Sort Order
    notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        
        if (sortOrder === "asc") return (a.title || a.text).localeCompare(b.title || b.text);
        if (sortOrder === "desc") return (b.title || b.text).localeCompare(a.title || a.text);
        return 0;
    });


    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No notes found. Start by adding your first note above!</p>
            </div>
        `;
        return;
    }

    notes.forEach((note,index)=>{
        if (!!note.archived !== showArchived) return;
        if (searchQuery && !note.title.toLowerCase().includes(searchQuery) && !note.text.toLowerCase().includes(searchQuery)) return;

        const tagsHtml = note.tags ? note.tags.split(',').map(t => `<span class="note-tag">#${t.trim()}</span>`).join('') : '';
        
        container.innerHTML += `
            <div class="note ${note.pinned ? 'pinned' : ''} ${note.archived ? 'archived' : ''}">
                <div class="note-actions">
                    <button class="icon-btn pin-btn" onclick="togglePin(${index})" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${note.pinned ? '📍' : '📌'}
                    </button>
                    <button class="icon-btn archive-btn" onclick="toggleArchive(${index})" title="${note.archived ? 'Restore' : 'Archive'}">
                        ${note.archived ? '📥' : '📦'}
                    </button>
                    <button class="icon-btn edit-btn" onclick="editNote(${index})" aria-label="Edit">✎</button>
                    <button class="icon-btn delete-btn" onclick="deleteNote(${index})" aria-label="Delete">✕</button>
                </div>
                ${note.title ? `<strong class="note-title">${escapeHtml(note.title)}</strong>` : ''}
                <div class="note-text">${renderMarkdown(note.text)}</div>
                <div class="note-footer" style="margin-top:10px">
                    ${tagsHtml}
                </div>
                <div class="note-date">${note.date}</div>
            </div>
        `;
    });
}


    // Sort Logic: Pinned first, then by the selected Sort Order
    notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        
        if (sortOrder === "asc") return (a.title || a.text).localeCompare(b.title || b.text);
        if (sortOrder === "desc") return (b.title || b.text).localeCompare(a.title || a.text);
        return 0;
    });


    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No notes found. Start by adding your first note above!</p>
            </div>
        `;
        return;
    }

    notes.forEach((note,index)=>{
        if (!!note.archived !== showArchived) return;
        if (searchQuery) {
            const matches = 
                (note.title || "").toLowerCase().includes(searchQuery) ||
                (note.text || "").toLowerCase().includes(searchQuery) ||
                (note.tags || "").toLowerCase().includes(searchQuery) ||
                (note.subject || "").toLowerCase().includes(searchQuery);
            if (!matches) return;
        }

        const tagsHtml = note.tags ? note.tags.split(',').map(t => `<span class="note-tag">#${t.trim()}</span>`).join('') : '';
        
        container.innerHTML += `
            <div class="note ${note.pinned ? 'pinned' : ''} ${note.archived ? 'archived' : ''}">
                <div class="note-actions">
                    <button class="icon-btn pin-btn" onclick="togglePin(${index})" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${note.pinned ? '📍' : '📌'}
                    </button>
                    <button class="icon-btn archive-btn" onclick="toggleArchive(${index})" title="${note.archived ? 'Restore' : 'Archive'}">
                        ${note.archived ? '📥' : '📦'}
                    </button>
                    <button class="icon-btn edit-btn" onclick="editNote(${index})" aria-label="Edit">✎</button>
                    <button class="icon-btn delete-btn" onclick="deleteNote(${index})" aria-label="Delete">✕</button>
                </div>
                ${note.title ? `<strong class="note-title">${escapeHtml(note.title)}</strong>` : ''}
                <div class="note-text">${renderMarkdown(note.text)}</div>
                <div class="note-footer" style="margin-top:10px">
                    ${tagsHtml}
                </div>
                <div class="note-date">${note.date}</div>
            </div>
        `;
    });
}


        // Use a temporary element to perform text-node highlighting
        const tmp = document.createElement('div');
        tmp.innerHTML = safeHtml;
        if(q) highlightInElement(tmp, q);
        const contentHtml = `<div class="note-content">${tmp.innerHTML}</div>`;
        const subjectColor = (note.subject && subjects[note.subject]) ? sanitizeColor(subjects[note.subject]) : '';
        const subjectHtml = note.subject ? `<div class="note-subject"><span class="subject-chip" style="background:${subjectColor};">${escapeHtml(note.subject)}</span></div>` : '';
        // render sections
        const sectionsHtml = (note.sections || []).map(s=>{
            const t = String(s.type || '').toLowerCase();
            const c = s.content || '';
            if(t === 'code'){
                return `<div class="note-section"><div class="section-type">Code / Example</div><pre class="note-code">${escapeHtml(c)}</pre></div>`;
            }
            if(t === 'formula'){
                return `<div class="note-section"><div class="section-type">Formula / Reference</div><pre class="note-formula">${escapeHtml(c)}</pre></div>`;
            }
            const titleMap = { lecture: 'Lecture', important: 'Important', summary: 'Summary' };
            const heading = titleMap[t] || escapeHtml(s.type || 'Section');
            let raw = '';
            try{ raw = window.marked ? marked.parse(c||'') : escapeHtml(c); }catch(e){ raw = escapeHtml(c); }
            const safe = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(raw) : raw;
            return `<div class="note-section"><div class="section-type">${heading}</div><div class="section-content">${safe}</div></div>`;
        }).join('');
        const tagsHtml = (note.tags || []).length ? `<div class="note-tags">${note.tags.map(t=>`<button type="button" class="tag" onclick="applyTagFilter(${JSON.stringify(t)})">${escapeHtml(t)}</button>`).join('')}</div>` : '';

        // Favorite & Pin buttons
        const favBtn = `<button class="favorite-btn ${note.favorite ? 'active' : ''}" onclick="toggleFavorite('${note.id}')" aria-label="Toggle favorite">${note.favorite ? '★' : '☆'}</button>`;
        const pinBtn = `<button class="pin-btn ${note.pinned ? 'active' : ''}" onclick="togglePin('${note.id}')" title="Pin to top">📌</button>`;
        const badgeHTML = getDueDateBadgeHTML(note.dueDate);

        const noteHtml = `
            <div class="note ${note.pinned ? 'pinned' : ''}" draggable="true" ondragstart="dragStart(event, '${note.id}')">
                ${favBtn}
                ${pinBtn}
                ${titleHtml}
                ${badgeHTML}
                ${contentHtml}
                ${subjectHtml}
                ${tagsHtml}
                ${sectionsHtml}
                <button class="delete-btn" onclick="deleteNote('${note.id}')" aria-label="Delete note">X</button>
            </div>
        `;

        if (currentView === 'board') {
            let containerId = note.status === 'doing' ? '#doing' : note.status === 'done' ? '#done' : '#todo';
            let kCont = document.querySelector(`${containerId} .kanban-content`);
            if(kCont) kCont.innerHTML += noteHtml;
        } else {
            if(note.favorite){
                // favorites shown in dedicated section
                if(favoritesContainer) favoritesContainer.innerHTML += noteHtml;
            } else if(note.pinned){
                pinnedContainer.innerHTML += noteHtml;
            } else {
                container.innerHTML += noteHtml;
            }
        }
    });

    if (currentView === "list") {
        let container = document.getElementById("notesContainer");
        container.innerHTML = "";
        sortedNotes.forEach((note) => {
            container.innerHTML += createNoteHTML(note);
        });
    } else {
        let todoContainer = document.querySelector("#todo .kanban-content");
        let doingContainer = document.querySelector("#doing .kanban-content");
        let doneContainer = document.querySelector("#done .kanban-content");
        
        todoContainer.innerHTML = "";
        doingContainer.innerHTML = "";
        doneContainer.innerHTML = "";

        sortedNotes.forEach((note) => {
            let html = createNoteHTML(note);
            if (note.status === 'todo') todoContainer.innerHTML += html;
            else if (note.status === 'doing') doingContainer.innerHTML += html;
            else if (note.status === 'done') doneContainer.innerHTML += html;
            else todoContainer.innerHTML += html; // fallback
        });
    }
}

function createNoteHTML(note) {
    return `
        <div class="note ${note.pinned ? 'pinned' : ''}" draggable="true" ondragstart="dragStart(event, ${note.id})">
            ${note.text}
            <button class="pin-btn ${note.pinned ? 'active' : ''}" onclick="togglePin(${note.id})" title="Pin to top">📌</button>
            <button class="delete-btn" onclick="deleteNote(${note.id})">X</button>
        </div>
    `;
}

function togglePin(id) {
    let note = notes.find(n => n.id === id);
    if (note) {
        note.pinned = !note.pinned;

function editNote(index){
    const note = notes[index];
    const newText = prompt("Edit your note content:", note.text);
    if(newText !== null && newText.trim() !== ""){
        notes[index] = { 
            ...note, 
            text: newText.trim(), 
            date: "Edited: " + new Date().toLocaleString() 
        };
        localStorage.setItem("notes", JSON.stringify(notes));
        displayNotes();
    }
}

function toggleArchive(index) {
    notes[index].archived = !notes[index].archived;
    notes[index].date = (notes[index].archived ? "Archived: " : "Restored: ") + new Date().toLocaleString();
    localStorage.setItem("notes", JSON.stringify(notes));
    displayNotes();
}

function sortNotes() {
    const sortOrder = document.getElementById("sortOrder").value;
    if (sortOrder === "asc") {
        notes.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortOrder === "desc") {
        notes.sort((a, b) => b.text.localeCompare(a.text));
    }

    localStorage.setItem("notes", JSON.stringify(notes));
    displayNotes();
}

function deleteNote(index){
    notes.splice(index,1);


    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );

    displayNotes();
}

function initTheme(){
    const toggleBtn = document.getElementById("themeToggle");

    const savedTheme = localStorage.getItem(THEME_KEY); // "light" | "dark" | null
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Priority: saved preference -> system -> light
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

    // Update toggle icon for better UX
    const sunIcon = document.querySelector('.theme-icon--sun');
    const moonIcon = document.querySelector('.theme-icon--moon');

    if(sunIcon && moonIcon){
        if(theme === 'dark'){
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        } else {
            sunIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        }
    }
}

// Basic XSS protection since we render notes as HTML via innerHTML.
function escapeHtml(str){
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;');
}

function setupInputListeners() {
    // Map input IDs to their respective actions
    const inputs = [
        { id: "searchInput", action: displayNotes },
        { id: "noteTitle", action: addNote },
        { id: "noteInput", action: addNote, isTextArea: true },
        { id: "noteTags", action: addNote },
        { id: "noteSubject", action: addNote },
        { id: "newFolderName", action: addFolder },
        { id: "newSubjectName", action: addSubject }
    ];

    const noteInput = document.getElementById("noteInput");
    const previewToggle = document.getElementById("livePreviewToggle");

    inputs.forEach(inputConfig => {
        const el = document.getElementById(inputConfig.id);
        if (el) {
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    if (!inputConfig.isTextArea || e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        inputConfig.action();
                    }
                }
            });
        }
    });

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
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem("notes", JSON.stringify(notes));
    displayNotes();
}

// Drag and Drop Logic
function dragStart(event, id) {
    event.dataTransfer.setData("text/plain", id);
    // Use timeout to hide the element while dragging for better visual
    setTimeout(() => {
        event.target.classList.add("dragging");
    }, 0);
}

document.addEventListener("dragend", (event) => {
    if (event.target.classList.contains("note")) {
        event.target.classList.remove("dragging");
    }
});

function allowDrop(event) {
    event.preventDefault();
    let column = event.target.closest('.kanban-column');
    if (column) {
        column.classList.add("drag-over");
    }
}

function dragLeave(event) {
    let column = event.target.closest('.kanban-column');
    if (column) {
        column.classList.remove("drag-over");
    }
}

function drop(event) {
    event.preventDefault();
    let column = event.target.closest('.kanban-column');
    if (column) {
        column.classList.remove("drag-over");
        let newStatus = column.getAttribute('data-status');
        let noteId = parseInt(event.dataTransfer.getData("text/plain"));
        
        let note = notes.find(n => n.id === noteId);
        if (note) {
            let oldStatus = note.status;
            note.status = newStatus;
            localStorage.setItem("notes", JSON.stringify(notes));
        // Reset the input value so the same file can be re-uploaded if modified
        event.target.value = '';
    };
    reader.readAsText(file);
}
function refreshFilters(){
    // Populate subjects dropdown
    const select = document.getElementById('filterSubject');
    if(!select) return;
    const subjects = Array.from(new Set(notes.map(n=> (n.subject||'').trim()).filter(Boolean)));
    const current = select.value;
    select.innerHTML = '<option value="">All subjects</option>' + subjects.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    select.value = current || '';

    // populate folder select for note creation and ensure folders are rendered
    populateFolderSelect();
    renderFolders();
    // render subjects panel and ensure subject list affects filter
    renderSubjects();
    populateFilterSubject();
    renderAttendancePanel();
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

            if (oldStatus !== 'done' && newStatus === 'done') {
                showToast("🎉 Congratulations on completing a task!");
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
    // Wire subject add
    const newSubjectInput = document.getElementById('newSubjectName');
    const newSubjectColor = document.getElementById('newSubjectColor');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    if(addSubjectBtn && newSubjectInput){
        addSubjectBtn.addEventListener('click', ()=>{
            const n = (newSubjectInput.value||'').trim();
            const c = newSubjectColor ? newSubjectColor.value : '#ffd966';
            if(!n) return;
            addSubject(n, c);
            newSubjectInput.value = '';
        });
        newSubjectInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); addSubjectBtn.click(); } });
    }
    // Wire sections add/remove UI
    const addSectionBtn = document.getElementById('addSectionBtn');
    const newSectionType = document.getElementById('newSectionType');
    if(addSectionBtn && newSectionType){
        addSectionBtn.addEventListener('click', ()=>{
            const t = (newSectionType.value||'lecture');
            addSectionBlock(t, '');
        });
    }
    // Wire folder add button
    const newFolderInput = document.getElementById('newFolderName');
    const addFolderBtn = document.getElementById('addFolderBtn');
    if(addFolderBtn && newFolderInput){
        addFolderBtn.addEventListener('click', ()=>{
            const v = (newFolderInput.value||'').trim();
            if(!v) return;
            addFolder(v, '');
            newFolderInput.value = '';
        });
        newFolderInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); addFolderBtn.click(); } });
    }
    // Render folders and populate selects on load
    try{ renderFolders(); populateFolderSelect(); }catch(e){}
    // Attendance wiring
    const attendanceDate = document.getElementById('attendanceDate');
    const markPresentBtn = document.getElementById('markPresentBtn');
    const markAbsentBtn = document.getElementById('markAbsentBtn');
    const attendanceSubject = document.getElementById('attendanceSubject');
    if(attendanceDate) attendanceDate.value = formatYMD(new Date());
    if(markPresentBtn){
        markPresentBtn.addEventListener('click', ()=>{
            const subj = attendanceSubject?.value || '';
            if(!subj){ alert('Select a subject first'); return; }
            const ok = addAttendanceRecord(subj, attendanceDate?.value, 'present');
            if(ok){ renderAttendancePanel(); alert('Recorded present for '+subj); }
        });
    }
    if(markAbsentBtn){
        markAbsentBtn.addEventListener('click', ()=>{
            const subj = attendanceSubject?.value || '';
            if(!subj){ alert('Select a subject first'); return; }
            const ok = addAttendanceRecord(subj, attendanceDate?.value, 'absent');
            if(ok){ renderAttendancePanel(); alert('Recorded absent for '+subj); }
        });
    }
    // initial attendance panel render
    try{ renderAttendancePanel(); }catch(e){}
    // Assignments wiring
    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    const assignmentTitle = document.getElementById('assignmentTitle');
    const assignmentSubject = document.getElementById('assignmentSubject');
    const assignmentDue = document.getElementById('assignmentDue');
    if(addAssignmentBtn){
        addAssignmentBtn.addEventListener('click', ()=>{
            const t = (assignmentTitle?.value||'').trim();
            const s = (assignmentSubject?.value||'').trim();
            const d = assignmentDue?.value || '';
            if(!t){ alert('Enter assignment title'); return; }
            addAssignment(t,s,d);
            assignmentTitle.value = '';
            if(assignmentSubject) assignmentSubject.value = '';
            if(assignmentDue) assignmentDue.value = '';
        });
    }
    // render assignments and subject select initially
    try{ renderAssignmentSubjectSelect(); renderAssignments(); }catch(e){}
    // Live preview handling
    if(noteInput && livePreview && livePreviewToggle){
        const updatePreview = () => {
            const isOn = livePreviewToggle.checked;
            livePreview.setAttribute('aria-hidden', isOn ? 'false' : 'true');
            if(!isOn){
                livePreview.style.display = 'none';
                return;
            }
        }
    }
}

function showToast(message) {
    let container = document.getElementById("toastContainer");
    if (!container) return;

    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ---------------------
// Minimal Recent History
// ---------------------
// ---------------------
// Minimal Folder support
// ---------------------
function saveFolders(){
    try{ localStorage.setItem('folders', JSON.stringify(folders)); }catch(e){}
}

function addFolder(name, parentId){
    if(!name || !name.trim()) return;
    const id = String(Date.now() + Math.floor(Math.random()*1000));
    folders.push({ id, name: name.trim(), parent: parentId || '' });
    saveFolders();
    renderFolders();
    populateFolderSelect();
}

function getChildren(parentId){
    return folders.filter(f=> (f.parent||'') === String(parentId));
}

function renderFolders(containerId = 'foldersTree'){
    const container = document.getElementById(containerId);
    if(!container) return;
    const build = (parentId) => {
        const children = getChildren(parentId);
        if(!children.length) return '';
        return `<ul class="folder-list">${children.map(c=>`<li class="folder-item ${String(c.id)===String(currentFolder)?'selected':''}">
            <span class="name" onclick="selectFolder('${c.id}')">${escapeHtml(c.name)}</span>
            <span class="folder-actions">
              <button onclick="promptAddSub('${c.id}')">Add sub</button>
            </span>
            ${build(c.id)}
        </li>`).join('')}</ul>`;
    };
    container.innerHTML = build('') || '<div class="muted">No folders</div>';
}

function promptAddSub(parentId){
    const name = prompt('Subfolder name:');
    if(!name) return;
    addFolder(name, parentId);
}

function selectFolder(id){
    currentFolder = id || null;
    // highlight
    renderFolders();
    // set filter and refresh
    displayNotes();
    // set folder selection in note form
    const noteFolder = document.getElementById('noteFolder');
    if(noteFolder) noteFolder.value = id || '';
}

function getDescendantFolderIds(id){
    const res = [];
    const walk = (pid)=>{
        const children = getChildren(pid);
        children.forEach(c=>{ res.push(String(c.id)); walk(c.id); });
    };
    walk(id);
    return res;
}

function populateFolderSelect(){
    const sel = document.getElementById('noteFolder');
    if(!sel) return;
    const buildOptions = (parentId, prefix='') => {
        const children = getChildren(parentId);
        return children.map(c=>{
            const sub = buildOptions(c.id, prefix + '—');
            return `<option value="${c.id}">${escapeHtml(prefix + ' ' + c.name)}</option>` + sub.join('');
        }).flat();
    };
    const opts = ['<option value="">No folder</option>'].concat(buildOptions(''));
    sel.innerHTML = opts.join('');
}

// ---------------------
// Subjects (minimal)
// ---------------------
function saveSubjects(){
    try{ localStorage.setItem('subjects', JSON.stringify(subjects)); }catch(e){}
}

function sanitizeColor(c){
    if(!c) return '';
    const s = String(c).trim();
    const hex = s.replace('#','');
    if(/^[0-9a-fA-F]{3}$/.test(hex)) return '#'+hex;
    if(/^[0-9a-fA-F]{6}$/.test(hex)) return '#'+hex;
    return '';
}

function addSubject(name, color){
    if(!name) return;
    const n = String(name).trim();
    const col = sanitizeColor(color) || '#ffd966';
    subjects[n] = col;
    saveSubjects();
    renderSubjects();
    populateFilterSubject();
}

function renderSubjects(){
    const container = document.getElementById('subjectsList');
    if(!container) return;
    const keys = Object.keys(subjects || {});
    if(!keys.length){ container.innerHTML = '<div class="muted">No subjects</div>'; return; }
    container.innerHTML = keys.map(k=>{
        const col = sanitizeColor(subjects[k]) || '#eee';
        return `<div class="subject-item"><div class="subject-row"><span class="subject-chip" style="background:${col};">${escapeHtml(k)}</span></div><div><button onclick="applySubjectFilter('${escapeHtml(k)}')">Filter</button></div></div>`;
    }).join('');
}

function applySubjectFilter(name){
    filterSubject = name || '';
    const select = document.getElementById('filterSubject');
    if(select) select.value = name || '';
    displayNotes();
}

function populateFilterSubject(){
    const select = document.getElementById('filterSubject');
    if(!select) return;
    const subjectsFromNotes = Array.from(new Set(notes.map(n=> (n.subject||'').trim()).filter(Boolean)));
    const known = Array.from(new Set([].concat(Object.keys(subjects||{}), subjectsFromNotes))).filter(Boolean);
    const current = select.value;
    select.innerHTML = '<option value="">All subjects</option>' + known.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    select.value = current || '';
}


    if (noteInput) {
        noteInput.addEventListener("input", updateLivePreview);
    }

    if (previewToggle) {
        previewToggle.addEventListener("change", (e) => {
            const previewDiv = document.getElementById("livePreview");
            if (previewDiv) {
                previewDiv.style.display = e.target.checked ? "block" : "none";
                if (e.target.checked) updateLivePreview();
            }
        });
    }

    // Also attach clicks to the sidebar buttons that were missing logic
    document.getElementById("addFolderBtn")?.addEventListener("click", addFolder);
    document.getElementById("addSubjectBtn")?.addEventListener("click", addSubject);
    
    document.getElementById("markPresentBtn")?.addEventListener("click", () => markAttendance(true));
    document.getElementById("markAbsentBtn")?.addEventListener("click", () => markAttendance(false));

    document.getElementById("searchInput")?.addEventListener("input", displayNotes);
}

function addFolder() {
    const input = document.getElementById("newFolderName");
    const name = input.value.trim();
    if (name) {
        folders.push(name);
        localStorage.setItem("folders", JSON.stringify(folders));
        input.value = "";
        updateSidebar();
    }
}

function addSubject() {
    const input = document.getElementById("newSubjectName");
    const color = document.getElementById("newSubjectColor").value;
    const name = input.value.trim();
    if (name) {
        subjects.push({ name, color });
        localStorage.setItem("subjects", JSON.stringify(subjects));
        input.value = "";
        updateSidebar();
    }
}

function markAttendance(isPresent) {
    const subject = document.getElementById("attendanceSubject").value;
    if (!subject) return alert("Please select a subject first!");

    if (!attendance[subject]) attendance[subject] = { present: 0, total: 0 };
    
    attendance[subject].total++;
    if (isPresent) attendance[subject].present++;

    localStorage.setItem("attendance", JSON.stringify(attendance));
    updateSidebar();
}

function updateLivePreview() {
    const input = document.getElementById("noteInput");
    const preview = document.getElementById("livePreview");
    const isVisible = document.getElementById("livePreviewToggle")?.checked;

    if (preview && isVisible) {
        preview.innerHTML = renderMarkdown(input.value || "*Preview will appear here...*");
    }
}

function renderMarkdown(text) {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(marked.parse(text));
    }
    return escapeHtml(text);
}

function updateSidebar() {
    const folderTree = document.getElementById("foldersTree");
    const subjectList = document.getElementById("subjectsList");
    const folderSelect = document.getElementById("noteFolder");
    const attSubjectSelect = document.getElementById("attendanceSubject");

    // Update Attendance Summary
    let attSummaryHtml = '<div class="attendance-summary">';
    for (const sub in attendance) {
        const data = attendance[sub];
        const percent = ((data.present / data.total) * 100).toFixed(1);
        attSummaryHtml += `
            <div class="attendance-item">
                <span>${escapeHtml(sub)}</span>
                <span>${percent}% (${data.present}/${data.total})</span>
            </div>`;
    }
    attSummaryHtml += '</div>';

    if (folderTree) folderTree.innerHTML = folders.map(f => `<div class="sidebar-item">📁 ${escapeHtml(f)}</div>`).join('');
    if (subjectList) subjectList.innerHTML = subjects.map(s => `
        <div class="sidebar-item">
            <span class="color-dot" style="background:${s.color}; display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px"></span>
            ${escapeHtml(s.name)}
        </div>`).join('');
    
    const attPanel = document.getElementById("attendancePanel");
    const existingSummary = attPanel.querySelector('.attendance-summary');
    if (existingSummary) existingSummary.remove();
    attPanel.insertAdjacentHTML('beforeend', attSummaryHtml);
    
    if (folderSelect) {
        folderSelect.innerHTML = '<option value="">No folder</option>' + folders.map(f => `<option value="${f}">${f}</option>`).join('');
    }

    if (attSubjectSelect) {
        attSubjectSelect.innerHTML = '<option value="">Subject</option>' + subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    }
}

/**
 * Toggles a predefined tag in the tags input field
 */
function addQuickTag(tag) {
    const tagsInput = document.getElementById("noteTags");
    let currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t !== "");
    
    const tagIndex = currentTags.indexOf(tag);
    if (tagIndex === -1) {
        currentTags.push(tag);
    } else {
        currentTags.splice(tagIndex, 1);
    }
    tagsInput.value = currentTags.join(', ');
}
