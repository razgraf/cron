"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import type { Task, TaskInterval } from "@/types";

const TASKS_KEY = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => db.tasks.orderBy("createdAt").reverse().toArray(),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_KEY, id],
    queryFn: () => db.tasks.get(id!) ?? null,
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Pick<Task, "title" | "prompt"> & { interval: TaskInterval },
    ) => {
      const now = Date.now();
      const task: Task = {
        id: nanoid(),
        title: data.title,
        prompt: data.prompt,
        interval: data.interval,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      await db.tasks.add(task);
      return task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Task> & { id: string }) => {
      await db.tasks.update(id, { ...data, updatedAt: Date.now() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.tasks.delete(id);
      await db.runs.where("taskId").equals(id).delete();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
