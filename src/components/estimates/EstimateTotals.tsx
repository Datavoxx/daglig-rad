import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { EstimateItem } from "./EstimateTable";

interface EstimateTotalsProps {
  items: EstimateItem[];
  markupPercent: number;
  onMarkupChange: (percent: number) => void;
  readOnly?: boolean;
}

export function EstimateTotals({
  items,
  markupPercent,
  onMarkupChange,
  readOnly = false,
}: EstimateTotalsProps) {
  // Calculate costs by type
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
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("sv-SE").format(Math.round(num));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Summering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Arbetskostnad</span>
          <span>{formatNumber(laborCost)} kr</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Materialkostnad</span>
          <span>{formatNumber(materialCost)} kr</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">UE-kostnad</span>
          <span>{formatNumber(subcontractorCost)} kr</span>
        </div>

        <Separator />

        <div className="flex justify-between text-sm font-medium">
          <span>Summa</span>
          <span>{formatNumber(subtotal)} kr</span>
        </div>

        {markup > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Påslag</span>
            <span>{formatNumber(markup)} kr</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-medium">
          <span>Totalt exkl. moms</span>
          <span>{formatNumber(totalExclVat)} kr</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Moms (25%)</span>
          <span>{formatNumber(vat)} kr</span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Totalt inkl. moms</span>
          <span className="text-primary">{formatNumber(totalInclVat)} kr</span>
        </div>
      </CardContent>
    </Card>
  );
}
