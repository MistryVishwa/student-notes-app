let notes = JSON.parse(localStorage.getItem("notes")) || [];

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
    let title = document.getElementById("noteTitle").value.trim();
    let input = document.getElementById("noteInput");
    let noteText = input.value.trim();
    let tagsText = document.getElementById('noteTags').value.trim();
    let subjectText = document.getElementById('noteSubject').value.trim();

    if(noteText === ""){
        alert("Please enter a note");
        return;
    }

    let newNote = {
        id: Date.now(),
        text: noteText,
        status: 'todo',
        pinned: false
    };

    notes.push(newNote);

    localStorage.setItem("notes", JSON.stringify(notes));
    input.value = "";
    displayNotes();

    // Clear any saved draft after successful save
    clearDraft();

    // update global tags list and suggestions
    addGlobalTags(newNote.tags);
    renderSuggestedTags();
}

function displayNotes(){
    const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

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
        localStorage.setItem("notes", JSON.stringify(notes));
        displayNotes();
    }
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
            displayNotes();

            if (oldStatus !== 'done' && newStatus === 'done') {
                showToast("🎉 Congratulations on completing a task!");
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
