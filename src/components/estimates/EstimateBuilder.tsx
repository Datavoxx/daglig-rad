import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Eye, EyeOff, FileText, Trash2, ClipboardList, ListChecks, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEstimate } from "@/hooks/useEstimate";
import { EstimateHeader } from "./EstimateHeader";
import { IntroductionSection } from "./IntroductionSection";
import { ClosingSection } from "./ClosingSection";
import { EstimateTable } from "./EstimateTable";
import { AddonsSection } from "./AddonsSection";
import { RotPanel } from "./RotPanel";
import { StickyTotals } from "./StickyTotals";
import { QuoteLivePreview } from "./QuoteLivePreview";
import { QuotePreviewSheet } from "./QuotePreviewSheet";
import { generateQuotePdf } from "@/lib/generateQuotePdf";
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
  onDelete?: () => void;
  onBack?: () => void;
}

export function EstimateBuilder({ project, manualData, onDelete, onBack }: EstimateBuilderProps) {
  const isMobile = useIsMobile();
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Determine if we're in manual mode
  const isManualMode = !project && !!manualData;

  const estimate = useEstimate(project?.id || null, isManualMode ? manualData : undefined);
  
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
      });
      toast.success("Offert nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  const handleSaveAsDraft = () => {
    estimate.updateStatus("draft");
    setTimeout(() => estimate.save(), 0);
  };

  const handleSaveAsCompleted = () => {
    estimate.updateStatus("completed");
    setTimeout(() => estimate.save(), 0);
  };

  const handleDelete = () => {
    estimate.delete();
    setDeleteDialogOpen(false);
    onDelete?.();
  };

  // Editor content
  const editorContent = (
    <div className="space-y-4 p-4 pb-28">
      {/* Header section */}
      <div className="flex items-start justify-between gap-4">
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
        />
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
          {!isMobile && (
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
      </div>

      {/* Introduction section */}
      <IntroductionSection
        text={estimate.state.introductionText}
        onChange={estimate.updateIntroduction}
      />

      {/* Divider */}
      <div className="h-px bg-border" />

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
            <CardTitle className="text-sm font-medium">Arbete som ingår</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <Textarea
            value={estimate.state.assumptions.join("\n")}
            onChange={(e) =>
              estimate.updateAssumptions(
                e.target.value.split("\n").filter((s) => s.trim())
              )
            }
            placeholder="En punkt per rad..."
            className="min-h-[60px] resize-none bg-muted/30 border border-border rounded-md p-2 text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-background transition-colors"
          />
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="h-px bg-border" />

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

      {/* ROT panel */}
      <RotPanel
        enabled={estimate.state.rotEnabled}
        percent={estimate.state.rotPercent}
        laborCost={estimate.totals.laborCost}
        rotEligibleLaborCost={estimate.totals.rotEligibleLaborCost}
        onToggle={(enabled) => estimate.updateRot(enabled)}
        onPercentChange={(percent) => estimate.updateRot(estimate.state.rotEnabled, percent)}
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
        amountToPay={estimate.totals.amountToPay}
        rotEnabled={estimate.state.rotEnabled}
        status={estimate.state.status}
        onSaveAsDraft={handleSaveAsDraft}
        onSaveAsCompleted={handleSaveAsCompleted}
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
    <div className="h-full bg-muted/30 border-l">
      <div className="p-3 border-b bg-background/80 backdrop-blur-sm flex items-center gap-2 sticky top-0 z-10">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Förhandsgranskning</span>
      </div>
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
    </>
  );
}
