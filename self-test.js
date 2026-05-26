(() => {
    "use strict";

    const STORAGE_KEY = "weeklySelfTestResults";

    // MVP: Static question set (MCQ only)
    const QUESTIONS = [
        {
            id: "q1",
            text: "Which HTML element is used to include JavaScript in a page?",
            options: ["<javascript>", "<script>", "<js>", "<code>"],
            correctIndex: 1,
        },
        {
            id: "q2",
            text: "Which method converts a JavaScript object into a JSON string?",
            options: ["JSON.parse()", "JSON.stringify()", "Object.toJSON()", "String.toJSON()"],
            correctIndex: 1,
        },
        {
            id: "q3",
            text: "Which keyword declares a block-scoped variable?",
            options: ["var", "let", "static", "scope"],
            correctIndex: 1,
        },
        {
            id: "q4",
            text: "Which CSS property controls text size?",
            options: ["text-style", "font-size", "text-size", "font-weight"],
            correctIndex: 1,
        },
        {
            id: "q5",
            text: "Which array method adds an element to the end of an array?",
            options: ["push()", "pop()", "shift()", "unshift()"],
            correctIndex: 0,
        },
    ];

    const TEST_DURATION_SEC = 10 * 60; // 10 minutes

    /** @type {number} */
    let currentIndex = 0;
    /** @type {(number|null)[]} */
    let answers = new Array(QUESTIONS.length).fill(null);
    /** @type {number} */
    let remainingSec = TEST_DURATION_SEC;
    /** @type {number|null} */
    let timerHandle = null;
    /** @type {boolean} */
    let submitted = false;

    function $(id) {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Missing element: ${id}`);
        return el;
    }

    function safeParseJson(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }

    function loadResults() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = safeParseJson(raw, []);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveResults(results) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        } catch {
            // Ignore storage failures (e.g., private mode restrictions)
        }
    }

    function computeDashboard(results) {
        const total = results.length;
        const last = total > 0 ? results[total - 1] : null;
        const avg = total > 0 ? (results.reduce((sum, r) => sum + (Number(r.scorePercent) || 0), 0) / total) : null;
        return {
            total,
            lastScorePercent: last ? Number(last.scorePercent) : null,
            avgScorePercent: avg,
        };
    }

    function renderDashboard() {
        const results = loadResults();
        const { total, lastScorePercent, avgScorePercent } = computeDashboard(results);

        $("totalAttempts").textContent = String(total);
        $("lastScore").textContent = lastScorePercent === null || Number.isNaN(lastScorePercent) ? "—" : `${Math.round(lastScorePercent)}%`;
        $("avgScore").textContent = avgScorePercent === null || Number.isNaN(avgScorePercent) ? "—" : `${Math.round(avgScorePercent)}%`;
    }

    function formatTime(sec) {
        const s = Math.max(0, sec);
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function updateTimerUI() {
        $("timerValue").textContent = formatTime(remainingSec);
    }

    function startTimer() {
        updateTimerUI();
        timerHandle = window.setInterval(() => {
            if (submitted) return;

            remainingSec -= 1;
            updateTimerUI();

            if (remainingSec <= 0) {
                remainingSec = 0;
                updateTimerUI();
                submitTest({ auto: true });
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerHandle !== null) {
            window.clearInterval(timerHandle);
            timerHandle = null;
        }
    }

    function getSelectedAnswerForCurrent() {
        const q = QUESTIONS[currentIndex];
        const checked = document.querySelector(`input[name="${q.id}"]:checked`);
        if (!checked) return null;
        const idx = Number(checked.value);
        return Number.isFinite(idx) ? idx : null;
    }

    function renderQuestion() {
        const q = QUESTIONS[currentIndex];
        const card = $("questionCard");
        const selected = answers[currentIndex];

        const optionsHtml = q.options
            .map((opt, idx) => {
                const inputId = `${q.id}_opt_${idx}`;
                const isChecked = selected === idx ? "checked" : "";
                return `
                    <label class="option" for="${inputId}">
                        <input id="${inputId}" type="radio" name="${q.id}" value="${idx}" ${isChecked} ${submitted ? "disabled" : ""} />
                        <span>${escapeHtml(opt)}</span>
                    </label>
                `;
            })
            .join("");

        card.innerHTML = `
            <div class="question-meta">Question ${currentIndex + 1} of ${QUESTIONS.length}</div>
            <div class="question-text">${escapeHtml(q.text)}</div>
            <div class="options" role="radiogroup" aria-label="Answer choices">
                ${optionsHtml}
            </div>
        `;

        $("prevBtn").disabled = submitted || currentIndex === 0;
        $("nextBtn").disabled = submitted || currentIndex === QUESTIONS.length - 1;
        $("submitBtn").disabled = submitted;
    }

    function persistCurrentSelection() {
        const selected = getSelectedAnswerForCurrent();
        answers[currentIndex] = selected;
    }

    function computeScore() {
        let correct = 0;
        for (let i = 0; i < QUESTIONS.length; i += 1) {
            if (answers[i] === QUESTIONS[i].correctIndex) correct += 1;
        }
        const total = QUESTIONS.length;
        const scorePercent = total === 0 ? 0 : (correct / total) * 100;
        return { correct, total, scorePercent };
    }

    function renderResult({ correct, total, scorePercent, practiceMode, auto }) {
        const card = $("resultCard");
        card.hidden = false;

        const title = auto ? "Time's up — Test submitted" : "Test submitted";
        const note = practiceMode
            ? "Practice Mode: result was not saved."
            : "Result saved to your performance dashboard.";

        card.innerHTML = `
            <h2 class="card-title">${title}</h2>
            <div class="result-main">
                <div class="result-score">${Math.round(scorePercent)}%</div>
                <div class="result-detail">${correct} correct out of ${total}</div>
                <div class="result-note">${note}</div>
            </div>
        `;
    }

    function submitTest({ auto } = { auto: false }) {
        if (submitted) return;

        persistCurrentSelection();
        submitted = true;
        stopTimer();

        const practiceMode = $("practiceMode").checked;
        const { correct, total, scorePercent } = computeScore();

        if (!practiceMode) {
            const results = loadResults();
            results.push({
                timestamp: new Date().toISOString(),
                correct,
                total,
                scorePercent,
                durationSec: TEST_DURATION_SEC,
            });
            saveResults(results);
        }

        renderResult({ correct, total, scorePercent, practiceMode, auto: Boolean(auto) });
        renderDashboard();
        renderQuestion();

        // Prevent mode changes from being confusing after submission
        $("practiceMode").disabled = true;
    }

    function wireEvents() {
        $("prevBtn").addEventListener("click", () => {
            if (submitted) return;
            persistCurrentSelection();
            currentIndex = Math.max(0, currentIndex - 1);
            renderQuestion();
        });

        $("nextBtn").addEventListener("click", () => {
            if (submitted) return;
            persistCurrentSelection();
            currentIndex = Math.min(QUESTIONS.length - 1, currentIndex + 1);
            renderQuestion();
        });

        $("submitBtn").addEventListener("click", () => submitTest({ auto: false }));

        // Save selection immediately when user changes option
        $("questionCard").addEventListener("change", (e) => {
            if (submitted) return;
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (target.type !== "radio") return;
            persistCurrentSelection();
        });
    }

    function init() {
        renderDashboard();
        wireEvents();
        renderQuestion();
        startTimer();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
