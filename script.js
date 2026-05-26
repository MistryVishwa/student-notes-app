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

const THEME_KEY = "theme";

displayNotes();
initTheme();
setupInputListeners();
updateSidebar();

function addNote() {
    const input = document.getElementById("noteInput");
    const titleInput = document.getElementById("noteTitle");
    const tagsInput = document.getElementById("noteTags");
    const subjectInput = document.getElementById("noteSubject");
    const folderInput = document.getElementById("noteFolder");
    
    const noteText = input.value.trim();
    const titleText = titleInput.value.trim();

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

    displayNotes();
}

function displayNotes(){
    let container = document.getElementById("notesContainer");
    const showArchived = document.getElementById("showArchived")?.checked || false;
    const searchQuery = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const sortOrder = document.getElementById("sortOrder")?.value || "";

    container.innerHTML = "";

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