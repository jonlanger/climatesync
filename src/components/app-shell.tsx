"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { WelcomeModal } from "@/components/welcome-modal";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false} className="h-svh overflow-hidden">
        <AppSidebar />
        <SidebarInset className="relative min-h-0 min-w-0 overflow-hidden bg-[color:var(--panel)] text-[color:var(--panel-fg)]">
          <div className="absolute top-3 left-3 z-30 md:hidden">
            <SidebarTrigger className="border border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--panel-fg)] hover:bg-[color:var(--panel-hover)]" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </SidebarInset>
        <WelcomeModal />
      </SidebarProvider>
    </TooltipProvider>
  );
}
