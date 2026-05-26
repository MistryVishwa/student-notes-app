let notes = (JSON.parse(localStorage.getItem("notes")) || []).map(n => 
    typeof n === 'string' ? { text: n, date: "Created: " + new Date().toLocaleString() } : n
);

const THEME_KEY = "theme";
const AUTO_SAVE_KEY = "draft";
const AUTO_SAVE_DELAY = 2000;
const TAGS_KEY = "allTags";

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

function addNote() {
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

    if (notes.some(n => n.text === noteText)) {


    if (notes.includes(noteText)) {

        alert("This note already exists!");
        return;
    }

    notes.push({ text: noteText, date: "Created: " + new Date().toLocaleString() });

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
        pinned: false
    };

    notes.unshift(newNote);

    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById("noteTitle").value = "";
    document.getElementById("noteInput").value = "";
    document.getElementById("noteTags").value = "";
    document.getElementById("noteSubject").value = "";

    clearDraft();
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteInput').value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('noteSubject').value = '';
    const folderSelect = document.getElementById('noteFolder'); if(folderSelect) folderSelect.value = '';

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

    // ensure subject exists in subjects map (use default color if missing)
    if(newNote.subject && !subjects[newNote.subject]){
        subjects[newNote.subject] = '#ffd966';
        try{ localStorage.setItem('subjects', JSON.stringify(subjects)); }catch(e){}
        try{ renderSubjects(); }catch(e){}
    }
}

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
                ${sectionsHtml}
                <button class="delete-btn" onclick="deleteNote('${note.id}')" aria-label="Delete note">X</button>

            </div>
        `;

        if (note.favorite) {
            favoritesContainer.innerHTML += noteHtml;
        } else if (note.pinned) {
            pinnedContainer.innerHTML += noteHtml;
        } else {
            container.innerHTML += noteHtml;
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
function editNote(index){
    let newNote = prompt("Edit your note:", notes[index].text);
    if(newNote !== null && newNote.trim() !== ""){
        let trimmedNote = newNote.trim();
        
        if (notes.some((n, i) => n.text === trimmedNote && i !== index)) {
            alert("A note with this text already exists!");
            return;
        }

        notes[index] = { text: trimmedNote, date: "Edited: " + new Date().toLocaleString() };
        localStorage.setItem("notes", JSON.stringify(notes));
        displayNotes();
    }
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

// ---------------------
// Assignments helpers
// ---------------------
function isOverdue(due){
    if(!due) return false;
    const today = formatYMD(new Date());
    return due < today;
}

function addAssignment(title, subject, due){
    if(!title || !title.trim()) return false;
    const id = 'a_' + (Date.now() + Math.floor(Math.random()*1000));
    assignments.push({ id, title: title.trim(), subject: subject || '', due: formatYMD(due || new Date()), completed: false });
    saveAssignments();
    renderAssignments();
    return true;
}

function toggleAssignmentComplete(id){
    const idx = assignments.findIndex(a=> a.id === id);
    if(idx === -1) return;
    assignments[idx].completed = !assignments[idx].completed;
    saveAssignments();
    renderAssignments();
}

function removeAssignment(id){
    assignments = assignments.filter(a=> a.id !== id);
    saveAssignments();
    renderAssignments();
}

function renderAssignments(){
    const container = document.getElementById('assignmentsList');
    if(!container) return;
    if(assignments.length === 0){ container.innerHTML = '<div class="muted">No assignments</div>'; return; }
    container.innerHTML = assignments.map(a=>{
        const overdue = !a.completed && isOverdue(a.due);
        const overdueClass = overdue ? ' assignment-overdue' : '';
        const subj = a.subject ? `<span class="assignment-meta">${escapeHtml(a.subject)}</span>` : '';
        const due = a.due ? `<span class="assignment-due${overdueClass}">${escapeHtml(a.due)}</span>` : '';
        const title = escapeHtml(a.title) + (a.completed ? ' (done)' : '');
        return `<div class="assignment-row" id="${a.id}">
            <div>
                <div class="assignment-title">${title}</div>
                <div class="assignment-meta">${subj} ${due}</div>
            </div>
            <div class="assignment-actions">
                <button onclick="toggleAssignmentComplete('${a.id}')">${a.completed ? 'Undo' : 'Complete'}</button>
                <button onclick="removeAssignment('${a.id}')">Remove</button>
            </div>
        </div>`;
    }).join('');
}

function renderAssignmentSubjectSelect(){
    const sel = document.getElementById('assignmentSubject');
    if(!sel) return;
    const keys = Object.keys(subjects || {});
    const opts = ['<option value="">Subject</option>'].concat(keys.map(k=>`<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`));
    sel.innerHTML = opts.join('');
}

// ---------------------
// Attendance helpers
// ---------------------
function formatYMD(d){
    if(!d) return '';
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
}

function addAttendanceRecord(subject, dateStr, status){
    if(!subject) return false;
    const d = formatYMD(dateStr || new Date());
    attendance[subject] = attendance[subject] || [];
    // replace record for date if exists
    const idx = attendance[subject].findIndex(r=> r.date === d);
    if(idx !== -1) attendance[subject][idx].status = status;
    else attendance[subject].push({ date: d, status });
    saveAttendance();
    return true;
}

function getAttendance(subject){
    return (attendance[subject] || []).slice().sort((a,b)=> a.date.localeCompare(b.date));
}

function attendancePercent(subject){
    const recs = attendance[subject] || [];
    if(!recs.length) return null;
    const present = recs.filter(r=> r.status === 'present').length;
    return Math.round((present / recs.length) * 100);
}

function renderAttendancePanel(){
    const sel = document.getElementById('attendanceSubject');
    if(sel){
        const keys = Object.keys(subjects || {});
        const opts = ['<option value="">Select subject</option>'].concat(keys.map(k=>`<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`));
        sel.innerHTML = opts.join('');
    }
    // summary area
    const sum = document.getElementById('attendanceSummary');
    if(!sum) return;
    const keys = Object.keys(subjects || {});
    if(!keys.length){ sum.innerHTML = '<div class="muted">No subjects to show attendance</div>'; return; }
    sum.innerHTML = keys.map(k=>{
        const pct = attendancePercent(k);
        const pctText = pct === null ? 'No records' : pct + '%';
        const warn = (pct !== null && pct < 75) ? ' low-attendance' : '';
        return `<div class="attendance-row"><div>${escapeHtml(k)}</div><div class="attendance-pct${warn}">${pctText}</div></div>`;
    }).join('');
}

// Section editor helpers
function addSectionBlock(type, content){
    const list = document.getElementById('sectionsList');
    if(!list) return;
    const id = 'sec_' + (Date.now() + Math.floor(Math.random()*1000));
    const div = document.createElement('div');
    div.className = 'section-block';
    div.id = id;
    div.innerHTML = `
        <div class="section-header">
            <div class="section-type">${escapeHtml(type)}</div>
            <div><button class="section-remove" type="button">Remove</button></div>
        </div>
        <div class="section-content">
            <textarea placeholder="Section content">${escapeHtml(content||'')}</textarea>
        </div>
    `;
    list.appendChild(div);
    const btn = div.querySelector('.section-remove');
    if(btn) btn.addEventListener('click', ()=>{ div.remove(); });
}

function gatherSectionsFromEditor(){
    const list = document.getElementById('sectionsList');
    if(!list) return [];
    const out = [];
    Array.from(list.children).forEach(block=>{
        const type = block.querySelector('.section-type')?.textContent || 'section';
        const content = block.querySelector('textarea')?.value || '';
        out.push({ type: type.trim().toLowerCase(), content });
    });
    return out;
}

function renderSectionsInEditor(sections){
    const list = document.getElementById('sectionsList');
    if(!list) return;
    list.innerHTML = '';
    (sections || []).forEach(s=> addSectionBlock(s.type || 'section', s.content || ''));
}
function recordRecent(note){
    if(!note) return;
    try{
        const raw = localStorage.getItem('recentNotes');
        const list = raw ? JSON.parse(raw) : [];
        const id = String(note.id || note._id || Date.now());
        // remove existing entry for id
        const filtered = list.filter(i=> String(i.id) !== id);
        filtered.unshift({ id, title: note.title || (note.content||'').slice(0,60), ts: Date.now() });
        // limit to 10
        const sliced = filtered.slice(0,10);
        localStorage.setItem('recentNotes', JSON.stringify(sliced));
        renderRecent();
    }catch(e){ console.warn('recordRecent error', e); }
}

function renderRecent(){
    const container = document.getElementById('recentContainer');
    if(!container) return;
    try{
        const raw = localStorage.getItem('recentNotes');
        const list = raw ? JSON.parse(raw) : [];
        if(!list.length){ container.innerHTML = '<div class="empty-state">No recent notes yet.</div>'; return; }
        container.innerHTML = list.map(item=>{
            const time = new Date(item.ts).toLocaleString();
            const title = escapeHtml(item.title || 'Untitled');
            return `
                <div class="recent-item">
                    <div>
                        <div class="title">${title}</div>
                        <div class="meta">${time}</div>
                    </div>
                    <div>
                        <button class="open-btn" onclick="openNote('${item.id}')">Open</button>
                    </div>
                </div>
            `;
        }).join('');
    }catch(e){ container.innerHTML = '<div class="empty-state">Unable to load recent notes.</div>'; }
}

function openNote(id){
    if(!id) return;
    const idx = notes.findIndex(n=> String(n.id) === String(id));
    if(idx === -1) {
        alert('Note not found');
        return;
    }
    const note = notes[idx];
    // populate editor
    const titleEl = document.getElementById('noteTitle');
    const inputEl = document.getElementById('noteInput');
    const tagsEl = document.getElementById('noteTags');
    const subjectEl = document.getElementById('noteSubject');
    if(titleEl) titleEl.value = note.title || '';
    if(inputEl) inputEl.value = note.content || '';
    if(tagsEl) tagsEl.value = (note.tags || []).join(', ');
    if(subjectEl) subjectEl.value = note.subject || '';
    // focus the editor
    if(inputEl) inputEl.focus();
    // record that user opened this note
    try{ recordRecent(note); }catch(e){}
    // populate sections editor
    try{ renderSectionsInEditor(note.sections || []); }catch(e){}
}

// Render recent on load
document.addEventListener('DOMContentLoaded', ()=>{
    try{ renderRecent(); }catch(e){}
});

