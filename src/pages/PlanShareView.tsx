import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  AlertTriangle, 
  Building2,
  Download,
  Clock
} from "lucide-react";
import { format, parseISO, addWeeks, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import { GanttTimeline, type PlanPhase } from "@/components/planning/GanttTimeline";
import { generatePlanningPdf } from "@/lib/generatePlanningPdf";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
}

interface ProjectPlan {
  id: string;
  phases: PlanPhase[];
  total_weeks: number | null;
  notes: string | null;
  start_date: string | null;
}

// Calculate end date (Friday after X weeks)
const getEndDate = (start: Date, weeks: number): Date => {
  const lastWeekStart = addWeeks(start, weeks - 1);
  return addDays(lastWeekStart, 4); // Monday + 4 = Friday
};

export default function PlanShareView() {
  const { token } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!token) {
        setError("Ogiltig delningslänk");
        setLoading(false);
        return;
      }

      try {
        // Fetch the share link
        const { data: shareLink, error: shareLinkError } = await supabase
          .from("plan_share_links")
          .select("project_id, expires_at")
          .eq("token", token)
          .single();

        if (shareLinkError || !shareLink) {
          setError("Delningslänken hittades inte eller har utgått");
          setLoading(false);
          return;
        }

        // Check expiry
        if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
          setError("Delningslänken har utgått");
          setLoading(false);
          return;
        }

        // Fetch the project
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

        // Fetch the plan
        const { data: planData, error: planError } = await supabase
          .from("project_plans")
          .select("id, phases, total_weeks, notes, start_date")
          .eq("project_id", shareLink.project_id)
          .single();

        if (planError || !planData) {
          setError("Ingen planering hittades för detta projekt");
          setLoading(false);
          return;
        }

        setPlan({
          ...planData,
          phases: (planData.phases as unknown as PlanPhase[]) || [],
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Ett oväntat fel inträffade");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!project || !plan) return;
    
    const startDate = plan.start_date ? parseISO(plan.start_date) : undefined;
    
    try {
      await generatePlanningPdf({
        projectName: project.name,
        phases: plan.phases,
        totalWeeks: plan.total_weeks || 0,
        summary: plan.notes || undefined,
        startDate,
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  const startDate = plan?.start_date ? parseISO(plan.start_date) : undefined;
  const endDate = startDate && plan?.total_weeks 
    ? getEndDate(startDate, plan.total_weeks) 
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">{project?.name}</h1>
            <p className="text-lg text-muted-foreground mb-1">Projektplanering</p>
            {project?.client_name && (
              <p className="text-sm text-muted-foreground">
                Beställare: {project.client_name}
              </p>
            )}
            <Button onClick={handleDownloadPdf} className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              Ladda ner PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{plan?.phases.length || 0}</p>
              <p className="text-sm text-muted-foreground">Moment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{plan?.total_weeks || 0}</p>
              <p className="text-sm text-muted-foreground">Veckor totalt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              {startDate && endDate ? (
                <>
                  <p className="text-lg font-bold">
                    {format(startDate, "d MMM", { locale: sv })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → {format(endDate, "d MMM yyyy", { locale: sv })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-sm text-muted-foreground">Datum ej satt</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {plan?.notes && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sammanfattning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{plan.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Gantt Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Tidslinje</CardTitle>
          </CardHeader>
          <CardContent>
            {plan && (
              <GanttTimeline
                phases={plan.phases}
                totalWeeks={plan.total_weeks || 0}
                startDate={startDate}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
