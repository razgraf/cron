"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useRuns } from "@/hooks/use-runs";
import { scheduler } from "@/lib/scheduler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(id);
  const { data: runs } = useRuns(id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!task) {
    return <p className="text-muted-foreground">Task not found.</p>;
  }

  const toggleStatus = () => {
    const newStatus = task.status === "active" ? "paused" : "active";
    updateTask.mutate(
      { id: task.id, status: newStatus },
      {
        onSuccess: () => {
          if (newStatus === "paused") {
            scheduler.clearTask(task.id);
          } else {
            scheduler.scheduleTask({ ...task, status: newStatus });
          }
        },
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this task and all its runs?")) return;
    scheduler.clearTask(task.id);
    deleteTask.mutate(task.id, {
      onSuccess: () => router.push("/tasks"),
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <Badge
            variant={task.status === "active" ? "success" : "secondary"}
          >
            {task.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleStatus}>
            {task.status === "active" ? "Pause" : "Resume"}
          </Button>
          <Link href={`/tasks/${task.id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{task.prompt}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {describeInterval(task.interval)}
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col space-y-4">
        <h2 className="text-lg font-semibold mb-4">
          Run History ({runs?.length ?? 0})
        </h2>

        {(!runs || runs.length === 0) && (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        )}

        {runs?.map((run) => (
          <Link key={run.id} href={`/runs/${run.id}`}>
            <Card className="gap-2 transition-colors hover:bg-accent/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <CardTitle className="text-sm font-medium min-w-0 truncate">
                    {run.result?.title ?? "Run"}
                  </CardTitle>
                  <Badge
                    variant={
                      run.status === "completed"
                        ? "success"
                        : run.status === "failed"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {run.status}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(run.startedAt).toLocaleString()}
                  {run.tokensUsed &&
                    ` — ${run.tokensUsed.input + run.tokensUsed.output} tokens`}
                </CardDescription>
              </CardHeader>
              {run.result && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {run.result.summary}
                  </p>
                </CardContent>
              )}
              {run.error && (
                <CardContent>
                  <p className="text-sm text-destructive">{run.error}</p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function describeInterval(
  interval: import("@/types").TaskInterval,
): string {
  switch (interval.type) {
    case "hourly":
      return `Every hour at minute ${interval.minute ?? 0}`;
    case "daily":
      return `Daily at ${pad(interval.hour)}:${pad(interval.minute)}`;
    case "weekly": {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return `Every ${days[interval.dayOfWeek ?? 0]} at ${pad(interval.hour)}:${pad(interval.minute)}`;
    }
    case "monthly":
      return `Monthly on day ${interval.dayOfMonth ?? 1} at ${pad(interval.hour)}:${pad(interval.minute)}`;
    case "once":
      return interval.exactDate
        ? `Once at ${new Date(interval.exactDate).toLocaleString()}`
        : "Once (no date set)";
    default:
      return interval.type;
  }
}

function pad(n?: number): string {
  return String(n ?? 0).padStart(2, "0");
}
