import { Users, Dumbbell, Package, UserCheck, TrendingUp, TrendingDown, Activity, AlertTriangle, UserPlus, Wrench, ShieldAlert } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UnverifiedPaymentsCard } from "@/components/members/UnverifiedPaymentsCard";
import { TodaySessionsCard } from "@/components/classes/TodaySessionsCard";
import { useMembersQuery, usePlanFeesQuery } from "@/components/members/use-members";
import { currentMonthLabel, formatAmount, sumAmounts, unverifiedThisMonth } from "@/components/members/payments";
import { useEquipmentQuery } from "@/components/equipment/use-equipment";
import { useInventoryQuery } from "@/components/inventory/use-inventory";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const membershipData = [
  { month: "Jan", members: 120 }, { month: "Feb", members: 145 }, { month: "Mar", members: 162 },
  { month: "Apr", members: 180 }, { month: "May", members: 210 }, { month: "Jun", members: 248 },
];

const attendanceData = [
  { day: "Mon", checkins: 85 }, { day: "Tue", checkins: 92 }, { day: "Wed", checkins: 78 },
  { day: "Thu", checkins: 96 }, { day: "Fri", checkins: 110 }, { day: "Sat", checkins: 130 },
  { day: "Sun", checkins: 65 },
];

const activityFeed = [
  { icon: UserPlus, text: "Sarah Connor joined as a new member", time: "5 min ago", color: "text-success" },
  { icon: Wrench, text: "Treadmill #3 marked for maintenance", time: "1 hour ago", color: "text-warning" },
  { icon: Package, text: "Protein powder restocked (+50 units)", time: "2 hours ago", color: "text-info" },
  { icon: AlertTriangle, text: "Yoga mats stock critically low", time: "3 hours ago", color: "text-destructive" },
  { icon: UserCheck, text: "12 members checked in today", time: "4 hours ago", color: "text-primary" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Index = () => {
  const { data: members = [] } = useMembersQuery();
  const { data: planFees } = usePlanFeesQuery();
  const { data: equipment = [] } = useEquipmentQuery();
  const { data: inventory = [] } = useInventoryQuery();
  const unverified = planFees ? unverifiedThisMonth(members, planFees) : [];

  const workingEquipment = equipment.filter((e) => e.status === "working").length;
  const equipmentNeedingAttention = equipment.length - workingEquipment;
  const lowInventoryCount = inventory.filter((i) => i.status === "low" || i.status === "critical").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Admin. Here's your gym overview.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard title="Total Members" value="248" change="+12% from last month" changeType="positive" icon={Users} />
          <KpiCard title="Active Members" value="210" change="84.7% active rate" changeType="positive" icon={UserCheck} />
          <KpiCard
            title="Unverified Payments"
            value={unverified.length}
            change={
              unverified.length
                ? `${formatAmount(sumAmounts(unverified))} · ${currentMonthLabel()}`
                : `All verified · ${currentMonthLabel()}`
            }
            changeType={unverified.length ? "negative" : "positive"}
            icon={ShieldAlert}
            iconColor={unverified.length ? "bg-warning/10" : undefined}
          />
          <KpiCard
            title="Equipment Status"
            value={`${workingEquipment}/${equipment.length}`}
            change={equipmentNeedingAttention > 0 ? `${equipmentNeedingAttention} needs attention` : "All working"}
            changeType={equipmentNeedingAttention > 0 ? "negative" : "positive"}
            icon={Dumbbell}
            iconColor={equipmentNeedingAttention > 0 ? "bg-warning/10" : undefined}
          />
          <KpiCard
            title="Low Inventory"
            value={lowInventoryCount}
            change={lowInventoryCount > 0 ? "Items need restocking" : "All stocked"}
            changeType={lowInventoryCount > 0 ? "negative" : "positive"}
            icon={Package}
            iconColor={lowInventoryCount > 0 ? "bg-destructive/10" : undefined}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Membership Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={membershipData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="members" stroke="hsl(0, 74%, 50%)" strokeWidth={2} dot={{ fill: "hsl(0, 74%, 50%)", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Daily Attendance</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="checkins" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payments to verify, today's Muay Thai sessions, activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {planFees && <UnverifiedPaymentsCard members={members} planFees={planFees} />}

          <TodaySessionsCard />

          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3 animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
