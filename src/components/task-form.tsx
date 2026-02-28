"use client";

import { useState } from "react";
import type { Task, TaskInterval } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntervalPicker } from "@/components/interval-picker";

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: {
    title: string;
    prompt: string;
    interval: TaskInterval;
  }) => void;
  isLoading?: boolean;
}

export function TaskForm({ initialData, onSubmit, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [prompt, setPrompt] = useState(initialData?.prompt ?? "");
  const [interval, setInterval] = useState<TaskInterval>(
    initialData?.interval ?? { type: "daily", hour: 9, minute: 0 },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;
    onSubmit({ title: title.trim(), prompt: prompt.trim(), interval });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Daily news summary"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Give me a summary of the top 5 tech news stories today..."
          rows={5}
          className="mt-1"
          required
        />
      </div>

      <IntervalPicker value={interval} onChange={setInterval} />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
      </Button>
    </form>
  );
}
