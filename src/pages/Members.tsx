import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddMemberDialog, MemberFormValues } from "@/components/members/AddMemberDialog";
import { MemberPayments } from "@/components/members/MemberPayments";
import { Member } from "@/components/members/member-data";
import { useAddMember, useMembersQuery, usePlanFeesQuery, useUpdatePayment } from "@/components/members/use-members";
import { Payment, PlanFees, currentPayment, formatPeriod } from "@/components/members/payments";
import { toast } from "@/hooks/use-toast";

const buildColumns = (planFees: PlanFees): Column<Member>[] => [
  {
    key: "membershipId",
    label: "Member ID",
    render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.membershipId}</span>,
  },
  {
    key: "name",
    label: "Member",
    render: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    ),
  },
  { key: "phone", label: "Phone" },
  { key: "plan", label: "Plan" },
  {
    key: "paymentMethod",
    label: "Payment",
    render: (row) => {
      const payment = currentPayment(row, planFees);
      return (
        <div>
          <p className="text-foreground">{row.paymentMethod}</p>
          <p className="text-xs text-muted-foreground">
            {formatPeriod(payment.period)} · {payment.verified ? "Verified" : "Unverified"}
          </p>
        </div>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  { key: "joined", label: "Joined" },
];

const MemberProfile = ({
  member,
  planFees,
  onUpdatePayment,
}: {
  member: Member;
  planFees: PlanFees;
  onUpdatePayment: (period: string, patch: Partial<Payment>) => void;
}) => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
        {member.name.split(" ").map((n) => n[0]).join("")}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
        <p className="text-sm text-muted-foreground">{member.email}</p>
        <p className="text-xs font-mono text-muted-foreground">{member.membershipId}</p>
        <StatusBadge status={member.status} />
      </div>
    </div>
    <Tabs defaultValue="overview">
      <TabsList className="bg-secondary">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="progress">Progress</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Membership ID</p>
            <p className="text-sm font-medium text-foreground font-mono">{member.membershipId}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">NIC</p>
            <p className="text-sm font-medium text-foreground font-mono">{member.nic}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="text-sm font-medium text-foreground">{member.plan}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Payment Method</p>
            <p className="text-sm font-medium text-foreground">{member.paymentMethod}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-sm font-medium text-foreground">{member.joined}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium text-foreground">{member.phone}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit Member</Button>
          <Button variant="destructive" size="sm">Suspend</Button>
        </div>
      </TabsContent>
      <TabsContent value="payments" className="mt-4">
        <MemberPayments member={member} planFees={planFees} onUpdate={onUpdatePayment} />
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <p className="text-sm text-muted-foreground">Attendance history will appear here.</p>
      </TabsContent>
      <TabsContent value="progress" className="mt-4">
        <p className="text-sm text-muted-foreground">Progress tracking (weight, BMI) will appear here.</p>
      </TabsContent>
    </Tabs>
  </div>
);

const Members = () => {
  const { data: members = [] } = useMembersQuery();
  const { data: planFees } = usePlanFeesQuery();
  const addMember = useAddMember();
  const updatePaymentMutation = useUpdatePayment(planFees);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Looked up rather than stored so payment edits show up in the open profile.
  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  const columns = useMemo(() => buildColumns(planFees ?? {}), [planFees]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.nic.toLowerCase().includes(q) ||
      m.membershipId.toLowerCase().includes(q);
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  // The dashboard links here with ?member=GYM-0001 to open a profile directly.
  const requestedMembershipId = searchParams.get("member");
  useEffect(() => {
    if (!requestedMembershipId) return;
    const match = members.find((m) => m.membershipId === requestedMembershipId);
    if (match) setSelectedMemberId(match.id);
  }, [requestedMembershipId, members]);

  const closeProfile = () => {
    setSelectedMemberId(null);
    if (requestedMembershipId) setSearchParams({}, { replace: true });
  };

  const handleAdd = (values: MemberFormValues) => {
    addMember.mutate(values, {
      onSuccess: (member) => {
        setAddOpen(false);
        toast({ title: "Member added", description: `${member.name} · ${member.membershipId}` });
      },
      onError: () => {
        toast({ title: "Could not add member", description: "Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Members"
        description={`${members.length} total members`}
        action={{ label: "Add Member", icon: UserPlus, onClick: () => setAddOpen(true) }}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members, NIC or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "expired"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedMember} onOpenChange={closeProfile}>
        <DataTable columns={columns} data={filtered} onRowClick={(member) => setSelectedMemberId(member.id)} />
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Member Profile</DialogTitle>
          </DialogHeader>
          {selectedMember && planFees && (
            <MemberProfile
              member={selectedMember}
              planFees={planFees}
              onUpdatePayment={(period, patch) =>
                updatePaymentMutation.mutate({ memberId: selectedMember.id, period, patch })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
    </DashboardLayout>
  );
};

export default Members;
