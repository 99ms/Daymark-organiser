# Organiser (v0.1.0-beta.1)

> Minimalistic, local-first, multi-scale personal productivity organiser built for fast planning across days, weeks, and months.

Organiser helps you plan, track, and accomplish your daily priorities without cognitive overload, spreadsheets, or slow cloud synchronizations.

---

## 🌟 Beta Release Features

- **Multi-Scale View Workspace**:
  - **Overview**: 12-column desktop command center with live completion metrics, streak tracking, workload indicator, top priorities, and upcoming schedule.
  - **Day View**: Time-blocked schedule, hour-by-hour planning, and daily notes.
  - **Week View**: 7-day column grid with drag-and-drop task rescheduling.
  - **Month View**: Complete monthly calendar overview.
  - **Inbox & Upcoming**: Rapid task capture and future schedule views.

- **Beginner-Friendly Onboarding Experience**:
  - Built-in **Getting Started** tutorial dataset introducing task priorities, subtasks, recurrence, projects, goals, and Focus Mode.
  - One-click **Remove Getting Started Tasks** banner option for a clean workspace transition.

- **Deep Task Management**:
  - **Progressive Disclosure**: Task cards expand to show subtasks, notes, tags, category badges, and project associations.
  - **Natural Language Parsing**: Quick Add supports inputs like `Review notes tomorrow at 6pm high priority`.
  - **Recurrence Support**: Flexible daily, weekdays, weekly, monthly, and custom recurrence rules.
  - **Priorities & Categories**: Color-coded priorities (Low, Medium, High, Critical) and customizable categories.

- **Projects, Goals & Notes**:
  - **Projects**: Group related tasks with real-time completion tracking.
  - **Goals**: Daily, weekly, and monthly target tracking with automatic progress calculation.
  - **Notes**: Self-contained markdown notes linkable to tasks and projects.

- **Distraction-Free Focus Mode**:
  - Integrated **Pomodoro timer** with short/long break presets and full-screen focus focus.

- **Local-First Architecture & Privacy**:
  - All data resides strictly on your device in **IndexedDB**.
  - Complete JSON backup export and import for data portability.

- **Keyboard-First Controls**:
  - `N`: Quick Add Task
  - `F`: Focus Mode
  - `D`: Day View
  - `I`: Inbox
  - `Ctrl + K`: Global Search

---

## 🛠️ Technology Stack

- **Core Framework**: React 18, TypeScript, Vite
- **Date Utilities**: `date-fns`
- **Iconography**: `lucide-react`
- **Persistence Layer**: `idb` (IndexedDB Wrapper)
- **Styling**: Modern Vanilla CSS with CSS Custom Tokens & dark/light themes

---

## 🚀 Getting Started (Development Setup)

### Prerequisites
- Node.js (v18.0 or higher)
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-username/organiser.git
cd organiser

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be available locally at `http://localhost:5173/`.

---

## 📦 Building for Production

To generate an optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## ⚠️ Current Status & Beta Disclaimer

Organiser is currently in **v0.1.0-beta.1**. While all task planning, IndexedDB persistence, keyboard shortcuts, and view modes have undergone QA auditing, active feedback and feature refinements are ongoing.

---

## 📄 License

MIT License © 2026 Organiser Team
