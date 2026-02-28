"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import type { TaskRun } from "@/types";

const RUNS_KEY = ["runs"] as const;

export function useAllRuns() {
  return useQuery({
    queryKey: [...RUNS_KEY, "all"],
    queryFn: async () => {
      const runs = await db.runs.orderBy("startedAt").reverse().toArray();
      return runs;
    },
  });
}

export function useRuns(taskId: string | undefined) {
  return useQuery({
    queryKey: [...RUNS_KEY, taskId],
    queryFn: () =>
      taskId
        ? db.runs
            .where("taskId")
            .equals(taskId)
            .reverse()
            .sortBy("startedAt")
        : [],
    enabled: !!taskId,
  });
}

export function useRun(id: string | undefined) {
  return useQuery({
    queryKey: [...RUNS_KEY, "detail", id],
    queryFn: () => db.runs.get(id!) ?? null,
    enabled: !!id,
  });
}

export function useCreateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { taskId: string; promptSnapshot: string }) => {
      const run: TaskRun = {
        id: nanoid(),
        taskId: data.taskId,
        status: "pending",
        promptSnapshot: data.promptSnapshot,
        startedAt: Date.now(),
      };
      await db.runs.add(run);
      return run;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, vars.taskId] }),
  });
}

export function useUpdateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<TaskRun> & { id: string }) => {
      await db.runs.update(id, data);
      const run = await db.runs.get(id);
      return run;
    },
    onSuccess: async (run) => {
      if (run?.taskId) {
        qc.invalidateQueries({ queryKey: [...RUNS_KEY, run.taskId] });
      }
    },
  });
}

export async function createRunDirect(data: {
  taskId: string;
  promptSnapshot: string;
}): Promise<TaskRun> {
  const run: TaskRun = {
    id: nanoid(),
    taskId: data.taskId,
    status: "pending",
    promptSnapshot: data.promptSnapshot,
    startedAt: Date.now(),
  };
  await db.runs.add(run);
  return run;
}

export async function updateRunDirect(
  id: string,
  data: Partial<TaskRun>,
): Promise<void> {
  await db.runs.update(id, data);
}
