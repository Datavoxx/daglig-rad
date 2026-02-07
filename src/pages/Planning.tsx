import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarDays, Mic, MicOff, Loader2, Plus, Sparkles, Download, AlertCircle, Trash2, List, BarChart3 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { GanttTimeline, type PlanPhase } from "@/components/planning/GanttTimeline";
import { PlanEditor } from "@/components/planning/PlanEditor";
import { PlanningSkeleton } from "@/components/skeletons/PlanningSkeleton";
import { generatePlanningPdf } from "@/lib/generatePlanningPdf";
import { format, addWeeks, addDays, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlanningMobileOverview } from "@/components/planning/PlanningMobileOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

type ViewState = "empty" | "input" | "review" | "view";

interface GeneratedPlan {
  phases: PlanPhase[];
  total_weeks: number;
  confidence: number;
  summary: string;
}

// Calculate next Monday from a date
const getNextMonday = (date: Date): Date => {
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const nextMonday = new Date(date);
  nextMonday.setDate(date.getDate() + daysUntilMonday);
  return nextMonday;
};

// Calculate end date (Friday after X weeks)
const getEndDate = (start: Date, weeks: number): Date => {
  const lastWeekStart = addWeeks(start, weeks - 1);
  return addDays(lastWeekStart, 4); // Monday + 4 = Friday
};

export default function Planning() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [mobileViewMode, setMobileViewMode] = useState<"list" | "timeline">("list");
  
  const {
    isRecording,
    isTranscribing,
    interimTranscript,
    startRecording,
    stopRecording,
    isSupported,
    isIOSDevice,
  } = useVoiceRecorder({
    agentName: "Byggio AI",
    onTranscriptUpdate: (newTranscript) => {
      setTranscript(newTranscript);
    },
    onTranscriptComplete: (completedTranscript) => {
      setTranscript(completedTranscript);
    },
  });

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", userData.user.id)
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
      // Load saved start date
      if ((existingPlan as any).start_date) {
        setStartDate(parseISO((existingPlan as any).start_date));
      } else {
        setStartDate(undefined);
      }
    } else if (selectedProjectId) {
      setViewState("empty");
      setStartDate(undefined);
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
        start_date: startDate ? startDate.toISOString().split('T')[0] : null,
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

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("project_plans")
        .delete()
        .eq("project_id", selectedProjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-plan", selectedProjectId] });
      setGeneratedPlan(null);
      setTranscript("");
      setViewState("empty");
      toast.success("Planeringen har raderats");
    },
    onError: (error) => {
      console.error("Failed to delete plan:", error);
      toast.error("Kunde inte radera planeringen");
    },
  });

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
      
      // Check if AI needs more information
      if (data.needs_more_info) {
        toast.error("Beskrivningen är för vag", {
          description: data.example || "Beskriv vilka arbetsmoment som ska utföras och ungefär när de ska ske.",
          duration: 10000,
        });
        return; // Stay in input state
      }
      
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
        startDate: startDate,
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
    setStartDate(getNextMonday(new Date())); // Default to next Monday
    setViewState("input");
  };

  // Calculate end date for display
  const endDate = startDate && generatedPlan 
    ? getEndDate(startDate, generatedPlan.total_weeks) 
    : undefined;

  // Construct displayed transcript
  const displayedTranscript = isIOSDevice 
    ? transcript 
    : transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '');


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
      <div className="space-y-1.5">
        <Label>Välj projekt</Label>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-full sm:w-[280px]">
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
            <div className="relative">
              <Textarea
                value={displayedTranscript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                }}
                placeholder="T.ex. 'Rivning först, sen stomme, el och VVS parallellt, sen ytskikt. Totalt runt 6 veckor.'"
                className="min-h-[150px] resize-none pr-24"
                disabled={isRecording || isTranscribing || isGenerating}
              />
              {(isRecording || isTranscribing) && (
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium animate-pulse">
                  {isTranscribing ? "Transkriberar..." : "Lyssnar..."}
                </div>
              )}
            </div>

            {!isSupported && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>Din webbläsare stöder inte röstinspelning. Prova Chrome eller Edge.</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isGenerating || isTranscribing || !isSupported}
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transkriberar...
                  </>
                ) : isRecording ? (
                  <>
                    <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />
                    <MicOff className="h-4 w-4 mr-2" />
                    Stoppa inspelning
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Spela in {isIOSDevice ? "" : "(realtid)"}
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
          startDate={startDate}
          onStartDateChange={setStartDate}
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
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>{selectedProject?.name}</CardTitle>
              <CardDescription>
                {startDate && endDate ? (
                  <>
                    {format(startDate, "d MMMM", { locale: sv })} → {format(endDate, "d MMMM yyyy", { locale: sv })}
                    {" • "}
                  </>
                ) : null}
                {generatedPlan.summary || `${generatedPlan.phases.length} moment över ${generatedPlan.total_weeks} veckor`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size={isMobile ? "sm" : "default"} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Radera</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Radera planering?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Detta kommer permanent radera planeringen för {selectedProject?.name}. 
                      Du kan sedan skapa en helt ny planering från grunden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deletePlanMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletePlanMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Raderar...
                        </>
                      ) : (
                        "Ja, radera"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleEditPlan}>
                Redigera
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <Tabs value={mobileViewMode} onValueChange={(v) => setMobileViewMode(v as "list" | "timeline")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="list" className="text-xs">
                    <List className="h-4 w-4 mr-1.5" />
                    Översikt
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Tidslinje
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="mt-0">
                  <PlanningMobileOverview
                    phases={generatedPlan.phases}
                    totalWeeks={generatedPlan.total_weeks}
                    startDate={startDate}
                  />
                </TabsContent>
                <TabsContent value="timeline" className="mt-0">
                  <div className="text-xs text-muted-foreground text-center mb-2">
                    ← Dra åt sidan för att se hela tidslinjen →
                  </div>
                  <GanttTimeline
                    phases={generatedPlan.phases}
                    totalWeeks={generatedPlan.total_weeks}
                    startDate={startDate}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <GanttTimeline
                phases={generatedPlan.phases}
                totalWeeks={generatedPlan.total_weeks}
                startDate={startDate}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
