import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Eye, EyeOff, FileText, Trash2, ClipboardList, ListChecks, ArrowLeft, Maximize2, Mic, Save, Loader2, FolderPlus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEstimate } from "@/hooks/useEstimate";
import { EstimateHeader } from "./EstimateHeader";

import { ClosingSection } from "./ClosingSection";
import { EstimateTable } from "./EstimateTable";
import { AddonsSection } from "./AddonsSection";
import { TaxDeductionPanel } from "./TaxDeductionPanel";
import { MarkupPanel } from "./MarkupPanel";
import { StickyTotals } from "./StickyTotals";
import { QuoteLivePreview } from "./QuoteLivePreview";
import { QuotePreviewSheet } from "./QuotePreviewSheet";
import { ArticleLibrarySection } from "./ArticleLibrarySection";
import { VoiceInputOverlay } from "@/components/shared/VoiceInputOverlay";
import { generateQuotePdf } from "@/lib/generateQuotePdf";
import { AI_AGENTS } from "@/config/aiAgents";
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

interface Project {
  id: string;
  name: string;
  client_name?: string;
  address?: string;
}

interface ManualData {
  projectName: string;
  clientName: string;
  address: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface EstimateBuilderProps {
  project?: Project;
  manualData?: ManualData;
  estimateId?: string | null;
  onDelete?: () => void;
  onBack?: () => void;
  autoDownload?: boolean;
}

export function EstimateBuilder({ project, manualData, estimateId, onDelete, onBack, autoDownload }: EstimateBuilderProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showProjectRecommendation, setShowProjectRecommendation] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);
  const hasAutoSaved = useRef(false);
  const hasAutoDownloaded = useRef(false);

  // Determine if we're in manual mode
  const isManualMode = !project && !!manualData;

  const estimate = useEstimate(project?.id || null, isManualMode ? manualData : undefined, estimateId);
  
  // Auto-save new manual estimates immediately
  useEffect(() => {
    if (isManualMode && !estimate.hasExistingEstimate && !estimate.isLoading && !hasAutoSaved.current) {
      hasAutoSaved.current = true;
      // Small delay to ensure state is initialized
      setTimeout(() => {
        estimate.save();
      }, 100);
    }
  }, [isManualMode, estimate.hasExistingEstimate, estimate.isLoading]);

  
  // Derive display values - use estimate state for manual mode to enable editing
  const displayProjectName = isManualMode ? estimate.state.manualProjectName : project?.name || "";
  const displayClientName = isManualMode ? estimate.state.manualClientName : project?.client_name || "";
  const displayAddress = isManualMode ? estimate.state.manualAddress : project?.address || "";

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

  // Fetch user profile for "Vår referens"
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userData.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleDownload = async () => {
    try {
      await generateQuotePdf({
        offerNumber: "OFF-001",
        projectName: displayProjectName,
        validDays: 30,
        company: companySettings
          ? {
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
            }
          : undefined,
        customer: {
          name: displayClientName || undefined,
          address: displayAddress || undefined,
        },
        scope: estimate.state.scope,
        conditions: estimate.state.assumptions,
        items: estimate.state.items,
        laborCost: estimate.totals.laborCost,
        materialCost: estimate.totals.materialCost,
        subcontractorCost: estimate.totals.subcontractorCost,
        markupPercent: estimate.state.markupPercent,
        rotEnabled: estimate.state.rotEnabled,
        rotPercent: estimate.state.rotPercent,
        rutEnabled: estimate.state.rutEnabled,
      });
      toast.success("Offert nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  // Auto-download PDF when navigated with download=true
  useEffect(() => {
    if (autoDownload && !hasAutoDownloaded.current && !estimate.isLoading && estimate.state.items.length > 0) {
      hasAutoDownloaded.current = true;
      setTimeout(() => {
        handleDownload();
      }, 500);
    }
  }, [autoDownload, estimate.isLoading, estimate.state.items.length]);

  const handleSave = () => {
    estimate.save();
    toast.success("Offert sparad");
  };

  const handleSaveAsCompleted = async () => {
    estimate.updateStatus("completed");
    try {
      // Small delay to ensure status update is applied
      await new Promise(resolve => setTimeout(resolve, 0));
      const newEstimateId = await estimate.saveAsync();
      setSavedEstimateId(newEstimateId);
      setShowProjectRecommendation(true);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleStatusChange = async (newStatus: "draft" | "completed") => {
    if (newStatus === "completed") {
      // Mark as complete and show project recommendation
      await handleSaveAsCompleted();
    } else {
      // Change back to draft
      estimate.updateStatus("draft");
      estimate.save();
      toast.success("Status ändrad till utkast");
    }
  };

  const handleDelete = () => {
    estimate.delete();
    setDeleteDialogOpen(false);
    onDelete?.();
  };

  // Handle voice input for full estimate editing
  const handleVoiceEdit = async (transcript: string) => {
    setIsApplyingVoice(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-full-estimate-voice", {
        body: {
          transcript,
          currentData: {
            introductionText: estimate.state.introductionText,
            scope: estimate.state.scope,
            assumptions: estimate.state.assumptions,
            items: estimate.state.items,
            addons: estimate.state.addons,
            rotEnabled: estimate.state.rotEnabled,
            rotPercent: estimate.state.rotPercent,
            closingText: estimate.state.closingText,
            markupPercent: estimate.state.markupPercent,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Apply all updates from AI response
      if (data.introductionText !== undefined) {
        estimate.updateIntroduction(data.introductionText);
      }
      if (data.scope !== undefined) {
        estimate.updateScope(data.scope);
      }
      if (data.assumptions !== undefined) {
        estimate.updateAssumptions(data.assumptions);
      }
      if (data.items !== undefined) {
        estimate.updateItems(data.items);
      }
      if (data.addons !== undefined) {
        estimate.updateAddons(data.addons);
      }
      if (data.rotEnabled !== undefined) {
        estimate.updateRot(data.rotEnabled, data.rotPercent);
      }
      if (data.closingText !== undefined) {
        estimate.updateClosing(data.closingText);
      }
      if (data.markupPercent !== undefined) {
        estimate.updateMarkup(data.markupPercent);
      }

      toast.success(data.changes_made || "Ändringar applicerade");
    } catch (error) {
      console.error("Voice edit error:", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte applicera röständringar");
    } finally {
      setIsApplyingVoice(false);
    }
  };

  // Editor content
  const editorContent = (
    <div className="space-y-4 p-4 pb-28">
      {/* Header section - Mobile: stacked with action bar on top */}
      <div className={cn(
        "gap-3",
        isMobile ? "flex flex-col" : "flex items-start justify-between gap-4"
      )}>
        {/* Action buttons - visible on top for mobile */}
        {isMobile && (
          <div className="flex items-center justify-between w-full pb-2 border-b border-border">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Tillbaka</span>
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={estimate.isSaving}
                className="h-8"
              >
                {estimate.isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              {estimate.hasExistingEstimate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Title section */}
        <EstimateHeader
          projectName={displayProjectName}
          clientName={displayClientName}
          address={displayAddress}
          offerNumber={null}
          version={1}
          createdAt={null}
          status={estimate.state.status}
          isEditable={isManualMode}
          ourReference={userProfile?.full_name}
          onProjectNameChange={estimate.updateManualProjectName}
          onClientNameChange={estimate.updateManualClientName}
          onAddressChange={estimate.updateManualAddress}
          onStatusChange={handleStatusChange}
        />

        {/* Desktop action buttons */}
        {!isMobile && (
          <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={estimate.isSaving}
              className="h-8"
            >
              {estimate.isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  if (estimate.state.status === "draft") {
                    await handleSaveAsCompleted();
                  } else {
                    const id = await estimate.saveAsync();
                    setSavedEstimateId(id);
                    setShowProjectRecommendation(true);
                  }
                } catch {}
              }}
              className="h-8 gap-1"
            >
              <FolderPlus className="h-4 w-4" />
              Starta projekt
            </Button>
            {estimate.state.status === "completed" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("draft")}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <Undo2 className="h-4 w-4" />
                Ångra godkänd
              </Button>
            )}
            {estimate.hasExistingEstimate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Voice control prompt - inline in header area */}
      <div 
        className="flex items-center gap-4 p-4 bg-primary/5 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => {
          // Trigger VoiceInputOverlay - we'll use a workaround by setting state
          const voiceButton = document.querySelector('[data-voice-trigger]') as HTMLButtonElement;
          if (voiceButton) voiceButton.click();
        }}
      >
        <img 
          src={AI_AGENTS.estimate.avatar}
          alt="Byggio AI"
          className="w-16 h-16 md:w-32 md:h-32 object-contain drop-shadow-lg"
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Mic className="h-5 w-5" />
            <span className="font-medium">Låt Byggio AI hjälpa dig</span>
          </div>
          <span className="text-sm text-muted-foreground">Spara 60% av din tid</span>
        </div>
      </div>


      {/* Scope / Project description */}
      <Card className="border bg-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Projektbeskrivning</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <Textarea
            value={estimate.state.scope}
            onChange={(e) => estimate.updateScope(e.target.value)}
            placeholder="Beskriv projektets omfattning..."
            className="min-h-[60px] resize-none bg-muted/30 border border-border rounded-md p-2 text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-background transition-colors"
          />
        </CardContent>
      </Card>

      {/* Work items */}
      <Card className="border bg-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Tidsplan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <Textarea
            value={estimate.state.assumptions.join("\n")}
            onChange={(e) =>
              estimate.updateAssumptions(
                e.target.value.split("\n")
              )
            }
            placeholder="En punkt per rad..."
            className="min-h-[60px] resize-none bg-muted/30 border border-border rounded-md p-2 text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-background transition-colors"
          />
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Article Library Section */}
      <ArticleLibrarySection 
        onAddArticles={(newItems) => {
          const updatedItems = [...estimate.state.items, ...newItems];
          estimate.updateItems(updatedItems);
        }}
      />

      {/* Estimate items table */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Offertposter
          </h2>
        </div>
        <EstimateTable
          items={estimate.state.items}
          onItemsChange={estimate.updateItems}
          rotEnabled={estimate.state.rotEnabled}
          rutEnabled={estimate.state.rutEnabled}
        />
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Addons */}
      <AddonsSection
        addons={estimate.state.addons}
        onToggle={estimate.toggleAddon}
        onAdd={estimate.addAddon}
        onRemove={estimate.removeAddon}
      />

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Tax deduction panel (ROT/RUT) */}
      <TaxDeductionPanel
        rotEnabled={estimate.state.rotEnabled}
        rotPercent={estimate.state.rotPercent}
        rotEligibleLaborCost={estimate.totals.rotEligibleLaborCost}
        onRotToggle={(enabled) => estimate.updateRot(enabled)}
        rutEnabled={estimate.state.rutEnabled}
        rutEligibleLaborCost={estimate.totals.rutEligibleLaborCost}
        onRutToggle={(enabled) => estimate.updateRut(enabled)}
        totalLaborCost={estimate.totals.laborCost}
      />

      {/* Markup panel */}
      <MarkupPanel
        items={estimate.state.items}
        onItemsChange={estimate.updateItems}
      />

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Closing section */}
      <ClosingSection
        text={estimate.state.closingText}
        onChange={estimate.updateClosing}
      />

      {/* Sticky totals bar */}
      <StickyTotals
        laborCost={estimate.totals.laborCost}
        materialCost={estimate.totals.materialCost}
        subcontractorCost={estimate.totals.subcontractorCost}
        addonsCost={estimate.totals.addonsCost}
        markup={estimate.totals.markup}
        vat={estimate.totals.vat}
        totalInclVat={estimate.totals.totalInclVat}
        rotAmount={estimate.totals.rotAmount}
        rutAmount={estimate.totals.rutAmount}
        combinedDeduction={estimate.totals.combinedDeduction}
        amountToPay={estimate.totals.amountToPay}
        rotEnabled={estimate.state.rotEnabled}
        rutEnabled={estimate.state.rutEnabled}
        onSave={handleSave}
        onDownload={handleDownload}
        onPreview={isMobile ? () => setMobilePreviewOpen(true) : undefined}
        isSaving={estimate.isSaving}
      />
    </div>
  );

  // Preview content
  // Create a display project object for preview components
  const displayProject = project || {
    name: displayProjectName,
    client_name: displayClientName,
    address: displayAddress,
  };

  const previewContent = (
    <div 
      className="h-full bg-muted/30 border-l cursor-pointer group"
      onClick={() => setMobilePreviewOpen(true)}
      title="Klicka för att förstora"
    >
      <div className="p-3 border-b bg-background/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Förhandsgranskning</span>
        </div>
        <Maximize2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="group-hover:opacity-90 transition-opacity">
        <QuoteLivePreview
          project={displayProject}
          company={companySettings}
          scope={estimate.state.scope}
          assumptions={estimate.state.assumptions}
          items={estimate.state.items}
          addons={estimate.state.addons}
          markupPercent={estimate.state.markupPercent}
          rotEnabled={estimate.state.rotEnabled}
          rotPercent={estimate.state.rotPercent}
        />
      </div>
    </div>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {editorContent}
        <QuotePreviewSheet
          open={mobilePreviewOpen}
          onOpenChange={setMobilePreviewOpen}
          project={displayProject}
          company={companySettings}
          scope={estimate.state.scope}
          assumptions={estimate.state.assumptions}
          items={estimate.state.items}
          markupPercent={estimate.state.markupPercent}
          rotEnabled={estimate.state.rotEnabled}
          rotPercent={estimate.state.rotPercent}
        />
        <VoiceInputOverlay
          onTranscriptComplete={handleVoiceEdit}
          isProcessing={isApplyingVoice}
        />
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Radera offert?</AlertDialogTitle>
              <AlertDialogDescription>
                Denna åtgärd kan inte ångras. Offerten och alla tillhörande data kommer att raderas permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Radera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={showProjectRecommendation} onOpenChange={setShowProjectRecommendation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-primary" />
                Starta projekt?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Nu när offerten är godkänd, vill du gå vidare och starta ett projekt? 
                Det gör att du snabbt kan börja planera och hantera arbetet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Inte nu</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  navigate(`/projects?createFrom=${savedEstimateId}`);
                }}
              >
                Skapa projekt
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Desktop layout with resizable panels
  return (
    <>
      {showPreview ? (
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-120px)]">
          <ResizablePanel defaultSize={65} minSize={45}>
            <div className="h-full overflow-auto">{editorContent}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35} minSize={25}>
            {previewContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="h-full overflow-auto">{editorContent}</div>
      )}
      <QuotePreviewSheet
        open={mobilePreviewOpen}
        onOpenChange={setMobilePreviewOpen}
        project={displayProject}
        company={companySettings}
        scope={estimate.state.scope}
        assumptions={estimate.state.assumptions}
        items={estimate.state.items}
        markupPercent={estimate.state.markupPercent}
        rotEnabled={estimate.state.rotEnabled}
        rotPercent={estimate.state.rotPercent}
      />
      <VoiceInputOverlay
        onTranscriptComplete={handleVoiceEdit}
        isProcessing={isApplyingVoice}
        agentName="Saga AI"
        agentAvatar={AI_AGENTS.estimate.avatar}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera offert?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Offerten och alla tillhörande data kommer att raderas permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showProjectRecommendation} onOpenChange={setShowProjectRecommendation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Starta projekt?
            </AlertDialogTitle>
              <AlertDialogDescription>
                Nu när offerten är godkänd, vill du gå vidare och starta ett projekt? 
                Det gör att du snabbt kan börja planera och hantera arbetet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Inte nu</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                navigate(`/projects?createFrom=${savedEstimateId}`);
              }}
            >
              Skapa projekt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
