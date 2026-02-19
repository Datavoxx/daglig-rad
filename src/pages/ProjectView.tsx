import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, LayoutDashboard, FileEdit, ClipboardList, FolderOpen, CalendarDays, BookOpen, FileDown, Loader2 } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { generateProjectPdf } from "@/lib/generateProjectPdf";
import { generateCompleteProjectPdf } from "@/lib/generateCompleteProjectPdf";
import { toast } from "sonner";
import ProjectOverviewTab from "@/components/projects/ProjectOverviewTab";
import ProjectAtaTab from "@/components/projects/ProjectAtaTab";
import ProjectWorkOrdersTab from "@/components/projects/ProjectWorkOrdersTab";
import ProjectFilesTab from "@/components/projects/ProjectFilesTab";
import ProjectPlanningTab from "@/components/projects/ProjectPlanningTab";
import ProjectDiaryTab from "@/components/projects/ProjectDiaryTab";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  estimate_id: string | null;
  start_date: string | null;
  budget: number | null;
  status: string | null;
  created_at: string;
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingOverview, setGeneratingOverview] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const { loading: permissionsLoading } = useUserPermissions();

  const handleOverviewPdf = async () => {
    if (!project) return;
    setGeneratingOverview(true);
    try {
      const [
        { data: reports },
        { data: timeEntries },
        { data: ataItems },
        { data: vendorInvoices },
        { data: estimate },
      ] = await Promise.all([
        supabase.from("daily_reports").select("*").eq("project_id", project.id).order("report_date", { ascending: false }),
        supabase.from("time_entries").select("hours, user_id").eq("project_id", project.id),
        supabase.from("project_ata").select("subtotal, status").eq("project_id", project.id),
        supabase.from("vendor_invoices").select("total_inc_vat").eq("project_id", project.id),
        project.estimate_id
          ? supabase.from("project_estimates").select("total_incl_vat").eq("id", project.estimate_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      // Calculate KPI data
      const totalHours = (timeEntries || []).reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
      const uniqueWorkers = new Set((timeEntries || []).map(e => e.user_id)).size;
      const reportCount = (reports || []).length;
      const ataCount = (ataItems || []).length;
      const ataTotal = (ataItems || []).reduce((sum, a) => sum + (Number(a.subtotal) || 0), 0);
      const expensesTotal = (vendorInvoices || []).reduce((sum, v) => sum + (Number(v.total_inc_vat) || 0), 0);
      const quoteValue = Number(estimate?.total_incl_vat) || 0;
      const marginPercent = quoteValue > 0 ? ((quoteValue - expensesTotal) / quoteValue) * 100 : 0;

      await generateProjectPdf({
        project: { name: project.name, client_name: project.client_name, address: project.address },
        reports: (reports || []) as any,
        kpiData: {
          totalHours,
          uniqueWorkers,
          reportCount,
          marginPercent,
          ataCount,
          ataTotal,
          expensesTotal,
          quoteValue,
        },
      });
      toast.success("Översikts-PDF skapad");
    } catch (e) {
      console.error(e);
      toast.error("Kunde inte skapa PDF");
    } finally {
      setGeneratingOverview(false);
    }
  };

  const handleSummaryPdf = async () => {
    if (!project) return;
    setGeneratingSummary(true);
    try {
      const [
        { data: estimate },
        { data: ataItems },
        { data: diaryReports },
        { data: timeEntries },
        { data: workOrders },
        { data: projectFiles },
        { data: vendorInvoices },
        { data: companySettings },
      ] = await Promise.all([
        supabase.from("project_estimates").select("*").eq("project_id", project.id).maybeSingle(),
        supabase.from("project_ata").select("*").eq("project_id", project.id).order("sort_order"),
        supabase.from("daily_reports").select("*").eq("project_id", project.id).order("report_date", { ascending: false }),
        supabase.from("time_entries").select("*").eq("project_id", project.id).order("date", { ascending: false }),
        supabase.from("project_work_orders").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
        supabase.from("project_files").select("*").eq("project_id", project.id),
        supabase.from("vendor_invoices").select("*").eq("project_id", project.id),
        supabase.from("company_settings").select("*").limit(1).maybeSingle(),
      ]);

      let estimateItems: any[] = [];
      if (estimate) {
        const { data } = await supabase.from("estimate_items").select("*").eq("estimate_id", estimate.id).order("sort_order");
        estimateItems = data || [];
      }

      let plan = null;
      const { data: planData } = await supabase.from("project_plans").select("*").eq("project_id", project.id).maybeSingle();
      if (planData) {
        plan = { ...planData, phases: (planData.phases as any) || [] };
      }

      await generateCompleteProjectPdf({
        project,
        estimate: estimate as any,
        estimateItems: estimateItems as any,
        ataItems: (ataItems || []) as any,
        plan: plan as any,
        diaryReports: (diaryReports || []) as any,
        timeEntries: (timeEntries || []) as any,
        workOrders: (workOrders || []) as any,
        projectFiles: (projectFiles || []) as any,
        vendorInvoices: (vendorInvoices || []) as any,
        companySettings: companySettings as any,
      });
      toast.success("Summerings-PDF skapad");
    } catch (e) {
      console.error(e);
      toast.error("Kunde inte skapa PDF");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const fetchProject = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching project:", error);
      navigate("/projects");
      return;
    }

    if (!data) {
      navigate("/projects");
      return;
    }

    setProject(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [id, navigate]);

  if (loading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
          className="mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1 flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {project.client_name && <span>{project.client_name}</span>}
            {project.address && <span>{project.address}</span>}
            {project.status && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {project.status === 'planning' ? 'Planering' : 
                 project.status === 'active' ? 'Pågående' : 
                 project.status === 'closing' ? 'Slutskede' :
                 project.status === 'completed' ? 'Avslutat' : project.status}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleOverviewPdf} disabled={generatingOverview}>
                {generatingOverview ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                <span className="hidden sm:inline">Översikt</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ladda ner översikts-PDF med dagrapporter</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleSummaryPdf} disabled={generatingSummary}>
                {generatingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                <span className="hidden sm:inline">Summering</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ladda ner komplett projektsammanfattning som PDF</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide bg-transparent border-b border-border rounded-none p-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="overview" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
                <LayoutDashboard className="h-4 w-4 transition-transform group-data-[state=active]:scale-110" />
                <span>Översikt</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Översikt</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="ata" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
                <FileEdit className="h-4 w-4" />
                <span>ÄTA</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">ÄTA</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="workorders" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
                <ClipboardList className="h-4 w-4" />
                <span>Arbetsorder</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Arbetsorder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="files" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
                <FolderOpen className="h-4 w-4" />
                <span>Filer</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Filer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="planning" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
                <CalendarDays className="h-4 w-4" />
                <span>Planering</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Planering</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="diary" className="flex items-center gap-1.5 min-w-fit tab-active-glow hover:bg-muted/50 py-2 px-3">
                <BookOpen className="h-4 w-4" />
                <span>Dagbok</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Dagbok</TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProjectOverviewTab project={project} onUpdate={fetchProject} />
        </TabsContent>

        <TabsContent value="ata" className="mt-6">
          <ProjectAtaTab 
            projectId={project.id} 
            projectName={project.name}
            clientName={project.client_name || undefined}
            projectAddress={project.address || undefined}
            projectPostalCode={project.postal_code || undefined}
            projectCity={project.city || undefined}
          />
        </TabsContent>

        <TabsContent value="workorders" className="mt-6">
          <ProjectWorkOrdersTab projectId={project.id} projectName={project.name} estimateId={project.estimate_id} />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <ProjectFilesTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <ProjectPlanningTab projectId={project.id} projectName={project.name} />
        </TabsContent>

        <TabsContent value="diary" className="mt-6">
          <ProjectDiaryTab projectId={project.id} projectName={project.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
