"use client";

import Link from "next/link";
import type { TaskRun } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RunCardProps {
  run: TaskRun;
  taskTitle?: string;
}

export function RunCard({ run, taskTitle }: RunCardProps) {
  const statusVariant =
    run.status === "completed"
      ? ("success" as const)
      : run.status === "failed"
        ? ("destructive" as const)
        : ("warning" as const);

  const timeAgo = formatTimeAgo(run.startedAt);

  return (
    <Link href={`/runs/${run.id}`}>
      <Card className="py-0 gap-0 transition-colors hover:bg-accent/50">
        <CardHeader className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <CardTitle className="text-sm font-medium truncate min-w-0">
              {run.result?.title ?? "Running..."}
            </CardTitle>
            <Badge variant={statusVariant} className="shrink-0">
              {run.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {taskTitle && <span className="truncate">{taskTitle}</span>}
            {taskTitle && <span>·</span>}
            <span className="shrink-0">{timeAgo}</span>
          </div>
        </CardHeader>
        {run.result?.summary && (
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {run.result.summary}
            </p>
          </CardContent>
        )}
        {run.error && (
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-sm text-destructive line-clamp-1">{run.error}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
