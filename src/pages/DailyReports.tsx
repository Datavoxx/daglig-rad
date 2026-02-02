import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Calendar, FileText, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { InlineDiaryCreator } from "@/components/projects/InlineDiaryCreator";

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

    // For employees, get employer ID and fetch their projects
    const { data: employee } = await supabase
      .from("employees")
      .select("user_id")
      .eq("linked_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const employerId = employee?.user_id || user.id;

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, client_name")
      .eq("user_id", employerId)
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
        <p className="page-subtitle">Skapa och visa dagrapporter för projekt</p>
      </div>

      {/* Project selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Välj projekt</CardTitle>
        </CardHeader>
        <CardContent>
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
