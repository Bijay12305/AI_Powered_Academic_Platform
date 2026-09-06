# StudentHub – AI-Powered Academic & Project Management Platform

> **"Less Time Managing. More Time Learning."**

StudentHub is a single, centralized productivity SaaS platform engineered specifically for college students. It helps students generate structured study notes using AI, manage team projects, track deadlines, solve academic doubts, organize subjects, and view everything from a unified modern dashboard.

---

## 🚀 Key Features

### 1. ✨ AI Generated Notes Studio (Hero Page)
- **4-Step Workflow**: Upload Material → Select Options → Generate Notes → Review & Save.
- **Drag & Drop Uploader**: Supports PDF, PPT, DOC, TXT (up to 20MB) with active file removal and validation.
- **Text & Lecture Input**: Text paste area, OCR handwritten notes scan trigger, and lecture audio transcription simulation.
- **Custom Note Types**: Short Notes, Key Points, Definitions, Important Topics, Questions (MCQs), Viva Questions, and Summary.
- **Multi-Tab Preview**: Instant switching between Short Notes, Key Points, Important Topics, MCQs, Viva Questions, and Summary.
- **Inline Rich Editing**: `✎ Edit Notes` WYSIWYG editor mode with formatting toolbar (Bold, Italic, Headings, Bullet Lists, Code).
- **Download & Save**: Export as clean Markdown/PDF or save directly to the student's personal notes collection with persistent database sync.

### 2. 📊 Academic Dashboard
- **Welcome & Stats Banner**: Displays counts for Subjects, Notes, Pending Assignments, Active Projects, and Upcoming Deadlines.
- **Quick Actions**: One-click creation of notes, assignments, projects, and document uploads.
- **Interactive Daily Tasks Checklist**: Persistent checkboxes that update status in real time.
- **Recent Notes & Deadlines Widget**: Quick links and urgency color indicators.
- **AI Study Assistant Hub**: Direct shortcuts to OCR, Lecture-to-Notes, Ask AI, and MCQ generation.

### 3. 📚 Subjects Directory
- Cards for core CSE subjects (Operating Systems, DBMS, Computer Networks, Java Programming, Mathematics & Discrete Structures).
- Syllabus coverage meters, credit hours, faculty info, notes counts, and assignment breakdown.

### 4. 📝 Notes Library
- Search by keyword with instant live filtering.
- Filter by Subject and Unit, sort by Date or Title.
- Pin important notes to the top, view full markdown content, edit, download, or delete.

### 5. 📁 Study Material Vault
- Store lecture slides, reference guides, cheatsheets, and question banks.
- Direct **"⚡ Generate Notes"** action on any document to immediately open the AI Studio with that file pre-selected.

### 6. 💬 Ask AI – Academic Doubts Assistant
- Interactive academic tutor that explains difficult topics in simple words.
- Structured answers: Simple Explanation, Key Points, Real-World Example, and Quick Revision Summary.
- Pre-configured prompt chips for common student queries.

### 7. 📋 Assignment Management
- Status workflow: `Not Started` → `In Progress` → `Completed`.
- Clear overdue alerts and priority tags (High, Medium, Low).
- Quick status toggle with instant database updates.

### 8. 🚀 Projects & Team Collaboration
- Showcase Project: **Smart Campus Management System**.
- **8-Stage Progression**: Planning → Research → Design → Development → Testing → Documentation → PPT → Completed.
- **Kanban Board**: Drag/move tasks between `To Do`, `In Progress`, and `Completed`.
- **Team Activity Feed**: Real-time record of teammate contributions.

### 9. 📅 Academic Calendar & Deadlines
- Month view with date navigation and color-coded event pills (Exams, Assignments, Project Milestones).
- Dedicated Deadlines page grouped into `Due Today`, `Due This Week`, `Upcoming Later`, and `Overdue`.

### 10. 🎓 Student Profile & Settings
- Profile for **Bijay Mandal (B.Tech CSE, 3rd Year)** with CGPA, attendance, semester info, and achievement badges.
- Theme toggle (Clean Light & Dark Mode) and AI generation preferences.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Semantic HTML5, Vanilla Modern CSS (CSS Custom Properties, Glassmorphism, Responsive Drawer), Vanilla ES6+ JavaScript.
- **Backend Server**: Lightweight Python 3 REST API (`server.py`) serving static assets and JSON endpoints with zero external dependencies.
- **Database**: Persistent JSON database in `data/database.json`.
- **Design Philosophy**: Dark navy sidebar (`#0f172a`), crisp off-white background (`#f8fafc`), electric blue action color (`#2563eb`), purple AI highlights (`#7c3aed`), and smooth micro-animations.

---

## 💻 Running the Application Locally

1. Open your terminal in the project directory:
   ```bash
   cd c:\project1\AI-Powered-Academic-Platform
   ```

2. Start the local server:
   ```bash
   python server.py
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```
