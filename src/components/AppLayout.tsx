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
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <header className="flex h-14 items-center gap-3 border-b px-4 bg-background">
            <SidebarTrigger className="relative sm:inline-flex p-2 sm:p-0">
              <Menu className="h-14 w-14 sm:h-5 sm:w-5 text-primary" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary animate-pulse border-2 border-background sm:hidden" />
            </SidebarTrigger>
            <img src={logoHeader} alt="GoPedagoX" className="h-4 sm:h-5 w-auto opacity-50" />
          </header>
          <div className="flex-1 p-3 sm:p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
