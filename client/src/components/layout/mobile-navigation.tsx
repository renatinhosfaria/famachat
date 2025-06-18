import { Link, useLocation } from "wouter";
import { LucideLayoutDashboard, LucideFileBarChart, LucideCalendar, LucideHome, LucideUserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LucideLayoutDashboard,
    },
    {
      name: "Leads",
      href: "/leads",
      icon: LucideUserPlus,
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
  ];

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-20">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center",
              location === item.href ? "text-primary" : "text-gray-500"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
