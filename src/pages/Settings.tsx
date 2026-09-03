import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Users2, Globe, Lock } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import {
  AccountValues,
  GymProfileValues,
  PasswordValues,
  accountSchema,
  gymProfileSchema,
  passwordSchema,
} from "@/components/settings/settings-data";
import {
  useGymProfileQuery,
  useUpdateAccount,
  useUpdateGymProfile,
  useUpdatePassword,
} from "@/components/settings/use-settings";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const inputClass = "bg-secondary border-border";

const Settings = () => {
  const { user } = useAuth();
  const { data: gymProfile } = useGymProfileQuery();
  const updateGymProfile = useUpdateGymProfile();
  const updateAccount = useUpdateAccount();
  const updatePassword = useUpdatePassword();

  const gymForm = useForm<GymProfileValues>({
    resolver: zodResolver(gymProfileSchema),
    defaultValues: { name: "", phone: "", address: "", hours: "", maxCapacity: 0 },
  });

  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", email: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  /**
   * Both forms start empty and fill in once their source data arrives, but only
   * while still untouched — a background refetch must not wipe an in-progress edit.
   *
   * Two subtleties, both of which silently break the guard if you skip them:
   * `isDirty` has to be read here in the render body, because react-hook-form's
   * formState is a Proxy that only starts tracking a flag once something reads it;
   * and the form objects go through a ref because useForm returns a new object on
   * every render, so using one as an effect dependency re-runs the reset forever.
   */
  const gymDirty = gymForm.formState.isDirty;
  const accountDirty = accountForm.formState.isDirty;

  const latest = useRef({ gymForm, accountForm, gymDirty, accountDirty });
  latest.current = { gymForm, accountForm, gymDirty, accountDirty };

  useEffect(() => {
    if (gymProfile && !latest.current.gymDirty) latest.current.gymForm.reset(gymProfile);
  }, [gymProfile]);

  useEffect(() => {
    if (user && !latest.current.accountDirty) {
      latest.current.accountForm.reset({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleGymSubmit = (values: GymProfileValues) => {
    updateGymProfile.mutate(values, {
      // Resetting to the saved values marks the form pristine again, so it can
      // pick up later server-side changes.
      onSuccess: (saved) => {
        gymForm.reset(saved);
        toast.success("Gym profile saved");
      },
      onError: () => toast.error("Could not save the gym profile. Please try again."),
    });
  };

  const handleAccountSubmit = (values: AccountValues) => {
    updateAccount.mutate(values, {
      onSuccess: (saved) => {
        accountForm.reset({ name: saved.name, email: saved.email });
        toast.success("Account updated");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError && err.status === 409 ? err.message : "Could not update your account.");
      },
    });
  };

  const handlePasswordSubmit = (values: PasswordValues) => {
    updatePassword.mutate(values, {
      onSuccess: () => {
        toast.success("Password updated");
        passwordForm.reset({ currentPassword: "", newPassword: "" });
      },
      onError: (err) => {
        // The server explains a wrong current password or a reused one; anything else is generic.
        toast.error(err instanceof ApiError && err.status === 400 ? err.message : "Could not update your password.");
      },
    });
  };

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
            <Form {...gymForm}>
              <form onSubmit={gymForm.handleSubmit(handleGymSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={gymForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Gym Name</FormLabel>
                        <FormControl><Input {...field} className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gymForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Phone</FormLabel>
                        <FormControl><Input {...field} className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gymForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-muted-foreground">Address</FormLabel>
                        <FormControl><Input {...field} className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gymForm.control}
                    name="hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Operating Hours</FormLabel>
                        <FormControl><Input {...field} className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gymForm.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Max Capacity</FormLabel>
                        <FormControl><Input {...field} type="number" className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={updateGymProfile.isPending}>
                  {updateGymProfile.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <div className="glass-card p-6 max-w-2xl space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Admin Account</h3>

            <Form {...accountForm}>
              <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Name</FormLabel>
                        <FormControl><Input {...field} className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Email</FormLabel>
                        <FormControl><Input {...field} type="email" className={inputClass} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={updateAccount.isPending}>
                  {updateAccount.isPending ? "Saving…" : "Save Account"}
                </Button>
              </form>
            </Form>

            <Separator className="bg-border" />

            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Change Password</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Current password" className={inputClass} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} type="password" placeholder="New password" className={inputClass} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button type="submit" variant="outline" disabled={updatePassword.isPending}>
                  {updatePassword.isPending ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </Form>
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
