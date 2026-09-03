import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExportReport, useReportsSummaryQuery } from "@/components/reports/use-reports";
import { ExportKind, categoryShare, colorForSlice } from "@/components/reports/reports-data";
import { toast } from "sonner";
import {
  LineChart, Line, ComposedChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const EXPORTS: { kind: ExportKind; label: string }[] = [
  { kind: "members", label: "Export Members" },
  { kind: "attendance", label: "Export Attendance" },
  { kind: "equipment", label: "Export Equipment" },
];

const axisTick = { fill: "hsl(215, 14%, 50%)", fontSize: 12 };

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string; color?: string }[];
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { data: summary, isLoading } = useReportsSummaryQuery();
  const exportReport = useExportReport();

  const memberTrend = summary?.memberTrend ?? [];
  const attendanceTrend = summary?.attendanceTrend ?? [];
  const equipmentByCategory = summary?.equipmentByCategory ?? [];

  const handleExport = (kind: ExportKind, label: string) => {
    exportReport.mutate(kind, {
      onSuccess: () => toast.success(`${label.replace("Export ", "")} exported as CSV`),
      onError: () => toast.error(`Could not export ${kind}. Please try again.`),
    });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Reports & Analytics" description="Insights into gym performance" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {EXPORTS.map(({ kind, label }) => (
          <Button
            key={kind}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={exportReport.isPending}
            onClick={() => handleExport(kind, label)}
          >
            <Download className="h-4 w-4" /> {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Membership Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={memberTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="new" name="New Members" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="total" name="Total Members" stroke="hsl(0, 74%, 50%)" strokeWidth={2} dot={{ fill: "hsl(0, 74%, 50%)", r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
              <XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="avg" name="Avg Daily" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: "hsl(217, 91%, 60%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Equipment by Category</h3>
          {equipmentByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isLoading ? "Loading…" : "No equipment recorded yet."}</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={250} className="max-w-xs">
                <PieChart>
                  <Pie data={equipmentByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {equipmentByCategory.map((_, i) => <Cell key={i} fill={colorForSlice(i)} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {equipmentByCategory.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorForSlice(i) }} />
                    <span className="text-sm text-foreground">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.value} · {categoryShare(item.value, equipmentByCategory)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
