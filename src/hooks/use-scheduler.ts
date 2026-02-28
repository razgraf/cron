"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { scheduler } from "@/lib/scheduler";

export function useScheduler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    scheduler.syncAll();

    const unsubscribe = scheduler.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    });

    // Re-sync every 60s to pick up changes
    const intervalId = setInterval(() => {
      scheduler.syncAll();
    }, 60_000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      scheduler.clearAll();
    };
  }, [queryClient]);
}
