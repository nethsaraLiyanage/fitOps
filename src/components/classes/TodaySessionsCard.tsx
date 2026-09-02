import { useNavigate } from "react-router-dom";
import { Activity, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClassesQuery, useSessionsQuery } from "./use-classes";
import { fmt, levelStyles, sessionsToday, statusStyles } from "./class-data";

const MAX_ROWS = 4;

/** Compact dashboard card: what is on the schedule across all disciplines today. */
export function TodaySessionsCard() {
  const { data: classes = [] } = useClassesQuery();
  const { data: sessions = [] } = useSessionsQuery();
  const navigate = useNavigate();

  const today = sessionsToday(classes, sessions);
  const shown = today.slice(0, MAX_ROWS);
  const booked = today.reduce((total, s) => total + s.booked, 0);
  const capacity = today.reduce((total, s) => total + s.capacity, 0);
  const dayLabel = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="glass-card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Today's Classes</h3>
            <p className="text-xs text-muted-foreground">{dayLabel}</p>
          </div>
        </div>
        {today.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {today.length} {today.length === 1 ? "session" : "sessions"}
            <br />
            <span className="text-foreground font-medium">
              {booked}/{capacity} booked
            </span>
          </p>
        )}
      </div>

      {today.length === 0 ? (
        <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
          <CalendarX className="h-5 w-5" />
          No classes on the schedule today.
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {shown.map((session) => (
            <div key={session.key} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2">
              <div className="w-16 shrink-0">
                <p className="text-xs font-medium text-foreground">
                  {session.startTime ? fmt(session.startTime) : "—"}
                </p>
                {session.durationMin && <p className="text-[10px] text-muted-foreground">{session.durationMin} min</p>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{session.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.discipline} · {session.coach}
                  {session.ring ? ` · ${session.ring}` : ""} · {session.booked}/{session.capacity}
                </p>
              </div>
              {session.level && (
                <span
                  className={cn(
                    "hidden sm:inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0",
                    levelStyles[session.level],
                  )}
                >
                  {session.level}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                  statusStyles[session.status],
                )}
              >
                {session.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/classes")}
        className="mt-4 text-xs text-primary hover:underline text-left"
      >
        {today.length > MAX_ROWS ? `+${today.length - MAX_ROWS} more · view schedule` : "View full schedule"}
      </button>
    </div>
  );
}
