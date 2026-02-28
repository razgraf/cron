# Plan 1: Foundation — Setup, Data, AI, Scheduler

## Goal

Bootstrap the app with project scaffolding, data layer, Claude AI integration, task CRUD, and the scheduler engine. By the end, a user can create a task, have it fire on schedule, and get a structured response stored in IndexedDB.

---

## Scope Changes from Original Spec

- **Claude only** — remove OpenAI, xAI. Single provider, no provider picker.
- Model: `claude-sonnet-4-20250514` (default), can hardcode for now.
- Lock `provider` field from Task model (always `anthropic`).
- Simplify AI route — no provider routing logic.

---

## Tech Stack

| Layer           | Choice                                    |
| --------------- | ----------------------------------------- |
| Framework       | Next.js 15 (App Router)                   |
| Language        | TypeScript (strict)                       |
| Styling         | Tailwind CSS v4 + shadcn/ui               |
| AI              | Vercel AI SDK (`ai`, `@ai-sdk/anthropic`) |
| Local DB        | Dexie.js (IndexedDB)                      |
| State           | TanStack Query + React Context            |
| Linting         | Biome                                     |
| Package manager | bun                                       |

---

## Data Model

```typescript
interface Task {
  id: string; // nanoid
  title: string;
  prompt: string;
  interval: TaskInterval;
  status: "active" | "paused";
  createdAt: number;
  updatedAt: number;
}

interface TaskInterval {
  type: "hourly" | "daily" | "weekly" | "monthly" | "once";
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  exactDate?: number;
}

interface TaskRun {
  id: string;
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  promptSnapshot: string;
  result?: TaskRunResult;
  error?: string;
  startedAt: number;
  completedAt?: number;
  tokensUsed?: { input: number; output: number };
}

interface TaskRunResult {
  title: string;
  summary: string;
  body: string; // markdown
  model: string;
}
```

---

## Implementation Steps

### 1. Project Setup

- `bunx create-next-app@latest` with App Router, TypeScript, Tailwind v4
- Add Biome config
- Install: `dexie`, `ai`, `@ai-sdk/anthropic`, `@tanstack/react-query`, `nanoid`
- Init shadcn/ui (dark theme)
- `.env.local` with `ANTHROPIC_API_KEY`

### 2. Data Layer (`src/lib/db.ts`, `src/types/index.ts`)

- Dexie DB class with `tasks` and `runs` tables
- Indexes: `runs` by `taskId`, by `startedAt`
- Export typed DB instance

### 3. TanStack Query Hooks (`src/hooks/`)

- `use-tasks.ts` — CRUD: list, get, create, update, delete
- `use-runs.ts` — list by taskId, get single, create
- Invalidation patterns for live updates

### 4. AI Route (`src/app/api/ai/run/route.ts`)

- POST handler: receives `{ taskId, prompt }`
- Uses `generateObject()` with Zod schema `{ title, summary, body }`
- Reads `ANTHROPIC_API_KEY` from env
- Returns structured result + token usage

### 5. Scheduler Engine (`src/lib/scheduler.ts`)

- `TaskScheduler` class with setTimeout-based scheduling
- `calculateNextRun(interval)` utility
- On task fire: POST to `/api/ai/run`, store `TaskRun` in Dexie
- `useScheduler` hook — starts on mount, syncs with task changes

### 6. Task CRUD Pages

- `/tasks` — list all tasks (card grid)
- `/tasks/new` — create form (title, prompt, interval picker)
- `/tasks/[id]` — detail view + run history list
- `/tasks/[id]/edit` — edit form
- Interval picker: type dropdown → dynamic fields (hour, day, etc.)

### 7. Root Layout

- Dark theme shell, sidebar nav (Dashboard, Tasks, Settings)
- `QueryClientProvider` + scheduler init at root

---

## Verification

1. `bun dev` → app loads
2. Create task with "every minute" interval → appears in list
3. Task fires → run stored in IndexedDB (check DevTools)
4. API route returns structured `{ title, summary, body }` from Claude
5. Pause task → no more runs
6. Edit prompt → next run uses new prompt
