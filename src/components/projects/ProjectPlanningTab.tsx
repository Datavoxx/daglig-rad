import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Mic, MicOff, Loader2, Download, Pencil, Trash2, Sparkles } from "lucide-react";
import { AI_AGENTS } from "@/config/aiAgents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GanttTimeline } from "@/components/planning/GanttTimeline";
import { PlanEditor } from "@/components/planning/PlanEditor";
import { generatePlanningPdf } from "@/lib/generatePlanningPdf";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Json } from "@/integrations/supabase/types";

interface PlanPhase {
  name: string;
  start_week: number;
  duration_weeks: number;
  color: string;
  parallel?: number;
  description?: string;
}

interface ProjectPlan {
  id: string;
  phases: PlanPhase[];
  total_weeks: number;
  start_date: string | null;
  notes: string | null;
}

interface ProjectPlanningTabProps {
  projectId: string;
  projectName: string;
}

type ViewState = "empty" | "input" | "generating" | "review" | "view";

function parsePhasesFromJson(json: Json): PlanPhase[] {
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      return {
        name: String(item.name || ""),
        start_week: Number(item.start_week || 1),
        duration_weeks: Number(item.duration_weeks || 1),
        color: String(item.color || "slate"),
        parallel: item.parallel ? Number(item.parallel) : undefined,
        description: item.description ? String(item.description) : undefined,
      };
    }
    return { name: "", start_week: 1, duration_weeks: 1, color: "slate" };
  });
}

function phasesToJson(phases: PlanPhase[]): Json {
  return phases.map((phase) => ({
    name: phase.name,
    start_week: phase.start_week,
    duration_weeks: phase.duration_weeks,
    color: phase.color,
    ...(phase.parallel !== undefined && { parallel: phase.parallel }),
    ...(phase.description !== undefined && { description: phase.description }),
  })) as Json;
}

export default function ProjectPlanningTab({ projectId, projectName }: ProjectPlanningTabProps) {
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [generatedPhases, setGeneratedPhases] = useState<PlanPhase[]>([]);
  const [generatedTotalWeeks, setGeneratedTotalWeeks] = useState(0);
  const [generatedConfidence, setGeneratedConfidence] = useState(0);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [startDate, setStartDate] = useState<Date>(getNextMonday(new Date()));
  const { toast } = useToast();

  useEffect(() => {
    fetchPlan();
  }, [projectId]);

  function getNextMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

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
      setPlan({
        id: data.id,
        phases: parsePhasesFromJson(data.phases),
        total_weeks: data.total_weeks || 0,
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

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast({ title: "Taligenkänning stöds inte", variant: "destructive" });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "sv-SE";

    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        }
      }
      if (final) {
        setTranscript((prev) => prev + final);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
    (window as any).currentRecognition = recognition;
  };

  const stopRecording = () => {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
    setIsRecording(false);
  };

  const handleGeneratePlan = async () => {
    if (!transcript.trim()) {
      toast({ title: "Beskriv projektet först", variant: "destructive" });
      return;
    }

    setViewState("generating");

    try {
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { transcript },
      });

      if (error) throw error;

      setGeneratedPhases(data.phases || []);
      setGeneratedTotalWeeks(data.total_weeks || 0);
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
    // Recalculate total weeks
    const maxEnd = phases.reduce((max, phase) => {
      const end = phase.start_week + phase.duration_weeks - 1;
      return Math.max(max, end);
    }, 0);
    setGeneratedTotalWeeks(maxEnd);
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
      total_weeks: generatedTotalWeeks,
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
        totalWeeks: plan.total_weeks,
        summary: plan.notes || "",
        startDate,
      });
      toast({ title: "PDF genererad" });
    } catch (error) {
      toast({ title: "Kunde inte generera PDF", variant: "destructive" });
    }
  };

  // Empty state
  if (viewState === "empty") {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium">Ingen planering ännu</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Beskriv projektet med röst eller text för att skapa en projektplan
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
        
        {/* Bo AI prompt */}
        <div 
          className="flex items-center gap-4 p-4 bg-primary/5 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={isRecording ? stopRecording : startRecording}
        >
          <img 
            src={AI_AGENTS.planning.avatar}
            alt="Bo AI"
            className="w-32 h-32 object-contain drop-shadow-lg"
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Mic className="h-5 w-5" />
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Låt Bo AI hjälpa dig</span>
            </div>
            <span className="text-sm text-muted-foreground">Beskriv planen med rösten</span>
            {isRecording && (
              <span className="text-xs text-destructive animate-pulse">● Spelar in...</span>
            )}
          </div>
        </div>

        <Textarea
          placeholder="Beskriv projektets faser, t.ex. 'Rivning 2 veckor, sedan stomme och grundarbete 4 veckor...'"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
        />
        <div className="flex items-center gap-3">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {isRecording ? "Stoppa" : "Spela in"}
          </Button>
          <Button onClick={handleGeneratePlan} disabled={!transcript.trim()}>
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
        totalWeeks={generatedTotalWeeks}
        confidence={generatedConfidence}
        summary={generatedSummary}
        startDate={startDate}
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Projektplanering</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedPhases(plan.phases);
                setGeneratedTotalWeeks(plan.total_weeks);
                setGeneratedConfidence(100);
                setGeneratedSummary(plan.notes || "");
                setViewState("review");
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Redigera
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Ta bort
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

        <GanttTimeline
          phases={plan.phases}
          totalWeeks={plan.total_weeks}
          startDate={startDate}
        />
      </div>
    );
  }

  return null;
}
