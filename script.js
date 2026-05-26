let notes = (JSON.parse(localStorage.getItem("notes")) || []).map(n => 
    typeof n === 'string' ? { text: n, date: "Created: " + new Date().toLocaleString() } : n
);
let folders = JSON.parse(localStorage.getItem("folders")) || [];
let subjects = JSON.parse(localStorage.getItem("subjects")) || [];

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
    container.innerHTML = "";

    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No notes found. Start by adding your first note above!</p>
            </div>
        `;
        return;
    }

    notes.forEach((note,index)=>{
        const tagsHtml = note.tags ? note.tags.split(',').map(t => `<span class="note-tag">#${t.trim()}</span>`).join('') : '';
        
        container.innerHTML += `
            <div class="note">
                <div class="note-actions">
                    <button class="icon-btn edit-btn" onclick="editNote(${index})" aria-label="Edit">✎</button>
                    <button class="icon-btn delete-btn" onclick="deleteNote(${index})" aria-label="Delete">✕</button>
                </div>
                ${note.title ? `<strong class="note-title">${escapeHtml(note.title)}</strong>` : ''}
                <div class="note-text">${escapeHtml(note.text)}</div>
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
    if(newNote !== null && newNote.trim() !== ""){
        notes[index] = { 
            ...note, 
            text: newText.trim(), 
            date: "Edited: " + new Date().toLocaleString() 
        };
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
        { id: "noteTitle", action: addNote },
        { id: "noteInput", action: addNote, isTextArea: true },
        { id: "noteTags", action: addNote },
        { id: "noteSubject", action: addNote },
        { id: "newFolderName", action: addFolder },
        { id: "newSubjectName", action: addSubject }
    ];

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

    // Also attach clicks to the sidebar buttons that were missing logic
    document.getElementById("addFolderBtn")?.addEventListener("click", addFolder);
    document.getElementById("addSubjectBtn")?.addEventListener("click", addSubject);
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

function updateSidebar() {
    const folderTree = document.getElementById("foldersTree");
    const subjectList = document.getElementById("subjectsList");
    const folderSelect = document.getElementById("noteFolder");

    if (folderTree) folderTree.innerHTML = folders.map(f => `<div class="sidebar-item">📁 ${escapeHtml(f)}</div>`).join('');
    if (subjectList) subjectList.innerHTML = subjects.map(s => `
        <div class="sidebar-item">
            <span class="color-dot" style="background:${s.color}; display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px"></span>
            ${escapeHtml(s.name)}
        </div>`).join('');
    
    if (folderSelect) {
        folderSelect.innerHTML = '<option value="">No folder</option>' + folders.map(f => `<option value="${f}">${f}</option>`).join('');
    }
}