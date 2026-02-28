"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link href="/tasks/new">
          <Button>New Task</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-${i}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tasks && tasks.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No tasks yet. Create your first one.
            </p>
            <Link href="/tasks/new" className="mt-4 inline-block">
              <Button variant="outline">Create Task</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <Card className="gap-2 transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <CardTitle className="text-sm font-medium truncate min-w-0">
                      {task.title}
                    </CardTitle>
                    <Badge
                      variant={
                        task.status === "active" ? "success" : "secondary"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.prompt}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {task.interval.type}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
