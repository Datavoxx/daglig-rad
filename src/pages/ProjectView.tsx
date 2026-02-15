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
import { ArrowLeft, LayoutDashboard, FileEdit, ClipboardList, FolderOpen, CalendarDays, BookOpen } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
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
  const { loading: permissionsLoading } = useUserPermissions();

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
        <div className="space-y-1 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide bg-transparent border-b border-border rounded-none p-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="overview" className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)] hover:bg-muted/50 py-2 px-3">
                <LayoutDashboard className="h-4 w-4 transition-transform group-data-[state=active]:scale-110" />
                <span>Översikt</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Översikt</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="ata" className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)] hover:bg-muted/50 py-2 px-3">
                <FileEdit className="h-4 w-4" />
                <span>ÄTA</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">ÄTA</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="workorders" className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)] hover:bg-muted/50 py-2 px-3">
                <ClipboardList className="h-4 w-4" />
                <span>Arbetsorder</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Arbetsorder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="files" className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)] hover:bg-muted/50 py-2 px-3">
                <FolderOpen className="h-4 w-4" />
                <span>Filer</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Filer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="planning" className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)] hover:bg-muted/50 py-2 px-3">
                <CalendarDays className="h-4 w-4" />
                <span>Planering</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Planering</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="diary" className="flex items-center gap-1.5 min-w-fit data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:rounded-md data-[state=active]:shadow-[0_0_12px_hsl(142_69%_45%_/_0.25)] hover:bg-muted/50 py-2 px-3">
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
