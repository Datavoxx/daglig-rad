import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  FileDown,
  Users,
  Clock,
  Hammer,
  AlertTriangle,
  Package,
  FileText,
  Loader2,
  Pencil,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateReportPdf } from "@/lib/generateReportPdf";
import { ReportEditor } from "@/components/reports/ReportEditor";
import { ReportViewSkeleton } from "@/components/skeletons/ReportViewSkeleton";

interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  roles: string[];
  hours_per_person: number | null;
  total_hours: number | null;
  work_items: string[];
  deviations: Array<{ type: string; description: string; hours: number | null }>;
  ata: {
    has_ata: boolean;
    items: Array<{ reason: string; consequence: string; estimated_hours: number | null }>;
  } | null;
  extra_work: string[];
  materials_delivered: string[];
  materials_missing: string[];
  notes: string | null;
  original_transcript: string | null;
  project: { id: string; name: string; client_name: string | null };
}

const deviationTypes: Record<string, string> = {
  waiting_time: "Väntetid",
  material_delay: "Materialförsening",
  weather: "Väder",
  coordination: "Samordning",
  equipment: "Utrustning",
  safety: "Säkerhet",
  quality: "Kvalitet",
  other: "Övrigt",
};

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const fetchReport = async () => {
    const { data, error } = await supabase
      .from("daily_reports")
      .select(`
        *,
        project:projects(id, name, client_name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Kunde inte hämta rapport",
        description: error.message,
        variant: "destructive",
      });
      navigate("/projects");
    } else {
      setReport(data as any);
    }
    setLoading(false);
  };

  const handleExportPdf = async () => {
    if (!report) return;
    
    setExportingPdf(true);
    try {
      await generateReportPdf(report);
      toast({
        title: "PDF exporterad",
        description: "Rapporten har laddats ner.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Kunde inte exportera PDF",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return <ReportViewSkeleton />;
  }

  if (!report) return null;

  const convertToEditorFormat = () => ({
    crew: {
      headcount: report.headcount,
      roles: report.roles || [],
      hours_per_person: report.hours_per_person,
      total_hours: report.total_hours,
    },
    work_items: report.work_items || [],
    deviations: report.deviations || [],
    ata: report.ata || null,
    extra_work: report.extra_work || [],
    materials: {
      delivered: report.materials_delivered || [],
      missing: report.materials_missing || [],
    },
    notes: report.notes,
    original_transcript: report.original_transcript || "",
    confidence: {
      overall: 1,
      low_confidence_fields: [],
    },
  });

  const handleEditSaved = (savedId: string) => {
    setIsEditing(false);
    fetchReport();
  };

  if (isEditing) {
    return (
      <ReportEditor
        report={convertToEditorFormat()}
        projectId={report.project.id}
        projectName={report.project.name}
        reportDate={new Date(report.report_date)}
        userId=""
        existingReportId={report.id}
        onBack={() => setIsEditing(false)}
        onSaved={handleEditSaved}
      />
    );
  }

  return (
    <div className="page-transition space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${report.project?.id}?tab=diary`)} className="shrink-0 mt-0.5">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>{report.project?.name}</span>
              <ChevronRight className="h-3 w-3" />
              <span>{format(new Date(report.report_date), "d MMMM yyyy", { locale: sv })}</span>
            </div>
            <h1 className="page-title">Dagrapport</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-12 sm:pl-0">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Redigera
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-3.5 w-3.5" />
            )}
            Exportera PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Crew */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="h-4 w-4 text-primary" />
              Bemanning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Antal personer</p>
                <p className="text-lg font-semibold tabular-nums">{report.headcount ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timmar/person</p>
                <p className="text-lg font-semibold tabular-nums">
                  {report.hours_per_person ? `${report.hours_per_person}h` : "—"}
                </p>
              </div>
            </div>
            {report.roles?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Roller</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.roles.map((role, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{role}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 mt-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Totala timmar:</span>
              <span className="font-semibold tabular-nums">
                {report.total_hours ? `${report.total_hours}h` : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Work items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Hammer className="h-4 w-4 text-primary" />
              Utfört arbete
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.work_items?.length > 0 ? (
              <ul className="space-y-2">
                {report.work_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[0.9375rem]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Inga arbetsmoment registrerade</p>
            )}
          </CardContent>
        </Card>

        {/* Deviations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Avvikelser
              {report.deviations && report.deviations.length > 0 && (
                <Badge variant="warning" className="ml-auto">
                  {report.deviations.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.deviations && report.deviations.length > 0 ? (
              <div className="space-y-3">
                {report.deviations.map((d, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">{deviationTypes[d.type] || d.type}</Badge>
                      {d.hours && (
                        <span className="text-xs text-muted-foreground">{d.hours}h</span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{d.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Inga avvikelser</p>
            )}
          </CardContent>
        </Card>

        {/* ÄTA */}
        {report.ata?.has_ata && report.ata.items.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <FileWarning className="h-4 w-4 text-info" />
                ÄTA
                <Badge variant="info" className="ml-auto">
                  {report.ata.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.ata.items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-info/20 bg-info/5 p-3 space-y-1.5">
                    <p className="text-sm">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anledning: </span>
                      {item.reason}
                    </p>
                    <p className="text-sm">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Konsekvens: </span>
                      {item.consequence}
                    </p>
                    {item.estimated_hours && (
                      <p className="text-sm">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uppskattade timmar: </span>
                        <span className="tabular-nums">{item.estimated_hours}h</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Package className="h-4 w-4 text-primary" />
              Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-success uppercase tracking-wider mb-1.5">Levererat</p>
              <p className="text-sm leading-relaxed">
                {report.materials_delivered?.length > 0
                  ? report.materials_delivered.join(", ")
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-1.5">Saknas</p>
              <p className="text-sm leading-relaxed">
                {report.materials_missing?.length > 0
                  ? report.materials_missing.join(", ")
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {report.notes && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <FileText className="h-4 w-4 text-primary" />
                Anteckningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{report.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Original transcript */}
        {report.original_transcript && (
          <Card className="lg:col-span-2 bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Originaltranskript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-mono">
                {report.original_transcript}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
