import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard as LucideLayoutDashboard,
  FileBarChart as LucideFileBarChart, 
  Calendar as LucideCalendar, 
  Users as LucideUsers,
  Settings as LucideSettings,
  UserCog as LucideUserCog,
  MessageSquare as LucideMessageSquare,
  MessageCircle as LucideMessageCircle,
  Facebook as LucideFacebook,
  Home as LucideHome,
  UserPlus as LucideUserPlus,
  LogOut as LucideLogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Department, Role } from "@shared/schema";
import { getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  className?: string;
  collapsed?: boolean;
};

export default function Sidebar({ className, collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const { currentUser, logout } = useAuth();
  
  // Função para obter os itens de navegação baseados no departamento
  const getNavItemsByDepartment = () => {
    const department = currentUser?.department;
    
    // Itens compartilhados (shared) - disponíveis para todos
    const sharedItems = [
      {
        name: "Agenda",
        href: "/agenda",
        icon: LucideCalendar,
      },
      {
        name: "Imóveis",
        href: "/imoveis",
        icon: LucideHome,
      },
    ];

    switch (department) {
      case 'Gestão':
        return [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LucideLayoutDashboard,
          },
          {
            name: "Clientes",
            href: "/clientes",
            icon: LucideUsers,
          },
          {
            name: "Imóveis",
            href: "/imoveis",
            icon: LucideHome,
          },
          {
            name: "Agenda",
            href: "/agenda",
            icon: LucideCalendar,
          },
          {
            name: "Metas",
            href: "/metas",
            icon: LucideFileBarChart,
          },
          {
            name: "Leads",
            href: "/leads",
            icon: LucideUserPlus,
          },
          {
            name: "Usuários",
            href: "/admin/usuarios",
            icon: LucideUserCog,
          },
          {
            name: "WhatsApp",
            href: "/admin/whatsapp",
            icon: LucideMessageSquare,
          },
          {
            name: "Facebook",
            href: "/admin/facebook",
            icon: LucideFacebook,
          },
          {
            name: "Webhook",
            href: "/webhook",
            icon: LucideSettings,
          }
        ];
      
      case 'Central de Atendimento':
        return [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LucideLayoutDashboard,
          },
          {
            name: "Clientes",
            href: "/clientes",
            icon: LucideUsers,
          },
          ...sharedItems
        ];
      
      case 'Vendas':
        return [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LucideLayoutDashboard,
          },
          {
            name: "Clientes",
            href: "/clientes",
            icon: LucideUsers,
          },
          ...sharedItems
        ];
      
      case 'Marketing':
        return [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LucideLayoutDashboard,
          },
          ...sharedItems
        ];
      
      default:
        return [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LucideLayoutDashboard,
          },
          ...sharedItems
        ];
    }
  };

  const navItems = getNavItemsByDepartment();

  // Tradução do cargo baseado no papel do usuário
  const getRoleDisplay = (role: string) => {
    switch(role) {
      case "Gestor": return "Gestor";
      case "Marketing": return "Marketing";
      case "Consultor de Atendimento": return "Consultor de Atendimento";
      case "Corretor": return "Corretor";
      default: return role;
    }
  };
  


  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Logo e título */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <span className="font-semibold text-lg">Sistema</span>}
        </div>
        
      {/* Menu de navegação */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                            location === item.href
                              ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
                        </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Informações do usuário */}
      {!collapsed && currentUser && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {getInitials(currentUser.fullName)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{currentUser.username}</p>
                <p className="text-xs text-gray-500">{getRoleDisplay(currentUser.role)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="ml-2"
              title="Sair"
            >
              <LucideLogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
