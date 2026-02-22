import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Clock, Package, Camera, FileText, MapPin, Phone,
  ChevronRight, Briefcase, Zap, ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";

interface JobSummary {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  status: string | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: "Planerad",
  planned: "Planerad",
  in_progress: "Pågående",
  active: "Pågående",
  waiting: "Väntar",
  completed: "Klar",
  invoiced: "Fakturerad",
  closing: "Slutskede",
};

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  active: "bg-primary/10 text-primary",
  waiting: "bg-yellow-500/10 text-yellow-600",
  completed: "bg-green-500/10 text-green-600",
  invoiced: "bg-secondary text-secondary-foreground",
};

export default function ServiceHomeDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: profile }, { data: projects }, { data: timeData }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("projects").select("id, name, client_name, address, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("work_order_time_entries")
        .select("hours, date")
        .eq("user_id", user.id)
        .gte("date", format(getMonday(new Date()), "yyyy-MM-dd")),
    ]);

    setUserName(profile?.full_name?.split(" ")[0] || "");
    setJobs((projects || []) as JobSummary[]);
    setWeeklyHours((timeData || []).reduce((s, e) => s + Number(e.hours), 0));
    setLoading(false);
  };

  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const activeJobs = jobs.filter(j => ["in_progress", "active"].includes(j.status || ""));
  const plannedJobs = jobs.filter(j => ["pending", "planned"].includes(j.status || ""));
  const completedNotInvoiced = jobs.filter(j => j.status === "completed");
  const currentJobs = [...activeJobs, ...plannedJobs.slice(0, 5)];

  if (loading) {
    return (
      <div className="page-transition space-y-4 p-1">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="page-transition space-y-5 pb-24 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hej{userName ? `, ${userName}` : ""}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE d MMMM", { locale: sv })}
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/projects")}>
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pågående</p>
            <p className="text-xl font-bold">{activeJobs.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/projects")}>
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Planerade</p>
            <p className="text-xl font-bold">{plannedJobs.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Att fakturera</p>
            <p className="text-xl font-bold text-primary">{completedNotInvoiced.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Timmar v.</p>
            <p className="text-xl font-bold tabular-nums">{weeklyHours}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { icon: Plus, label: "Nytt jobb", action: () => setCreateOpen(true), primary: true },
          { icon: Clock, label: "Lägg tid", action: () => activeJobs[0] && navigate(`/projects/${activeJobs[0].id}`) },
          { icon: Package, label: "Material", action: () => activeJobs[0] && navigate(`/projects/${activeJobs[0].id}`) },
          { icon: Camera, label: "Kvitto", action: () => navigate("/invoices?tab=receipts&auto=true") },
          { icon: FileText, label: "Faktura", action: () => navigate("/invoices") },
        ].map(({ icon: Icon, label, action, primary }) => (
          <button
            key={label}
            onClick={action}
            className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium transition-all active:scale-95 ${
              primary
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* My Jobs */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mina jobb</h2>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/projects")}>
            Visa alla <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="space-y-2">
          {currentJobs.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Inga aktiva jobb just nu
              </CardContent>
            </Card>
          )}
          {currentJobs.map(job => (
            <Card
              key={job.id}
              className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99]"
              onClick={() => navigate(`/projects/${job.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm truncate">{job.name}</h3>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${statusColors[job.status || "pending"]}`}>
                        {statusLabels[job.status || "pending"] || job.status}
                      </Badge>
                    </div>
                    {job.client_name && (
                      <p className="text-xs text-muted-foreground truncate">{job.client_name}</p>
                    )}
                    {job.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{job.address}</span>
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Ready to Invoice */}
      {completedNotInvoiced.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Klara att fakturera
          </h2>
          <div className="space-y-2">
            {completedNotInvoiced.map(job => (
              <Card key={job.id} className="border-primary/20 bg-primary/5">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{job.name}</h3>
                    {job.client_name && (
                      <p className="text-xs text-muted-foreground">{job.client_name}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${job.id}`);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Fakturera
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchData} />
    </div>
  );
}
