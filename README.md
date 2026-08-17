# Daymark Organiser

A minimal, local-first personal productivity organiser for planning your days, weeks, and months.

Daymark helps you plan, track, and accomplish your work without cognitive overload, complex cloud setups, user registration, or subscription lock-in.

🚀 **Live Demo**: [https://99ms.github.io/Daymark-organiser/](https://99ms.github.io/Daymark-organiser/)

---

## 📌 Overview

Daymark Organiser is designed around frictionless personal productivity:
- **Tasks**: Create, prioritize, categorize, tag, and schedule tasks with natural-language parsing.
- **Priorities**: Color-coded levels (Low, Medium, High, Critical) for clear visual hierarchy.
- **Planning Views**: Flexible time horizons across Day, Week, Month, and Upcoming schedules.
- **Projects**: Group related tasks with visual completion metrics.
- **Goals**: Set and manually track daily, weekly, and monthly targets.
- **Notes**: Maintain standalone or project-linked markdown notes.
- **Recurring Tasks**: Schedule repeating instances without completing future occurrences.
- **Focus Mode**: Distraction-free execution space with an integrated Pomodoro timer.
- **Customizable Overview**: Personalize your main dashboard with true drag-and-drop widgets.
- **Custom Themes**: Select built-in presets or create your own custom color themes with live preview.
- **Local Safety Snapshots**: Automatic rolling safety backups before database resets or imports.

**Local-First Privacy**: All your workspace data is persisted locally in your browser using **IndexedDB**. Daymark requires no user registration or external server setups.

---

## ✨ Key Features

### 📊 Customizable Overview Dashboard
- **Default Experience**: Clean 12-column desktop command center with completion progress, streak tracking, workload indicator, top priorities, and upcoming schedule.
- **True Drag-and-Drop**: Reorder widgets freely across the grid with real-time IndexedDB layout persistence.
- **Widget Customization**: Resize widgets (1/4, 1/2, 3/4, Full width), hide unused widgets, or restore default layouts anytime.
- **Expanded Widget Library**: Choose from 9 optional widgets:
  - *Quick Capture*, *Mini Calendar*, *Focus Session*, *Goal Progress*, *Task Breakdown*, *Productivity Trend*, *Recent Notes*, *Time Budget*, and *Inbox*.

### 📅 Multi-Horizon Planning
- **Day View**: Hour-by-hour time blocking and daily reflection space.
- **Week View**: 7-day column grid with drag-and-drop task rescheduling.
- **Month View**: Comprehensive monthly calendar overview.
- **Upcoming View**: Chronological schedule for future tasks and upcoming deadlines.

### 📝 Comprehensive Task Management
- **Progressive Disclosure**: Expand task cards to view subtasks, notes, tags, category badges, and project links.
- **Natural Language Parsing**: Quick Add parses inputs like `Review notes tomorrow at 6pm high priority` (`N` hotkey).
- **Top Priorities**: Pin critical daily deliverables to the top of your workspace.
- **Recurrence Engine**: Flexible rules (daily, weekdays, weekly, monthly, custom). Completing one occurrence schedules the next without completing future instances.

### 🎯 Projects, Goals & Notes
- **Projects**: Group related tasks with live completion progress.
- **Goals**: Independent target tracking for daily habits, weekly output, and monthly milestones.
- **Notes**: Standalone or project-linked markdown notes.

### ⏱️ Focus Mode & Pomodoro Timer
- Integrated Pomodoro timer (`Timer` icon) with customizable work and break intervals.
- Distraction-free full-screen workspace.

### 🎨 Themes & Customization
- **Built-in Presets**:
  - **Light Mode**: Clean daylight interface.
  - **Dark Mode**: Slate dark interface.
  - **AMOLED**: True-black (`#000000`) OLED theme for maximum contrast and battery saving.
- **Top-Right Theme Cycler**: Instantly cycle between Light → Dark → AMOLED presets.
- **Theme Creator & Editor**: Create, edit, rename, duplicate, and delete custom themes under **Settings → Appearance & Custom Themes**. Includes live DOM preview and WCAG contrast warning indicators.

### 🔐 Local-First & Data Resilience
- **IndexedDB Persistence**: All workspace data remains on your device.
- **Automatic Safety Snapshots**: Rolling 5-snapshot safety net automatically created before database resets or backup imports.
- **JSON Export & Import**: Export your complete workspace state (including custom themes and overview layout) for off-device protection.

### 📱 Responsive Design & Accessibility
- **Fluid Layouts**: Full responsive support across desktop (1920px+), tablet (1024px, 768px), and mobile (430px, 390px, 360px) with off-canvas drawer navigation.
- **Accessibility**: Explicit `aria-label` attributes on icon controls, accessible contrast warnings, keyboard navigation, and visible focus indicators.

---

## ⌨️ Keyboard Shortcuts

- `N`: Quick add task
- `T`: Jump to Today
- `D`: Day view
- `W`: Week view
- `M`: Month view
- `P`: Projects view
- `F`: Focus mode
- `Ctrl / Cmd + K`: Open search
- `Esc`: Close open modal

---

## 🛠️ Tech Stack

- **UI Framework**: React (`^19.2.8`) & React DOM
- **Language**: TypeScript (`~6.0.2`)
- **Build Tool**: Vite (`^8.2.0`)
- **Date Utilities**: `date-fns` (`^4.4.0`)
- **Iconography**: `lucide-react` (`^1.31.0`)
- **Local Database**: `idb` (`^8.0.3` IndexedDB wrapper)
- **Styling**: Vanilla CSS with custom HSL design tokens

---

## 🏗️ Architecture

```text
src/
├── components/     # Presentation components (Header, Sidebar, TaskItem, TaskEditorModal)
├── context/        # OrganiserContext providing state management, snapshots & persistence
├── services/       # IndexedDB interface (db.ts) & seed data definitions (sampleData.ts)
├── types/          # TypeScript domain models (Task, Priority, Category, Project, Goal, Note, ThemeTokens)
├── utils/          # Task scheduling, date math, theme tokens, and natural-language parsing utilities
├── views/          # Primary page views (Overview, Day, Week, Month, Focus, Projects, Goals, Notes, Settings)
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

## 🔐 Data, Privacy & Backups

Daymark stores all user data **locally in your browser** via IndexedDB. No personal data, tasks, or notes are transmitted to any remote servers.

- **No User Account Required**: Use Daymark immediately without creating an account or logging in.
- **Local Safety Snapshots**: Snapshots are created automatically before dangerous actions (resets or imports) and can be restored with one click in Settings.
- **Exporting Backups**: Open **Settings → Data Resilience** and click **Export Backup (JSON)** to save your workspace file off-device.
- **Restoring Backups**: Click **Import Backup JSON** to restore your tasks, projects, goals, notes, custom themes, and overview layout.
- **Data Protection Warning**: Clearing browser site data or clearing local storage will wipe locally stored data. Users should periodically export JSON backups for long-term protection.

---

## 🏷️ Beta Status

Daymark Organiser is currently in **v0.2.0-beta.1**. Features and UI may continue to evolve as the project is tested and refined.

---

## 📄 License

Daymark Organiser is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

