import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { AddClassDialog, ClassFormValues, DAYS } from "@/components/classes/AddClassDialog";
import { useAddClass, useClassesQuery, useCompleteSession, useSessionsQuery } from "@/components/classes/use-classes";
import { ClassSession, TrainingClass, fmt, levelStyles } from "@/components/classes/class-data";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Activity, CalendarClock, Users, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const HOURS = ["06:00", "07:00", "08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"];

const Classes = () => {
  const { data: classes = [] } = useClassesQuery();
  const { data: sessions = [] } = useSessionsQuery();
  const addClass = useAddClass();
  const completeSessionMutation = useCompleteSession();
  const [open, setOpen] = useState(false);

  const weeklyHours = useMemo(
    () => (classes.reduce((s, c) => s + c.durationMin, 0) / 60).toFixed(1),
    [classes]
  );
  const totalBooked = classes.reduce((s, c) => s + c.booked, 0);
  const totalCapacity = classes.reduce((s, c) => s + c.capacity, 0);
  const fillRate = totalCapacity ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  const handleAdd = (values: ClassFormValues) => {
    addClass.mutate(values, {
      onSuccess: () => {
        toast.success(`${values.title} (${values.discipline}) scheduled on ${values.day} at ${fmt(values.startTime)}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          const conflict = err.details as TrainingClass | undefined;
          toast.error(
            conflict
              ? `Time conflict with "${conflict.title}" in ${conflict.ring} on ${conflict.day}`
              : "This time slot overlaps an existing class in the same ring.",
          );
          return;
        }
        toast.error("Could not schedule the class. Please try again.");
      },
    });
  };

  const handleComplete = (id: string) => {
    completeSessionMutation.mutate(id, {
      onSuccess: () => toast.success("Session marked as completed"),
      onError: () => toast.error("Could not mark the session complete."),
    });
  };

  const sessionCols: Column<ClassSession>[] = [
    { key: "date", label: "Date" },
    { key: "title", label: "Class", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
    { key: "discipline", label: "Discipline" },
    { key: "coach", label: "Coach" },
    { key: "attended", label: "Attendance", render: (r) => `${r.attended}/${r.capacity}` },
    { key: "rounds", label: "Rounds" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            r.status === "Completed" && "status-active",
            r.status === "Scheduled" && "bg-info/15 text-info",
            r.status === "Cancelled" && "status-critical"
          )}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) =>
        r.status === "Scheduled" ? (
          <Button size="sm" variant="outline" onClick={() => handleComplete(r.id)}>
            Mark complete
          </Button>
        ) : null,
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Classes"
        description="Session tracking, time blocking and coach scheduling across every discipline"
        action={{ label: "Schedule Class", icon: Plus, onClick: () => setOpen(true) }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Weekly Classes" value={classes.length} change={`${weeklyHours}h of mat time`} changeType="neutral" icon={Activity} />
        <KpiCard title="Booked Spots" value={`${totalBooked}/${totalCapacity}`} change={`${fillRate}% fill rate`} changeType={fillRate >= 75 ? "positive" : "neutral"} icon={Users} iconColor="bg-info/10" />
        <KpiCard title="Sessions Logged" value={sessions.filter((s) => s.status === "Completed").length} change="This week" changeType="positive" icon={CalendarClock} />
        <KpiCard title="Avg Session" value={classes.length ? `${Math.round(classes.reduce((s, c) => s + c.durationMin, 0) / classes.length)}m` : "0m"} change="Per class block" changeType="neutral" icon={Timer} iconColor="bg-warning/10" />
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">Time Blocking</TabsTrigger>
          <TabsTrigger value="sessions">Session Tracking</TabsTrigger>
          <TabsTrigger value="classes">Class List</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <div className="glass-card p-5 overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2">
                <div />
                {DAYS.map((d) => (
                  <div key={d} className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center pb-2">
                    {d}
                  </div>
                ))}
                {HOURS.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="text-xs text-muted-foreground py-3">{fmt(hour)}</div>
                    {DAYS.map((day) => {
                      const block = classes.find((c) => c.day === day && c.startTime.slice(0, 2) === hour.slice(0, 2));
                      return (
                        <div key={`${day}-${hour}`} className="min-h-[56px] rounded-md border border-border/60 bg-secondary/30 p-1">
                          {block && (
                            <div className={cn("h-full rounded-md border px-2 py-1", levelStyles[block.level])}>
                              <p className="text-xs font-semibold truncate">{block.title}</p>
                              <p className="text-[10px] opacity-80 truncate">{block.discipline}</p>
                              <p className="text-[10px] opacity-80 truncate">{block.coach} · {block.durationMin}m</p>
                              <p className="text-[10px] opacity-70 truncate">{block.ring}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <DataTable columns={sessionCols} data={sessions} />
        </TabsContent>

        <TabsContent value="classes">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div key={c.id} className="glass-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">{c.discipline} · {c.coach} · {c.ring}</p>
                  </div>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", levelStyles[c.level])}>{c.level}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.day} · {fmt(c.startTime)} — {c.durationMin} min
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Booked</span>
                    <span className="text-foreground font-medium">{c.booked}/{c.capacity}</span>
                  </div>
                  <Progress value={(c.booked / c.capacity) * 100} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AddClassDialog open={open} onOpenChange={setOpen} onSubmit={handleAdd} />
    </DashboardLayout>
  );
};

export default Classes;
