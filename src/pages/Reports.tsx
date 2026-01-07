import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Plus,
  FileText,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  FileCheck,
  Search,
  FileWarning,
  Share2,
  Copy,
  Check,
  Link,
  Download,
  ChevronRight,
} from "lucide-react";
import { generateProjectPdf } from "@/lib/generateProjectPdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportsTableSkeleton } from "@/components/skeletons/ReportsTableSkeleton";
interface DailyReport {
  id: string;
  report_date: string;
  headcount: number | null;
  total_hours: number | null;
  deviations: any[];
  ata: { has_ata: boolean; items: any[] } | null;
  created_at: string;
  project: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

export default function Reports() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const createProjectShareLink = async () => {
    if (selectedProject === "all") return;
    
    setCreatingShareLink(true);
    try {
      const { data: existingLink } = await supabase
        .from("project_share_links")
        .select("token, expires_at")
        .eq("project_id", selectedProject)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (existingLink) {
        setShareLink(`${window.location.origin}/share/project/${existingLink.token}`);
        setShareDialogOpen(true);
        setCreatingShareLink(false);
        return;
      }

      const { data: newLink, error } = await supabase
        .from("project_share_links")
        .insert({ project_id: selectedProject })
        .select("token")
        .single();

      if (error) throw error;

      setShareLink(`${window.location.origin}/share/project/${newLink.token}`);
      setShareDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Kunde inte skapa delningslänk",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingShareLink(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Länk kopierad!",
      description: "Delningslänken har kopierats till urklipp.",
    });
  };

  const handleDownloadPdf = async () => {
    if (selectedProject === "all") return;

    setGeneratingPdf(true);
    try {
      const project = projects.find(p => p.id === selectedProject);
      if (!project) return;

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", selectedProject)
        .maybeSingle();

      const { data: reportsData } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("project_id", selectedProject)
        .order("report_date", { ascending: false });

      if (!projectData || !reportsData) {
        toast({
          title: "Kunde inte hämta data",
          description: "Försök igen senare",
          variant: "destructive",
        });
        return;
      }

      const projectReport = {
        project: {
          name: projectData.name,
          client_name: projectData.client_name,
          address: projectData.address,
        },
        reports: reportsData.map((report) => ({
          id: report.id,
          report_date: report.report_date,
          headcount: report.headcount,
          hours_per_person: report.hours_per_person,
          total_hours: report.total_hours,
          roles: report.roles || [],
          work_items: report.work_items || [],
          deviations: (Array.isArray(report.deviations) ? report.deviations : []) as { type: string; description: string; hours?: number | null }[],
          ata: report.ata as { has_ata: boolean; items: any[] } | null,
          materials_delivered: report.materials_delivered || [],
          materials_missing: report.materials_missing || [],
          notes: report.notes,
        })),
      };

      generateProjectPdf(projectReport);

      toast({
        title: "PDF genererad!",
        description: "Projektets PDF har laddats ner.",
      });
    } catch (error: any) {
      toast({
        title: "Kunde inte generera PDF",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const fetchData = async () => {
    const [reportsRes, projectsRes] = await Promise.all([
      supabase
        .from("daily_reports")
        .select(`
          id,
          report_date,
          headcount,
          total_hours,
          deviations,
          ata,
          created_at,
          project:projects(id, name)
        `)
        .order("report_date", { ascending: false }),
      supabase.from("projects").select("id, name").order("name"),
    ]);

    if (reportsRes.error) {
      toast({
        title: "Kunde inte hämta rapporter",
        description: reportsRes.error.message,
        variant: "destructive",
      });
    } else {
      setReports(reportsRes.data as any || []);
    }

    if (!projectsRes.error) {
      setProjects(projectsRes.data || []);
    }

    setLoading(false);
  };

  const filteredReports = reports.filter((report) => {
    const matchesProject = selectedProject === "all" || report.project?.id === selectedProject;
    const matchesSearch =
      !searchQuery ||
      report.project?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const getDeviationCount = (deviations: any[]) => {
    if (!Array.isArray(deviations)) return 0;
    return deviations.length;
  };

  const getAtaCount = (ata: { has_ata: boolean; items: any[] } | null) => {
    if (!ata?.has_ata || !Array.isArray(ata.items)) return 0;
    return ata.items.length;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Dagrapporter</h1>
          <p className="page-subtitle">Översikt över alla dagrapporter</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedProject !== "all" && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                {generatingPdf ? "Genererar..." : "Ladda ner PDF"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={createProjectShareLink}
                disabled={creatingShareLink}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {creatingShareLink ? "Skapar länk..." : "Dela projekt"}
              </Button>
            </>
          )}
          <Button onClick={() => navigate("/reports/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Ny dagrapport
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Dela projektrapporter
            </DialogTitle>
            <DialogDescription>
              Dela denna länk med beställaren så de kan se alla dagrapporter för projektet.
              Länken är giltig i 30 dagar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={shareLink || ""} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button onClick={copyShareLink} variant="outline" size="icon">
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Beställaren kan se alla dagrapporter, inklusive utfört arbete, avvikelser och ÄTA.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Sök på projektnamn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-48 border-0 bg-card shadow-sm">
            <SelectValue placeholder="Alla projekt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla projekt</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <ReportsTableSkeleton />
      ) : filteredReports.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-medium">Inga rapporter ännu</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            {reports.length === 0
              ? "Skapa din första dagrapport för att komma igång"
              : "Inga rapporter matchar dina filter"}
          </p>
          {reports.length === 0 && (
            <Button className="mt-6" onClick={() => navigate("/reports/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Skapa dagrapport
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28">Datum</TableHead>
                <TableHead>Projekt</TableHead>
                <TableHead className="w-20 text-center">Antal</TableHead>
                <TableHead className="w-20 text-center">Timmar</TableHead>
                <TableHead className="w-24 text-center">Avvikelser</TableHead>
                <TableHead className="w-20 text-center">ÄTA</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const deviationCount = getDeviationCount(report.deviations);
                const ataCount = getAtaCount(report.ata);
                return (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(report.report_date), "d MMM", { locale: sv })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{report.project?.name || "—"}</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {report.headcount ?? "—"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {report.total_hours ? `${report.total_hours}h` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {deviationCount > 0 ? (
                        <Badge variant="warning">{deviationCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {ataCount > 0 ? (
                        <Badge variant="info">{ataCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="success" className="gap-1">
                        <FileCheck className="h-3 w-3" />
                        Sparad
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
