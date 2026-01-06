import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  FileDown,
  Share2,
  Copy,
  Check,
  Users,
  Clock,
  Hammer,
  AlertTriangle,
  Package,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateReportPdf } from "@/lib/generateReportPdf";

interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  roles: string[];
  hours_per_person: number | null;
  total_hours: number | null;
  work_items: string[];
  deviations: Array<{ type: string; description: string; hours: number | null }>;
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
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
      navigate("/reports");
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

  const handleCreateShareLink = async () => {
    if (!report) return;

    setCreatingLink(true);

    try {
      const { data, error } = await supabase
        .from("share_links")
        .insert({ daily_report_id: report.id })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/share/${data.token}`;
      setShareLink(link);
    } catch (error) {
      toast({
        title: "Kunde inte skapa delningslänk",
        description: error instanceof Error ? error.message : "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Länk kopierad!" });
    } catch {
      toast({ title: "Kunde inte kopiera länk", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              {report.project?.name}
            </h1>
            <p className="text-muted-foreground">
              Dagrapport • {format(new Date(report.report_date), "d MMMM yyyy", { locale: sv })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {exportingPdf ? "Exporterar..." : "Exportera PDF"}
          </Button>
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Dela
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crew */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Bemanning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Antal personer</span>
              <span className="font-medium">{report.headcount ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timmar/person</span>
              <span className="font-medium">
                {report.hours_per_person ? `${report.hours_per_person}h` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Roller</span>
              <span className="font-medium">
                {report.roles?.length > 0 ? report.roles.join(", ") : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Totala timmar:</span>
              <span className="font-medium">
                {report.total_hours ? `${report.total_hours}h` : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Work items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hammer className="h-5 w-5 text-primary" />
              Utfört arbete
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.work_items?.length > 0 ? (
              <ul className="space-y-2">
                {report.work_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Inga arbetsmoment registrerade</p>
            )}
          </CardContent>
        </Card>

        {/* Deviations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Avvikelser
              {report.deviations && report.deviations.length > 0 && (
                <Badge variant="outline" className="ml-auto bg-warning/10 text-warning border-warning/30">
                  {report.deviations.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.deviations && report.deviations.length > 0 ? (
              <div className="space-y-3">
                {report.deviations.map((d, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{deviationTypes[d.type] || d.type}</Badge>
                      {d.hours && (
                        <span className="text-sm text-muted-foreground">{d.hours}h</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{d.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Inga avvikelser</p>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-success">Levererat</p>
              <p className="mt-1">
                {report.materials_delivered?.length > 0
                  ? report.materials_delivered.join(", ")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">Saknas</p>
              <p className="mt-1">
                {report.materials_missing?.length > 0
                  ? report.materials_missing.join(", ")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {report.notes && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Anteckningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Original transcript */}
        {report.original_transcript && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-muted-foreground">Originaltranskript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {report.original_transcript}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dela dagrapport</DialogTitle>
            <DialogDescription>
              Skapa en delningslänk som gäller i 30 dagar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {shareLink ? (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm"
                />
                <Button onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Button onClick={handleCreateShareLink} disabled={creatingLink} className="w-full">
                {creatingLink ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Skapar länk...
                  </>
                ) : (
                  "Skapa delningslänk"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
