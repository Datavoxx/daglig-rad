import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  Mic,
  MicOff,
  Loader2,
  Plus,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  Trash2,
  Edit,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { EstimateSummary } from "@/components/estimates/EstimateSummary";
import { EstimateTable, type EstimateItem } from "@/components/estimates/EstimateTable";
import { EstimateTotals } from "@/components/estimates/EstimateTotals";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";
import { generateEstimatePdf } from "@/lib/generateEstimatePdf";

type ViewState = "empty" | "input" | "review" | "view";

interface GeneratedEstimate {
  scope: string;
  assumptions: string[];
  uncertainties: string[];
  items: EstimateItem[];
  labor_cost: number;
  material_cost: number;
  subcontractor_cost: number;
}

export default function Estimates() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  // Estimate data
  const [scope, setScope] = useState("");
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [uncertainties, setUncertainties] = useState<string[]>([]);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [markupPercent, setMarkupPercent] = useState(15);

  // Dialogs
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Web Speech API refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const isSpeechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

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

  // Fetch existing estimate for selected project
  const { data: existingEstimate, isLoading: estimateLoading } = useQuery({
    queryKey: ["project-estimate", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data: estimate, error } = await supabase
        .from("project_estimates")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (estimate) {
        // Fetch items
        const { data: estimateItems, error: itemsError } = await supabase
          .from("estimate_items")
          .select("*")
          .eq("estimate_id", estimate.id)
          .order("sort_order", { ascending: true });
        if (itemsError) throw itemsError;

        return { ...estimate, items: estimateItems || [] };
      }

      return null;
    },
    enabled: !!selectedProjectId,
  });

  // Update view state when estimate data changes
  useEffect(() => {
    if (existingEstimate) {
      setViewState("view");
      setScope(existingEstimate.scope || "");
      setAssumptions((existingEstimate.assumptions as string[]) || []);
      setUncertainties((existingEstimate.uncertainties as string[]) || []);
      setMarkupPercent(Number(existingEstimate.markup_percent) || 15);
      setItems(
        existingEstimate.items.map((item: any) => ({
          id: item.id,
          moment: item.moment,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          hours: item.hours,
          unit_price: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0,
          comment: item.comment || "",
          uncertainty: item.uncertainty || "medium",
          sort_order: item.sort_order,
        }))
      );
    } else if (selectedProjectId) {
      setViewState("empty");
      resetEstimate();
    }
  }, [existingEstimate, selectedProjectId]);

  const resetEstimate = () => {
    setScope("");
    setAssumptions([]);
    setUncertainties([]);
    setItems([]);
    setMarkupPercent(15);
    setTranscript("");
  };

  // Save estimate mutation
  const saveEstimateMutation = useMutation({
    mutationFn: async () => {
      // Check if estimate exists
      const { data: existing } = await supabase
        .from("project_estimates")
        .select("id, version")
        .eq("project_id", selectedProjectId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calculate totals
      const laborCost = items
        .filter((item) => item.type === "labor")
        .reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const materialCost = items
        .filter((item) => item.type === "material")
        .reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const subcontractorCost = items
        .filter((item) => item.type === "subcontractor")
        .reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const subtotal = laborCost + materialCost + subcontractorCost;
      const markup = subtotal * (markupPercent / 100);
      const totalExclVat = subtotal + markup;
      const totalInclVat = totalExclVat * 1.25;

      const estimateData = {
        project_id: selectedProjectId,
        scope,
        assumptions: JSON.parse(JSON.stringify(assumptions)),
        uncertainties: JSON.parse(JSON.stringify(uncertainties)),
        labor_cost: laborCost,
        material_cost: materialCost,
        subcontractor_cost: subcontractorCost,
        markup_percent: markupPercent,
        total_excl_vat: totalExclVat,
        total_incl_vat: totalInclVat,
        original_transcript: transcript,
        version: existing ? (existing.version || 1) : 1,
      };

      let estimateId: string;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("project_estimates")
          .update(estimateData)
          .eq("id", existing.id);
        if (error) throw error;
        estimateId = existing.id;

        // Delete old items
        await supabase.from("estimate_items").delete().eq("estimate_id", existing.id);
      } else {
        // Insert new
        const { data: newEstimate, error } = await supabase
          .from("project_estimates")
          .insert(estimateData)
          .select("id")
          .single();
        if (error) throw error;
        estimateId = newEstimate.id;
      }

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items.map((item, index) => ({
          estimate_id: estimateId,
          moment: item.moment,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          hours: item.hours,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          comment: item.comment,
          uncertainty: item.uncertainty,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase.from("estimate_items").insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-estimate", selectedProjectId] });
      toast.success("Kalkylen har sparats");
      setViewState("view");
    },
    onError: (error) => {
      console.error("Failed to save estimate:", error);
      toast.error("Kunde inte spara kalkylen");
    },
  });

  // Delete estimate mutation
  const deleteEstimateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("project_estimates")
        .delete()
        .eq("project_id", selectedProjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-estimate", selectedProjectId] });
      resetEstimate();
      setViewState("empty");
      setDeleteDialogOpen(false);
      toast.success("Kalkylen har raderats");
    },
    onError: (error) => {
      console.error("Failed to delete estimate:", error);
      toast.error("Kunde inte radera kalkylen");
    },
  });

  const startRecording = () => {
    if (!isSpeechRecognitionSupported) {
      toast.error("Din webbläsare stöder inte röstinspelning. Prova Chrome eller Edge.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final.trim();
        setTranscript(finalTranscriptRef.current);
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        toast.info("Ingen röst upptäcktes. Fortsätt prata...");
      } else if (event.error !== "aborted") {
        toast.error("Röstinspelningen avbröts. Försök igen.");
      }
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
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

  const handleGenerateEstimate = async () => {
    if (!transcript.trim()) {
      toast.error("Skriv eller spela in en beskrivning först");
      return;
    }

    const selectedProject = projects?.find((p) => p.id === selectedProjectId);

    try {
      setIsGenerating(true);

      // Fetch user's pricing settings
      const { data: userData } = await supabase.auth.getUser();
      let userPricing = null;
      if (userData.user) {
        const { data: pricingData } = await supabase
          .from("user_pricing_settings")
          .select("*")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        userPricing = pricingData;
      }

      const { data, error } = await supabase.functions.invoke("generate-estimate", {
        body: { 
          transcript, 
          project_name: selectedProject?.name,
          user_pricing: userPricing,
        },
      });

      if (error) throw error;

      if (data.needs_more_info) {
        toast.error("Beskrivningen är för vag", {
          description: data.example || "Beskriv projektets omfattning mer detaljerat.",
          duration: 10000,
        });
        return;
      }

      // Set the generated data
      setScope(data.scope || "");
      setAssumptions(data.assumptions || []);
      setUncertainties(data.uncertainties || []);
      setItems(
        (data.items || []).map((item: any, index: number) => ({
          id: crypto.randomUUID(),
          moment: item.moment,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit || "tim",
          hours: item.hours,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal || 0,
          comment: item.comment || "",
          uncertainty: item.uncertainty || "medium",
          sort_order: index,
        }))
      );

      setViewState("review");
    } catch (error: any) {
      console.error("Failed to generate estimate:", error);
      toast.error(error.message || "Kunde inte generera kalkylen");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceedToTable = () => {
    setViewState("view");
  };

  const handleCreateNew = () => {
    resetEstimate();
    setViewState("input");
  };

  const handleEdit = () => {
    setViewState("view");
  };

  const handleSave = () => {
    saveEstimateMutation.mutate();
  };

  const handleDownloadPdf = async () => {
    if (!selectedProject) return;

    try {
      await generateEstimatePdf({
        projectName: selectedProject.name,
        scope,
        assumptions,
        uncertainties,
        items: items.map((item) => ({
          moment: item.moment,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          hours: item.hours,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          comment: item.comment,
          uncertainty: item.uncertainty,
        })),
        markupPercent,
        version: existingEstimate?.version,
      });
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  const createShareLink = async () => {
    if (!existingEstimate?.id) return;

    setCreatingShareLink(true);
    try {
      const { data: existingLink } = await supabase
        .from("estimate_share_links")
        .select("token, expires_at")
        .eq("estimate_id", existingEstimate.id)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (existingLink) {
        setShareLink(`${window.location.origin}/share/estimate/${existingLink.token}`);
        setShareDialogOpen(true);
        setCreatingShareLink(false);
        return;
      }

      const { data: newLink, error } = await supabase
        .from("estimate_share_links")
        .insert({ estimate_id: existingEstimate.id })
        .select("token")
        .single();

      if (error) throw error;

      setShareLink(`${window.location.origin}/share/estimate/${newLink.token}`);
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

  if (projectsLoading) {
    return (
      <div className="page-transition p-6 max-w-6xl mx-auto">
        <EstimateSkeleton />
      </div>
    );
  }

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return (
    <div className="page-transition p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kalkyl</h1>
        <p className="text-muted-foreground">Skapa och hantera projektkalkyler</p>
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
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Välj ett projekt</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Välj ett projekt ovan för att se eller skapa en kalkyl.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading estimate */}
      {selectedProjectId && estimateLoading && <EstimateSkeleton />}

      {/* Empty state - no estimate exists */}
      {selectedProjectId && !estimateLoading && viewState === "empty" && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen kalkyl ännu</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Skapa en kalkyl för projektet. Beskriv vad som ska göras så hjälper AI till att
              strukturera momenten.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa kalkyl
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Input state */}
      {viewState === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>Beskriv projektet</CardTitle>
            <CardDescription>
              Berätta fritt om projektet – vad ska göras, ungefärlig storlek och vilka resurser som
              behövs. AI hjälper till att strukturera kalkylen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                value={transcript + (interimTranscript ? (transcript ? " " : "") + interimTranscript : "")}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  finalTranscriptRef.current = e.target.value;
                }}
                placeholder="T.ex. 'Badrumsrenovering ca 8 kvm. Rivning av befintligt, nytt tätskikt, kakel på väggar och klinker på golv. VVS och el som underentreprenader.'"
                className="min-h-[150px] pr-12"
              />
              {isSpeechRecognitionSupported && (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleGenerateEstimate} disabled={isGenerating || !transcript.trim()}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Skapa kalkyl med AI
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setViewState("empty")}>
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review state */}
      {viewState === "review" && (
        <EstimateSummary
          scope={scope}
          assumptions={assumptions}
          uncertainties={uncertainties}
          onScopeChange={setScope}
          onAssumptionsChange={setAssumptions}
          onUncertaintiesChange={setUncertainties}
          onProceed={handleProceedToTable}
        />
      )}

      {/* View/Edit state */}
      {viewState === "view" && (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedProject?.name}</h2>
              {existingEstimate?.version && (
                <p className="text-sm text-muted-foreground">Version {existingEstimate.version}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Ladda ner PDF
              </Button>
              {existingEstimate && (
                <Button variant="outline" onClick={createShareLink} disabled={creatingShareLink}>
                  {creatingShareLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Dela
                </Button>
              )}
              <Button onClick={handleSave} disabled={saveEstimateMutation.isPending}>
                {saveEstimateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Spara
              </Button>
            </div>
          </div>

          {/* Summary cards */}
          {(scope || assumptions.length > 0 || uncertainties.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sammanfattning</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setViewState("review")}>
                    <Edit className="h-4 w-4 mr-1" />
                    Redigera
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {scope && <p className="text-muted-foreground">{scope}</p>}
              </CardContent>
            </Card>
          )}

          {/* Estimate table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kalkylposter</CardTitle>
            </CardHeader>
            <CardContent>
              <EstimateTable items={items} onItemsChange={setItems} />
            </CardContent>
          </Card>

          {/* Totals */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2" />
            <EstimateTotals
              items={items}
              markupPercent={markupPercent}
              onMarkupChange={setMarkupPercent}
            />
          </div>

          {/* Delete button */}
          {existingEstimate && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Radera kalkyl
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dela kalkyl</DialogTitle>
            <DialogDescription>
              Kopiera länken nedan för att dela kalkylen. Länken är giltig i 30 dagar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
            />
            <Button onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera kalkyl?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Kalkylen och alla poster kommer att tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEstimateMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEstimateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Radera"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
