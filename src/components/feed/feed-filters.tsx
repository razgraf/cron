"use client";

import type { Task } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedFiltersProps {
  tasks: Task[];
  selectedTaskId: string | null;
  selectedStatus: string | null;
  onTaskChange: (taskId: string | null) => void;
  onStatusChange: (status: string | null) => void;
}

export function FeedFilters({
  tasks,
  selectedTaskId,
  selectedStatus,
  onTaskChange,
  onStatusChange,
}: FeedFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={selectedTaskId ?? "all"}
        onValueChange={(v) => onTaskChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="min-w-[140px] flex-1 sm:flex-none sm:w-[180px]">
          <SelectValue placeholder="All tasks" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tasks</SelectItem>
          {tasks.map((task) => (
            <SelectItem key={task.id} value={task.id}>
              {task.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedStatus ?? "all"}
        onValueChange={(v) => onStatusChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="min-w-[140px] flex-1 sm:flex-none sm:w-[140px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="running">Running</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
