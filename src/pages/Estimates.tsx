import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Calculator,
  Mic,
  MicOff,
  Loader2,
  Plus,
  Sparkles,
  Download,
  Check,
  Trash2,
  Edit,
  FileText,
  Home,
  ChevronDown,
  Pencil,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { EstimateSummary } from "@/components/estimates/EstimateSummary";
import { EstimateTable, type EstimateItem } from "@/components/estimates/EstimateTable";
import { EstimateTotals } from "@/components/estimates/EstimateTotals";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";

import { VoiceInputOverlay } from "@/components/shared/VoiceInputOverlay";
import { generateEstimatePdf } from "@/lib/generateEstimatePdf";
import { generateQuotePdf } from "@/lib/generateQuotePdf";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuotePreviewSheet } from "@/components/estimates/QuotePreviewSheet";

type ViewState = "empty" | "input" | "review" | "view" | "manual";

interface GeneratedEstimate {
  scope: string;
  assumptions: string[];
  uncertainties: string[];
  items: EstimateItem[];
  labor_cost: number;
  material_cost: number;
  subcontractor_cost: number;
}

interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  hourly_rates: Record<string, number>;
  work_items: Array<{
    wbs: string;
    name: string;
    unit: string;
    resource: string;
    hours_per_unit: number;
  }>;
  cost_library: Array<{
    id: string;
    name: string;
    unit: string;
    price: number;
  }>;
  material_spill_percent?: number;
  overhead_percent?: number;
  risk_percent?: number;
  profit_percent?: number;
  vat_percent?: number;
  establishment_cost?: number;
}

export default function Estimates() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
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
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);
  
  // ROT settings
  const [rotEnabled, setRotEnabled] = useState(false);
  const [rotPercent, setRotPercent] = useState(30);

  // Dialogs and sheets
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Fetch projects with client info
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name, address")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch estimate templates
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ["estimate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimate_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EstimateTemplate[];
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
      setSelectedTemplateId(existingEstimate.template_id || null);
      // Handle ROT settings from existing estimate
      setRotEnabled((existingEstimate as any).rot_enabled || false);
      setRotPercent(Number((existingEstimate as any).rot_percent) || 30);
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
    setRotEnabled(false);
    setRotPercent(30);
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
        template_id: selectedTemplateId,
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
      toast.success("Offerten har sparats");
      setViewState("view");
    },
    onError: (error) => {
      console.error("Failed to save estimate:", error);
      toast.error("Kunde inte spara offerten");
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
      toast.success("Offerten har raderats");
    },
    onError: (error) => {
      console.error("Failed to delete estimate:", error);
      toast.error("Kunde inte radera offerten");
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
    const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

    try {
      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke("generate-estimate", {
        body: { 
          transcript, 
          project_name: selectedProject?.name,
          template: selectedTemplate,
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
      toast.error(error.message || "Kunde inte generera offerten");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceedToTable = () => {
    setViewState("view");
  };

  const handleCreateWithAI = () => {
    resetEstimate();
    setViewState("input");
  };

  const handleCreateManual = () => {
    resetEstimate();
    setViewState("manual");
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

  const handleDownloadQuotePdf = async () => {
    if (!selectedProject) return;

    // Calculate costs
    const laborCost = items
      .filter((item) => item.type === "labor")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const materialCost = items
      .filter((item) => item.type === "material")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const subcontractorCost = items
      .filter((item) => item.type === "subcontractor")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);

    // Generate offer number
    const offerNumber = existingEstimate?.id 
      ? `OFF-${existingEstimate.id.slice(0, 8).toUpperCase()}`
      : `OFF-${Date.now().toString(36).toUpperCase()}`;

    try {
      await generateQuotePdf({
        company: companySettings ? {
          company_name: companySettings.company_name || undefined,
          org_number: companySettings.org_number || undefined,
          address: companySettings.address || undefined,
          postal_code: companySettings.postal_code || undefined,
          city: companySettings.city || undefined,
          phone: companySettings.phone || undefined,
          email: companySettings.email || undefined,
          website: companySettings.website || undefined,
          bankgiro: companySettings.bankgiro || undefined,
          logo_url: companySettings.logo_url || undefined,
          contact_person: companySettings.contact_person || undefined,
          contact_phone: companySettings.contact_phone || undefined,
          momsregnr: companySettings.momsregnr || undefined,
          f_skatt: companySettings.f_skatt ?? undefined,
        } : undefined,
        customer: {
          name: selectedProject.client_name || undefined,
          address: selectedProject.address || undefined,
        },
        offerNumber,
        projectName: selectedProject.name,
        validDays: 30,
        scope,
        conditions: assumptions,
        items: items.filter(i => i.type === "labor").map(item => ({
          moment: item.moment,
          hours: item.hours,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        laborCost,
        materialCost,
        subcontractorCost,
        markupPercent,
        rotEnabled,
        rotPercent,
        paymentTerms: "30 dagar netto",
        version: existingEstimate?.version,
      });
      toast.success("Offert-PDF nedladdad");
    } catch (error) {
      console.error("Failed to generate quote PDF:", error);
      toast.error("Kunde inte generera offert-PDF");
    }
  };

  const handleVoiceEditItems = async (transcript: string) => {
    if (!transcript.trim()) return;

    try {
      setIsApplyingVoice(true);
      const { data, error } = await supabase.functions.invoke("apply-estimate-voice-edits", {
        body: { transcript, items },
      });

      if (error) throw error;

      if (data.items) {
        setItems(data.items);
        toast.success("Ändring genomförd", {
          description: data.changes_made || "Offertposterna uppdaterades",
        });
      }
    } catch (error) {
      console.error("Voice edit failed:", error);
      toast.error("Kunde inte tillämpa ändringen");
    } finally {
      setIsApplyingVoice(false);
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
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  return (
    <div className="page-transition p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offert</h1>
        <p className="text-muted-foreground">Skapa och hantera projektofferter</p>
      </div>

      {/* Project selector */}
      <div className="flex flex-col gap-4">
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

      </div>

      {/* Empty state - no project selected */}
      {!selectedProjectId && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Välj ett projekt</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Välj ett projekt ovan för att se eller skapa en offert.
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
            <h3 className="text-lg font-medium mb-2">Ingen offert ännu</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Fyll i mängder och detaljer via röst eller text.
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa offert
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={handleCreateWithAI}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Skapa med AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateManual}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Skapa manuellt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      )}

      {/* Input state */}
      {viewState === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>Fyll i mängder och detaljer</CardTitle>
            <CardDescription>
              {selectedTemplate ? (
                <>Mall: <strong>{selectedTemplate.name}</strong> – Beskriv mängder och specifika detaljer.</>
              ) : (
                "Berätta om projektets mängder och detaljer."
              )}
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
                placeholder="T.ex. 'Sex kvadrat golv, tjugo kvadrat vägg, en golvbrunn, en WC och en kommod.'"
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

            {/* Template work items preview */}
            {selectedTemplate && selectedTemplate.work_items && selectedTemplate.work_items.length > 0 && (
              <Card className="bg-muted/50 border-dashed">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Mallens moment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isMobile ? (
                    // Mobile: Card view
                    <div className="space-y-2">
                      {selectedTemplate.work_items.map((item, index) => (
                        <div key={index} className="p-2 rounded-lg bg-background border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs shrink-0">{item.wbs}</Badge>
                                <span className="text-sm font-medium truncate">{item.name}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                                <span>{item.unit}</span>
                                <span>•</span>
                                <span className="capitalize">{item.resource}</span>
                                <span>•</span>
                                <span>{item.hours_per_unit} tim/enh</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Desktop: Table view
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="pb-2 pr-4 font-medium">WBS</th>
                            <th className="pb-2 pr-4 font-medium">Moment</th>
                            <th className="pb-2 pr-4 font-medium">Enhet</th>
                            <th className="pb-2 pr-4 font-medium">Resurs</th>
                            <th className="pb-2 font-medium text-right">Tim/enh</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTemplate.work_items.map((item, index) => (
                            <tr key={index} className="border-b border-muted last:border-0">
                              <td className="py-1.5 pr-4 text-muted-foreground">{item.wbs}</td>
                              <td className="py-1.5 pr-4">{item.name}</td>
                              <td className="py-1.5 pr-4 text-muted-foreground">{item.unit}</td>
                              <td className="py-1.5 pr-4 text-muted-foreground capitalize">{item.resource}</td>
                              <td className="py-1.5 text-right text-muted-foreground">{item.hours_per_unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                    Skapa offert med AI
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

      {/* Manual creation state */}
      {viewState === "manual" && (
        <div className="space-y-6">
          {/* Header with project info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedProject?.name}</h2>
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground">
                  Mall: {selectedTemplate.name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size={isMobile ? "sm" : "default"} 
                onClick={handleSave} 
                disabled={saveEstimateMutation.isPending || items.length === 0}
              >
                {saveEstimateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 sm:mr-2" />
                )}
                <span className="sm:inline">{isMobile ? "Spara" : "Spara offert"}</span>
              </Button>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => setViewState("empty")}>
                Avbryt
              </Button>
            </div>
          </div>

          {/* Scope input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projektbeskrivning</CardTitle>
              <CardDescription>Beskriv vad offerten gäller</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="T.ex. 'Totalrenovering av badrum 6 kvm inkl. byte av golvbrunn, kakel/klinker, VVS och el.'"
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Quick-add from template */}
          {selectedTemplate && selectedTemplate.work_items && selectedTemplate.work_items.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Snabbval från mall
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.work_items.map((workItem, index) => {
                    const isAdded = items.some(item => item.moment === workItem.name);
                    return (
                      <Button
                        key={index}
                        variant={isAdded ? "secondary" : "outline"}
                        size="sm"
                        disabled={isAdded}
                        onClick={() => {
                          const hourlyRate = selectedTemplate.hourly_rates?.general || 500;
                          const newItem: EstimateItem = {
                            id: crypto.randomUUID(),
                            moment: workItem.name,
                            type: "labor" as const,
                            quantity: null,
                            unit: workItem.unit || "tim",
                            hours: null,
                            unit_price: hourlyRate,
                            subtotal: 0,
                            comment: "",
                            uncertainty: "medium" as const,
                            sort_order: items.length,
                          };
                          setItems([...items, newItem]);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {workItem.name}
                        {isAdded && <Check className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estimate table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Offertposter</CardTitle>
              <CardDescription>Lägg till och redigera poster i offerten</CardDescription>
            </CardHeader>
            <CardContent>
              <EstimateTable items={items} onItemsChange={setItems} />
            </CardContent>
          </Card>

          {/* ROT and Totals */}
          {items.length > 0 && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rot-toggle" className="font-medium">ROT-avdrag</Label>
                      <p className="text-sm text-muted-foreground">
                        Beräkna ROT-avdrag för arbetskostnad
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {rotEnabled && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={rotPercent}
                            onChange={(e) => setRotPercent(Number(e.target.value))}
                            className="w-20 h-9"
                            min={0}
                            max={100}
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                      <Switch
                        id="rot-toggle"
                        checked={rotEnabled}
                        onCheckedChange={setRotEnabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <EstimateTotals
                items={items}
                markupPercent={markupPercent}
                onMarkupChange={setMarkupPercent}
              />
            </>
          )}
        </div>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedProject?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {existingEstimate?.version && <span>Version {existingEstimate.version}</span>}
                {selectedTemplate && (
                  <>
                    <span>•</span>
                    <span>Mall: {selectedTemplate.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => setPreviewOpen(true)} className="flex-1 sm:flex-none">
                <Eye className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">{isMobile ? "Visa" : "Förhandsgranska"}</span>
              </Button>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleDownloadQuotePdf} className="flex-1 sm:flex-none">
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">{isMobile ? "Offert" : "Ladda ner offert"}</span>
              </Button>
              <Button size={isMobile ? "sm" : "default"} onClick={handleSave} disabled={saveEstimateMutation.isPending} className="flex-1 sm:flex-none">
                {saveEstimateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 sm:mr-2" />
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
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-base">Offertposter</CardTitle>
            </CardHeader>
            <CardContent>
              <EstimateTable items={items} onItemsChange={setItems} />
            </CardContent>
            <VoiceInputOverlay
              onTranscriptComplete={handleVoiceEditItems}
              isProcessing={isApplyingVoice}
              className="absolute bottom-4 right-4"
            />
          </Card>

          {/* ROT and Totals */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  ROT-avdrag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Switch checked={rotEnabled} onCheckedChange={setRotEnabled} id="rot-toggle" />
                  <Label htmlFor="rot-toggle" className="cursor-pointer">Aktivera ROT-avdrag</Label>
                  {rotEnabled && (
                    <div className="flex items-center gap-2 ml-4">
                      <Input
                        type="number"
                        value={rotPercent}
                        onChange={(e) => setRotPercent(Number(e.target.value))}
                        className="w-20"
                        min={0}
                        max={50}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ROT-avdraget beräknas på arbetskostnaden och visas på offerten.
                </p>
              </CardContent>
            </Card>
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
                Radera offert
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera offert?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Offerten och alla poster kommer att tas bort permanent.
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

      {/* Quote Preview Sheet */}
      <QuotePreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        project={selectedProject || null}
        company={companySettings}
        scope={scope}
        assumptions={assumptions}
        items={items}
        markupPercent={markupPercent}
        rotEnabled={rotEnabled}
        rotPercent={rotPercent}
        offerNumber={existingEstimate?.id ? `OFF-${existingEstimate.id.substring(0, 6).toUpperCase()}` : "OFF-001"}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["project-estimate", selectedProjectId] })}
      />
    </div>
  );
}
