import { Button } from "@/components/ui/button";
import { Save, Download, Eye, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StickyTotalsProps {
  laborCost: number;
  materialCost: number;
  subcontractorCost: number;
  addonsCost: number;
  markup: number;
  vat: number;
  totalInclVat: number;
  rotAmount: number;
  rutAmount?: number;
  combinedDeduction?: number;
  amountToPay: number;
  rotEnabled: boolean;
  rutEnabled?: boolean;
  onSave: () => void;
  onDownload: () => void;
  onPreview?: () => void;
  isSaving?: boolean;
}

export function StickyTotals({
  laborCost,
  materialCost,
  subcontractorCost,
  addonsCost,
  markup,
  vat,
  totalInclVat,
  rotAmount,
  rutAmount = 0,
  combinedDeduction = 0,
  amountToPay,
  rotEnabled,
  rutEnabled = false,
  onSave,
  onDownload,
  onPreview,
  isSaving = false,
}: StickyTotalsProps) {
  const isMobile = useIsMobile();
  const hasAnyDeduction = rotEnabled || rutEnabled;

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  // Mobile: simplified view with just total and buttons
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        {/* Breakdown row for mobile */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1 text-[11px] text-muted-foreground border-b overflow-x-auto">
          <span className="whitespace-nowrap">Arb: <span className="font-medium text-foreground tabular-nums">{formatNumber(laborCost)}</span></span>
          <span className="whitespace-nowrap">Mat: <span className="font-medium text-foreground tabular-nums">{formatNumber(materialCost)}</span></span>
          <span className="whitespace-nowrap">UE: <span className="font-medium text-foreground tabular-nums">{formatNumber(subcontractorCost)}</span></span>
          <span className="whitespace-nowrap">Påsl: <span className="font-medium text-foreground tabular-nums">{formatNumber(markup)}</span></span>
          <span className="whitespace-nowrap">Moms: <span className="font-medium text-foreground tabular-nums">{formatNumber(vat)}</span></span>
        </div>
        
        {/* Total + buttons */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {hasAnyDeduction 
                ? `Att betala (efter ${rotEnabled && rutEnabled ? "ROT/RUT" : rotEnabled ? "ROT" : "RUT"})` 
                : "Totalt inkl. moms"}
            </p>
            <p className="text-xl font-bold text-primary tabular-nums">
              {formatNumber(hasAnyDeduction ? amountToPay : totalInclVat)} kr
            </p>
          </div>
          <div className="flex gap-2">
            {onPreview && (
              <Button variant="outline" size="icon" onClick={onPreview}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button disabled={isSaving} onClick={onSave}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: full breakdown
  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t shadow-lg p-3 -mx-4 -mb-4 mt-4 animate-slide-in-bottom">
      <div className="flex items-center justify-between gap-4 max-w-none">
        <div className="flex items-center gap-4 text-[13px] flex-shrink min-w-0 overflow-hidden">
          <div className="hidden lg:block">
            <span className="text-muted-foreground">Arb:</span>
            <span className="ml-0.5 font-medium tabular-nums number-animate">{formatNumber(laborCost)}</span>
          </div>
          <div className="hidden lg:block">
            <span className="text-muted-foreground">Mat:</span>
            <span className="ml-0.5 font-medium tabular-nums number-animate">{formatNumber(materialCost)}</span>
          </div>
          <div className="hidden xl:block">
            <span className="text-muted-foreground">UE:</span>
            <span className="ml-0.5 font-medium tabular-nums number-animate">{formatNumber(subcontractorCost)}</span>
          </div>
          {addonsCost > 0 && (
            <div className="hidden xl:block">
              <span className="text-muted-foreground">Tillv:</span>
              <span className="ml-0.5 font-medium tabular-nums number-animate">{formatNumber(addonsCost)}</span>
            </div>
          )}
          <div className="hidden md:block">
            <span className="text-muted-foreground">Påsl:</span>
            <span className="ml-0.5 font-medium tabular-nums number-animate">{formatNumber(markup)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Moms:</span>
            <span className="ml-0.5 font-medium tabular-nums number-animate">{formatNumber(vat)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground transition-opacity duration-200">
              {hasAnyDeduction 
                ? `Att betala (efter ${rotEnabled && rutEnabled ? "ROT/RUT" : rotEnabled ? "ROT" : "RUT"})` 
                : "Totalt inkl. moms"}
            </p>
            <p className="text-xl font-bold text-primary tabular-nums number-animate">
              {formatNumber(hasAnyDeduction ? amountToPay : totalInclVat)} kr
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={onDownload} className="transition-all duration-200 hover:shadow-md h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Ladda ner
            </Button>
            <Button size="sm" disabled={isSaving} onClick={onSave} className="transition-all duration-200 hover:shadow-md h-8">
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="mr-0.5">Spara</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
