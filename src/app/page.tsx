"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityFeed } from "@/components/feed/activity-feed";

export default function DashboardPage() {
  const { data: tasks, isLoading } = useTasks();

  const activeTasks = tasks?.filter((t) => t.status === "active") ?? [];
  const pausedTasks = tasks?.filter((t) => t.status === "paused") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/tasks/new">
          <Button>New Task</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      ) : tasks && tasks.length > 0 ? (
        <>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Total: <span className="font-medium text-foreground">{tasks.length}</span>
            </span>
            <span className="text-border">·</span>
            <span>
              Active: <span className="font-medium text-emerald-500">{activeTasks.length}</span>
            </span>
            <span className="text-border">·</span>
            <span>
              Paused: <span className="font-medium text-foreground">{pausedTasks.length}</span>
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Activity Feed</h2>
            <ActivityFeed />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No tasks yet. Create your first AI task to get started.
            </p>
            <Link href="/tasks/new" className="mt-4 inline-block">
              <Button>Create Task</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
