import { Button } from "@/components/ui/button";
import { Save, Download, Eye, Loader2, ChevronDown, FileEdit, CheckCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StickyTotalsProps {
  laborCost: number;
  materialCost: number;
  subcontractorCost: number;
  addonsCost: number;
  markup: number;
  vat: number;
  totalInclVat: number;
  rotAmount: number;
  amountToPay: number;
  rotEnabled: boolean;
  status: "draft" | "completed";
  onSaveAsDraft: () => void;
  onSaveAsCompleted: () => void;
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
  amountToPay,
  rotEnabled,
  status,
  onSaveAsDraft,
  onSaveAsCompleted,
  onDownload,
  onPreview,
  isSaving = false,
}: StickyTotalsProps) {
  const isMobile = useIsMobile();

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  // Mobile: simplified view with just total and buttons
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Totalt inkl. moms</p>
            <p className="text-xl font-bold text-primary">
              {formatNumber(rotEnabled ? amountToPay : totalInclVat)} kr
            </p>
            {rotEnabled && (
              <p className="text-xs text-muted-foreground">
                Efter ROT-avdrag
              </p>
            )}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isSaving} className="gap-1">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSaveAsDraft}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Spara som draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSaveAsCompleted}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Markera som klar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: full breakdown
  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t shadow-lg p-3 -mx-4 -mb-4 mt-4 animate-slide-in-bottom">
      <div className="flex items-center justify-between gap-4 max-w-none">
        <div className="flex items-center gap-4 text-[13px]">
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

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground transition-opacity duration-200">
              {rotEnabled ? "Att betala (efter ROT)" : "Totalt inkl. moms"}
            </p>
            <p className="text-xl font-bold text-primary tabular-nums number-animate">
              {formatNumber(rotEnabled ? amountToPay : totalInclVat)} kr
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={onDownload} className="transition-all duration-200 hover:shadow-md h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Ladda ner
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={isSaving} className="transition-all duration-200 hover:shadow-md h-8 gap-1">
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span className="mr-0.5">Spara</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSaveAsDraft}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Spara som draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSaveAsCompleted}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Markera som klar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
