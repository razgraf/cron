export interface TaskInterval {
  type: "hourly" | "daily" | "weekly" | "monthly" | "once";
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  exactDate?: number;
}

export interface Task {
  id: string;
  title: string;
  prompt: string;
  interval: TaskInterval;
  status: "active" | "paused";
  createdAt: number;
  updatedAt: number;
}

export interface TaskRunResult {
  title: string;
  summary: string;
  body: string;
  model: string;
}

export interface TaskRun {
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
