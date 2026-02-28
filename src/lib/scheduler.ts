import type { Task, TaskInterval } from "@/types";
import { db } from "@/lib/db";
import { createRunDirect, updateRunDirect } from "@/hooks/use-runs";

export function calculateNextRun(interval: TaskInterval): number | null {
  const now = new Date();
  const minute = interval.minute ?? 0;
  const hour = interval.hour ?? 0;

  switch (interval.type) {
    case "once": {
      if (!interval.exactDate) return null;
      return interval.exactDate > Date.now() ? interval.exactDate : null;
    }

    case "hourly": {
      const next = new Date(now);
      next.setMinutes(minute, 0, 0);
      if (next <= now) {
        next.setHours(next.getHours() + 1);
      }
      return next.getTime();
    }

    case "daily": {
      const next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next.getTime();
    }

    case "weekly": {
      const dayOfWeek = interval.dayOfWeek ?? 0;
      const next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
      if (daysUntil === 0 && next <= now) {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + daysUntil);
      }
      return next.getTime();
    }

    case "monthly": {
      const dayOfMonth = interval.dayOfMonth ?? 1;
      const next = new Date(now);
      next.setDate(dayOfMonth);
      next.setHours(hour, minute, 0, 0);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next.getTime();
    }

    default:
      return null;
  }
}

async function executeRun(task: Task): Promise<void> {
  const run = await createRunDirect({
    taskId: task.id,
    promptSnapshot: task.prompt,
  });

  await updateRunDirect(run.id, { status: "running" });

  try {
    const response = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, prompt: task.prompt }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "API request failed");
    }

    const data = await response.json();

    await updateRunDirect(run.id, {
      status: "completed",
      result: data.result,
      tokensUsed: data.tokensUsed,
      completedAt: Date.now(),
    });
  } catch (error) {
    await updateRunDirect(run.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      completedAt: Date.now(),
    });
  }
}

type ScheduledTimer = {
  taskId: string;
  timerId: ReturnType<typeof setTimeout>;
  nextRun: number;
};

class TaskScheduler {
  private timers: Map<string, ScheduledTimer> = new Map();
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async syncAll(): Promise<void> {
    const tasks = await db.tasks.where("status").equals("active").toArray();
    const activeTaskIds = new Set(tasks.map((t) => t.id));

    // Clear timers for removed/paused tasks
    for (const [taskId] of this.timers) {
      if (!activeTaskIds.has(taskId)) {
        this.clearTask(taskId);
      }
    }

    // Schedule active tasks
    for (const task of tasks) {
      this.scheduleTask(task);
    }
  }

  scheduleTask(task: Task): void {
    if (task.status !== "active") {
      this.clearTask(task.id);
      return;
    }

    const nextRun = calculateNextRun(task.interval);
    if (!nextRun) {
      this.clearTask(task.id);
      return;
    }

    const existing = this.timers.get(task.id);
    if (existing && existing.nextRun === nextRun) {
      return; // Already scheduled for this time
    }

    this.clearTask(task.id);

    const delay = Math.max(0, nextRun - Date.now());
    const timerId = setTimeout(async () => {
      await executeRun(task);
      this.notify();
      // Reschedule for recurring tasks
      if (task.interval.type !== "once") {
        const freshTask = await db.tasks.get(task.id);
        if (freshTask && freshTask.status === "active") {
          this.scheduleTask(freshTask);
        }
      } else {
        this.timers.delete(task.id);
      }
    }, delay);

    this.timers.set(task.id, { taskId: task.id, timerId, nextRun });
  }

  clearTask(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer.timerId);
      this.timers.delete(taskId);
    }
  }

  clearAll(): void {
    for (const [taskId] of this.timers) {
      this.clearTask(taskId);
    }
  }

  getNextRun(taskId: string): number | null {
    return this.timers.get(taskId)?.nextRun ?? null;
  }

  getScheduledCount(): number {
    return this.timers.size;
  }
}

export const scheduler = new TaskScheduler();
