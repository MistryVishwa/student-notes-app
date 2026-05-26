let notes = JSON.parse(localStorage.getItem("notes")) || [];

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

    if (!noteText) {
        alert("Please enter a note");
        return;
    }

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
    };

    notes.unshift(newNote);

    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById("noteTitle").value = "";
    document.getElementById("noteInput").value = "";
    document.getElementById("noteTags").value = "";
    document.getElementById("noteSubject").value = "";

    clearDraft();
    refreshFilters();
    renderSuggestedTags();
    displayNotes();
}

function displayNotes() {

    if (currentView === "board") {
        renderKanban();
        return;
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

                <button class="delete-btn"
                    onclick="deleteNote('${note.id}')">
                    X
                </button>
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