import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calculator, FileText, Calendar, User, ArrowLeft, Trash2, Plus, Package } from "lucide-react";
import { EstimateImportDialog } from "@/components/estimates/EstimateImportDialog";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";
import { EstimateBuilder } from "@/components/estimates/EstimateBuilder";
import { EstimateWizard } from "@/components/estimates/EstimateWizard";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SavedEstimate {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  manual_project_name: string | null;
  project_id: string | null;
  offer_number: string | null;
  manual_client_name: string | null;
  projects: { name: string; client_name: string | null } | null;
}

export default function Estimates() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Read URL parameters SYNCHRONOUSLY for deep-linking
  const estimateIdFromUrl = searchParams.get("estimateId") || searchParams.get("id");
  const offerNumberFromUrl = searchParams.get("offerNumber");
  const hasDeepLink = Boolean(estimateIdFromUrl || offerNumberFromUrl);
  const paramKey = `${estimateIdFromUrl || ""}-${offerNumberFromUrl || ""}`;
  
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Initialize state based on URL parameters to prevent flicker
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    estimateIdFromUrl || null
  );
  
  // Manual mode state for builder - start in builder mode if deep-link exists
  const [manualData, setManualData] = useState<{
    projectName: string;
    clientName: string;
    address: string;
    postalCode?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null>(hasDeepLink ? { projectName: "", clientName: "", address: "" } : null);
  const [manualStarted, setManualStarted] = useState(hasDeepLink);
  
  // Guard ref to ensure deep-linking runs only once per URL param set
  const deepLinkProcessedRef = useRef<string | null>(null);

  // Fetch saved estimates
  const { data: savedEstimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ["saved-estimates"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("project_estimates")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          manual_project_name,
          project_id,
          offer_number,
          manual_client_name,
          projects!project_estimates_project_id_fkey (name, client_name)
        `)
        .eq("user_id", userData.user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as SavedEstimate[];
    },
  });

  const drafts = savedEstimates?.filter((e) => e.status === "draft") || [];
  const completed = savedEstimates?.filter((e) => e.status === "completed") || [];

  const filteredEstimates = activeTab === "all" 
    ? savedEstimates 
    : activeTab === "draft" 
    ? drafts 
    : completed;

  // Handle URL parameter for direct estimate navigation (robust deep-linking)
  // Only populates manualData - view switching is handled by initial state
  useEffect(() => {
    // Skip if no deep-link params
    if (!hasDeepLink) return;
    // Skip if already processed this exact param set
    if (deepLinkProcessedRef.current === paramKey) return;
    // Wait for data before we can populate manualData correctly
    if (!savedEstimates || savedEstimates.length === 0) return;
    
    // Try to find by estimateId first
    let estimate = estimateIdFromUrl 
      ? savedEstimates.find(e => e.id === estimateIdFromUrl)
      : null;
    
    // Fallback: try to find by offerNumber
    if (!estimate && offerNumberFromUrl) {
      estimate = savedEstimates.find(e => e.offer_number === offerNumberFromUrl);
    }
    
    if (estimate) {
      deepLinkProcessedRef.current = paramKey;
      // Update manualData with correct info (manualStarted is already true)
      setManualData({
        projectName: estimate.manual_project_name || estimate.projects?.name || "",
        clientName: estimate.manual_client_name || estimate.projects?.client_name || "",
        address: "",
      });
      setSelectedEstimateId(estimate.id);
    } else {
      // Estimate not found - go back to list
      toast({
        title: "Kunde inte hitta offerten",
        description: offerNumberFromUrl 
          ? `Offert ${offerNumberFromUrl} hittades inte.`
          : "Den begärda offerten kunde inte hittas.",
        variant: "destructive",
      });
      setManualStarted(false);
      setManualData(null);
      setSearchParams({}, { replace: true });
    }
  }, [savedEstimates, hasDeepLink, paramKey, estimateIdFromUrl, offerNumberFromUrl, toast, setSearchParams]);

  if (estimatesLoading) {
    return (
      <div className="page-transition p-6 max-w-6xl mx-auto">
        <EstimateSkeleton />
      </div>
    );
  }

  const handleWizardComplete = (data: {
    customerId?: string;
    customerName: string;
    projectName: string;
    address: string;
    postalCode?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setManualData({
      projectName: data.projectName,
      clientName: data.customerName,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    setManualStarted(true);
    setShowWizard(false);
  };

  const handleBack = () => {
    setManualStarted(false);
    setSelectedEstimateId(null);
    setManualData(null);
    setShowWizard(false);
    // Clear URL params and reset deep-link guard
    deepLinkProcessedRef.current = null;
    setSearchParams({}, { replace: true });
  };

  const handleSelectEstimate = (estimate: SavedEstimate) => {
    // Open the estimate directly in manual mode
    setManualData({
      projectName: estimate.manual_project_name || estimate.projects?.name || "",
      clientName: estimate.manual_client_name || estimate.projects?.client_name || "",
      address: "",
    });
    setManualStarted(true);
    setSelectedEstimateId(estimate.id);
  };

  const getEstimateName = (estimate: SavedEstimate) => {
    if (estimate.projects?.name) return estimate.projects.name;
    if (estimate.manual_project_name) return estimate.manual_project_name;
    return "Namnlös offert";
  };

  const getClientName = (estimate: SavedEstimate) => {
    if (estimate.projects?.client_name) return estimate.projects.client_name;
    if (estimate.manual_client_name) return estimate.manual_client_name;
    return null;
  };

  const handleDeleteEstimate = async (estimateId: string) => {
    try {
      const { error } = await supabase
        .from("project_estimates")
        .delete()
        .eq("id", estimateId);

      if (error) throw error;

      toast({ title: "Offert borttagen" });
      queryClient.invalidateQueries({ queryKey: ["saved-estimates"] });
    } catch (error) {
      console.error("Delete estimate error:", error);
      toast({
        title: "Kunde inte ta bort offert",
        description: "Något gick fel, försök igen",
        variant: "destructive",
      });
    }
  };

  // Show wizard - wizard handles its own back/cancel
  if (showWizard) {
    return (
      <div className="page-transition p-4 md:p-6 max-w-6xl mx-auto">
        <EstimateWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  // Show builder
  // Show builder - no outer back button since EstimateBuilder has its own
  const shouldAutoDownload = searchParams.get("download") === "true";

  if (manualStarted && manualData) {
    return (
      <div className="page-transition p-4 md:p-6 max-w-6xl mx-auto">
        <EstimateBuilder
          manualData={manualData}
          estimateId={selectedEstimateId}
          onDelete={handleBack}
          onBack={handleBack}
          autoDownload={shouldAutoDownload}
        />
      </div>
    );
  }

  return (
    <div className="page-transition p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Offert</h1>
          <p className="text-muted-foreground text-sm">Skapa och hantera offerter</p>
        </div>
        <div className="flex items-center gap-2">
          <EstimateImportDialog onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["saved-estimates"] })} />
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => navigate("/settings?tab=articles")}
          >
            <Package className="h-4 w-4 mr-1" />
            {isMobile ? "Artiklar" : "Artikelbibliotek"}
          </Button>
          <Button onClick={() => setShowWizard(true)} size={isMobile ? "sm" : "default"}>
            <Plus className="h-4 w-4 mr-1" />
            {isMobile ? "Ny" : "Ny offert"}
          </Button>
        </div>
      </div>

      {/* Saved estimates list */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Alla ({savedEstimates?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft ({drafts.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Klara ({completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredEstimates && filteredEstimates.length > 0 ? (
                isMobile ? (
                  // MOBILE: Card layout
                  <div className="space-y-3">
                    {filteredEstimates.map((estimate) => (
                      <div
                        key={estimate.id}
                        onClick={() => handleSelectEstimate(estimate)}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base leading-tight">{getEstimateName(estimate)}</p>
                            {getClientName(estimate) && (
                              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {getClientName(estimate)}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={estimate.status === "draft" ? "secondary" : "success"}
                          >
                            {estimate.status === "draft" ? "Draft" : "Godkänd"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {estimate.offer_number && (
                              <>
                                <span className="tabular-nums">{estimate.offer_number}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{format(new Date(estimate.updated_at), "d MMM", { locale: sv })}</span>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort offert?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Offerten "{getEstimateName(estimate)}" kommer att tas bort permanent. 
                                  Detta kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEstimate(estimate.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // DESKTOP: Row layout
                  <div className="space-y-2">
                    {filteredEstimates.map((estimate) => (
                      <div
                        key={estimate.id}
                        onClick={() => handleSelectEstimate(estimate)}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{getEstimateName(estimate)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {getClientName(estimate) && (
                                <>
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{getClientName(estimate)}</span>
                                </>
                              )}
                              <Calendar className="h-3 w-3 ml-1" />
                              <span>{format(new Date(estimate.updated_at), "d MMM yyyy", { locale: sv })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {estimate.offer_number && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {estimate.offer_number}
                            </span>
                          )}
                          <Badge 
                            variant={estimate.status === "draft" ? "secondary" : "success"}
                          >
                            {estimate.status === "draft" ? "Draft" : "Godkänd"}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort offert?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Offerten "{getEstimateName(estimate)}" kommer att tas bort permanent. 
                                  Detta kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEstimate(estimate.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Inga offerter ännu</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowWizard(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Skapa din första offert
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
