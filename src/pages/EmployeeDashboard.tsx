import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calculator, Clock, ChevronRight, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      return data;
    },
  });

  const { data: weeklyReportsCount, isLoading: reportsLoading } = useQuery({
    queryKey: ["my-weekly-reports"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { count } = await supabase
        .from("daily_reports")
        .select("*", { count: "exact", head: true })
        .gte("report_date", format(weekStart, "yyyy-MM-dd"))
        .lte("report_date", format(weekEnd, "yyyy-MM-dd"));

      return count || 0;
    },
  });

  const { data: estimatesCount, isLoading: estimatesLoading } = useQuery({
    queryKey: ["my-estimates-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("project_estimates")
        .select("*", { count: "exact", head: true });

      return count || 0;
    },
  });

  const { data: docsCount, isLoading: docsLoading } = useQuery({
    queryKey: ["my-docs-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      return count || 0;
    },
  });

  const { data: weeklyHours, isLoading: hoursLoading } = useQuery({
    queryKey: ["my-weekly-hours"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data } = await supabase
        .from("time_entries")
        .select("hours")
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"));

      return data?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;
    },
  });

  const { data: recentEntries, isLoading: recentLoading } = useQuery({
    queryKey: ["my-recent-time-entries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("time_entries")
        .select("id, date, hours, description")
        .order("date", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  const isLoading =
    profileLoading || reportsLoading || estimatesLoading || docsLoading || hoursLoading || recentLoading;

  const firstName = profile?.full_name?.split(" ")[0] || "där";

  const moduleCards = [
    {
      title: "Dagrapporter",
      icon: BookOpen,
      href: "/daily-reports",
      value: `${weeklyReportsCount ?? 0}`,
      label: "rapporter denna vecka",
    },
    {
      title: "Offerter",
      icon: Calculator,
      href: "/estimates",
      value: `${estimatesCount ?? 0}`,
      label: "offerter totalt",
    },
    {
      title: "Tidsrapport",
      icon: Clock,
      href: "/time-reporting",
      value: `${weeklyHours ?? 0}`,
      label: "timmar denna vecka",
    },
    {
      title: "Docs",
      icon: FileText,
      href: "/docs",
      value: `${docsCount ?? 0}`,
      label: "dokument",
    },
  ];

  if (isLoading) return null;

  return (
    <div className="page-transition space-y-6">
      {/* Greeting header */}
      <div>
        <h1 className="page-title">Hej, {firstName}</h1>
        <p className="page-subtitle">
          Vecka {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "d MMM", { locale: sv })} –{" "}
          {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "d MMM", { locale: sv })}
        </p>
      </div>

      {/* Module cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {moduleCards.map((card) => (
          <Card
            key={card.href}
            className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
            onClick={() => navigate(card.href)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <card.icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{card.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent time entries */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Senaste tidrapporter</h2>
            <button
              onClick={() => navigate("/time-reporting")}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Visa alla
            </button>
          </div>

          {recentEntries && recentEntries.length > 0 ? (
            <div className="mt-3 divide-y divide-border">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {format(parseISO(entry.date), "EEEE d MMM", { locale: sv })}
                    </p>
                    {entry.description && (
                      <p className="truncate text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                  <span className="ml-4 shrink-0 text-sm font-medium tabular-nums">
                    {Number(entry.hours)} h
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Inga tidrapporter ännu. Registrera dina första timmar under Tidsrapport.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
