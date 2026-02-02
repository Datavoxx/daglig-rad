import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Calendar, FileText, Loader2, ClipboardCheck, Clock } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { InlineDiaryCreator } from "@/components/projects/InlineDiaryCreator";
import { EmployeeQuickCard } from "@/components/dashboard/EmployeeQuickCard";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
}

interface DailyReport {
  id: string;
  report_date: string;
  work_items: string[] | null;
  notes: string | null;
  created_at: string;
}

export default function DailyReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Hämta veckans rapporter för snabbkort
  const { data: weeklyReportsCount } = useQuery({
    queryKey: ["weekly-reports-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { count } = await supabase
        .from("daily_reports")
        .select("*", { count: "exact", head: true })
        .gte("report_date", format(weekStart, "yyyy-MM-dd"))
        .lte("report_date", format(weekEnd, "yyyy-MM-dd"));
      
      return count || 0;
    },
    enabled: !!userId,
  });

  // Hämta aktiv incheckning för snabbkort
  const { data: activeCheckIn } = useQuery({
    queryKey: ["active-check-in", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data } = await supabase
        .from("attendance_records")
        .select("check_in, project_id")
        .eq("user_id", userId)
        .is("check_out", null)
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!userId,
  });

  // Hämta veckans timmar för snabbkort
  const { data: weeklyHours } = useQuery({
    queryKey: ["weekly-hours", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data } = await supabase
        .from("time_entries")
        .select("hours")
        .eq("user_id", userId)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"));
      
      return data?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchReports(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    // Låt RLS filtrera - den tillåter redan employer's projects via get_employer_id()
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, client_name")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchReports = async (projectId: string) => {
    setLoadingReports(true);
    
    const { data, error } = await supabase
      .from("daily_reports")
      .select("id, report_date, work_items, notes, created_at")
      .eq("project_id", projectId)
      .order("report_date", { ascending: false })
      .limit(50);

    if (!error && data) {
      setReports(data);
    }
    setLoadingReports(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleReportSaved = (reportId: string) => {
    setShowCreator(false);
    // Refresh the reports list
    if (selectedProjectId) {
      fetchReports(selectedProjectId);
    }
    // Optionally navigate to the report
    navigate(`/reports/${reportId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Dagrapporter
        </h1>
        <p className="page-subtitle">Din arbetsöversikt och dagrapporter</p>
      </div>

      {/* Employee Quick Cards Dashboard */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <EmployeeQuickCard
          title="Dagrapporter"
          value={`${weeklyReportsCount ?? 0} denna vecka`}
          href="/daily-reports"
          icon={BookOpen}
        />
        <EmployeeQuickCard
          title="Personalliggare"
          value={activeCheckIn ? "Incheckad" : "Ej incheckad"}
          subValue={activeCheckIn ? `sedan ${format(parseISO(activeCheckIn.check_in), "HH:mm")}` : undefined}
          href="/attendance"
          icon={ClipboardCheck}
          variant={activeCheckIn ? "success" : "warning"}
        />
        <EmployeeQuickCard
          title="Tidsrapport"
          value={`${weeklyHours ?? 0}h denna vecka`}
          href="/time-reporting"
          icon={Clock}
        />
      </div>

      {/* Project selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Välj projekt</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga projekt tillgängliga</p>
          ) : (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Välj projekt..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} {project.client_name && `- ${project.client_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Inline creator or create button */}
      {selectedProjectId && selectedProject && (
        <>
          {showCreator ? (
            <InlineDiaryCreator
              projectId={selectedProjectId}
              projectName={selectedProject.name}
              onClose={() => setShowCreator(false)}
              onSaved={handleReportSaved}
            />
          ) : (
            <Button
              onClick={() => setShowCreator(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa ny dagrapport
            </Button>
          )}
        </>
      )}

      {/* Reports list */}
      {selectedProjectId && (
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Rapporter</CardTitle>
              <CardDescription>
                {reports.length} dagrapporter för detta projekt
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Inga dagrapporter ännu</p>
                <p className="text-sm">Skapa din första rapport för att komma igång</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {format(parseISO(report.report_date), "EEEE d MMMM", { locale: sv })}
                        </p>
                        {report.work_items && report.work_items.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[400px]">
                            {report.work_items.slice(0, 2).join(", ")}
                            {report.work_items.length > 2 && ` +${report.work_items.length - 2} till`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(report.created_at), "HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
