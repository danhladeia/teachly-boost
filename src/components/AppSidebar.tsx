import {
  LayoutDashboard, BookOpen, FileText, Presentation, Gamepad2,
  FileCheck, Stamp, Settings, LogOut, CreditCard, StickyNote, MessageSquare, Library, GitBranch,
  Coins, FolderOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Biblioteca", url: "/app/biblioteca", icon: Library },
  { title: "Planejador BNCC", url: "/app/bncc", icon: BookOpen },
  { title: "Atividades A4", url: "/app/atividades", icon: FileText },
  { title: "Gerador de Slides", url: "/app/slides", icon: Presentation },
  { title: "Fábrica de Jogos", url: "/app/jogos", icon: Gamepad2 },
  { title: "Gerador de Diagramas", url: "/app/diagramas", icon: GitBranch },
  { title: "Provas e Correção", url: "/app/provas", icon: FileCheck },
  { title: "Bloco de Notas", url: "/app/notas", icon: StickyNote },
  { title: "Suporte", url: "/app/suporte", icon: MessageSquare },
  { title: "Planos", url: "/app/planos", icon: CreditCard },
  { title: "Timbres e Branding", url: "/app/timbres", icon: Stamp },
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
];

function SidebarCreditsWidget() {
  const { plan, planLimits } = useCredits();
  const { docCount, docLimit } = useDocumentLimits();
  const isUnlimited = plan.planType === "ultra";

  return (
    <div className="px-3 py-2 space-y-1.5 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
      <p className="text-[10px] font-semibold text-sidebar-foreground/60 uppercase tracking-wider">Consumo</p>
      {isUnlimited ? (
        <p className="text-[10px] text-sidebar-foreground/80 flex items-center gap-1">∞ Uso Ilimitado Liberado</p>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/80">
            <Coins className="h-3 w-3 text-primary shrink-0" />
            <span>Criação: {plan.creditsGeneral}/{planLimits.maxGeneral}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/80">
            <FileCheck className="h-3 w-3 text-destructive shrink-0" />
            <span>Correções: {plan.creditsExams}/{planLimits.maxExams}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/80">
            <FolderOpen className="h-3 w-3 text-plan-pratico shrink-0" />
            <span>Docs: {docCount}/{docLimit}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
        <img src={logoGoPedagoX} alt="GoPedagoX" className="h-4 w-4 sm:h-8 sm:w-8 shrink-0 object-contain" />
        <span className="font-display text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          GoPedagoX
        </span>
      </div>
      <SidebarContent className="pt-2 flex flex-col">
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/app"} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium" onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sair" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarCreditsWidget />
      </SidebarContent>
    </Sidebar>
  );
}
