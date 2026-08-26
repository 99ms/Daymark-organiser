# Changelog

All notable changes to the Daymark Organiser project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0-beta.2] - 2026-08-26

### Added
- **Productivity Activity Heatmap**: 52-week activity grid in Statistics visualizing daily task completion volume with visibility toggle.
- **Tutorial Task Recovery**: Added a "Restore Tutorial Tasks" option in Settings to safely restore the Getting Started onboarding dataset without overwriting user data.
- **Direct Archive & Restore Controls**: Added direct Archive and Restore action buttons with accessible ARIA labels to task cards.

### Improved
- **Task Completion & Recurrence Integrity**: Hardened completion timestamp synchronization across mutation paths; recurring task completions generate deduplicated future occurrences with reset subtask states and comprehensive undo support.
- **Responsive Layouts**: Enhanced Projects view layout with responsive 12-column grid scaling across mobile, tablet, and desktop screens.
- **Local Date Semantics**: Aligned "Move to Today", overdue detection, and productivity analytics with local calendar dates to eliminate timezone-induced calendar shifts.
- **Import Normalization**: Strengthened JSON backup import validation to defensively normalize task IDs, string titles, due dates, completion timestamps, and subtask arrays.

### Fixed
- **Subtask Editor Persistence**: Fixed a stale task reference in `TaskEditorModal` that could overwrite live subtask changes upon saving task edits.
- **Inbox Quick Capture**: Fixed Quick Capture in the Inbox view defaulting plain tasks to today's date, ensuring unscheduled items remain in the Inbox.
- **Archived Recurrence Occurrence**: Ensured new occurrences generated from archived recurring tasks are created in the active schedule rather than remaining archived.
- **Defensive Subtask Array Handling**: Added defensive fallbacks across all views and context methods to prevent runtime exceptions when handling legacy tasks without subtask arrays.

## [0.2.0-beta.1] - 2026-08-17

### Added
- **AMOLED Theme**: OLED true-black theme (`#000000`) for maximum contrast and battery saving on OLED screens.
- **Customizable Overview Dashboard**: Personalizable widget layout with hidden widget drawer, size presets (1/4, 1/2, 3/4, Full width), and drag-and-drop customization.
- **Drag-and-Drop Layout**: True HTML5 drag-and-drop widget reordering with immediate layout persistence.
- **9 Additional Overview Widgets**: Expanded library with Quick Capture, Mini Calendar, Focus Session, Goal Progress, Task Breakdown, Productivity Trend, Recent Notes, Time Budget, and Inbox widgets.
- **User-Created Custom Themes**: Theme Creator & Live Editor in Settings supporting custom background, text, accent, and surface tokens with live preview and contrast warning indicators.
- **Local Safety Snapshots**: Rolling 5-snapshot local IndexedDB safety net automatically capturing workspace state prior to database resets or backup imports.
- **Workspace Backup Enrichment**: Fully integrated custom themes and overview layouts into workspace JSON backups.

### Improved
- **Responsive Layouts**: Enhanced reflow and off-canvas mobile drawer navigation across desktop, tablet, and mobile screen sizes.
- **Accessibility & ARIA**: Added explicit aria-label tags on Header action buttons and non-blocking contrast warnings in the Theme Creator.
- **IndexedDB Resilience**: Added `blocking()` connection handlers to resolve database version migration locks cleanly.

### Fixed
- **Database Reset Safety Guard**: Fixed an IndexedDB version lock that prevented safety snapshots during database reset.
- **Goal Manual Progress Isolation**: Verified goal progress remains 100% independent from task completion events.

## [0.1.0-beta.1] - 2026-08-14

### Added
- **Initial Beta Release** of Daymark Organiser.
- **Multi-Scale Planning**: Day View, Week View, Month View, and Upcoming Schedule views.
- **Overview Command Center**: 12-column desktop dashboard with progress dial, streak tracker, workload indicator, top priorities, and upcoming schedule.
- **Beginner Onboarding**: Getting Started tutorial dataset introducing priorities, subtasks, recurrence, projects, goals, and Focus mode with a one-click dismissal banner.
- **Task Management**: Color-coded priorities (Low, Medium, High, Critical), custom categories, tags, subtasks, due dates, due times, and task notes.
- **Natural Language Quick Add**: Parse task titles, due dates, times, and priorities from natural text (`N` hotkey).
- **Recurrence Engine**: Support for daily, weekdays, weekly, monthly, and custom recurrence rules.
- **Projects & Goals**: Task grouping by project and progress tracking across daily, weekly, and monthly goals.
- **Standalone Notes**: Markdown notes linkable to tasks and projects.
- **Focus Mode**: Distraction-free Pomodoro timer workspace.
- **IndexedDB Persistence**: Local-first storage using `idb` with JSON export and import capabilities.
- **Keyboard Shortcuts & Search**: Global search (`Ctrl + K`) and fast view switching hotkeys (`T`, `D`, `W`, `M`, `P`, `F`).
- **Themes**: Full Light Mode and Dark Mode support with responsive layout scaling.
