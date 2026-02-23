import {
  LayoutDashboard, BookOpen, FileText, Presentation, Gamepad2,
  FileCheck, Calendar, Stamp, Settings, Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Planejador BNCC", url: "/app/bncc", icon: BookOpen },
  { title: "Atividades A4", url: "/app/atividades", icon: FileText },
  { title: "Gerador de Slides", url: "/app/slides", icon: Presentation },
  { title: "Fábrica de Jogos", url: "/app/jogos", icon: Gamepad2 },
  { title: "Provas e Correção", url: "/app/provas", icon: FileCheck },
  { title: "Sequência Didática", url: "/app/sequencia", icon: Calendar },
  { title: "Timbres e Branding", url: "/app/timbres", icon: Stamp },
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          Pedagox
        </span>
      </div>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/app"} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
