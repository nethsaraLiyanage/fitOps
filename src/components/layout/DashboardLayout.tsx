import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsCompactViewport } from "@/hooks/use-compact-viewport";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const compact = useIsCompactViewport();
  const [open, setOpen] = useState(!compact);

  // Collapse when the viewport becomes tablet-sized (including a rotation) and
  // reopen on wider screens. Manual toggles in between are left alone.
  useEffect(() => {
    setOpen(!compact);
  }, [compact]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
