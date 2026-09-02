import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { UserCheck, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const todayAttendance = [
  { id: 1, name: "Sarah Connor", checkIn: "06:30 AM", checkOut: "08:15 AM", duration: "1h 45m" },
  { id: 2, name: "John Doe", checkIn: "07:00 AM", checkOut: "08:30 AM", duration: "1h 30m" },
  { id: 3, name: "Emily Chen", checkIn: "07:15 AM", checkOut: "—", duration: "In gym" },
  { id: 4, name: "Alex Rivera", checkIn: "08:00 AM", checkOut: "—", duration: "In gym" },
  { id: 5, name: "David Kim", checkIn: "09:00 AM", checkOut: "10:45 AM", duration: "1h 45m" },
  { id: 6, name: "Rachel Green", checkIn: "10:30 AM", checkOut: "—", duration: "In gym" },
];

const attendanceCols: Column<typeof todayAttendance[0]>[] = [
  { key: "name", label: "Member", render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
  { key: "checkIn", label: "Check In" },
  { key: "checkOut", label: "Check Out" },
  {
    key: "duration",
    label: "Duration",
    render: (row) => (
      <span className={row.duration === "In gym" ? "text-success font-medium" : "text-foreground"}>
        {row.duration}
      </span>
    ),
  },
];

const heatmapData = [
  { hour: "5AM", mon: 2, tue: 3, wed: 1, thu: 2, fri: 4, sat: 1, sun: 0 },
  { hour: "6AM", mon: 8, tue: 7, wed: 9, thu: 6, fri: 8, sat: 5, sun: 2 },
  { hour: "7AM", mon: 15, tue: 12, wed: 14, thu: 13, fri: 16, sat: 10, sun: 4 },
  { hour: "8AM", mon: 12, tue: 14, wed: 11, thu: 15, fri: 13, sat: 18, sun: 6 },
  { hour: "9AM", mon: 8, tue: 9, wed: 7, thu: 10, fri: 8, sat: 20, sun: 8 },
  { hour: "10AM", mon: 6, tue: 5, wed: 7, thu: 6, fri: 5, sat: 15, sun: 10 },
  { hour: "11AM", mon: 5, tue: 4, wed: 5, thu: 4, fri: 6, sat: 12, sun: 8 },
  { hour: "12PM", mon: 10, tue: 11, wed: 9, thu: 12, fri: 10, sat: 8, sun: 5 },
  { hour: "1PM", mon: 8, tue: 7, wed: 8, thu: 9, fri: 7, sat: 6, sun: 3 },
  { hour: "5PM", mon: 18, tue: 16, wed: 19, thu: 17, fri: 20, sat: 8, sun: 2 },
  { hour: "6PM", mon: 22, tue: 20, wed: 21, thu: 23, fri: 18, sat: 6, sun: 1 },
  { hour: "7PM", mon: 15, tue: 17, wed: 14, thu: 16, fri: 12, sat: 4, sun: 1 },
  { hour: "8PM", mon: 8, tue: 10, wed: 9, thu: 8, fri: 6, sat: 2, sun: 0 },
];

const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getHeatColor(val: number) {
  if (val === 0) return "bg-secondary";
  if (val <= 5) return "bg-primary/20";
  if (val <= 10) return "bg-primary/40";
  if (val <= 15) return "bg-primary/60";
  if (val <= 20) return "bg-primary/80";
  return "bg-primary";
}

const Attendance = () => {
  const [quickCheckIn, setQuickCheckIn] = useState("");

  const handleCheckIn = () => {
    if (quickCheckIn.trim()) {
      toast.success(`${quickCheckIn} checked in successfully`);
      setQuickCheckIn("");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Attendance" description="Track daily gym attendance" />

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="heatmap">Peak Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {/* Quick Check-in */}
          <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-primary">
              <UserCheck className="h-5 w-5" />
              <span className="text-sm font-medium text-foreground">Quick Check-in</span>
            </div>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Enter member name or ID..."
                value={quickCheckIn}
                onChange={(e) => setQuickCheckIn(e.target.value)}
                className="bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
              />
              <Button onClick={handleCheckIn}>Check In</Button>
            </div>
          </div>

          <DataTable columns={attendanceCols} data={todayAttendance} />
        </TabsContent>

        <TabsContent value="heatmap">
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Peak Hour Heatmap</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-8 gap-1 mb-1">
                  <div />
                  {dayLabels.map((d) => (
                    <div key={d} className="text-center text-xs text-muted-foreground font-medium">{d}</div>
                  ))}
                </div>
                {heatmapData.map((row) => (
                  <div key={row.hour} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="text-xs text-muted-foreground flex items-center">{row.hour}</div>
                    {days.map((day) => (
                      <div
                        key={day}
                        className={`h-8 rounded-sm ${getHeatColor(row[day])} flex items-center justify-center text-xs font-medium text-foreground`}
                        title={`${row[day]} check-ins`}
                      >
                        {row[day] > 0 && row[day]}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Less</span>
              {["bg-secondary", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80", "bg-primary"].map((c) => (
                <div key={c} className={`h-4 w-4 rounded-sm ${c}`} />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Attendance;
