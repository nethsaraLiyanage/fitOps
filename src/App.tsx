import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Login from "./pages/Login.tsx";
import Index from "./pages/Index.tsx";
import Members from "./pages/Members.tsx";
import Equipment from "./pages/Equipment.tsx";
import Inventory from "./pages/Inventory.tsx";
import Attendance from "./pages/Attendance.tsx";
import Reports from "./pages/Reports.tsx";
import Classes from "./pages/Classes.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/equipment" element={<Equipment />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/classes" element={<Classes />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
