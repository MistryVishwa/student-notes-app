let notes = JSON.parse(localStorage.getItem("notes")) || [];

const THEME_KEY = "theme";

displayNotes();
initTheme();

function addNote() {
    let input = document.getElementById("noteInput");
    let noteText = input.value.trim();

    if(noteText === ""){
        alert("Please enter a note");
        return;
    }

    notes.push(noteText);

    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );

    input.value = "";

    displayNotes();
}

function displayNotes(){
    let container = document.getElementById("notesContainer");
    container.innerHTML = "";

    notes.forEach((note,index)=>{
        container.innerHTML += `
            <div class="note">
                ${escapeHtml(note)}
                <button class="delete-btn"
                onclick="deleteNote(${index})" aria-label="Delete note">
                X
                </button>
            </div>
        `;
    });
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

