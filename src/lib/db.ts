import Dexie, { type EntityTable } from "dexie";
import type { Task, TaskRun } from "@/types";

const db = new Dexie("ai-scheduler") as Dexie & {
  tasks: EntityTable<Task, "id">;
  runs: EntityTable<TaskRun, "id">;
};

db.version(1).stores({
  tasks: "id, status, createdAt",
  runs: "id, taskId, startedAt, status",
});

export { db };
