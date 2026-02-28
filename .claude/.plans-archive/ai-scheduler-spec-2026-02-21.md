# AI Scheduler — Full Spec & Implementation Plan

## Context

Build a web app ("Scheduler") that lets users create recurring AI tasks — prompts sent to LLMs (Claude, ChatGPT, Grok) on configurable intervals, with results stored and browsable. Two-phase rollout: Phase 1 is local-only (single user, browser storage), Phase 2 adds multi-user with accounts/database.

---

## Architecture Decisions (from Interview)

| Decision | Choice | Rationale |
|---|---|---|
| Data sourcing | Model handles it | Rely on model's built-in capabilities (browsing, search). No pre-fetching in Phase 1 |
| API key storage (P1) | `.env` + Next.js API routes | Keys in `.env`, proxied via server actions. Never in browser |
| Task execution (P1) | Always-on tab + setInterval | Simplest. Missed runs if tab closed — acceptable for P1 |
| Scheduling (P2) | Upstash QStash | Serverless, $1/100K msgs, dynamic per-user schedules, Next.js SDK |
| AI SDK | Vercel AI SDK | Unified `generateText()` across providers. Handles streaming, structured output |
| Local storage (P1) | IndexedDB via Dexie.js | No 5MB limit, TypeScript support, query API, smooth migration to Supabase in P2 |
| Database (P2) | Supabase (Postgres) | Hosted Postgres with auth, realtime, storage. Good free tier |
| Auth (P2) | Decide later | Phase 1 is single-user local |
| Business model | Absorb API costs, tier-based limits | Free tier = small context. Paid tiers = larger context windows |
| Model selection | Provider only | User picks "ChatGPT"/"Claude"/"Grok". App maps to cost-effective default model |
| Output format | Universal schema + markdown | Every run: `{ title, summary, body (markdown), metadata }` |
| Output rendering | Markdown + syntax highlighting | `react-markdown` + `shiki` for code blocks |
| History | Full response, no limit | In P1 (local), storage is free. Revisit limits in P2 |
| Calendar/schedule view | Simple chronological list | Not a calendar grid. List grouped by day, filterable |
| Notifications | None in Phase 1 | Add browser push + email/Telegram in P2 |
| Error handling | Log failure, no retry | Keep P1 simple. Add retry + fallback model in P2 |
| Task versioning | Mutate in place | Each run snapshots the prompt used, but task itself is mutable |
| Dashboard | Global activity feed | Main view = chronological run feed across all tasks |
| Templates | Free-form only (P1) | Add prompt templates in P2 |
| Visual style | Dark, minimal | Linear/Vercel aesthetic. shadcn/ui + custom dark theme |
| X/Twitter integration | Deferred to P2+ | xAI API can't access X data (see research below). Needs X API v2 ($100/mo) |

---

## Research Findings

### Grok / X API Access

- **xAI API (`api.x.ai`)**: Pure LLM inference. No X/Twitter data access. "Search X" only works in consumer product (x.com, grok.com)
- **To read private X lists**: Need X API v2 `GET /2/lists/:id/tweets` + OAuth 2.0 User Context. Minimum **Basic tier ($100/mo)**
- **Practical approach**: Two-step pipeline — fetch tweets via X API, then summarize with any LLM
- **Decision**: Defer to Phase 2. Build as a "data source" plugin when needed

### Cron Job Hosting (Phase 2)

| Service | Max Jobs | Pricing | DX | Verdict |
|---|---|---|---|---|
| **Vercel Cron** | 100 static | Free (function cost) | Great | **Disqualified** — static, not per-user |
| **Upstash QStash** | Unlimited | $1/100K msgs | Great | **Winner** — serverless, dynamic, cheap |
| **Inngest** | Unlimited | $50/mo pro | Excellent | Good for complex workflows, pricier |
| **Trigger.dev** | Unlimited | $20/mo+ | Good | Compute-time billing bad for API-wait tasks |
| **AWS EventBridge** | ~1M | ~$1/1M invocations | Poor | Best at massive scale, worst DX |
| **GCP Scheduler** | 500 | $0.10/job/mo | OK | **Poor fit** — per-job pricing punitive |
| **BullMQ + Redis** | Unlimited | ~$10-30/mo Redis | Good | Full control, needs long-running worker |

**Chosen: Upstash QStash** — stays serverless on Vercel, dynamic schedule creation via API, at-least-once delivery with retries, native Next.js SDK, cheapest for the use case.

### Vercel AI SDK for Structured Output

The Vercel AI SDK (`ai` package) provides:
- `generateText()` / `streamText()` — unified across providers
- `generateObject()` — structured output with Zod schema validation
- Provider packages: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/xai`
- Works with Next.js App Router server actions

This is ideal for the universal schema approach — use `generateObject()` with a Zod schema to enforce `{ title, summary, body }` from every provider.

### Rendering Rich AI Output

For rendering structured markdown responses with code highlighting:
- `react-markdown` — standard React markdown renderer
- `@shikijs/rehype` or `rehype-pretty-code` — shiki-based syntax highlighting as a rehype plugin
- Alternatively: Vercel's `@vercel/react-markdown` or the newer `ai` SDK's built-in UI components

---

## Tech Stack (Phase 1)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/xai`) |
| Local DB | Dexie.js (IndexedDB wrapper) |
| State | TanStack Query (for cache/sync of IndexedDB data) + React Context |
| Markdown | `react-markdown` + `rehype-pretty-code` (shiki) |
| Linting | Biome |
| Package manager | bun |
| Deployment | localhost (P1), Vercel (P2) |

---

## Data Model (Phase 1 — Dexie/IndexedDB)

```typescript
// Task — the user-created recurring job
interface Task {
  id: string;              // nanoid
  title: string;
  prompt: string;
  provider: 'openai' | 'anthropic' | 'xai';
  interval: TaskInterval;
  status: 'active' | 'paused';
  createdAt: number;       // unix ms
  updatedAt: number;
}

interface TaskInterval {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'once';
  hour?: number;           // 0-23, for daily/weekly/monthly
  minute?: number;         // 0-59
  dayOfWeek?: number;      // 0-6, for weekly
  dayOfMonth?: number;     // 1-31, for monthly
  exactDate?: number;      // unix ms, for 'once'
}

// TaskRun — a single execution of a task
interface TaskRun {
  id: string;              // nanoid
  taskId: string;          // FK to Task
  status: 'pending' | 'running' | 'completed' | 'failed';
  promptSnapshot: string;  // the prompt as it was when this ran
  result?: TaskRunResult;
  error?: string;
  startedAt: number;
  completedAt?: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

interface TaskRunResult {
  title: string;           // AI-generated title for this run
  summary: string;         // 1-2 sentence summary
  body: string;            // full markdown response
  model: string;           // actual model used (e.g. 'gpt-4o-mini')
}
```

---

## App Structure

```
ai-scheduler/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (dark theme, fonts)
│   │   ├── page.tsx                # Dashboard — global activity feed
│   │   ├── tasks/
│   │   │   ├── page.tsx            # Tasks list
│   │   │   ├── new/page.tsx        # Create task form
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Task detail + run history
│   │   │       └── edit/page.tsx   # Edit task
│   │   ├── runs/
│   │   │   └── [id]/page.tsx       # Single run detail view
│   │   ├── settings/page.tsx       # API keys config, preferences
│   │   └── api/
│   │       └── ai/
│   │           └── run/route.ts    # Server route: execute AI call
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── layout/                 # Shell, sidebar, header
│   │   ├── tasks/                  # Task card, form, list
│   │   ├── runs/                   # Run card, result viewer, markdown renderer
│   │   └── feed/                   # Activity feed, filters
│   ├── lib/
│   │   ├── db.ts                   # Dexie database setup + schema
│   │   ├── ai.ts                   # Vercel AI SDK provider config
│   │   ├── scheduler.ts           # setInterval-based scheduler engine
│   │   ├── models.ts              # Provider → model mapping
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-tasks.ts           # TanStack Query hooks for tasks CRUD
│   │   ├── use-runs.ts            # TanStack Query hooks for runs
│   │   └── use-scheduler.ts       # Hook to start/stop the scheduler
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── .env.local                      # API keys (gitignored)
├── biome.json
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── bun.lock
```

---

## Key Pages & UX

### Dashboard (`/`) — Global Activity Feed
- Chronological stream of all task runs, newest first
- Each run card shows: task title, provider icon, timestamp, status (success/failed), summary preview
- Click a run → navigate to `/runs/[id]` for full result
- Filters: by task, by provider, by date range, by status
- Empty state: prompt to create first task

### Tasks List (`/tasks`)
- Card grid or list of all tasks
- Each card: title, provider, interval description ("Every day at 9:00 AM"), status toggle (active/paused), last run time
- "New Task" CTA button

### Create/Edit Task (`/tasks/new`, `/tasks/[id]/edit`)
- Form fields: title, prompt (textarea with monospace font), provider (radio/select), interval config (dynamic UI based on type), status
- Interval picker: type dropdown → reveals relevant fields (hour picker, day picker, etc.)
- Preview: show next 3 scheduled run times based on config
- Save → creates task in IndexedDB, scheduler picks it up

### Task Detail (`/tasks/[id]`)
- Task metadata (title, prompt, provider, interval, created date)
- Edit/Delete/Pause actions
- Run history: scrollable list of past runs with status, timestamp, summary
- Click a run → full result view

### Run Detail (`/runs/[id]`)
- Full result: title, summary, body (rendered markdown with syntax highlighting)
- Metadata: model used, tokens consumed, duration, prompt snapshot
- Navigation: back to task, previous/next run

### Settings (`/settings`)
- API key inputs for each provider (masked, saved to `.env.local` or a local config)
- Note: In Phase 1, keys are in `.env.local`. Settings page may just show status (connected/not connected)

---

## Scheduler Engine (Phase 1)

```typescript
// Simplified scheduler logic (src/lib/scheduler.ts)
class TaskScheduler {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  start(tasks: Task[]) {
    for (const task of tasks) {
      if (task.status === 'active') this.scheduleNext(task);
    }
  }

  private scheduleNext(task: Task) {
    const nextRunMs = calculateNextRun(task.interval) - Date.now();
    if (nextRunMs <= 0) {
      // Overdue — run immediately, then schedule next
      this.executeAndReschedule(task);
      return;
    }
    const timer = setTimeout(() => this.executeAndReschedule(task), nextRunMs);
    this.timers.set(task.id, timer);
  }

  private async executeAndReschedule(task: Task) {
    await executeTask(task);   // calls /api/ai/run
    this.scheduleNext(task);   // schedule next occurrence
  }

  stop(taskId: string) {
    const timer = this.timers.get(taskId);
    if (timer) clearTimeout(timer);
    this.timers.delete(taskId);
  }

  stopAll() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers.clear();
  }
}
```

The scheduler runs client-side. On app load, it reads all active tasks from IndexedDB, calculates the next run time for each, and sets timeouts. When a task fires, it calls a Next.js API route (`/api/ai/run`) which executes the AI call server-side (so API keys stay in `.env`).

---

## AI Execution Flow

```
Browser (setTimeout fires)
  → POST /api/ai/run { taskId, prompt, provider }
  → API route reads API key from env
  → Vercel AI SDK generateObject() with Zod schema:
      { title: string, summary: string, body: string }
  → Returns structured result
  → Browser stores TaskRun in IndexedDB via Dexie
  → Activity feed updates via TanStack Query invalidation
```

---

## Cost Optimization Strategies

1. **Default to cheap models**: Map providers to cost-effective defaults
   - OpenAI → `gpt-4o-mini` (~$0.15/1M input, $0.60/1M output)
   - Anthropic → `claude-sonnet-4-20250514` (~$3/1M input, $15/1M output) or `claude-haiku-4-5-20251001` (~$0.80/$4)
   - xAI → `grok-2` (check current pricing)

2. **Tier-based context limits** (Phase 2):
   - Free: 4K input / 1K output tokens per run
   - Pro ($X/mo): 16K input / 4K output
   - Business: 128K input / 8K output

3. **Prompt caching**: For tasks that run repeatedly with similar prompts, Anthropic's prompt caching can reduce costs by ~90% on cached prefix tokens

4. **Track token usage**: Store `tokensUsed` per run. Show users their consumption. Set hard caps per tier.

5. **Batch API** (Phase 2): For non-urgent tasks (daily/weekly), use Anthropic's Batch API for 50% cost reduction with 24h turnaround

---

## Phase 1 Implementation Order

1. **Project setup**: Next.js + Tailwind + shadcn/ui + Biome + Dexie
2. **Data layer**: Dexie schema, TanStack Query hooks for CRUD
3. **AI integration**: Vercel AI SDK setup, `/api/ai/run` route, provider config
4. **Task CRUD**: Create/edit/delete task pages and forms
5. **Scheduler engine**: setInterval-based scheduler with IndexedDB persistence
6. **Run storage & display**: Store results, markdown renderer with shiki
7. **Dashboard**: Global activity feed with filters
8. **Task detail page**: Full task view with run history
9. **Settings page**: API key status display
10. **Polish**: Dark theme, loading states, empty states, error states

---

## Phase 2 Roadmap (not implemented now, but architected for)

- Supabase: migrate from Dexie to Postgres (Dexie's API is similar enough that migration is manageable)
- Auth: TBD provider, add user accounts
- Upstash QStash: replace setInterval with server-side cron
- Notifications: browser push, then email/Telegram
- X API integration: data source plugin for private lists
- Prompt templates: curated + user-created
- Tier system: free/pro/business with token caps
- Retry + fallback models on failure

---

## Verification (Phase 1)

1. `bun dev` → app loads at localhost:3000
2. Create a task with hourly interval → appears in tasks list
3. Task fires (or manually trigger) → run appears in activity feed
4. Click run → see full markdown-rendered result with syntax highlighting
5. Edit task prompt → next run uses new prompt, old runs show old prompt snapshot
6. Pause task → no more runs scheduled
7. Check IndexedDB in DevTools → data persists across page reloads

---

## Open Questions (Resolved)

| Question | Resolution |
|---|---|
| How to estimate/cap token spending? | Tier-based context limits. Track `tokensUsed` per run. Default to cheap models. |
| How to store prompts/keys securely? | P1: `.env.local` + Next.js API routes. P2: Supabase + server-side only. |
| What other technologies? | See tech stack above. Key additions: Dexie.js, Vercel AI SDK, TanStack Query, shiki, Biome. |
| Grok reading X lists? | Not possible via xAI API. Need X API v2 ($100/mo). Deferred to P2. |
| Cron job hosting? | Upstash QStash for P2. setInterval for P1. |
