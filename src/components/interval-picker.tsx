"use client";

import type { TaskInterval } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IntervalPickerProps {
  value: TaskInterval;
  onChange: (interval: TaskInterval) => void;
}

export function IntervalPicker({ value, onChange }: IntervalPickerProps) {
  const update = (partial: Partial<TaskInterval>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Frequency</Label>
        <Select
          value={value.type}
          onValueChange={(type) =>
            onChange({
              type: type as TaskInterval["type"],
              hour: 0,
              minute: 0,
            })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="once">Once</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.type === "hourly" && (
        <div>
          <Label>At minute</Label>
          <Input
            type="number"
            min={0}
            max={59}
            value={value.minute ?? 0}
            onChange={(e) => update({ minute: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
      )}

      {(value.type === "daily" ||
        value.type === "weekly" ||
        value.type === "monthly") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Hour</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={value.hour ?? 0}
              onChange={(e) => update({ hour: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Minute</Label>
            <Input
              type="number"
              min={0}
              max={59}
              value={value.minute ?? 0}
              onChange={(e) => update({ minute: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {value.type === "weekly" && (
        <div>
          <Label>Day of week</Label>
          <Select
            value={String(value.dayOfWeek ?? 0)}
            onValueChange={(v) => update({ dayOfWeek: Number(v) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, i) => (
                <SelectItem key={day} value={String(i)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.type === "monthly" && (
        <div>
          <Label>Day of month</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? 1}
            onChange={(e) => update({ dayOfMonth: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
      )}

      {value.type === "once" && (
        <div>
          <Label>Date and time</Label>
          <Input
            type="datetime-local"
            value={
              value.exactDate
                ? new Date(value.exactDate).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) =>
              update({ exactDate: new Date(e.target.value).getTime() })
            }
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
