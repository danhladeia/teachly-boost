import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import logoHeader from "@/assets/logo-gopedagox-header.png";
import NotificationBell from "@/components/NotificationBell";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden max-w-full">
          <header className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4 bg-sidebar">
            <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
            <div className="h-6 w-px bg-sidebar-border" />
            <img src={logoHeader} alt="GoPedagoX" className="h-3 sm:h-3.5 w-auto opacity-70" />
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>
          <div className="flex-1 p-3 sm:p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
