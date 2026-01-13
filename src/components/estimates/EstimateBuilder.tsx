import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Eye, EyeOff, FileText, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEstimate } from "@/hooks/useEstimate";
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

interface EstimateBuilderProps {
  project: Project;
  onDelete?: () => void;
}

export function EstimateBuilder({ project, onDelete }: EstimateBuilderProps) {
  const isMobile = useIsMobile();
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const estimate = useEstimate(project.id);

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

  const handleDownload = async () => {
    try {
      await generateQuotePdf({
        offerNumber: "OFF-001",
        projectName: project.name,
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
          name: project.client_name || undefined,
          address: project.address || undefined,
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

  const handleDelete = () => {
    estimate.delete();
    setDeleteDialogOpen(false);
    onDelete?.();
  };

  // Editor content
  const editorContent = (
    <div className="space-y-6 p-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offert</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Dölj förhandsgranskning
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Visa förhandsgranskning
                </>
              )}
            </Button>
          )}
          {estimate.hasExistingEstimate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Radera
            </Button>
          )}
        </div>
      </div>

      {/* Project info badges */}
      <div className="flex flex-wrap gap-2">
        {project.client_name && (
          <Badge variant="secondary">Kund: {project.client_name}</Badge>
        )}
        {project.address && (
          <Badge variant="outline">{project.address}</Badge>
        )}
      </div>

      <Separator />

      {/* Scope / Project description */}
      <div className="space-y-2">
        <Label htmlFor="scope">Projektbeskrivning</Label>
        <Textarea
          id="scope"
          value={estimate.state.scope}
          onChange={(e) => estimate.updateScope(e.target.value)}
          placeholder="Beskriv projektets omfattning..."
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Work items / Assumptions */}
      <div className="space-y-2">
        <Label>Arbete som ingår</Label>
        <Textarea
          value={estimate.state.assumptions.join("\n")}
          onChange={(e) =>
            estimate.updateAssumptions(
              e.target.value.split("\n").filter((s) => s.trim())
            )
          }
          placeholder="En punkt per rad..."
          className="min-h-[80px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Skriv varje arbetspunkt på en egen rad
        </p>
      </div>

      <Separator />

      {/* Estimate items table */}
      <div className="space-y-2">
        <Label>Offertposter</Label>
        <EstimateTable
          items={estimate.state.items}
          onItemsChange={estimate.updateItems}
        />
      </div>

      <Separator />

      {/* Addons */}
      <AddonsSection
        addons={estimate.state.addons}
        onToggle={estimate.toggleAddon}
        onAdd={estimate.addAddon}
        onRemove={estimate.removeAddon}
      />

      <Separator />

      {/* ROT panel */}
      <RotPanel
        enabled={estimate.state.rotEnabled}
        percent={estimate.state.rotPercent}
        laborCost={estimate.totals.laborCost}
        onToggle={(enabled) => estimate.updateRot(enabled)}
        onPercentChange={(percent) => estimate.updateRot(estimate.state.rotEnabled, percent)}
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
        onSave={() => estimate.save()}
        onDownload={handleDownload}
        onPreview={isMobile ? () => setMobilePreviewOpen(true) : undefined}
        isSaving={estimate.isSaving}
      />
    </div>
  );

  // Preview content
  const previewContent = (
    <div className="h-full bg-muted/30 border-l">
      <div className="p-4 border-b bg-background flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Förhandsgranskning</span>
      </div>
      <QuoteLivePreview
        project={project}
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
          project={project}
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
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="h-full overflow-auto">{editorContent}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
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
