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
  Wallet,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import KpiCard from "@/components/dashboard/KpiCard";

interface ActivityItem {
  id: string;
  type: "estimate";
  title: string;
  projectName: string;
  date: Date;
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

  // Fetch all dashboard data with trends
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const fourteenDaysAgo = subDays(now, 14);

      const [
        projectsRes,
        estimatesRes,
        customersRes,
        projectsThisMonth,
        projectsLastMonth,
        estimatesThisMonth,
        estimatesLastMonth,
        customersThisMonth,
        customersLastMonth,
        projectsTrend,
        estimatesTrend,
        customersTrend,
      ] = await Promise.all([
        // Totals
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id),
        supabase.from("project_estimates").select("id, total_incl_vat").eq("user_id", userData.user.id),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id),
        // This month counts
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id).gte("created_at", thisMonthStart.toISOString()).lte("created_at", thisMonthEnd.toISOString()),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id).gte("created_at", lastMonthStart.toISOString()).lte("created_at", lastMonthEnd.toISOString()),
        supabase.from("project_estimates").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id).gte("created_at", thisMonthStart.toISOString()).lte("created_at", thisMonthEnd.toISOString()),
        supabase.from("project_estimates").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id).gte("created_at", lastMonthStart.toISOString()).lte("created_at", lastMonthEnd.toISOString()),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id).gte("created_at", thisMonthStart.toISOString()).lte("created_at", thisMonthEnd.toISOString()),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id).gte("created_at", lastMonthStart.toISOString()).lte("created_at", lastMonthEnd.toISOString()),
        // Trends (14 days)
        supabase.from("projects").select("created_at").eq("user_id", userData.user.id).gte("created_at", fourteenDaysAgo.toISOString()),
        supabase.from("project_estimates").select("created_at, total_incl_vat").eq("user_id", userData.user.id).gte("created_at", fourteenDaysAgo.toISOString()),
        supabase.from("customers").select("created_at").eq("user_id", userData.user.id).gte("created_at", fourteenDaysAgo.toISOString()),
      ]);

      // Calculate total estimate value
      const totalEstimateValue = estimatesRes.data?.reduce((sum, e) => sum + (e.total_incl_vat || 0), 0) || 0;

      // Calculate percentage changes
      const calcChange = (thisMonth: number, lastMonth: number) => {
        if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
        return ((thisMonth - lastMonth) / lastMonth) * 100;
      };

      // Generate sparkline data (14 days)
      const generateSparkline = (items: { created_at: string }[] | null) => {
        if (!items) return Array(14).fill(0);
        const days = Array(14).fill(0);
        items.forEach(item => {
          const dayIndex = 13 - Math.floor((now.getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 14) days[dayIndex]++;
        });
        // Cumulative
        let cumulative = 0;
        return days.map(d => { cumulative += d; return cumulative; });
      };

      return {
        projects: projectsRes.count || 0,
        estimates: estimatesRes.data?.length || 0,
        customers: customersRes.count || 0,
        totalEstimateValue,
        projectsChange: calcChange(projectsThisMonth.count || 0, projectsLastMonth.count || 0),
        estimatesChange: calcChange(estimatesThisMonth.count || 0, estimatesLastMonth.count || 0),
        customersChange: calcChange(customersThisMonth.count || 0, customersLastMonth.count || 0),
        projectsSparkline: generateSparkline(projectsTrend.data),
        estimatesSparkline: generateSparkline(estimatesTrend.data),
        customersSparkline: generateSparkline(customersTrend.data),
      };
    },
  });

  // Fetch recent activity (estimates only)
  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data: estimatesRes } = await supabase
        .from("project_estimates")
        .select("id, updated_at, project_id, projects!project_estimates_project_id_fkey(name)")
        .eq("user_id", userData.user.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      const activities: ActivityItem[] = [];

      estimatesRes?.forEach((e) => {
        const project = e.projects as { name: string } | null;
        activities.push({
          id: e.id,
          type: "estimate",
          title: "Offert uppdaterad",
          projectName: project?.name || "Okänt projekt",
          date: new Date(e.updated_at || ""),
        });
      });

      return activities;
    },
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M kr`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k kr`;
    }
    return `${value.toFixed(0)} kr`;
  };

  const quickActions = [
    {
      title: "Offerter",
      description: "Skapa och hantera projektofferter",
      icon: Calculator,
      href: "/estimates",
      gradient: "from-blue-500/5 via-transparent to-blue-500/10",
    },
    {
      title: "Kunder",
      description: "Hantera dina kundrelationer",
      icon: Users,
      href: "/customers",
      gradient: "from-amber-500/5 via-transparent to-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Hero Section - Compact */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-5 md:p-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/8 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary animate-pulse-subtle" />
              <span className="text-xs font-medium text-primary">Dashboard</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {greeting}{userName ? `, ${userName}` : ""}! 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Här är din översikt för idag
            </p>
          </div>

        </div>
      </section>

      {/* Modern KPI Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Projekt"
          value={dashboardData?.projects ?? 0}
          change={dashboardData?.projectsChange}
          sparklineData={dashboardData?.projectsSparkline}
          icon={FolderKanban}
          onClick={() => navigate("/projects")}
          accentColor="primary"
          delay={0}
        />
        <KpiCard
          title="Offerter"
          value={dashboardData?.estimates ?? 0}
          change={dashboardData?.estimatesChange}
          sparklineData={dashboardData?.estimatesSparkline}
          icon={Calculator}
          onClick={() => navigate("/estimates")}
          accentColor="blue"
          delay={80}
        />
        <KpiCard
          title="Offertvärde"
          value={formatCurrency(dashboardData?.totalEstimateValue ?? 0)}
          sparklineData={dashboardData?.estimatesSparkline}
          icon={Wallet}
          onClick={() => navigate("/estimates")}
          accentColor="emerald"
          delay={160}
        />
        <KpiCard
          title="Kunder"
          value={dashboardData?.customers ?? 0}
          change={dashboardData?.customersChange}
          sparklineData={dashboardData?.customersSparkline}
          icon={Users}
          onClick={() => navigate("/customers")}
          accentColor="amber"
          delay={240}
        />
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Snabbåtgärder
        </h2>
        <div className="grid gap-3 grid-cols-2">
          {quickActions.map((action, index) => (
            <Card
              key={action.title}
              className="group relative overflow-hidden cursor-pointer hover-lift border-border/40 bg-card/50 ring-1 ring-black/5 dark:ring-white/5 animate-fade-in"
              style={{ animationDelay: `${400 + index * 80}ms` }}
              onClick={() => navigate(action.href)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="relative p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary ring-1 ring-primary/20">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground">{action.title}</h3>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Activity - Compact */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Senaste aktivitet
        </h2>
        <Card className="border-border/40 bg-card/50 ring-1 ring-black/5 dark:ring-white/5">
          <CardContent className="p-0">
            {recentActivity && recentActivity.length > 0 ? (
              <ul className="divide-y divide-border/50">
                {recentActivity.map((activity, index) => (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${500 + index * 60}ms` }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.projectName}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(activity.date, { addSuffix: true, locale: sv })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Ingen aktivitet ännu</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Din senaste aktivitet visas här
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
