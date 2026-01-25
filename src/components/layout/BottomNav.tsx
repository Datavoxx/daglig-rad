import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FolderKanban,
  ClipboardCheck,
  Calculator,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey: string;
}

const navItems: NavItem[] = [
  { label: "Hem", href: "/dashboard", icon: Home, moduleKey: "dashboard" },
  { label: "Projekt", href: "/projects", icon: FolderKanban, moduleKey: "projects" },
  { label: "Kontroller", href: "/inspections", icon: ClipboardCheck, moduleKey: "inspections" },
  { label: "Offert", href: "/estimates", icon: Calculator, moduleKey: "estimates" },
  { label: "Kunder", href: "/customers", icon: Users, moduleKey: "customers" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess } = useUserPermissions();

  // Filter to only show accessible items, max 5 in bottom nav
  const visibleItems = navItems.filter(item => hasAccess(item.moduleKey)).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm safe-bottom md:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg min-w-[56px] touch-target transition-all duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-lg transition-colors duration-150",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-150",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
