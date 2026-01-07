import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarDays, Mic, MicOff, Loader2, ArrowLeft, Plus, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { GanttTimeline, type PlanPhase } from "@/components/planning/GanttTimeline";
import { PlanEditor } from "@/components/planning/PlanEditor";
import { PlanningSkeleton } from "@/components/skeletons/PlanningSkeleton";
import { generatePlanningPdf } from "@/lib/generatePlanningPdf";

type ViewState = "empty" | "input" | "review" | "view";

interface GeneratedPlan {
  phases: PlanPhase[];
  total_weeks: number;
  confidence: number;
  summary: string;
}

export default function Planning() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing plan for selected project
  const { data: existingPlan, isLoading: planLoading } = useQuery({
    queryKey: ["project-plan", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data, error } = await supabase
        .from("project_plans")
        .select("*")
        .eq("project_id", selectedProjectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // Update view state when plan data changes
  useEffect(() => {
    if (existingPlan) {
      setViewState("view");
      setGeneratedPlan({
        phases: (existingPlan.phases as unknown as PlanPhase[]) || [],
        total_weeks: existingPlan.total_weeks || 0,
        confidence: 1,
        summary: existingPlan.notes || "",
      });
    } else if (selectedProjectId) {
      setViewState("empty");
    }
  }, [existingPlan, selectedProjectId]);

  // Save plan mutation
  const savePlanMutation = useMutation({
    mutationFn: async (plan: GeneratedPlan) => {
      // Check if plan exists first
      const { data: existing } = await supabase
        .from("project_plans")
        .select("id")
        .eq("project_id", selectedProjectId)
        .maybeSingle();

      const planData = {
        phases: JSON.parse(JSON.stringify(plan.phases)),
        total_weeks: plan.total_weeks,
        notes: plan.summary,
        original_transcript: transcript,
      };

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("project_plans")
          .update(planData)
          .eq("project_id", selectedProjectId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("project_plans")
          .insert({
            ...planData,
            project_id: selectedProjectId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-plan", selectedProjectId] });
      toast.success("Planeringen har sparats");
      setViewState("view");
    },
    onError: (error) => {
      console.error("Failed to save plan:", error);
      toast.error("Kunde inte spara planeringen");
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Kunde inte starta inspelningen. Kontrollera mikrofonbehörigheter.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsGenerating(true);
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        if (error) throw error;
        if (data?.text) {
          setTranscript((prev) => prev ? `${prev}\n${data.text}` : data.text);
        }
        setIsGenerating(false);
      };
    } catch (error) {
      console.error("Transcription failed:", error);
      toast.error("Kunde inte transkribera ljudet");
      setIsGenerating(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!transcript.trim()) {
      toast.error("Skriv eller spela in en beskrivning först");
      return;
    }

    const selectedProject = projects?.find((p) => p.id === selectedProjectId);

    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { 
          transcript, 
          project_name: selectedProject?.name 
        },
      });

      if (error) throw error;
      
      setGeneratedPlan(data);
      setViewState("review");
    } catch (error: any) {
      console.error("Failed to generate plan:", error);
      toast.error(error.message || "Kunde inte generera planeringen");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    if (generatedPlan) {
      savePlanMutation.mutate(generatedPlan);
    }
  };

  const handleEditPlan = () => {
    setViewState("review");
  };

  const handleDownloadPdf = async () => {
    if (!generatedPlan || !selectedProject) return;
    
    try {
      await generatePlanningPdf({
        projectName: selectedProject.name,
        phases: generatedPlan.phases,
        totalWeeks: generatedPlan.total_weeks,
        summary: generatedPlan.summary,
      });
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  const handleCreateNew = () => {
    setTranscript("");
    setGeneratedPlan(null);
    setViewState("input");
  };

  if (projectsLoading) {
    return (
      <div className="page-transition p-6 max-w-5xl mx-auto">
        <PlanningSkeleton />
      </div>
    );
  }

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return (
    <div className="page-transition p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planering</h1>
        <p className="text-muted-foreground">
          Skapa en grov tidsplan för ditt projekt
        </p>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-4">
        <div className="space-y-1.5">
          <Label>Välj projekt</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Välj ett projekt" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state - no project selected */}
      {!selectedProjectId && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Välj ett projekt</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Välj ett projekt ovan för att se eller skapa en tidsplan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading plan */}
      {selectedProjectId && planLoading && <PlanningSkeleton />}

      {/* Empty state - no plan exists */}
      {selectedProjectId && !planLoading && viewState === "empty" && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen planering ännu</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Skapa en grov tidsplan för projektet. Prata eller skriv hur du tror att projektet kommer genomföras.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa planering
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Input state */}
      {viewState === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>Beskriv planeringen</CardTitle>
            <CardDescription>
              Berätta fritt hur du tror att projektet kommer genomföras. Nämn faser, uppskattade tider och vad som kan ske parallellt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="T.ex. 'Rivning först, sen stomme, el och VVS parallellt, sen ytskikt. Totalt runt 6 veckor.'"
              className="min-h-[150px] resize-none"
              disabled={isRecording || isGenerating}
            />

            <div className="flex items-center gap-3">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isGenerating}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stoppa inspelning
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Spela in
                  </>
                )}
              </Button>

              <div className="flex-1" />

              <Button
                variant="outline"
                onClick={() => setViewState("empty")}
                disabled={isGenerating}
              >
                Avbryt
              </Button>

              <Button
                onClick={handleGeneratePlan}
                disabled={!transcript.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generera planering
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review state */}
      {viewState === "review" && generatedPlan && (
        <PlanEditor
          phases={generatedPlan.phases}
          totalWeeks={generatedPlan.total_weeks}
          confidence={generatedPlan.confidence}
          summary={generatedPlan.summary}
          onPhasesChange={(phases) => {
            const maxEnd = Math.max(...phases.map((p) => p.start_week + p.duration_weeks - 1));
            setGeneratedPlan({ ...generatedPlan, phases, total_weeks: maxEnd });
          }}
          onApprove={handleApprove}
          onCancel={() => setViewState("input")}
          isLoading={savePlanMutation.isPending}
        />
      )}

      {/* View state - show saved plan */}
      {viewState === "view" && generatedPlan && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{selectedProject?.name}</CardTitle>
              <CardDescription>
                {generatedPlan.summary || `${generatedPlan.phases.length} moment över ${generatedPlan.total_weeks} veckor`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Ladda ner PDF
              </Button>
              <Button variant="outline" onClick={handleEditPlan}>
                Redigera
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GanttTimeline
              phases={generatedPlan.phases}
              totalWeeks={generatedPlan.total_weeks}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
