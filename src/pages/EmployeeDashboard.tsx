import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ClipboardCheck, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  // Hämta användarens namn
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

  // Hämta veckans rapporter (endast egna - RLS)
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

  // Hämta aktiv incheckning (endast egen - RLS)
  const { data: activeCheckIn, isLoading: checkInLoading } = useQuery({
    queryKey: ["my-active-checkin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_records")
        .select("check_in, project_id")
        .is("check_out", null)
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
  });

  // Hämta veckans timmar (endast egna - RLS)
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

  // Hämta veckans incheckningsdagar
  const { data: weeklyCheckIns, isLoading: weekCheckInsLoading } = useQuery({
    queryKey: ["my-weekly-checkins"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data } = await supabase
        .from("attendance_records")
        .select("check_in")
        .gte("check_in", weekStart.toISOString())
        .lte("check_in", weekEnd.toISOString());
      
      // Count unique days
      const uniqueDays = new Set(
        data?.map(r => format(parseISO(r.check_in), "yyyy-MM-dd")) || []
      );
      
      return uniqueDays.size;
    },
  });

  const isLoading = profileLoading || reportsLoading || checkInLoading || hoursLoading || weekCheckInsLoading;

  const firstName = profile?.full_name?.split(" ")[0] || "där";

  const moduleCards = [
    {
      title: "Dagrapporter",
      description: "Dokumentera dagens arbete",
      icon: BookOpen,
      href: "/daily-reports",
      value: `${weeklyReportsCount ?? 0}`,
      label: "rapporter denna vecka",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Personalliggare",
      description: "Elektronisk närvaroregistrering",
      icon: ClipboardCheck,
      href: "/attendance",
      value: activeCheckIn ? "Incheckad" : "Ej incheckad",
      label: activeCheckIn 
        ? `sedan ${format(parseISO(activeCheckIn.check_in), "HH:mm")}` 
        : "Checka in för att starta",
      color: activeCheckIn 
        ? "bg-green-500/10 text-green-600 dark:text-green-400" 
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Tidsrapport",
      description: "Registrera arbetade timmar",
      icon: Clock,
      href: "/time-reporting",
      value: `${weeklyHours ?? 0}h`,
      label: "denna vecka",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="page-transition space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      {/* Greeting header */}
      <div>
        <h1 className="page-title">Hej, {firstName}! 👋</h1>
        <p className="page-subtitle">Din arbetsöversikt för veckan</p>
      </div>

      {/* Module cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {moduleCards.map((card) => (
          <Card
            key={card.href}
            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
            onClick={() => navigate(card.href)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.color)}>
                  <card.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-lg mt-3">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{card.value}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly statistics summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Din veckostatistik</CardTitle>
          </div>
          <CardDescription>
            Sammanfattning för {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "d MMMM", { locale: sv })} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "d MMMM", { locale: sv })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Dagrapporter</p>
                <p className="font-semibold">{weeklyReportsCount ?? 0} st</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Arbetade timmar</p>
                <p className="font-semibold">{weeklyHours ?? 0}h</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Incheckade dagar</p>
                <p className="font-semibold">{weeklyCheckIns ?? 0} av 5</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
