let notes = JSON.parse(localStorage.getItem("notes")) || [];

const THEME_KEY = "theme";

// UI state
let searchQuery = "";
let filterTags = [];
let filterSubject = "";

normalizeNotes();
displayNotes();
initTheme();

function normalizeNotes(){
    // Convert old string notes into structured objects
    notes = notes.map(n => {
        if(typeof n === 'string'){
            const lines = n.split('\n').map(l=>l.trim()).filter(Boolean);
            return {
                title: lines[0] || '',
                content: lines.slice(1).join('\n') || lines[0] || '',
                tags: [],
                subject: ''
            };
        }
        // Already structured, ensure keys exist
        return {
            title: n.title || '',
            content: n.content || '',
            tags: Array.isArray(n.tags) ? n.tags : (n.tags ? String(n.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
            subject: n.subject || ''
        };
    });

    localStorage.setItem('notes', JSON.stringify(notes));
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
        title: title,
        content: noteText,
        tags: tagsText ? tagsText.split(',').map(t=>t.trim()).filter(Boolean) : [],
        subject: subjectText || ''
    };

    notes.unshift(newNote);

    localStorage.setItem("notes", JSON.stringify(notes));

    document.getElementById('noteTitle').value = '';
    document.getElementById('noteInput').value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('noteSubject').value = '';

    refreshFilters();
    displayNotes();
}

function displayNotes(){
    let container = document.getElementById("notesContainer");
    container.innerHTML = "";

    const q = searchQuery.trim();
    const tagsFilter = filterTags.map(t=>t.toLowerCase());
    const subjectFilter = filterSubject.toLowerCase();

    notes.forEach((note,index)=>{
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
        const tagsHtml = (note.tags || []).length ? `<div class="note-tags">${note.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : '';

        container.innerHTML += `
            <div class="note">
                ${titleHtml}
                ${contentHtml}
                ${subjectHtml}
                ${tagsHtml}
                <button class="delete-btn" onclick="deleteNote(${index})" aria-label="Delete note">X</button>
            </div>
        `;
    });
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

function deleteNote(index){
    notes.splice(index,1);

    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );

    refreshFilters();
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

