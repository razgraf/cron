"use client";

import { useMemo, useState } from "react";
import { useAllRuns } from "@/hooks/use-runs";
import { useTasks } from "@/hooks/use-tasks";
import { RunCard } from "./run-card";
import { FeedFilters } from "./feed-filters";

export function ActivityFeed() {
  const { data: runs, isLoading: runsLoading } = useAllRuns();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const taskMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks ?? []) {
      map.set(task.id, task.title);
    }
    return map;
  }, [tasks]);

  const filteredRuns = useMemo(() => {
    let result = runs ?? [];
    if (selectedTaskId) {
      result = result.filter((r) => r.taskId === selectedTaskId);
    }
    if (selectedStatus) {
      result = result.filter((r) => r.status === selectedStatus);
    }
    return result;
  }, [runs, selectedTaskId, selectedStatus]);

  const isLoading = runsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-24 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks && tasks.length > 0 && (
        <FeedFilters
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          selectedStatus={selectedStatus}
          onTaskChange={setSelectedTaskId}
          onStatusChange={setSelectedStatus}
        />
      )}

      {filteredRuns.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {runs && runs.length > 0
            ? "No runs match the current filters."
            : "No runs yet. Runs will appear here as tasks execute."}
        </p>
      )}

      <div className="flex flex-col space-y-4">
        {filteredRuns.map((run) => (
          <RunCard
            key={run.id}
            run={run}
            taskTitle={taskMap.get(run.taskId)}
          />
        ))}
      </div>
    </div>
  );
}
