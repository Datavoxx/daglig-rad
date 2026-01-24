import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  FileText,
  Settings,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RouteTransition } from "./RouteTransition";
import byggioLogo from "@/assets/byggio-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userInitial, setUserInitial] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess, loading: permissionsLoading } = useUserPermissions();

  // Fetch user profile for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", userData.user.id)
          .single();

        if (profile) {
          setUserInitial(
            profile.full_name
              ? profile.full_name.charAt(0).toUpperCase()
              : userData.user.email?.charAt(0).toUpperCase() || "U"
          );
          setAvatarUrl(profile.avatar_url);
        } else {
          setUserInitial(userData.user.email?.charAt(0).toUpperCase() || "U");
        }
      }
    };
    fetchProfile();
  }, []);

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(item => hasAccess(item.moduleKey));

  const renderNavButton = (item: NavItem, isActive: boolean) => (
    <button
      onClick={() => {
        navigate(item.href);
        setMobileOpen(false);
      }}
      className={cn(
        "relative flex w-full items-center justify-center rounded-md p-2.5 text-[13px] font-medium transition-all duration-200 ease-out",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      {/* Active indicator with animation */}
      <span 
        className={cn(
          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-200",
          isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
        )}
      />
      <item.icon className={cn(
        "h-5 w-5 shrink-0 transition-transform duration-200", 
        isActive && "scale-110"
      )} />
    </button>
  );

  const logoutButton = (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }}
      className="flex w-full items-center justify-center rounded-md p-2.5 text-[13px] font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
    >
      <LogOut className="h-5 w-5 shrink-0" />
    </button>
  );

  const profileButton = (
    <button
      onClick={() => navigate("/profile")}
      className={cn(
        "flex w-full items-center justify-center rounded-md p-1.5 transition-all duration-200",
        location.pathname === "/profile"
          ? "ring-2 ring-primary ring-offset-2 ring-offset-sidebar"
          : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-sidebar"
      )}
    >
      <Avatar className="h-9 w-9 border-2 border-primary/20">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Profil" />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {userInitial}
          </AvatarFallback>
        )}
      </Avatar>
    </button>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - always collapsed */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[68px] flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:relative",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand - clickable logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex h-20 w-full items-center justify-center border-b border-sidebar-border p-1 hover:bg-sidebar-accent/30 transition-colors cursor-pointer"
          aria-label="Gå till dashboard"
        >
          <img src={byggioLogo} alt="Byggio" className="w-full h-full object-contain hover:scale-105 transition-transform" />
        </button>

        {/* Navigation */}
        <TooltipProvider delayDuration={0}>
          <nav className="flex-1 space-y-0.5 p-1.5">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              const button = renderNavButton(item, isActive);
              
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    sideOffset={8}
                    className="bg-foreground text-background text-sm font-medium"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Profile avatar */}
          <div className="border-t border-sidebar-border p-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                {profileButton}
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                sideOffset={8}
                className="bg-foreground text-background text-sm font-medium"
              >
                Min profil
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Logout */}
          <div className="border-t border-sidebar-border p-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                {logoutButton}
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                sideOffset={8}
                className="bg-foreground text-background text-sm font-medium"
              >
                Logga ut
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
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
