import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import logoHeader from "@/assets/logo-gopedagox-header.png";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-3 border-b px-4 bg-background">
            <SidebarTrigger className="sm:inline-flex">
              <Menu className="h-6 w-6 sm:h-5 sm:w-5 text-primary" />
            </SidebarTrigger>
            <img src={logoHeader} alt="GoPedagoX" className="h-5 w-auto opacity-60" />
          </header>
          <div className="flex-1 p-3 sm:p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
