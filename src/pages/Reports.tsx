import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const memberTrend = [
  { month: "Oct", new: 18, churned: 5 }, { month: "Nov", new: 22, churned: 8 },
  { month: "Dec", new: 15, churned: 12 }, { month: "Jan", new: 28, churned: 6 },
  { month: "Feb", new: 35, churned: 4 }, { month: "Mar", new: 32, churned: 7 },
];

const attendanceTrend = [
  { week: "W1", avg: 72 }, { week: "W2", avg: 85 }, { week: "W3", avg: 78 },
  { week: "W4", avg: 92 }, { week: "W5", avg: 88 }, { week: "W6", avg: 95 },
];

const equipmentUsage = [
  { name: "Cardio", value: 40 }, { name: "Strength", value: 35 },
  { name: "Free Weights", value: 15 }, { name: "Flexibility", value: 10 },
];

const COLORS = ["hsl(0, 74%, 50%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)", "hsl(280, 65%, 60%)"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  return (
    <DashboardLayout>
      <PageHeader title="Reports & Analytics" description="Insights into gym performance" />

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export Members</Button>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export Attendance</Button>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export Equipment</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Membership Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={memberTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="new" name="New Members" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="churned" name="Churned" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
              <XAxis dataKey="week" tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="avg" name="Avg Daily" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: "hsl(217, 91%, 60%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Equipment Usage by Category</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={250} className="max-w-xs">
              <PieChart>
                <Pie data={equipmentUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {equipmentUsage.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {equipmentUsage.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
