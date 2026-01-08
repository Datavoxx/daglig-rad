import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarDays, Mic, MicOff, Loader2, Plus, Sparkles, Download, Share2, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GanttTimeline, type PlanPhase } from "@/components/planning/GanttTimeline";
import { PlanEditor } from "@/components/planning/PlanEditor";
import { PlanningSkeleton } from "@/components/skeletons/PlanningSkeleton";
import { generatePlanningPdf } from "@/lib/generatePlanningPdf";
import { format, addWeeks, addDays, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Web Speech API refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");
  
  // Check if Web Speech API is supported
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

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

  const startRecording = () => {
    if (!isSpeechRecognitionSupported) {
      toast.error("Din webbläsare stöder inte röstinspelning. Prova Chrome eller Edge.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.lang = 'sv-SE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Store current transcript as starting point
    finalTranscriptRef.current = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final.trim();
        setTranscript(finalTranscriptRef.current);
      }
      
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.info("Ingen röst upptäcktes. Fortsätt prata...");
      } else if (event.error !== 'aborted') {
        toast.error("Röstinspelningen avbröts. Försök igen.");
      }
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      // Restart if still recording (continuous mode)
      if (isRecording && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started, ignore
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Inspelning startad – texten visas i realtid");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setInterimTranscript("");
      toast.success("Inspelning stoppad");
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

  const createShareLink = async () => {
    if (!selectedProjectId) return;
    
    setCreatingShareLink(true);
    try {
      // Check for existing non-expired link
      const { data: existingLink } = await supabase
        .from("plan_share_links")
        .select("token, expires_at")
        .eq("project_id", selectedProjectId)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (existingLink) {
        setShareLink(`${window.location.origin}/share/plan/${existingLink.token}`);
        setShareDialogOpen(true);
        setCreatingShareLink(false);
        return;
      }

      // Create new link
      const { data: newLink, error } = await supabase
        .from("plan_share_links")
        .insert({ project_id: selectedProjectId })
        .select("token")
        .single();

      if (error) throw error;

      setShareLink(`${window.location.origin}/share/plan/${newLink.token}`);
      setShareDialogOpen(true);
    } catch (error: any) {
      toast.error("Kunde inte skapa delningslänk");
      console.error("Share link error:", error);
    } finally {
      setCreatingShareLink(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Länk kopierad!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  };

  // Calculate end date for display
  const endDate = startDate && generatedPlan 
    ? getEndDate(startDate, generatedPlan.total_weeks) 
    : undefined;

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
            <div className="relative">
              <Textarea
                value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  finalTranscriptRef.current = e.target.value;
                }}
                placeholder="T.ex. 'Rivning först, sen stomme, el och VVS parallellt, sen ytskikt. Totalt runt 6 veckor.'"
                className="min-h-[150px] resize-none pr-24"
                disabled={isRecording || isGenerating}
              />
              {interimTranscript && (
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium animate-pulse">
                  Lyssnar...
                </div>
              )}
            </div>

            {!isSpeechRecognitionSupported && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>Din webbläsare stöder inte röstinspelning. Prova Chrome eller Edge.</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isGenerating || !isSpeechRecognitionSupported}
              >
                {isRecording ? (
                  <>
                    <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />
                    <MicOff className="h-4 w-4 mr-2" />
                    Stoppa inspelning
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Spela in (realtid)
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={createShareLink}
                disabled={creatingShareLink}
              >
                {creatingShareLink ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Dela
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                PDF
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
              startDate={startDate}
            />
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dela planering</DialogTitle>
            <DialogDescription>
              Kopiera länken nedan för att dela planeringen. Länken är giltig i 30 dagar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Input 
              value={shareLink} 
              readOnly 
              className="flex-1"
            />
            <Button onClick={copyToClipboard} variant="outline">
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
