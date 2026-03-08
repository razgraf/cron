![Cron](/assets/banner.png)

# Cron

> [!NOTE]
> This is an experimental project, meant to explore the idea and is not production-ready.

Schedule AI-powered tasks that run automatically on a recurring basis. Each task executes a prompt using Claude, optionally enriched with live web search results, and stores the output for later review.

Started building this because the native task/schedules UX in Grok and ChatGPT wasn't very good.

## Features

- **Recurring schedules** — hourly, daily, weekly, monthly, or one-time execution
- **Web search context** — optional Brave Search integration injects current information into prompts
- **Structured output** — each run produces a title, summary, and full markdown body
- **Activity feed** — filterable dashboard showing all runs across tasks
- **Token tracking** — input/output token usage recorded per run
- **Local-first** — all data stored client-side in IndexedDB via Dexie

![Screenshot](/assets/screenshot.png)

## Quickstart

```bash
git clone https://github.com/razgraf/cron.git
cd cron
bun install
```

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-...         # Required
BRAVE_SEARCH_API_KEY=BSA...          # Optional — enables web search context
```

Start the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

This project is built in two stages.

### Stage 1 — Local-first scheduler (current)

Everything runs in the browser. Tasks are stored in IndexedDB, the scheduler uses `setTimeout` in an always-on tab, and AI calls are proxied through Next.js API routes with keys in `.env.local`. No backend, no accounts, no external infrastructure.

- [x] Task CRUD with recurring schedules
- [x] Client-side scheduling engine
- [x] AI execution via Vercel AI SDK + Claude
- [x] Web search context via Brave Search
- [x] Activity feed, run history, markdown rendering
- [x] Token usage tracking

### Stage 2 — Hosted multi-user platform

Migrate to a proper backend with user accounts, server-side job scheduling, and persistent storage.

- [ ] **Auth** — user accounts and API key management per user
- [ ] **Database** — Supabase (Postgres) replacing IndexedDB
- [ ] **Scheduling** — Upstash QStash replacing client-side timers
- [ ] **Multi-provider** — OpenAI, xAI alongside Anthropic
- [ ] **Notifications** — browser push, email, Telegram
- [ ] **Prompt templates** — curated and user-created
- [ ] **Tier system** — free/pro/business with token caps and context limits
- [ ] **Retry & fallback** — automatic retry with fallback models on failure

## Configuration

Tunable constants live in `src/lib/constants.ts`:

```ts
export const MAX_OUTPUT_TOKENS = 4096;
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
```

## License

MIT
