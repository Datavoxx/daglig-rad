import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Sparkles, Info, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Swedish tax deduction limits (2026)
const ROT_MAX = 50000;
const RUT_MAX = 75000;
const COMBINED_MAX = 75000;

interface TaxDeductionPanelProps {
  // ROT
  rotEnabled: boolean;
  rotPercent: number;
  rotEligibleLaborCost: number;
  onRotToggle: (enabled: boolean) => void;
  // RUT
  rutEnabled: boolean;
  rutEligibleLaborCost: number;
  onRutToggle: (enabled: boolean) => void;
  // General
  totalLaborCost: number;
  readOnly?: boolean;
}

export function TaxDeductionPanel({
  rotEnabled,
  rotPercent,
  rotEligibleLaborCost,
  onRotToggle,
  rutEnabled,
  rutEligibleLaborCost,
  onRutToggle,
  totalLaborCost,
  readOnly = false,
}: TaxDeductionPanelProps) {
  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  // ROT calculations
  const rotEligibleWithVat = rotEligibleLaborCost * 1.25;
  const rotAmount = rotEnabled ? rotEligibleWithVat * (rotPercent / 100) : 0;
  const rotExceedsMax = rotAmount > ROT_MAX;
  const rotCapped = Math.min(rotAmount, ROT_MAX);

  // RUT calculations (always 50%)
  const rutEligibleWithVat = rutEligibleLaborCost * 1.25;
  const rutAmount = rutEnabled ? rutEligibleWithVat * 0.5 : 0;
  const rutExceedsMax = rutAmount > RUT_MAX;
  const rutCapped = Math.min(rutAmount, RUT_MAX);

  // Combined limit
  const combinedAmount = rotCapped + rutCapped;
  const combinedExceedsMax = combinedAmount > COMBINED_MAX;
  const totalCapped = Math.min(combinedAmount, COMBINED_MAX);

  const hasAnyDeduction = rotEnabled || rutEnabled;
  const hasSelectedRotRows = rotEligibleLaborCost > 0;
  const hasSelectedRutRows = rutEligibleLaborCost > 0;
  const totalLaborWithVat = totalLaborCost * 1.25;

  return (
    <Card className={cn(
      "transition-colors",
      hasAnyDeduction ? "border-primary/30 bg-primary/5" : ""
    )}>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            hasAnyDeduction ? "bg-primary/10" : "bg-muted"
          )}>
            <Home className={cn(
              "h-4 w-4",
              hasAnyDeduction ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <span className="font-medium">Skatteavdrag</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p className="font-medium mb-1">ROT/RUT-avdrag</p>
                <p>ROT: 30% avdrag, max 50 000 kr/person/år</p>
                <p>RUT: 50% avdrag, max 75 000 kr/person/år</p>
                <p className="mt-1 text-muted-foreground">Kombinerat max 75 000 kr/person/år</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ROT Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">ROT-avdrag (30%)</span>
            </div>
            <Switch
              checked={rotEnabled}
              onCheckedChange={onRotToggle}
              disabled={readOnly}
            />
          </div>
          
          {rotEnabled && (
            <div className="pl-5 space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Berättigad arbetskostnad: {formatNumber(rotEligibleWithVat)} kr inkl moms
                {totalLaborCost > 0 && rotEligibleLaborCost < totalLaborCost && (
                  <span className="text-muted-foreground/70">
                    {" "}(av totalt {formatNumber(totalLaborWithVat)} kr)
                  </span>
                )}
              </p>
              {hasSelectedRotRows ? (
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xs font-medium",
                    rotExceedsMax ? "text-amber-600" : "text-primary"
                  )}>
                    Beräknat avdrag: {formatNumber(rotAmount)} kr
                    {rotExceedsMax && (
                      <span className="font-normal text-muted-foreground">
                        {" "}→ max {formatNumber(ROT_MAX)} kr
                      </span>
                    )}
                  </p>
                  {rotExceedsMax && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          Överstiger maxgränsen på 50 000 kr per person/år
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-600">
                  Välj arbetsrader för ROT i tabellen ovan
                </p>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* RUT Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">RUT-avdrag (50%)</span>
            </div>
            <Switch
              checked={rutEnabled}
              onCheckedChange={onRutToggle}
              disabled={readOnly}
            />
          </div>
          
          {rutEnabled && (
            <div className="pl-5 space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Berättigad arbetskostnad: {formatNumber(rutEligibleWithVat)} kr inkl moms
                {totalLaborCost > 0 && rutEligibleLaborCost < totalLaborCost && (
                  <span className="text-muted-foreground/70">
                    {" "}(av totalt {formatNumber(totalLaborWithVat)} kr)
                  </span>
                )}
              </p>
              {hasSelectedRutRows ? (
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xs font-medium",
                    rutExceedsMax ? "text-amber-600" : "text-primary"
                  )}>
                    Beräknat avdrag: {formatNumber(rutAmount)} kr
                    {rutExceedsMax && (
                      <span className="font-normal text-muted-foreground">
                        {" "}→ max {formatNumber(RUT_MAX)} kr
                      </span>
                    )}
                  </p>
                  {rutExceedsMax && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          Överstiger maxgränsen på 75 000 kr per person/år
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-600">
                  Välj arbetsrader för RUT i tabellen ovan
                </p>
              )}
            </div>
          )}
        </div>

        {/* Combined total */}
        {hasAnyDeduction && (hasSelectedRotRows || hasSelectedRutRows) && (
          <>
            <div className="h-px bg-border" />
            <div className={cn(
              "p-2 rounded-md",
              combinedExceedsMax ? "bg-amber-50 border border-amber-200" : "bg-muted/50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {combinedExceedsMax && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm font-medium">Totalt avdrag</span>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  combinedExceedsMax ? "text-amber-600" : "text-primary"
                )}>
                  {formatNumber(totalCapped)} kr
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Max 75 000 kr kombinerat per person/år
                {combinedExceedsMax && (
                  <span className="text-amber-600 ml-1">
                    (beräknat {formatNumber(combinedAmount)} kr)
                  </span>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
