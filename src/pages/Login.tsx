import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-context";

/** Seeded by the backend's seed script — see server/src/seed/data/users.ts. */
const DEMO_ACCOUNTS = [
  { email: "admin@fitops.lk", password: "admin123", role: "Administrator" },
  { email: "staff@fitops.lk", password: "staff123", role: "Staff" },
];

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = { email: string; password: string };

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Where the guard bounced them from, so a deep link survives signing in.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const ok = await login(values.email, values.password);
      if (!ok) {
        setError("Those credentials do not match any account.");
        return;
      }
      setError(null);
      navigate(from, { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">FitOps</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage your gym.</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <Form {...form}>
            {/* noValidate: the zod messages below replace the browser's native popups. */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="admin@fitops.lk"
                        {...field}
                        className="bg-secondary border-border h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    {/* The wrapper sits outside FormControl so the label still targets the input. */}
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          {...field}
                          className="bg-secondary border-border h-11 pr-11"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-11">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </form>
          </Form>
        </div>

        <div className="glass-card p-4 text-xs text-muted-foreground space-y-1">
          <p className="text-foreground font-medium">Demo accounts</p>
          {DEMO_ACCOUNTS.map((account) => (
            <p key={account.email}>
              <span className="font-mono">{account.email}</span> · <span className="font-mono">{account.password}</span>{" "}
              ({account.role})
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
