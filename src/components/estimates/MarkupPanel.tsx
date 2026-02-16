import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";
import type { EstimateItem } from "./EstimateTable";

interface MarkupPanelProps {
  items: EstimateItem[];
  onItemsChange: (items: EstimateItem[]) => void;
}

export function MarkupPanel({ items, onItemsChange }: MarkupPanelProps) {
  const hasAnyMarkup = items.some((item) => item.markup_enabled);

  const handleMasterToggle = (enabled: boolean) => {
    onItemsChange(
      items.map((item) => ({
        ...item,
        markup_enabled: enabled,
        markup_percent: enabled ? (item.markup_percent || 10) : item.markup_percent,
      }))
    );
  };

  const handleItemToggle = (id: string, checked: boolean) => {
    onItemsChange(
      items.map((item) =>
        item.id === id
          ? { ...item, markup_enabled: checked, markup_percent: checked && !item.markup_percent ? 10 : item.markup_percent }
          : item
      )
    );
  };

  const handlePercentChange = (id: string, value: string) => {
    const percent = value === "" ? 0 : Number(value);
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, markup_percent: percent } : item
      )
    );
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  const totalMarkup = items.reduce((sum, item) => {
    if (item.markup_enabled && item.markup_percent > 0) {
      return sum + (item.subtotal || 0) * (item.markup_percent / 100);
    }
    return sum;
  }, 0);

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Påslag</CardTitle>
          </div>
          <Switch checked={hasAnyMarkup} onCheckedChange={handleMasterToggle} />
        </div>
      </CardHeader>

      {hasAnyMarkup && (
        <CardContent className="px-3 pb-3 pt-0 space-y-2">
          {items
            .filter((item) => (item.description || item.moment))
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <Checkbox
                  checked={item.markup_enabled}
                  onCheckedChange={(checked) =>
                    handleItemToggle(item.id, !!checked)
                  }
                  className="h-4 w-4"
                />
                <span className="flex-1 text-sm truncate min-w-0">
                  {item.description || item.moment || "–"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.markup_enabled ? (item.markup_percent || "") : ""}
                    onChange={(e) => handlePercentChange(item.id, e.target.value)}
                    disabled={!item.markup_enabled}
                    className="w-12 h-7 text-xs text-right bg-muted/50 rounded border-0 outline-none focus:ring-1 focus:ring-primary/50 tabular-nums disabled:opacity-40"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                {item.markup_enabled && item.markup_percent > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-16 text-right">
                    +{formatNumber((item.subtotal || 0) * (item.markup_percent / 100))}
                  </span>
                )}
              </div>
            ))}

          {totalMarkup > 0 && (
            <div className="flex items-center justify-between pt-2 border-t text-sm font-medium">
              <span>Totalt påslag</span>
              <span className="tabular-nums">{formatNumber(totalMarkup)} kr</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
