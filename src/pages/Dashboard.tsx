import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FolderKanban, 
  FileText, 
  Users, 
  Calculator,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "report" | "estimate" | "inspection";
  title: string;
  projectName: string;
  date: Date;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Välkommen");
  const [userName, setUserName] = useState<string | null>(null);

  // Dynamic greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setGreeting("God morgon");
    else if (hour < 17) setGreeting("Hej");
    else setGreeting("God kväll");
  }, []);

  // Fetch user profile
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

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { projects: 0, estimates: 0, customers: 0 };

      const [projectsRes, estimatesRes, customersRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id),
        supabase.from("project_estimates").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", userData.user.id),
      ]);

      return {
        projects: projectsRes.count || 0,
        estimates: estimatesRes.count || 0,
        customers: customersRes.count || 0,
      };
    },
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const [reportsRes, estimatesRes, inspectionsRes] = await Promise.all([
        supabase
          .from("daily_reports")
          .select("id, created_at, project_id, projects(name)")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("project_estimates")
          .select("id, updated_at, project_id, projects(name)")
          .eq("user_id", userData.user.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("inspections")
          .select("id, created_at, template_name, projects(name)")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const activities: ActivityItem[] = [];

      reportsRes.data?.forEach((r) => {
        const project = r.projects as { name: string } | null;
        activities.push({
          id: r.id,
          type: "report",
          title: "Dagrapport skapad",
          projectName: project?.name || "Okänt projekt",
          date: new Date(r.created_at || ""),
        });
      });

      estimatesRes.data?.forEach((e) => {
        const project = e.projects as { name: string } | null;
        activities.push({
          id: e.id,
          type: "estimate",
          title: "Offert uppdaterad",
          projectName: project?.name || "Okänt projekt",
          date: new Date(e.updated_at || ""),
        });
      });

      inspectionsRes.data?.forEach((i) => {
        const project = i.projects as { name: string } | null;
        activities.push({
          id: i.id,
          type: "inspection",
          title: i.template_name || "Egenkontroll",
          projectName: project?.name || "Okänt projekt",
          date: new Date(i.created_at),
        });
      });

      return activities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);
    },
  });

  const statCards = [
    {
      label: "Projekt",
      value: stats?.projects ?? 0,
      icon: FolderKanban,
      href: "/projects",
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Offerter",
      value: stats?.estimates ?? 0,
      icon: Calculator,
      href: "/estimates",
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Kunder",
      value: stats?.customers ?? 0,
      icon: Users,
      href: "/customers",
      color: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const quickActions = [
    {
      title: "Offerter",
      description: "Skapa och hantera projektofferter med smart kalkylering",
      icon: Calculator,
      href: "/estimates",
      gradient: "from-primary/5 via-transparent to-primary/10",
    },
    {
      title: "Kunder",
      description: "Hantera dina kundrelationer och kontaktuppgifter",
      icon: Users,
      href: "/customers",
      gradient: "from-amber-500/5 via-transparent to-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/8 blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse-subtle" />
            <span className="text-sm font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {greeting}{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg">
            Här är din översikt. Håll koll på projekt, offerter och kunder – allt på ett ställe.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className="group relative overflow-hidden cursor-pointer hover-lift border-border/50 stagger-item"
            style={{ animationDelay: `${index * 80}ms` }}
            onClick={() => navigate(stat.href)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight number-animate">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl bg-background p-2.5 shadow-sm ring-1 ring-border/50 ${stat.iconColor}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Se alla</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Snabbåtgärder
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action, index) => (
            <Card
              key={action.title}
              className="group relative overflow-hidden cursor-pointer hover-lift border-border/50 stagger-item"
              style={{ animationDelay: `${(index + 3) * 80}ms` }}
              onClick={() => navigate(action.href)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-transform"
                  >
                    Öppna
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Senaste aktivitet
        </h2>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {recentActivity && recentActivity.length > 0 ? (
              <ul className="divide-y divide-border/50">
                {recentActivity.map((activity, index) => (
                  <li
                    key={activity.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors stagger-item"
                    style={{ animationDelay: `${(index + 5) * 60}ms` }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      {activity.type === "report" && <FileText className="h-4 w-4 text-muted-foreground" />}
                      {activity.type === "estimate" && <Calculator className="h-4 w-4 text-muted-foreground" />}
                      {activity.type === "inspection" && <FileText className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.projectName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatDistanceToNow(activity.date, { addSuffix: true, locale: sv })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Ingen aktivitet ännu</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Din senaste aktivitet kommer visas här
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
