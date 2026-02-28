# Plan 2: UI, Dashboard & Polish

## Goal

Build the user-facing experience on top of Plan 1's foundation: dashboard activity feed, run detail view with markdown rendering, settings page, and visual polish. By the end, the app is usable end-to-end with a dark, minimal aesthetic.

---

## Dependencies

- Plan 1 fully implemented (data layer, AI route, scheduler, task CRUD)

---

## Additional Packages

- `react-markdown` — render AI response body
- `rehype-pretty-code` + `shiki` — syntax highlighting in markdown code blocks

---

## Implementation Steps

### 1. Markdown Renderer Component (`src/components/runs/markdown-renderer.tsx`)
- `react-markdown` with `rehype-pretty-code` plugin
- Dark theme code blocks (shiki theme: `github-dark` or similar)
- Handle headings, lists, tables, inline code

### 2. Run Detail Page (`/runs/[id]`)
- Full result display: title, summary, rendered body (markdown)
- Metadata sidebar: model, tokens, duration, prompt snapshot
- Navigation: back to parent task, prev/next run

### 3. Dashboard — Activity Feed (`/`)
- Chronological stream of all runs, newest first
- Run card: task title, timestamp, status badge, summary preview
- Click → navigate to `/runs/[id]`
- Filters: by task, by status (success/failed), by date range
- Empty state: CTA to create first task

### 4. Feed Components (`src/components/feed/`)
- `ActivityFeed` — query all runs sorted by `startedAt` desc
- `RunCard` — compact card with status indicator
- `FeedFilters` — filter bar component

### 5. Settings Page (`/settings`)
- Show API key connection status (connected / not configured)
- Info text explaining `.env.local` setup
- Phase 1: read-only status display, no key editing in UI

### 6. Layout & Navigation Polish
- Sidebar: Dashboard, Tasks, Settings links with active state
- Header: app title, maybe a "last run" indicator
- Responsive: sidebar collapses on mobile

### 7. Visual Polish
- Dark theme: consistent bg/border/text colors across all pages
- Loading skeletons for feed and task list
- Empty states with illustrations or helpful copy
- Error states: failed run display, API connection errors
- Status badges: active/paused for tasks, success/failed for runs
- Hover/focus states on all interactive elements
- Transitions on page navigation and card interactions

---

## Verification

1. Dashboard shows chronological feed of runs from all tasks
2. Click run card → full markdown-rendered result with syntax-highlighted code
3. Filters work: filter by task, status
4. Settings page shows API key status
5. Dark theme consistent across all pages
6. Loading skeletons appear while data loads
7. Empty states show when no tasks/runs exist
8. Mobile: sidebar collapses, layout remains usable
