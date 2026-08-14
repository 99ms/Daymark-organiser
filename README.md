# Daymark Organiser

A minimal, local-first personal productivity organiser for planning your days, weeks, and months.

Daymark helps you plan, track, and accomplish your work without cognitive overload, complex cloud setups, or subscription lock-in.

🚀 **Live Demo**: [https://99ms.github.io/Daymark-organiser/](https://99ms.github.io/Daymark-organiser/)

---

## 📌 Overview

Daymark Organiser is designed to manage:
- **Tasks**: Create, prioritize, categorize, tag, and schedule tasks.
- **Priorities**: Color-coded levels (Low, Medium, High, Critical) for visual hierarchy.
- **Planning Views**: Flexible time horizons across Day, Week, Month, and Upcoming schedules.
- **Projects**: Group related tasks together with live completion progress.
- **Goals**: Set and track daily, weekly, and monthly targets.
- **Notes**: Maintain standalone or project-linked markdown notes.
- **Recurring Tasks**: Schedule repeating instances without completing future occurrences.
- **Focus Mode**: Distraction-free execution space with an integrated Pomodoro timer.

**Local-First Privacy**: All your data is persisted locally in your browser using **IndexedDB**. Daymark requires no external database or user registration to operate.

---

## ✨ Features

### 📅 Multi-Horizon Planning
- **Dashboard / Overview**: Full 12-column desktop command center with live completion metrics, streak tracking, workload indicator, top priorities, and upcoming schedule.
- **Day View**: Hour-by-hour time blocking and daily reflection space.
- **Week View**: 7-day column grid with drag-and-drop task rescheduling.
- **Month View**: Comprehensive monthly calendar overview.
- **Upcoming View**: Sorted schedule for future tasks and upcoming deadlines.

### 📝 Comprehensive Task Management
- **Progressive Disclosure**: Task cards expand to reveal subtasks, notes, tags, category badges, and project links.
- **Natural Language Parsing**: Quick Add parses inputs like `Review notes tomorrow at 6pm high priority`.
- **Top Priorities**: Pin critical daily deliverables to the top of your workspace.
- **Rescheduling & Undo**: Instantly move tasks between days with one-click toast undo actions.
- **Recurrence Engine**: Flexible rules (daily, weekdays, weekly, monthly, custom). Completing one occurrence schedules the next without completing future instances.

### 🎯 Projects, Goals & Notes
- **Projects**: Group related tasks with visual progress tracking.
- **Goals**: Target tracking for daily habits, weekly output, and monthly milestones.
- **Notes**: Rich text notes linkable directly to tasks or projects.

### ⏱️ Focus Mode & Productivity Tools
- Integrated **Pomodoro timer** with customizable work and break intervals.
- Distraction-free full-screen workspace.

### 🔍 Search & Filtering
- **Global Search (`Ctrl + K`)**: Instant search across tasks, categories, and notes.
- Filter by category, project, or tag.

### ⌨️ Keyboard Shortcuts
- `N`: Quick add task
- `T`: Jump to Today
- `D`: Day view
- `W`: Week view
- `M`: Month view
- `P`: Projects view
- `F`: Focus mode
- `Ctrl / Cmd + K`: Open search
- `Esc`: Close open modal

### 🎨 Themes & Customization
- Seamless **Light Mode** and **Dark Mode** support tailored with accessible HSL color palettes.

### 💾 Data & Privacy
- **IndexedDB Storage**: Local-first architecture ensures 100% data privacy and offline capability.
- **JSON Export & Import**: Export your complete state anytime for external backups or restore on new devices.

---

## 🎨 Preview

> *Visual screenshots will be published here as the UI continues to refine during the Beta phase.*

---

## 🛠️ Tech Stack

- **UI Framework**: React (`^19.2.8`) & React DOM
- **Language**: TypeScript (`~6.0.2`)
- **Build Tool**: Vite (`^8.2.0`)
- **Date Utilities**: `date-fns` (`^4.4.0`)
- **Iconography**: `lucide-react` (`^1.31.0`)
- **Local Database**: `idb` (`^8.0.3` IndexedDB wrapper)
- **Styling**: Vanilla CSS with custom HSL variables

---

## 🏗️ Architecture

```text
src/
├── components/     # Reusable presentation components (Header, Sidebar, TaskItem, TaskEditorModal)
├── context/        # OrganiserContext providing state management & IndexedDB persistence
├── services/       # IndexedDB interface (db.ts) & seed data definitions (sampleData.ts)
├── types/          # TypeScript domain models (Task, Priority, Category, Project, Goal, Note)
├── utils/          # Task scheduling, date math, and natural-language parsing utilities
├── views/          # Primary page views (Overview, Day, Week, Month, Focus, Projects, Goals, Notes)
├── App.tsx         # Main layout wrapper & modal router
├── index.css       # Global design tokens, typography scale, and responsive grid rules
└── main.tsx        # Application entrypoint
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18.0 or higher)
- npm or yarn

### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/99ms/Daymark-organiser.git
cd Daymark-organiser

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be available at `http://localhost:5173/`.

---

## 📦 Production Build

To build the production bundle:

```bash
npm run build
```

To preview the built production application locally:

```bash
npm run preview
```

---

## 🌐 Browser Requirements

Daymark Organiser runs in any modern web browser supporting ES2020+ and IndexedDB:
- Google Chrome / Chromium (recommended)
- Mozilla Firefox
- Apple Safari
- Microsoft Edge

---

## 🔐 Data, Privacy & Backups

Daymark stores all user data **locally in your browser** via IndexedDB. No personal data, tasks, or notes are transmitted to any remote servers.

- **Creating a Backup**: Open Settings → click **Export Data (JSON)** to download your complete workspace backup.
- **Restoring Data**: Open Settings → click **Import Data (JSON)** to restore from a backup file. Validated prior to database update.
- **Data Reset**: Open Settings → click **Reset Database** to restore default settings.

---

## 🏷️ Beta Status

Daymark Organiser is currently in **v0.1.0-beta.1**. Features and UI may continue to evolve as the project is tested and refined.

---

## 🗺️ Roadmap

- [ ] Enhanced mobile navigation & gesture support
- [ ] Subtask drag-and-drop reordering
- [ ] Export schedule to iCal / .ics format
- [ ] Advanced productivity analytics & velocity charts
- [ ] Custom color theme builder

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Make your changes and verify with `npm run build`.
4. Ensure design consistency and readability.
5. Open a Pull Request.

---

## 🐛 Bug Reports & Feedback

If you encounter a bug or have a feature request:
- Open an issue on [GitHub Issues](https://github.com/99ms/Daymark-organiser/issues).
- Please include your browser name, operating system, steps to reproduce, and console errors if applicable.

---

## 📄 License

Daymark Organiser is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
