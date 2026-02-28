"use client";

import { useRouter } from "next/navigation";
import { useCreateTask } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/task-form";
import { scheduler } from "@/lib/scheduler";

export default function NewTaskPage() {
  const router = useRouter();
  const createTask = useCreateTask();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Create Task</h1>
      <TaskForm
        onSubmit={(data) => {
          createTask.mutate(data, {
            onSuccess: (task) => {
              scheduler.scheduleTask(task);
              router.push(`/tasks/${task.id}`);
            },
          });
        }}
        isLoading={createTask.isPending}
      />
    </div>
  );
}
