import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { CheckInCombobox } from "@/components/attendance/CheckInCombobox";
import {
  AttendanceRecord,
  DAY_LABELS,
  HEAT_LEGEND,
  buildHeatmapRows,
  busiestCount,
  formatDuration,
  formatTime,
  heatColor,
} from "@/components/attendance/attendance-data";
import { useAttendanceHeatmapQuery, useCheckIn, useCheckOut, useTodayAttendanceQuery } from "@/components/attendance/use-attendance";
import { Member } from "@/components/members/member-data";
import { ApiError } from "@/lib/api-client";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Attendance = () => {
  const { data: records = [] } = useTodayAttendanceQuery();
  const { data: heatmapCells = [] } = useAttendanceHeatmapQuery();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const inGym = records.filter((r) => !r.checkOut).length;
  const heatmapRows = buildHeatmapRows(heatmapCells);
  const busiest = busiestCount(heatmapRows);

  const handleCheckIn = () => {
    if (!selectedMember) return;

    checkIn.mutate(selectedMember.id, {
      onSuccess: (record) => {
        toast.success(`${record.memberName} checked in at ${formatTime(record.checkIn)}`);
        setSelectedMember(null);
      },
      onError: (err) => {
        // A 409 means they're already in the gym — the server's message names them.
        toast.error(err instanceof ApiError && err.status === 409 ? err.message : "Could not check the member in.");
      },
    });
  };

  const handleCheckOut = (record: AttendanceRecord) => {
    checkOut.mutate(record.id, {
      onSuccess: (updated) => toast.success(`${updated.memberName} checked out · ${formatDuration(updated)}`),
      onError: (err) => {
        toast.error(err instanceof ApiError && err.status === 409 ? err.message : "Could not check the member out.");
      },
    });
  };

  const attendanceCols: Column<AttendanceRecord>[] = [
    {
      key: "memberName",
      label: "Member",
      render: (row) => (
        <div>
          <span className="font-medium text-foreground">{row.memberName}</span>
          {row.membershipId && <span className="ml-2 text-xs text-muted-foreground">{row.membershipId}</span>}
        </div>
      ),
    },
    { key: "checkIn", label: "Check In", render: (row) => formatTime(row.checkIn) },
    { key: "checkOut", label: "Check Out", render: (row) => formatTime(row.checkOut) },
    {
      key: "duration",
      label: "Duration",
      render: (row) => (
        <span className={row.checkOut ? "text-foreground" : "text-success font-medium"}>{formatDuration(row)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) =>
        row.checkOut ? null : (
          <Button
            variant="outline"
            size="sm"
            disabled={checkOut.isPending}
            onClick={(e) => {
              e.stopPropagation();
              handleCheckOut(row);
            }}
          >
            Check Out
          </Button>
        ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Attendance"
        description={`${records.length} check-ins today · ${inGym} in the gym now`}
      />

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
              <CheckInCombobox value={selectedMember} onChange={setSelectedMember} disabled={checkIn.isPending} />
              <Button onClick={handleCheckIn} disabled={!selectedMember || checkIn.isPending}>
                Check In
              </Button>
            </div>
          </div>

          <DataTable columns={attendanceCols} data={records} />
        </TabsContent>

        <TabsContent value="heatmap">
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Peak Hour Heatmap</h3>
            {heatmapRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins recorded in the last eight weeks.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-8 gap-1 mb-1">
                      <div />
                      {DAY_LABELS.map((d) => (
                        <div key={d} className="text-center text-xs text-muted-foreground font-medium">{d}</div>
                      ))}
                    </div>
                    {heatmapRows.map((row) => (
                      <div key={row.hour} className="grid grid-cols-8 gap-1 mb-1">
                        <div className="text-xs text-muted-foreground flex items-center">{row.label}</div>
                        {row.counts.map((count, day) => (
                          <div
                            key={day}
                            className={`h-8 rounded-sm ${heatColor(count, busiest)} flex items-center justify-center text-xs font-medium text-foreground`}
                            title={`${count} check-ins`}
                          >
                            {count > 0 && count}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-muted-foreground">Less</span>
                  {HEAT_LEGEND.map((c) => (
                    <div key={c} className={`h-4 w-4 rounded-sm ${c}`} />
                  ))}
                  <span className="text-xs text-muted-foreground">More</span>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Attendance;
