# Student Notes App — NSOC'26

Welcome to the **Student Notes App** project for **NSOC'26** 🚀

This repository is beginner-friendly and open for contributions from students and developers who want to improve their frontend, UI/UX, and JavaScript skills through real open-source collaboration.

Repository Link:
https://github.com/karthik2004-tech/student-notes-app

Every contribution matters — whether it's a small UI fix or a major functionality enhancement.

---

# Contribution Levels

## Level 1 — Basic UI Enhancements

Simple visual improvements or minor frontend changes.

Examples:

* Color/font updates
* Spacing and alignment fixes
* Responsive improvements
* Small animation additions
* Button/navbar/footer styling

---

## Level 2 — Component Enhancements

Adding new UI components or improving multiple sections/components.

Examples:

* Sidebar/Navbar additions
* Search bars and filters
* Dashboard enhancements
* Cards, modals, or reusable components
* Multiple UI section improvements

---

## Level 3 — Functional & Logical Features

Adding or modifying project functionality and application logic.

Examples:

* Search/filter logic
* Auto-save system
* Markdown support
* Local storage integration
* Theme toggling
* Notes management logic
* API/database integration

---

# How to Contribute

## 1. Fork the Repository

Click the **Fork** button on the top-right corner of this repository.

---

## 2. Clone Your Fork

```bash
git clone https://github.com/your-username/student-notes-app.git
```

---

## 3. Move Into Project Folder

```bash
cd student-notes-app
```

---

## 4. Create a New Branch

```bash
git checkout -b feature-name
```

---

## 5. Make Changes and Commit

```bash
git add .
git commit -m "Added new feature"
```

---

## 6. Push Changes

```bash
git push origin feature-name
```

---

## 7. Create a Pull Request

Open a Pull Request with:

* Proper title
* Clear description
* Screenshots/videos if needed
* Mention contribution level

---

# Developer Reference & Local Setup Guide 🛠️

## 📂 Project Architecture & File Descriptions

| File | Type | Description |
| :--- | :--- | :--- |
| **`index.html`** | HTML | The main notes dashboard designed to match Google Keep. Features a grid/list notes grid, collapsible sidebar, theme switcher, and inline note creation card. |
| **`script.js`** | JavaScript | Contains the core logic for rendering notes, managing checklists, search indexing, tags, custom background swatches, toast popups, and drafts. |
| **`style.css`** | CSS | Complete custom stylesheet for the notes application. Standardizes themes (dark mode default), masonry grids, layouts, responsive transitions, and dropdown styling. |
| **`auth.html`** | HTML | Registration and Login forms wrapped in a premium Keep-style dark background theme. |
| **`auth.js`** | JavaScript | Handles client-side cryptography, user management, authentication checks, active session state, and redirection guards (`authRequire`). |
| **`self-test.html`** | HTML | **[Protected]** MCQ practice layout featuring a countdown timer badge, multiple-choice options, submit logic, and a dynamic dashboard tracker. |
| **`self-test.js`** | JavaScript | Manages test state, clocks, MCQ rendering, auto-submit triggers, score computation, and dashboard history mapping. |
| **`mindmap.html`** | HTML | **[Protected]** Whiteboard editor featuring an infinite canvas dot grid, custom nodes toolbars, node coordinate grids, and JSON exporter. |
| **`mindmap.js`** | JavaScript | Implements whiteboard nodes creation, mouse coordinates tracking, node draggable states constraints, connection coordinates, and canvas clearing. |

---

## 💾 State Management & Data Storage

This project operates entirely on the client side, utilizing the browser's **Web Storage API (`localStorage`)** to manage state and persistent user data. No external servers or API backends are required to run the project.

Data is stored under the following registry keys:

* **`sna_notes`**: Stores all created notes, including titles, contents, checklist objects, pinned status, archive/trash flags, and color palette states as a JSON array.
* **`sna_labels`**: Holds custom categories created in the sidebar dynamically.
* **`sna_users`**: Manages all registered user accounts. Passwords are encrypted using a custom hashing algorithm (`_simpleHash()`) for local security before being saved.
* **`sna_session`**: Holds the active logged-in user profile metadata and session timestamps.
* **`weeklySelfTestResults`**: Tracks MCQ scores, attempted counts, correct counts, and timestamps for performance dashboard visualizations.
* **`sna_theme`**: Saves active light or dark theme values permanently.

---

## 🚀 Setting Up the Project Locally

Since this is a client-side web application built using standard HTML5, CSS3, and Vanilla JavaScript, there are **no external dependencies or database installation steps** required! All you need is:
1. A modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari).
2. A code editor (like VS Code).

### Run Locally in VS Code (Recommended)
1. Install the **Live Server** extension in Visual Studio Code.
2. Open the project folder in VS Code.
3. Click the **Go Live** button at the bottom right corner of your VS Code status bar.
4. Your browser will automatically open the project dashboard locally (usually at `http://127.0.0.1:5500/index.html`).

### Run by Opening HTML Files Directly
1. Navigate to the project folder in your file explorer.
2. Double-click on `index.html` to open it in your default web browser.
3. For authentication features, open `auth.html` directly in the browser.

---

# Best Wishes ✨

Thank you for contributing to NSOC'26.

Learn, build, collaborate, and improve together.
Happy Coding 💻
