import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RotPanelProps {
  enabled: boolean;
  percent: number;
  laborCost: number;
  rotEligibleLaborCost?: number;
  onToggle: (enabled: boolean) => void;
  onPercentChange: (percent: number) => void;
  readOnly?: boolean;
}

export function RotPanel({
  enabled,
  percent,
  laborCost,
  rotEligibleLaborCost,
  onToggle,
  onPercentChange,
  readOnly = false,
}: RotPanelProps) {
  // Use rotEligibleLaborCost if provided, otherwise fall back to laborCost
  const eligibleCost = rotEligibleLaborCost ?? laborCost;
  const eligibleWithVat = eligibleCost * 1.25;
  const rotAmount = eligibleWithVat * (percent / 100);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  const hasSelectedRows = eligibleCost > 0;
  const totalLaborWithVat = laborCost * 1.25;

  return (
    <Card className={enabled ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? "bg-primary/10" : "bg-muted"}`}>
              <Home className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">ROT-avdrag</span>
                <Switch
                  checked={enabled}
                  onCheckedChange={onToggle}
                  disabled={readOnly}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      ROT-avdrag gäller endast arbetskostnad. Bocka i de arbetsrader som ska ingå i avdraget.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {enabled && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    ROT-berättigad arbetskostnad: {formatNumber(eligibleWithVat)} kr inkl moms
                    {rotEligibleLaborCost !== undefined && laborCost > 0 && (
                      <span className="text-muted-foreground/70">
                        {" "}(av totalt {formatNumber(totalLaborWithVat)} kr)
                      </span>
                    )}
                  </p>
                  {hasSelectedRows ? (
                    <p className="text-xs font-medium text-primary">
                      Beräknat avdrag: {formatNumber(rotAmount)} kr
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600">
                      Välj arbetsrader för ROT i tabellen ovan
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {enabled && !readOnly && (
            <Select
              value={String(percent)}
              onValueChange={(value) => onPercentChange(Number(value))}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
              </SelectContent>
            </Select>
          )}
          {enabled && readOnly && (
            <span className="text-sm text-muted-foreground">{percent}%</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
