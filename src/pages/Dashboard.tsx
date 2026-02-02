import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FolderKanban, 
  Calculator,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertCircle,
  CalendarClock,
  Receipt,
  TrendingUp,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, subDays, startOfWeek, endOfWeek, format, isAfter, isBefore, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import KpiCard from "@/components/dashboard/KpiCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  guest_name: string | null;
  project_id: string;
  projects?: { name: string } | null;
  profile_name?: string | null;
  profile_email?: string | null;
}

interface UpcomingDeadline {
  id: string;
  type: "invoice" | "project";
  title: string;
  subtitle: string;
  dueDate: Date;
  daysLeft: number;
  urgent: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Välkommen");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setGreeting("God morgon");
    else if (hour < 17) setGreeting("Hej");
    else setGreeting("God kväll");
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userData.user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }
      }
    };
    fetchProfile();
  }, []);

  // Fetch all dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-data-v2"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const fourteenDaysAgo = subDays(now, 14);

      const [
        // Active workers (checked in but not out)
        activeWorkersRes,
        // Hours this week
        hoursThisWeekRes,
        // Active projects
        activeProjectsRes,
        // Overdue invoices
        overdueInvoicesRes,
        // Draft invoices
        draftInvoicesRes,
        // Upcoming deadlines (invoices due within 7 days)
        upcomingInvoicesRes,
        // Recent projects trend
        projectsTrendRes,
        // Recent hours trend
        hoursTrendRes,
      ] = await Promise.all([
        // Active workers
        supabase
          .from("attendance_records")
          .select("id, user_id, check_in, check_out, guest_name, project_id, projects(name)")
          .eq("employer_id", userData.user.id)
          .is("check_out", null),
        // Hours this week
        supabase
          .from("time_entries")
          .select("hours, date")
          .eq("employer_id", userData.user.id)
          .gte("date", weekStart.toISOString().split('T')[0])
          .lte("date", weekEnd.toISOString().split('T')[0]),
        // Active projects
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userData.user.id)
          .eq("status", "active"),
        // Overdue invoices
        supabase
          .from("customer_invoices")
          .select("id, total_inc_vat, due_date, invoice_number, customers(name)")
          .eq("user_id", userData.user.id)
          .neq("status", "paid")
          .lt("due_date", now.toISOString().split('T')[0]),
        // Draft invoices
        supabase
          .from("customer_invoices")
          .select("id, total_inc_vat")
          .eq("user_id", userData.user.id)
          .eq("status", "draft"),
        // Upcoming invoices (7 days)
        supabase
          .from("customer_invoices")
          .select("id, due_date, invoice_number, total_inc_vat, customers(name)")
          .eq("user_id", userData.user.id)
          .neq("status", "paid")
          .gte("due_date", now.toISOString().split('T')[0])
          .lte("due_date", addDays(now, 7).toISOString().split('T')[0])
          .order("due_date"),
        // Trend data
        supabase
          .from("projects")
          .select("created_at")
          .eq("user_id", userData.user.id)
          .gte("created_at", fourteenDaysAgo.toISOString()),
        supabase
          .from("time_entries")
          .select("hours, date")
          .eq("employer_id", userData.user.id)
          .gte("date", fourteenDaysAgo.toISOString().split('T')[0]),
      ]);

      // Fetch profile data for active workers
      const userIds = activeWorkersRes.data?.map(r => r.user_id).filter(Boolean) || [];
      let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, { full_name: p.full_name, email: p.email }]) || []);
      }

      // Enrich workers with profile data
      const enrichedWorkers: AttendanceRecord[] = (activeWorkersRes.data || []).map(worker => ({
        ...worker,
        profile_name: profileMap.get(worker.user_id)?.full_name || null,
        profile_email: profileMap.get(worker.user_id)?.email || null,
      }));

      // Calculate total hours this week
      const totalHoursThisWeek = hoursThisWeekRes.data?.reduce((sum, e) => sum + (e.hours || 0), 0) || 0;

      // Calculate overdue total
      const overdueTotal = overdueInvoicesRes.data?.reduce((sum, inv) => sum + (inv.total_inc_vat || 0), 0) || 0;

      // Calculate draft total
      const draftTotal = draftInvoicesRes.data?.reduce((sum, inv) => sum + (inv.total_inc_vat || 0), 0) || 0;

      // Generate hours sparkline (14 days)
      const generateHoursSparkline = () => {
        if (!hoursTrendRes.data) return Array(14).fill(0);
        const days: number[] = Array(14).fill(0);
        hoursTrendRes.data.forEach(entry => {
          const entryDate = new Date(entry.date);
          const dayIndex = 13 - Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 14) {
            days[dayIndex] += entry.hours || 0;
          }
        });
        return days;
      };

      // Generate project sparkline (14 days cumulative)
      const generateProjectSparkline = () => {
        if (!projectsTrendRes.data) return Array(14).fill(0);
        const days = Array(14).fill(0);
        projectsTrendRes.data.forEach(item => {
          const dayIndex = 13 - Math.floor((now.getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 14) days[dayIndex]++;
        });
        let cumulative = 0;
        return days.map(d => { cumulative += d; return cumulative; });
      };

      // Build upcoming deadlines
      const deadlines: UpcomingDeadline[] = [];
      
      upcomingInvoicesRes.data?.forEach(inv => {
        const dueDate = new Date(inv.due_date);
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const customer = inv.customers as { name: string } | null;
        deadlines.push({
          id: inv.id,
          type: "invoice",
          title: inv.invoice_number || "Faktura",
          subtitle: customer?.name || "Okänd kund",
          dueDate,
          daysLeft,
          urgent: daysLeft <= 2,
        });
      });

      return {
        activeWorkers: enrichedWorkers,
        totalHoursThisWeek,
        activeProjects: activeProjectsRes.count || 0,
        overdueInvoices: overdueInvoicesRes.data?.length || 0,
        overdueTotal,
        draftInvoices: draftInvoicesRes.data?.length || 0,
        draftTotal,
        hoursSparkline: generateHoursSparkline(),
        projectsSparkline: generateProjectSparkline(),
        upcomingDeadlines: deadlines,
      };
    },
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M kr`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}k kr`;
    }
    return `${value.toFixed(0)} kr`;
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const quickActions = [
    {
      title: "Ny offert",
      icon: Calculator,
      href: "/estimates",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Registrera tid",
      icon: Clock,
      href: "/time-reporting",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Nytt projekt",
      icon: FolderKanban,
      href: "/projects",
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      title: "Ny faktura",
      icon: Receipt,
      href: "/invoices",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Dagens Prioriteter - Compact Alert Bar */}
      <section className="rounded-xl border border-border/40 bg-card/50 p-4">
        {/* Priority alerts */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {dashboardData?.overdueInvoices && dashboardData.overdueInvoices > 0 && (
            <button
              onClick={() => navigate("/invoices")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {dashboardData.overdueInvoices} förfallna ({formatCurrency(dashboardData.overdueTotal)})
              </span>
            </button>
          )}
          {dashboardData?.draftInvoices && dashboardData.draftInvoices > 0 && (
            <button
              onClick={() => navigate("/invoices")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span className="text-sm font-medium">
                {dashboardData.draftInvoices} utkast att skicka
              </span>
            </button>
          )}
          {dashboardData?.activeWorkers && dashboardData.activeWorkers.length > 0 && (
            <button
              onClick={() => navigate("/attendance")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              <span className="text-sm font-medium">
                {dashboardData.activeWorkers.length} på plats nu
              </span>
            </button>
          )}
          {(!dashboardData?.overdueInvoices && !dashboardData?.draftInvoices && (!dashboardData?.activeWorkers || dashboardData.activeWorkers.length === 0)) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Allt under kontroll idag!</span>
            </div>
          )}
        </div>

        {/* Quick actions - compact */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.title}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Primary KPI Cards - Most important metrics */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Personal på plats"
          value={dashboardData?.activeWorkers.length ?? 0}
          icon={UserCheck}
          onClick={() => navigate("/attendance")}
          accentColor="emerald"
          delay={0}
          subtitle="just nu"
        />
        <KpiCard
          title="Timmar"
          value={formatHours(dashboardData?.totalHoursThisWeek ?? 0)}
          sparklineData={dashboardData?.hoursSparkline}
          icon={Clock}
          onClick={() => navigate("/time-reporting")}
          accentColor="blue"
          delay={80}
          subtitle="denna vecka"
        />
        <KpiCard
          title="Aktiva projekt"
          value={dashboardData?.activeProjects ?? 0}
          sparklineData={dashboardData?.projectsSparkline}
          icon={FolderKanban}
          onClick={() => navigate("/projects")}
          accentColor="violet"
          delay={160}
        />
        <KpiCard
          title="Obetalda fakturor"
          value={dashboardData?.overdueInvoices ?? 0}
          icon={AlertCircle}
          onClick={() => navigate("/invoices")}
          accentColor={dashboardData?.overdueInvoices && dashboardData.overdueInvoices > 0 ? "red" : "primary"}
          delay={240}
          subtitle={dashboardData?.overdueTotal ? formatCurrency(dashboardData.overdueTotal) : undefined}
        />
      </section>

      {/* Secondary row - Active workers + Upcoming deadlines */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Active Workers Card */}
        <Card className="border-border/40 bg-card/50 ring-1 ring-black/5 dark:ring-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                Personal på plats just nu
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/attendance")}>
                Visa alla
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.activeWorkers && dashboardData.activeWorkers.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.activeWorkers.slice(0, 5).map((worker, index) => {
                  const project = worker.projects as { name: string } | null;
                  const displayName = worker.guest_name 
                    || worker.profile_name 
                    || worker.profile_email?.split("@")[0] 
                    || "Okänd";
                  const initials = displayName.split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "??";
                  
                  return (
                    <div 
                      key={worker.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {project?.name || "Okänt projekt"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(worker.check_in), "HH:mm")}
                      </span>
                    </div>
                  );
                })}
                {dashboardData.activeWorkers.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{dashboardData.activeWorkers.length - 5} fler på plats
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Ingen på plats</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Personal checkar in via QR-kod
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines Card */}
        <Card className="border-border/40 bg-card/50 ring-1 ring-black/5 dark:ring-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-amber-500" />
                Kommande deadlines
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
                Visa alla
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                  <div 
                    key={deadline.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 60}ms` }}
                    onClick={() => navigate("/invoices")}
                  >
                    <div className={`rounded-lg p-2 ${deadline.urgent ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                      <Receipt className={`h-4 w-4 ${deadline.urgent ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{deadline.subtitle}</p>
                    </div>
                    <Badge 
                      variant={deadline.urgent ? "destructive" : "outline"}
                      className="text-xs whitespace-nowrap"
                    >
                      {deadline.daysLeft === 0 ? "Idag" : deadline.daysLeft === 1 ? "Imorgon" : `${deadline.daysLeft} dagar`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Inga kommande deadlines</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fakturor som förfaller inom 7 dagar visas här
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>


      {/* Additional KPIs - Secondary metrics */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Statistik
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <QuickStatCard
            title="Offerter totalt"
            icon={Calculator}
            href="/estimates"
            onClick={() => navigate("/estimates")}
          />
          <QuickStatCard
            title="Kunder"
            icon={Users}
            href="/customers"
            onClick={() => navigate("/customers")}
          />
          <QuickStatCard
            title="Dagrapporter"
            icon={TrendingUp}
            href="/daily-reports"
            onClick={() => navigate("/daily-reports")}
          />
          <QuickStatCard
            title="Besiktningar"
            icon={FolderKanban}
            href="/inspections"
            onClick={() => navigate("/inspections")}
          />
        </div>
      </section>
    </div>
  );
};

// Simple stat card for secondary navigation
const QuickStatCard = ({ 
  title, 
  icon: Icon, 
  onClick 
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>; 
  href: string;
  onClick: () => void;
}) => {
  return (
    <Card 
      className="group cursor-pointer border-border/40 bg-card/50 hover:bg-muted/50 transition-all hover-lift"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{title}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  );
};

export default Dashboard;
