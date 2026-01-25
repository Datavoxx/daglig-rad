import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Calendar, Users, Clock, AlertTriangle, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { generateProjectPdf } from "@/lib/generateProjectPdf";
import { toast } from "sonner";
import { InlineDiaryCreator } from "./InlineDiaryCreator";

interface Deviation {
  type: string;
  description: string;
  hours?: number | null;
}

interface AtaItem {
  reason: string;
  consequence: string;
  estimated_hours: number | null;
}

interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  total_hours: number | null;
  deviations: Deviation[];
  ata: {
    has_ata: boolean;
    items: AtaItem[];
  } | null;
  notes: string | null;
  work_items: string[] | null;
  roles: string[] | null;
  hours_per_person: number | null;
  materials_delivered: string[] | null;
  materials_missing: string[] | null;
}

interface ProjectDiaryTabProps {
  projectId: string;
  projectName: string;
}

export default function ProjectDiaryTab({ projectId, projectName }: ProjectDiaryTabProps) {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_reports")
      .select("id, report_date, headcount, total_hours, deviations, ata, notes, work_items, roles, hours_per_person, materials_delivered, materials_missing")
      .eq("project_id", projectId)
      .order("report_date", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      // Parse the JSON fields properly
      const parsedReports = (data || []).map(report => ({
        ...report,
        deviations: Array.isArray(report.deviations) ? report.deviations as unknown as Deviation[] : [],
        ata: report.ata as unknown as DailyReport["ata"],
      }));
      setReports(parsedReports);
    }
    setLoading(false);
  };

  const handleExportPdf = async () => {
    if (reports.length === 0) {
      toast.error("Inga rapporter att exportera");
      return;
    }

    setExporting(true);
    try {
      await generateProjectPdf({
        project: {
          name: projectName,
          client_name: null,
          address: null,
        },
        reports: reports,
      });
      toast.success("PDF genererad och nedladdad");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Kunde inte generera PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleReportSaved = (reportId: string) => {
    setShowCreateForm(false);
    fetchReports();
    navigate(`/reports/${reportId}`);
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // Show inline creator form
  if (showCreateForm) {
    return (
      <InlineDiaryCreator
        projectId={projectId}
        projectName={projectName}
        onClose={() => setShowCreateForm(false)}
        onSaved={handleReportSaved}
      />
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Ingen arbetsdagbok ännu</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Skapa din första arbetsdagbok för att dokumentera arbetet på projektet.
        </p>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny arbetsdagbok
        </Button>
      </div>
    );
  }

  // Calculate summary stats
  const totalHours = reports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const totalDeviations = reports.reduce((sum, r) => sum + (r.deviations?.length || 0), 0);
  const reportsWithAta = reports.filter(r => r.ata?.has_ata && r.ata.items?.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Arbetsdagbok</h2>
          <p className="text-sm text-muted-foreground">
            {reports.length} {reports.length === 1 ? "rapport" : "rapporter"} • {totalHours.toFixed(1)}h totalt
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporterar..." : "Ladda ner PDF"}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ny arbetsdagbok
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Rapporter</span>
            </div>
            <p className="text-2xl font-semibold">{reports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Totala timmar</span>
            </div>
            <p className="text-2xl font-semibold">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Avvikelser</span>
            </div>
            <p className="text-2xl font-semibold">{totalDeviations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Med ÄTA</span>
            </div>
            <p className="text-2xl font-semibold">{reportsWithAta}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.map((report, index) => {
          const hasDeviations = report.deviations && report.deviations.length > 0;
          const hasAta = report.ata?.has_ata && report.ata.items?.length > 0;

          return (
            <Card
              key={report.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleViewReport(report.id)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(report.report_date), "d MMMM yyyy", { locale: sv })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {report.headcount && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {report.headcount} pers
                        </span>
                      )}
                      {report.total_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {report.total_hours}h
                        </span>
                      )}
                    </div>
                    {report.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {report.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDeviations && (
                      <Badge variant="warning">
                        {report.deviations.length} avvikelse{report.deviations.length > 1 ? "r" : ""}
                      </Badge>
                    )}
                    {hasAta && (
                      <Badge variant="info">
                        ÄTA
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
