import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  FileText,
  Users,
  Clock,
  Hammer,
  AlertTriangle,
  Package,
  Loader2,
  AlertCircle,
  FileWarning,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

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
  materials_delivered: string[];
  materials_missing: string[];
  notes: string | null;
  project: { name: string; client_name: string | null; address: string | null };
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

export default function ShareView() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) fetchSharedReport();
  }, [token]);

  const fetchSharedReport = async () => {
    // First get the share link
    const { data: linkData, error: linkError } = await supabase
      .from("share_links")
      .select("daily_report_id, expires_at")
      .eq("token", token)
      .single();

    if (linkError || !linkData) {
      setError("Ogiltig eller utgången länk");
      setLoading(false);
      return;
    }

    // Check expiry
    if (new Date(linkData.expires_at) < new Date()) {
      setError("Denna länk har gått ut");
      setLoading(false);
      return;
    }

    // Get the report
    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .select(`
        id,
        report_date,
        headcount,
        roles,
        hours_per_person,
        total_hours,
        work_items,
        deviations,
        ata,
        materials_delivered,
        materials_missing,
        notes,
        project:projects(name, client_name, address)
      `)
      .eq("id", linkData.daily_report_id)
      .single();

    if (reportError) {
      setError("Kunde inte hämta rapport");
    } else {
      setReport(reportData as any);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">{error}</h1>
        <p className="text-muted-foreground">
          Kontakta avsändaren för en ny delningslänk
        </p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="animate-in min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <FileText className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            {report.project?.name}
          </h1>
          <p className="text-muted-foreground">
            Dagrapport • {format(new Date(report.report_date), "d MMMM yyyy", { locale: sv })}
          </p>
          {report.project?.client_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              Beställare: {report.project.client_name}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          {/* Deviations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Avvikelser
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

          {/* ÄTA */}
          {report.ata?.has_ata && report.ata.items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileWarning className="h-5 w-5 text-info" />
                  ÄTA
                  <Badge variant="outline" className="ml-auto bg-info/10 text-info border-info/30">
                    {report.ata.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.ata.items.map((item, i) => (
                    <div key={i} className="rounded-lg border border-info/20 bg-info/5 p-3">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-muted-foreground">Anledning: </span>
                          {item.reason}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-muted-foreground">Konsekvens: </span>
                          {item.consequence}
                        </p>
                        {item.estimated_hours && (
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">Uppskattade timmar: </span>
                            {item.estimated_hours}h
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
            <Card className="md:col-span-2">
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
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Genererad med Dagrapport • {format(new Date(), "yyyy")}
        </p>
      </div>
    </div>
  );
}
