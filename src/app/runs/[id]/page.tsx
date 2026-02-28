"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRun } from "@/hooks/use-runs";
import { useTask } from "@/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/runs/markdown-renderer";

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, isLoading } = useRun(id);
  const { data: task } = useTask(run?.taskId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!run) {
    return <p className="text-muted-foreground">Run not found.</p>;
  }

  const duration =
    run.completedAt && run.startedAt
      ? ((run.completedAt - run.startedAt) / 1000).toFixed(1)
      : null;

  const statusVariant =
    run.status === "completed"
      ? ("success" as const)
      : run.status === "failed"
        ? ("destructive" as const)
        : ("warning" as const);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {run.result?.title ?? "Run Detail"}
          </h1>
          <Badge variant={statusVariant}>{run.status}</Badge>
        </div>
        {task && (
          <Link href={`/tasks/${task.id}`}>
            <Button variant="outline" size="sm">
              Back to Task
            </Button>
          </Link>
        )}
      </div>

      {run.result?.summary && (
        <p className="text-muted-foreground">{run.result.summary}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {run.result?.body && <MarkdownRenderer content={run.result.body} />}

          {run.error && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{run.error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {task && (
                <div>
                  <span className="text-muted-foreground">Task</span>
                  <p className="font-medium">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="hover:underline"
                    >
                      {task.title}
                    </Link>
                  </p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">Model</span>
                <p className="font-mono text-xs">
                  {run.result?.model ?? "—"}
                </p>
              </div>

              {run.tokensUsed && (
                <div>
                  <span className="text-muted-foreground">Tokens</span>
                  <p>
                    {run.tokensUsed.input} in / {run.tokensUsed.output} out
                  </p>
                </div>
              )}

              {duration && (
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p>{duration}s</p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">Started</span>
                <p>{new Date(run.startedAt).toLocaleString()}</p>
              </div>

              {run.completedAt && (
                <div>
                  <span className="text-muted-foreground">Completed</span>
                  <p>{new Date(run.completedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prompt Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {run.promptSnapshot}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
