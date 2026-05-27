// State
let goals = {
    daily: [],
    weekly: [],
    monthly: []
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    renderGoals();
});

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Core Functions
function addGoal(type) {
    const titleInput = document.getElementById(`${type}Title`);
    const descInput = document.getElementById(`${type}Desc`);
    
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();

    if (!title) {
        showToast('Task title cannot be empty', 'error');
        return;
    }

    const newGoal = {
        id: generateId(),
        title: title,
        description: desc,
        completed: false,
        createdAt: new Date().toISOString()
    };

    goals[type].push(newGoal);
    saveGoals();
    
    // Clear inputs
    titleInput.value = '';
    descInput.value = '';

    renderGoals();
    showToast(`New ${type} goal added!`);
}

function toggleGoal(id, type) {
    const goal = goals[type].find(g => g.id === id);
    if (goal) {
        goal.completed = !goal.completed;
        saveGoals();
        renderGoals();
        if (goal.completed) {
            // Optional celebration logic here if desired
        }
    }
}

function deleteGoal(id, type) {
    goals[type] = goals[type].filter(g => g.id !== id);
    saveGoals();
    renderGoals();
    showToast('Goal deleted');
}

function renderGoals() {
    const types = ['daily', 'weekly', 'monthly'];
    let totalTasks = 0;
    let totalCompleted = 0;

    types.forEach(type => {
        const listContainer = document.getElementById(`${type}List`);
        listContainer.innerHTML = ''; // Clear current

        const sectionGoals = goals[type];
        
        let completedInSection = 0;

        if (sectionGoals.length === 0) {
            listContainer.innerHTML = `<div class="empty-state">No ${type} goals yet. Add one above!</div>`;
        } else {
            sectionGoals.forEach(goal => {
                totalTasks++;
                if (goal.completed) {
                    completedInSection++;
                    totalCompleted++;
                }

                const card = document.createElement('div');
                card.className = `goal-card ${goal.completed ? 'completed' : ''}`;
                
                card.innerHTML = `
                    <div class="goal-header">
                        <input type="checkbox" class="goal-checkbox" ${goal.completed ? 'checked' : ''} onchange="toggleGoal('${goal.id}', '${type}')" aria-label="Mark ${goal.title} complete" />
                        <div class="goal-title">${escapeHTML(goal.title)}</div>
                    </div>
                    ${goal.description ? `<div class="goal-desc">${escapeHTML(goal.description)}</div>` : ''}
                    <button class="goal-delete-btn" onclick="deleteGoal('${goal.id}', '${type}')" aria-label="Delete Goal" title="Delete">✕</button>
                `;

                listContainer.appendChild(card);
            });
        }

        // Update section progress
        const sectionProgressFill = document.getElementById(`${type}ProgressFill`);
        const sectionPercentage = sectionGoals.length === 0 ? 0 : Math.round((completedInSection / sectionGoals.length) * 100);
        sectionProgressFill.style.width = `${sectionPercentage}%`;
    });

    updateProgress(totalTasks, totalCompleted);
}

function updateProgress(total, completed) {
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statPercentage').textContent = `${percentage}%`;

    const overallProgressFill = document.getElementById('overallProgressFill');
    overallProgressFill.style.width = `${percentage}%`;
}

function saveGoals() {
    localStorage.setItem('studentGoals', JSON.stringify(goals));
}

function loadGoals() {
    const stored = localStorage.getItem('studentGoals');
    if (stored) {
        try {
            goals = JSON.parse(stored);
            // Ensure structure exists in case of old data formats
            goals.daily = goals.daily || [];
            goals.weekly = goals.weekly || [];
            goals.monthly = goals.monthly || [];
        } catch (e) {
            console.error('Failed to parse goals from localStorage', e);
        }
    }
}

// Utility: Escape HTML to prevent XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Re-using toast functionality from existing app structure, if not present, polyfill it:
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
        toast.style.background = '#EF4444';
    }
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;

    toast.classList.add('show');
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if(toast.parentElement) toast.remove();
        }, 300);
    }, 3000);
}
