"use client";

import { useTransition } from "react";
import type { AttendanceStatus } from "@prisma/client";
import { toast } from "sonner";
import { updateEventAttendance } from "@/actions/events";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AttendancePanelProps = {
  eventId: string;
  attendances: Array<{
    id: string;
    userId: string;
    status: AttendanceStatus;
    user: {
      profile: { name: string; instrument: string | null } | null;
      email: string;
    };
  }>;
};

const attendanceOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "ATTENDING", label: "Asiste" },
  { value: "NOT_ATTENDING", label: "No asiste" },
  { value: "PENDING", label: "Pendiente" },
];

export function AttendancePanel({ eventId, attendances }: AttendancePanelProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(userId: string, status: AttendanceStatus) {
    startTransition(async () => {
      const result = await updateEventAttendance({ eventId, userId, status });
      if (!("success" in result) || !result.success) {
        toast.error("error" in result ? result.error : "Error al actualizar");
        return;
      }
      toast.success("Asistencia actualizada");
    });
  }

  if (attendances.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay registros de asistencia para este evento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {attendances.map((attendance) => {
        const name = attendance.user.profile?.name ?? attendance.user.email;
        return (
          <div
            key={attendance.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{name}</p>
              {attendance.user.profile?.instrument && (
                <p className="text-xs text-muted-foreground">
                  {attendance.user.profile.instrument}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge kind="attendance" status={attendance.status} />
              <Select
                value={attendance.status}
                onValueChange={(value) =>
                  handleChange(attendance.userId, value as AttendanceStatus)
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attendanceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}