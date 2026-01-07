import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  FileText,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Json } from "@/integrations/supabase/types";
import { generateProjectPdf } from "@/lib/generateProjectPdf";

interface Deviation {
  type: string;
  description: string;
}

interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  total_hours: number | null;
  hours_per_person: number | null;
  work_items: string[] | null;
  deviations: Json | null;
  ata: Json | null;
  notes: string | null;
  materials_delivered: string[] | null;
  materials_missing: string[] | null;
  roles: string[] | null;
}

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
}

export default function ProjectShareView() {
  const { token } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!token) {
        setError("Ogiltig delningslänk");
        setLoading(false);
        return;
      }

      try {
        // Hämta delningslänken
        const { data: shareLink, error: shareLinkError } = await supabase
          .from("project_share_links")
          .select("project_id, expires_at")
          .eq("token", token)
          .single();

        if (shareLinkError || !shareLink) {
          setError("Delningslänken hittades inte eller har utgått");
          setLoading(false);
          return;
        }

        // Kolla om länken har utgått
        if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
          setError("Delningslänken har utgått");
          setLoading(false);
          return;
        }

        // Hämta projektet
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, name, client_name, address")
          .eq("id", shareLink.project_id)
          .single();

        if (projectError || !projectData) {
          setError("Projektet hittades inte");
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Hämta alla dagrapporter för projektet
        const { data: reportsData, error: reportsError } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("project_id", shareLink.project_id)
          .order("report_date", { ascending: false });

        if (reportsError) {
          console.error("Error fetching reports:", reportsError);
          setError("Kunde inte hämta dagrapporter");
          setLoading(false);
          return;
        }

        setReports(reportsData || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Ett oväntat fel inträffade");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [token]);

  const toggleReportExpanded = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const parseDeviations = (deviations: Json | null): Deviation[] => {
    if (!deviations) return [];
    if (Array.isArray(deviations)) {
      return deviations.map(d => {
        if (typeof d === 'object' && d !== null && !Array.isArray(d)) {
          return {
            type: String((d as Record<string, unknown>).type || ''),
            description: String((d as Record<string, unknown>).description || '')
          };
        }
        return { type: '', description: '' };
      }).filter(d => d.type || d.description);
    }
    return [];
  };

  const parseAta = (ata: Json | null): { description: string; estimatedHours: number; items?: Array<{ reason: string; consequence: string; estimated_hours: number | null }> } | null => {
    if (!ata || typeof ata !== 'object' || Array.isArray(ata)) return null;
    const ataObj = ata as { description?: string; estimatedHours?: number; has_ata?: boolean; items?: Array<{ reason: string; consequence: string; estimated_hours: number | null }> };
    if (ataObj.description || ataObj.has_ata) {
      return {
        description: ataObj.description || '',
        estimatedHours: ataObj.estimatedHours || 0,
        items: ataObj.items
      };
    }
    return null;
  };

  const handleDownloadPdf = async () => {
    if (!project || reports.length === 0) return;
    
    // Transformera data för PDF-generatorn
    const pdfData = {
      project: {
        name: project.name,
        client_name: project.client_name,
        address: project.address
      },
      reports: reports.map(r => {
        const deviations = parseDeviations(r.deviations);
        const ataData = r.ata as { has_ata?: boolean; items?: Array<{ reason: string; consequence: string; estimated_hours: number | null }> } | null;
        
        return {
          id: r.id,
          report_date: r.report_date,
          headcount: r.headcount,
          roles: r.roles,
          hours_per_person: r.hours_per_person,
          total_hours: r.total_hours,
          work_items: r.work_items,
          deviations: deviations.map(d => ({ type: d.type, description: d.description, hours: null })),
          ata: ataData?.has_ata ? { has_ata: true, items: ataData.items || [] } : null,
          materials_delivered: r.materials_delivered,
          materials_missing: r.materials_missing,
          notes: r.notes
        };
      })
    };
    
    await generateProjectPdf(pdfData);
  };

  // Beräkna statistik
  const totalHours = reports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const totalDeviations = reports.reduce((sum, r) => sum + parseDeviations(r.deviations).length, 0);
  const totalAta = reports.filter(r => parseAta(r.ata)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fel</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">{project?.name}</h1>
            {project?.client_name && (
              <p className="text-lg text-muted-foreground mb-1">
                Beställare: {project.client_name}
              </p>
            )}
            {project?.address && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.address}
              </p>
            )}
            {reports.length > 0 && (
              <Button onClick={handleDownloadPdf} className="mt-4">
                <Download className="h-4 w-4 mr-2" />
                Ladda ner PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Statistik */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Dagrapporter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Totalt arbetade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{totalDeviations}</p>
              <p className="text-sm text-muted-foreground">Avvikelser</p>
            </CardContent>
          </Card>
        </div>

        {/* ÄTA sammanfattning */}
        {totalAta > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                  ÄTA
                </Badge>
                {totalAta} rapport{totalAta > 1 ? 'er' : ''} innehåller ÄTA
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        <Separator className="mb-6" />

        {/* Dagrapporter */}
        <h2 className="text-xl font-semibold mb-4">Dagrapporter</h2>
        
        {reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Inga dagrapporter finns för detta projekt ännu.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const deviations = parseDeviations(report.deviations);
              const ata = parseAta(report.ata);
              const isExpanded = expandedReports.has(report.id);

              return (
                <Card 
                  key={report.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleReportExpanded(report.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(report.report_date), "d MMMM yyyy", { locale: sv })}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {deviations.length > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {deviations.length} avvikelse{deviations.length > 1 ? 'r' : ''}
                          </Badge>
                        )}
                        {ata && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                            ÄTA
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Kompakt vy */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      {report.headcount && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {report.headcount} personer
                        </span>
                      )}
                      {report.total_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {report.total_hours}h
                        </span>
                      )}
                    </div>

                    {/* Kort sammanfattning av arbete */}
                    {report.work_items && report.work_items.length > 0 && !isExpanded && (
                      <p className="text-sm line-clamp-2">
                        {report.work_items.slice(0, 2).map((item, i) => (
                          <span key={i}>• {item}{i < Math.min(report.work_items!.length, 2) - 1 ? ' ' : ''}</span>
                        ))}
                        {report.work_items.length > 2 && <span className="text-muted-foreground"> +{report.work_items.length - 2} till</span>}
                      </p>
                    )}

                    {/* Expanderad vy */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Roller */}
                        {report.roles && report.roles.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Roller på plats</h4>
                            <div className="flex flex-wrap gap-1">
                              {report.roles.map((role, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Utfört arbete */}
                        {report.work_items && report.work_items.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Utfört arbete</h4>
                            <ul className="text-sm space-y-1">
                              {report.work_items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Avvikelser */}
                        {deviations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1 text-amber-700">Avvikelser</h4>
                            <ul className="text-sm space-y-1">
                              {deviations.map((dev, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span>
                                    <strong>{dev.type}:</strong> {dev.description}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* ÄTA */}
                        {ata && (
                          <div className="bg-amber-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium mb-1 text-amber-700">ÄTA</h4>
                            <p className="text-sm">{ata.description}</p>
                            {ata.estimatedHours > 0 && (
                              <p className="text-xs text-amber-600 mt-1">
                                Uppskattad tid: {ata.estimatedHours}h
                              </p>
                            )}
                          </div>
                        )}

                        {/* Material */}
                        {((report.materials_delivered && report.materials_delivered.length > 0) || 
                          (report.materials_missing && report.materials_missing.length > 0)) && (
                          <div className="grid grid-cols-2 gap-4">
                            {report.materials_delivered && report.materials_delivered.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-1 text-green-700">Material levererat</h4>
                                <ul className="text-sm space-y-0.5">
                                  {report.materials_delivered.map((item, i) => (
                                    <li key={i} className="text-green-600">✓ {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {report.materials_missing && report.materials_missing.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-1 text-red-700">Material saknas</h4>
                                <ul className="text-sm space-y-0.5">
                                  {report.materials_missing.map((item, i) => (
                                    <li key={i} className="text-red-600">✗ {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Anteckningar */}
                        {report.notes && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Anteckningar</h4>
                            <p className="text-sm text-muted-foreground">{report.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Genererad projektöversikt</p>
        </div>
      </div>
    </div>
  );
}
