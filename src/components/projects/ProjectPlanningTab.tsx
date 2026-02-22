import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Loader2, Download, Pencil, Trash2, Sparkles } from "lucide-react";
import { AI_AGENTS } from "@/config/aiAgents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { GanttTimeline, normalizePhaseToDays } from "@/components/planning/GanttTimeline";
import { PlanningMobileOverview } from "@/components/planning/PlanningMobileOverview";
import { PlanEditor } from "@/components/planning/PlanEditor";
import { generatePlanningPdf } from "@/lib/generatePlanningPdf";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Json } from "@/integrations/supabase/types";
import type { PlanPhase } from "@/components/planning/GanttTimeline";

interface ProjectPlan {
  id: string;
  phases: PlanPhase[];
  total_days: number;
  start_date: string | null;
  notes: string | null;
}

interface ProjectPlanningTabProps {
  projectId: string;
  projectName: string;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

type ViewState = "empty" | "input" | "generating" | "review" | "view";

function parsePhasesFromJson(json: Json): PlanPhase[] {
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const phase = normalizePhaseToDays(item);
      return {
        name: String(phase.name || ""),
        start_day: Number(phase.start_day || 1),
        duration_days: Number(phase.duration_days || 1),
        color: String(phase.color || "slate"),
        description: phase.description ? String(phase.description) : undefined,
      };
    }
    return { name: "", start_day: 1, duration_days: 1, color: "slate" };
  });
}

function phasesToJson(phases: PlanPhase[]): Json {
  return phases.map((phase) => ({
    name: phase.name,
    start_day: phase.start_day,
    duration_days: phase.duration_days,
    color: phase.color,
    ...(phase.description !== undefined && { description: phase.description }),
  })) as Json;
}

export default function ProjectPlanningTab({ projectId, projectName, projectStartDate, projectEndDate }: ProjectPlanningTabProps) {
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [transcript, setTranscript] = useState("");
  const [generatedPhases, setGeneratedPhases] = useState<PlanPhase[]>([]);
  const [generatedTotalDays, setGeneratedTotalDays] = useState(0);
  const [generatedConfidence, setGeneratedConfidence] = useState(0);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [startDate, setStartDate] = useState<Date>(
    projectStartDate ? new Date(projectStartDate) : new Date()
  );
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchPlan();
  }, [projectId]);

  const fetchPlan = async () => {
    const { data, error } = await supabase
      .from("project_plans")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching plan:", error);
      return;
    }

    if (data) {
      const phases = parsePhasesFromJson(data.phases);
      const totalDays = (data as any).total_days || (data.total_weeks ? data.total_weeks * 5 : 
        Math.max(...phases.map(p => p.start_day + p.duration_days - 1), 0));
      setPlan({
        id: data.id,
        phases,
        total_days: totalDays,
        start_date: data.start_date,
        notes: data.notes,
      });
      if (data.start_date) {
        setStartDate(new Date(data.start_date));
      }
      setViewState("view");
    } else {
      setViewState("empty");
    }
  };

  const handleGeneratePlan = async () => {
    if (!transcript.trim()) {
      toast({ title: "Beskriv projektet först", variant: "destructive" });
      return;
    }

    setViewState("generating");

    try {
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { 
          transcript,
          project_name: projectName,
          start_date: projectStartDate || startDate.toISOString().split("T")[0],
          end_date: projectEndDate || undefined,
        },
      });

      if (error) throw error;

      if (data.needs_more_info) {
        toast({ title: "Beskrivningen är för vag", description: data.example, variant: "destructive" });
        setViewState("input");
        return;
      }

      const phases = (data.phases || []).map(normalizePhaseToDays);
      setGeneratedPhases(phases);
      setGeneratedTotalDays(data.total_days || data.total_weeks * 5 || 0);
      setGeneratedConfidence(data.confidence || 0);
      setGeneratedSummary(data.summary || "");
      setViewState("review");
    } catch (error: any) {
      toast({ title: "Kunde inte generera plan", description: error.message, variant: "destructive" });
      setViewState("input");
    }
  };

  const handlePhasesChange = (phases: PlanPhase[]) => {
    setGeneratedPhases(phases);
    const maxEnd = phases.reduce((max, phase) => {
      const end = (phase.start_day || 1) + (phase.duration_days || 1) - 1;
      return Math.max(max, end);
    }, 0);
    setGeneratedTotalDays(maxEnd);
  };

  const handleSavePlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      return;
    }

    const planData = {
      project_id: projectId,
      user_id: user.id,
      phases: phasesToJson(generatedPhases),
      total_days: generatedTotalDays,
      total_weeks: Math.ceil(generatedTotalDays / 5),
      start_date: startDate.toISOString().split("T")[0],
      original_transcript: transcript,
    };

    if (plan?.id) {
      const { error } = await supabase
        .from("project_plans")
        .update(planData)
        .eq("id", plan.id);

      if (error) {
        toast({ title: "Kunde inte uppdatera", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("project_plans").insert(planData);

      if (error) {
        toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Plan sparad" });
    fetchPlan();
  };

  const handleDeletePlan = async () => {
    if (!plan?.id) return;

    const { error } = await supabase.from("project_plans").delete().eq("id", plan.id);

    if (error) {
      toast({ title: "Kunde inte ta bort", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Plan borttagen" });
    setPlan(null);
    setTranscript("");
    setGeneratedPhases([]);
    setViewState("empty");
  };

  const handleDownloadPdf = async () => {
    if (!plan) return;

    try {
      await generatePlanningPdf({
        projectName,
        phases: plan.phases,
        totalWeeks: Math.ceil(plan.total_days / 5),
        summary: plan.notes || "",
        startDate,
      });
      toast({ title: "PDF genererad" });
    } catch (error) {
      toast({ title: "Kunde inte generera PDF", variant: "destructive" });
    }
  };

  const endDate = projectEndDate ? new Date(projectEndDate) : undefined;

  // Empty state
  if (viewState === "empty") {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium">Ingen planering ännu</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Beskriv projektet med text för att skapa en projektplan
        </p>
        <Button className="mt-4" onClick={() => setViewState("input")}>
          Skapa planering
        </Button>
      </Card>
    );
  }

  // Input state
  if (viewState === "input") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Beskriv projektet</h3>
          <Button variant="ghost" onClick={() => setViewState("empty")}>Avbryt</Button>
        </div>
        
        <div className="relative">
          <Textarea
            placeholder="Beskriv projektets faser, t.ex. 'Rivning 3 dagar, sedan stomme och grundarbete 10 dagar...'"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleGeneratePlan} disabled={!transcript.trim()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generera plan
          </Button>
        </div>
      </div>
    );
  }

  // Generating state
  if (viewState === "generating") {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Genererar projektplan...</p>
      </Card>
    );
  }

  // Review state
  if (viewState === "review") {
    return (
      <PlanEditor
        phases={generatedPhases}
        totalDays={generatedTotalDays}
        confidence={generatedConfidence}
        summary={generatedSummary}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onPhasesChange={handlePhasesChange}
        onApprove={handleSavePlan}
        onCancel={() => setViewState("input")}
      />
    );
  }

  // View state
  if (viewState === "view" && plan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-medium">Projektplanering</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedPhases(plan.phases);
                setGeneratedTotalDays(plan.total_days);
                setGeneratedConfidence(100);
                setGeneratedSummary(plan.notes || "");
                setViewState("review");
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Redigera</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ta bort</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort planering?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta går inte att ångra. All planering för projektet kommer att raderas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePlan}>Ta bort</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {isMobile ? (
          <PlanningMobileOverview
            phases={plan.phases}
            totalDays={plan.total_days}
            startDate={startDate}
          />
        ) : (
          <GanttTimeline
            phases={plan.phases}
            totalDays={plan.total_days}
            startDate={startDate}
          />
        )}
      </div>
    );
  }

  return null;
}
