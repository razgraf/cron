"use client";

import { useParams, useRouter } from "next/navigation";
import { useTask, useUpdateTask } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/task-form";
import { scheduler } from "@/lib/scheduler";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!task) {
    return <p className="text-muted-foreground">Task not found.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Task</h1>
      <TaskForm
        initialData={task}
        onSubmit={(data) => {
          updateTask.mutate(
            { id: task.id, ...data },
            {
              onSuccess: () => {
                scheduler.scheduleTask({ ...task, ...data });
                router.push(`/tasks/${task.id}`);
              },
            },
          );
        }}
        isLoading={updateTask.isPending}
      />
    </div>
  );
}
