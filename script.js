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
const AUTO_SAVE_KEY = "draft";
const AUTO_SAVE_DELAY = 2000;
const TAGS_KEY = "allTags";


let currentView = "list"; // default view

displayNotes();
initTheme();

let notes = JSON.parse(localStorage.getItem("notes")) || [];
const THEME_KEY = "theme";

// Auto-save configuration
const AUTO_SAVE_KEY = 'draft';
const AUTO_SAVE_DELAY = 2000; // ms of inactivity before saving
let autoSaveTimer = null;
let searchQuery = "";
let filterTags = [];
let filterSubject = "";
let globalTags = [];
let currentView = "list";
// Folder model: simple parent-relation tree
let folders = JSON.parse(localStorage.getItem('folders')) || [];
let currentFolder = null; // currently selected folder id (string)
// Subjects mapping: name -> color (hex)
let subjects = JSON.parse(localStorage.getItem('subjects')) || {};
// Attendance mapping: subject -> [{date:'YYYY-MM-DD', status:'present'|'absent'}]
let attendance = JSON.parse(localStorage.getItem('attendance')) || {};

function saveAttendance(){ try{ localStorage.setItem('attendance', JSON.stringify(attendance)); }catch(e){} }

// Assignments list: {id,title,subject,due:'YYYY-MM-DD',completed:boolean}
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
function saveAssignments(){ try{ localStorage.setItem('assignments', JSON.stringify(assignments)); }catch(e){} }


// Normalize old notes
function normalizeNotes() {
    notes = notes.map((n, index) => {
        if (typeof n === "string") {
            return {
                id: Date.now() + index,
                title: "",
                content: n,
                tags: [],
                subject: "",
                pinned: false,
                favorite: false,
                status: "todo"
            };
        }

        return {
            id: n.id || Date.now() + index,
            title: n.title || "",
            content: n.content || "",
            tags: Array.isArray(n.tags) ? n.tags : [],
            subject: n.subject || "",
            id: n.id || (Date.now() + Math.floor(Math.random()*1000)),
            title: n.title || '',
            content: n.content || '',
            sections: Array.isArray(n.sections) ? n.sections : [],
            tags: Array.isArray(n.tags) ? n.tags : (n.tags ? String(n.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
            subject: n.subject || '',
            pinned: !!n.pinned,
            favorite: !!n.favorite,
            status: n.status || "todo"
        };
    });

    localStorage.setItem("notes", JSON.stringify(notes));
}

normalizeNotes();
displayNotes();
initTheme();

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

// ==========================================
// Note Actions: Add, Display, Edit, Delete
// ==========================================
function addNote() {

    const input = document.getElementById("noteInput");
    const titleInput = document.getElementById("noteTitle");
    const tagsInput = document.getElementById("noteTags");
    const subjectInput = document.getElementById("noteSubject");
    const folderInput = document.getElementById("noteFolder");
    
    const noteText = input.value.trim();
    const titleText = titleInput.value.trim();

    let title = document.getElementById("noteTitle").value.trim();
    let noteText = document.getElementById("noteInput").value.trim();
    let tagsText = document.getElementById("noteTags").value.trim();
    let subjectText = document.getElementById("noteSubject").value.trim();
    let input = document.getElementById("noteInput");
    let noteText = input.value.trim();
    let tagsText = document.getElementById('noteTags').value.trim();
    let subjectText = document.getElementById('noteSubject').value.trim();
    let folderId = document.getElementById('noteFolder')?.value || '';

    if (!noteText) {
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
        title,
        content: noteText,
        tags: tagsText
            ? tagsText.split(",").map(t => t.trim()).filter(Boolean)
            : [],
        subject: subjectText,
        pinned: false,
        favorite: false,
        status: "todo"
        tags: tagsText ? tagsText.split(',').map(t=>t.trim()).filter(Boolean) : [],
        subject: subjectText || '',
        folderId: folderId || '',
        sections: gatherSectionsFromEditor(),
        pinned: false,
        dueDate: dueDate,
        status: 'todo'
    };

    notes.unshift(newNote);
    notes.push(newNote);

        pinned: false,
        favorite: false
    };

    notes.unshift(newNote);
    localStorage.setItem("notes", JSON.stringify(notes));
    input.value = "";

    document.getElementById("noteTitle").value = "";
    document.getElementById("noteInput").value = "";
    document.getElementById("noteTags").value = "";
    document.getElementById("noteSubject").value = "";

    clearDraft();
    document.getElementById('noteTitle').value = '';
    noteInputEl.value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('noteSubject').value = '';
    const folderSelect = document.getElementById('noteFolder'); if(folderSelect) folderSelect.value = '';
    const dateInput = document.getElementById('noteDueDate'); if(dateInput) dateInput.value = '';

    // record new note in recent history and refresh UI
    try{ recordRecent(newNote); }catch(e){}
    refreshFilters();
    renderSuggestedTags();
    displayNotes();
}

function displayNotes() {

    if (currentView === "board") {
        renderKanban();
        return;
    }
    // update global tags list and suggestions
    addGlobalTags(newNote.tags);
    renderSuggestedTags();

    displayNotes();
}

function displayNotes(){
    const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    let container = document.getElementById("notesContainer");
    let pinnedContainer = document.getElementById("pinnedContainer");
    let favoritesContainer = document.getElementById("favoritesContainer");

    container.innerHTML = "";
    pinnedContainer.innerHTML = "";
    favoritesContainer.innerHTML = "";

    const q = searchQuery.toLowerCase();

    notes.forEach(note => {

        const combined =
            (note.title + " " + note.content).toLowerCase();
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
    notes.forEach((note)=>{
        const combined = (note.title + ' ' + note.content).toLowerCase();

        if (q && !combined.includes(q)) return;

        const noteHtml = `
            <div class="note" draggable="true"
                ondragstart="dragStart(event, ${note.id})">

                <button class="favorite-btn"
                    onclick="toggleFavorite('${note.id}')">
                    ${note.favorite ? "★" : "☆"}
                </button>

                <button class="pin-btn"
                    onclick="togglePin('${note.id}')">
                    ${note.pinned ? "Unpin" : "Pin"}
                </button>
        // Filter by folder (include descendants)
        if(currentFolder){
            const allowed = getDescendantFolderIds(currentFolder).concat([String(currentFolder)]);
            if(!allowed.includes(String(note.folderId || ''))) return;
        }

        const titleHtml = note.title ? `<div class="note-title">${escapeHtml(note.title)}</div>` : '';

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

                ${note.title
                    ? `<div class="note-title">${escapeHtml(note.title)}</div>`
                    : ""}

                <div class="note-content">
                    ${escapeHtml(note.content)}
                </div>

                ${note.subject
                    ? `<div class="note-subject">
                        Subject: ${escapeHtml(note.subject)}
                    </div>`
                    : ""}

                ${(note.tags || []).length
                    ? `<div class="note-tags">
                        ${note.tags.map(
                            t => `<span class="tag">${escapeHtml(t)}</span>`
                        ).join("")}
                    </div>`
                    : ""}

    notes.forEach((note,index)=>{
        container.innerHTML += `
            <div class="note">
                <div class="note-text">${escapeHtml(note.text)}</div>
                <div class="note-date">${note.date}</div>
                <button class="edit-btn"
                onclick="editNote(${index})" aria-label="Edit note">
                Edit
                </button>
                <button class="delete-btn"
                    onclick="deleteNote('${note.id}')">
                    X
                </button>

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

        if (note.favorite) {
            favoritesContainer.innerHTML += noteHtml;
        } else if (note.pinned) {
            pinnedContainer.innerHTML += noteHtml;
        if (currentView === 'board') {
            let containerId = note.status === 'doing' ? '#doing' : note.status === 'done' ? '#done' : '#todo';
            let kCont = document.querySelector(`${containerId} .kanban-content`);
            if(kCont) kCont.innerHTML += noteHtml;
        if(note.favorite && favoritesContainer){
            favoritesContainer.innerHTML += noteHtml;
        } else if(note.pinned && pinnedContainer){
            pinnedContainer.innerHTML += noteHtml;
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
}

function renderKanban() {

    const todoContainer =
        document.querySelector("#todo .kanban-content");

    const doingContainer =
        document.querySelector("#doing .kanban-content");

    const doneContainer =
        document.querySelector("#done .kanban-content");

    todoContainer.innerHTML = "";
    doingContainer.innerHTML = "";
    doneContainer.innerHTML = "";

    notes.forEach(note => {

        const html = `
            <div class="note"
                draggable="true"
                ondragstart="dragStart(event, ${note.id})">

                ${escapeHtml(note.title || note.content)}

                <button class="delete-btn"
                    onclick="deleteNote('${note.id}')">
                    X
                </button>
            </div>
        `;

        if (note.status === "todo") {
            todoContainer.innerHTML += html;
        } else if (note.status === "doing") {
            doingContainer.innerHTML += html;
        } else {
            doneContainer.innerHTML += html;
        }
    });
}

function deleteNote(id) {
    notes = notes.filter(n => String(n.id) !== String(id));
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

        notes[index] = { text: trimmedNote, date: "Edited: " + new Date().toLocaleString() };
    if(pinnedContainer && pinnedSection){
        pinnedSection.style.display = pinnedContainer.children.length ? '' : 'none';
    }
    if(favoritesContainer && favoritesSection){
        favoritesSection.style.display = favoritesContainer.children.length ? '' : 'none';
    }

    renderSuggestedTags();
}

function editNote(id){
    const idx = notes.findIndex(n=>String(n.id) === String(id));
    if(idx === -1) return;
    
    let newContent = prompt("Edit your note content:", notes[idx].content);
    if(newContent !== null && newContent.trim() !== ""){
        notes[idx].content = newContent.trim();
        localStorage.setItem("notes", JSON.stringify(notes));
        displayNotes();
    }
}

function deleteNote(id){
    const idx = notes.findIndex(n=>String(n.id) === String(id));
    if(idx === -1) return;
    notes.splice(idx,1);
    localStorage.setItem("notes", JSON.stringify(notes));
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

function sortNotes() {
    const sortOrder = document.getElementById("sortOrder").value;
    if (sortOrder === "asc") {
        notes.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortOrder === "desc") {
        notes.sort((a, b) => b.text.localeCompare(a.text));
        notes.sort((a, b) => (a.title || a.content).localeCompare(b.title || b.content));
    } else if (sortOrder === "desc") {
        notes.sort((a, b) => (b.title || b.content).localeCompare(a.title || a.content));
    }
    localStorage.setItem("notes", JSON.stringify(notes));

    displayNotes();
}

function togglePin(id) {
    const note = notes.find(n => String(n.id) === String(id));

    if (!note) return;

    note.pinned = !note.pinned;

    localStorage.setItem("notes", JSON.stringify(notes));

    displayNotes();
}

function toggleFavorite(id) {
    const note = notes.find(n => String(n.id) === String(id));

    if (!note) return;

    note.favorite = !note.favorite;

    localStorage.setItem("notes", JSON.stringify(notes));

    displayNotes();
}

function toggleView() {

    currentView =
        currentView === "list"
            ? "board"
            : "list";

    let btn = document.getElementById("toggleViewBtn");
// Import and append unique notes from a structural JSON file
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validation Guardrail: Ensure parsed file content is a valid Array
            if (Array.isArray(importedData)) {
                
                // Advanced Tip: Filter out notes that already exist in the app to prevent duplicates
                const uniqueImportedData = importedData.filter(importedNote => {
                    // If the imported note is an object (in case the schema changes later)
                    if (typeof importedNote === 'object' && importedNote !== null) {
                        return !notes.some(existingNote => 
                            typeof existingNote === 'object' && existingNote !== null 
                            ? existingNote.text === importedNote.text 
                            : existingNote === importedNote.text
                        );
                    }
                    // Standard string matching for the current codebase setup
                    return !notes.includes(importedNote);
                });

                if (uniqueImportedData.length === 0) {
                    alert("All notes in this backup are already present in your app!");
                    event.target.value = '';
                    return;
                }

                const userConfirmation = confirm(`Found ${uniqueImportedData.length} new unique notes. Do you want to add them to your existing notes?`);
                
                if (userConfirmation) {
                    // Combine existing notes with the unique imported ones
                    notes = [...notes, ...uniqueImportedData];
                    
                    localStorage.setItem("notes", JSON.stringify(notes));
                    displayNotes();
                    alert("New notes imported and added successfully!");
                }
            } else {
                alert("Import failed: JSON structure must be a valid array list.");
            }
        } catch (error) {
            alert("Error parsing backup file. Please ensure it is a valid, uncorrupted .json file.");
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
function escapeHtml(str){
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function refreshFilters(){
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

    btn.innerText =
        currentView === "list"
            ? "Switch to Board View"
            : "Switch to List View";

    document.getElementById("notesContainer")
        .classList.toggle("hidden");

    document.getElementById("kanbanBoard")
        .classList.toggle("hidden");

    displayNotes();
}
    if(filterTagsInput){
        filterTagsInput.addEventListener('input', (e)=>{
            const txt = e.target.value.trim();
            filterTags = txt ? txt.split(',').map(t=>t.trim()).filter(Boolean) : [];
            displayNotes();

            if (oldStatus !== 'done' && newStatus === 'done') {
                showToast("🎉 Congratulations on completing a task!");
    refreshFilters();
    restoreDraft();
    displayNotes();

    [noteInput, titleInput, tagsInput, subjectInput].forEach(inp=>{
        if(!inp) return;
        inp.addEventListener('input', scheduleAutoSave);
    });

    const newTagInput = document.getElementById('newTagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    if(addTagBtn && newTagInput){
        addTagBtn.addEventListener('click', () => {
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
            livePreview.style.display = 'block';
            const raw = noteInput.value || '';
            let html = raw;
            try{ html = window.marked ? marked.parse(raw) : escapeHtml(raw); }catch(e){ html = escapeHtml(raw); }
            const safe = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(html) : html;
            livePreview.innerHTML = safe;
        };

function dragStart(event, id) {
    event.dataTransfer.setData("text/plain", id);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {

    event.preventDefault();

    let noteId =
        event.dataTransfer.getData("text/plain");

    let column =
        event.target.closest(".kanban-column");

    let newStatus =
        column.getAttribute("data-status");

    let note =
        notes.find(n => String(n.id) === String(noteId));

    if (note) {
        note.status = newStatus;

        localStorage.setItem(
            "notes",
            JSON.stringify(notes)
        );

        displayNotes();
    }
}

function dragLeave(event) {
    const column = event.target.closest(".kanban-column");

    if (column) {
        column.classList.remove("drag-over");
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function clearDraft() {
    localStorage.removeItem(AUTO_SAVE_KEY);
}

function refreshFilters() {
    const select =
        document.getElementById("filterSubject");

    if (!select) return;

    const subjects =
        [...new Set(
            notes.map(n => n.subject).filter(Boolean)
        )];

    select.innerHTML =
        '<option value="">All subjects</option>' +
        subjects.map(
            s => `<option value="${s}">${s}</option>`
        ).join("");
}

function renderSuggestedTags() {

    const container =
        document.getElementById("suggestedTags");

    if (!container) return;

    const tags =
        [...new Set(notes.flatMap(n => n.tags || []))];

    container.innerHTML =
        tags.map(
            t => `<span class="tag">${escapeHtml(t)}</span>`
        ).join(" ");
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

function initTheme() {

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    const theme =
        savedTheme || "light";

    document.documentElement
        .setAttribute("data-theme", theme);
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

// Render recent on load
document.addEventListener('DOMContentLoaded', ()=>{
    try{ renderRecent(); }catch(e){}
});

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

    // Initialize Theme Logic Control
    initTheme();
});

// ==========================================
// Theme Logic Engine
// ==========================================
function initTheme(){
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme'); 
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : (systemPrefersDark ? "dark" : "light");

    applyTheme(initialTheme);

    if(themeToggleBtn){
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
}

function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if(themeToggleBtn){
        if(theme === 'dark'){
            themeToggleBtn.textContent = '☀️ Light Mode';
        } else {
            themeToggleBtn.textContent = '🌙 Dark Mode';
        }
    }
}
