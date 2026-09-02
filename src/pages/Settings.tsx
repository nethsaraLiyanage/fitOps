import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Users2, Globe, Lock } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Manage your gym and account settings" />

      <Tabs defaultValue="gym" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="gym">Gym Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="future">Coming Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="gym">
          <div className="glass-card p-6 max-w-2xl space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Gym Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Gym Name</Label>
                <Input defaultValue="FitZone Gym" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Phone</Label>
                <Input defaultValue="+1 555-0100" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-muted-foreground">Address</Label>
                <Input defaultValue="123 Fitness Avenue, Los Angeles, CA" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Operating Hours</Label>
                <Input defaultValue="5:00 AM - 10:00 PM" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Max Capacity</Label>
                <Input defaultValue="150" type="number" className="bg-secondary border-border" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <div className="glass-card p-6 max-w-2xl space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Admin Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Name</Label>
                <Input defaultValue="Admin User" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input defaultValue="admin@fitzone.com" className="bg-secondary border-border" />
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Change Password</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input type="password" placeholder="Current password" className="bg-secondary border-border" />
                <Input type="password" placeholder="New password" className="bg-secondary border-border" />
              </div>
            </div>
            <Button>Update Account</Button>
          </div>
        </TabsContent>

        <TabsContent value="future">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {[
              { icon: CreditCard, title: "Payments", desc: "Accept payments, manage billing and invoices" },
              { icon: Globe, title: "Multi-Branch", desc: "Manage multiple gym locations from one dashboard" },
              { icon: Users2, title: "Staff & Trainers", desc: "Role-based access for trainers and staff members" },
              { icon: Lock, title: "Subscription Plans", desc: "Create and manage membership pricing tiers" },
            ].map((item) => (
              <div key={item.title} className="glass-card p-5 opacity-60">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                <span className="inline-block mt-3 text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
