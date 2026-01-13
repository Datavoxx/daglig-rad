import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  FileText, 
  Calculator, 
  CalendarDays, 
  ClipboardCheck,
  MapPin,
  User
} from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  created_at: string;
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasAccess, loading: permissionsLoading } = useUserPermissions();

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching project:", error);
        navigate("/projects");
        return;
      }

      setProject(data);
      setLoading(false);
    };

    fetchProject();
  }, [id, navigate]);

  if (loading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const actions = [
    {
      title: "Dagrapport",
      description: "Skapa eller visa dagrapporter",
      icon: FileText,
      module: "reports",
      onClick: () => navigate(`/reports/new?project=${project.id}`),
    },
    {
      title: "Offert",
      description: "Skapa eller hantera offerter",
      icon: Calculator,
      module: "estimates",
      onClick: () => navigate(`/estimates?project=${project.id}`),
    },
    {
      title: "Planering",
      description: "Projektplanering och tidslinje",
      icon: CalendarDays,
      module: "planning",
      onClick: () => navigate(`/planning?project=${project.id}`),
    },
    {
      title: "Egenkontroll",
      description: "Besiktningar och kontroller",
      icon: ClipboardCheck,
      module: "inspections",
      onClick: () => navigate(`/inspections?project=${project.id}`),
    },
  ];

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
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {project.client_name && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{project.client_name}</span>
              </div>
            )}
            {project.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{project.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium mb-4">Snabbåtgärder</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const canAccess = hasAccess(action.module);
            const ActionIcon = action.icon;

            if (!canAccess) {
              return (
                <Tooltip key={action.title}>
                  <TooltipTrigger asChild>
                    <Card className="opacity-50 cursor-not-allowed">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <ActionIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <CardTitle className="text-base">{action.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Du saknar behörighet till denna modul</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all"
                onClick={action.onClick}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ActionIcon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
