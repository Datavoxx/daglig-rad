import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  Search,
  Bell,
  CalendarDays,
  ClipboardCheck,
  Calculator,
  Users,
  BookOpen,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RouteTransition } from "./RouteTransition";
import byggioLogo from "@/assets/byggio-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey: string;
}

const navItems: NavItem[] = [
  { label: "Projekt", href: "/projects", icon: FolderKanban, moduleKey: "projects" },
  { label: "Dagrapporter", href: "/reports", icon: FileText, moduleKey: "reports" },
  { label: "Planering", href: "/planning", icon: CalendarDays, moduleKey: "planning" },
  { label: "Egenkontroller", href: "/inspections", icon: ClipboardCheck, moduleKey: "inspections" },
  { label: "Offert", href: "/estimates", icon: Calculator, moduleKey: "estimates" },
  { label: "Kunder", href: "/customers", icon: Users, moduleKey: "customers" },
  { label: "Guide", href: "/guide", icon: BookOpen, moduleKey: "guide" },
  { label: "Inställningar", href: "/settings", icon: Settings, moduleKey: "settings" },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess, loading: permissionsLoading } = useUserPermissions();

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(item => hasAccess(item.moduleKey));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:relative",
          collapsed ? "w-[68px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img src={byggioLogo} alt="Byggio" className="h-8" />
            </div>
          )}
          {collapsed && (
            <img src={byggioLogo} alt="Byggio" className="h-8 w-8 object-contain object-left" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed ? "hidden md:flex absolute right-2" : "hidden md:flex"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
                <button
                key={item.href}
                onClick={() => {
                  navigate(item.href);
                  setMobileOpen(false);
                }}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5"
                )}
              >
                {/* Active indicator with animation */}
                <span 
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-200",
                    isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                  )}
                />
                <item.icon className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-transform duration-200", 
                  collapsed && "mx-auto",
                  isActive && "scale-110"
                )} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
            )}
          >
            <LogOut className={cn("h-[18px] w-[18px] shrink-0", collapsed && "mx-auto")} />
            {!collapsed && <span>Logga ut</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/50 backdrop-blur-sm px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Badge 
              variant="secondary" 
              className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            >
              Beta
            </Badge>
            <div className="relative hidden w-64 md:block lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Sök projekt, rapporter..."
                className="h-9 pl-9 border-transparent bg-muted/40 focus-visible:bg-card"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
              <Bell className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-content px-4 py-6 md:px-6 md:py-8">
            <RouteTransition>
              <Outlet />
            </RouteTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
