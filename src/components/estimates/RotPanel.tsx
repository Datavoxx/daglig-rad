import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";

interface RotPanelProps {
  enabled: boolean;
  percent: number;
  laborCost: number;
  onToggle: (enabled: boolean) => void;
  onPercentChange: (percent: number) => void;
  readOnly?: boolean;
}

export function RotPanel({
  enabled,
  percent,
  laborCost,
  onToggle,
  onPercentChange,
  readOnly = false,
}: RotPanelProps) {
  const laborWithVat = laborCost * 1.25;
  const rotAmount = laborWithVat * (percent / 100);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

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
              </div>
              {enabled && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Beräknat avdrag: {formatNumber(rotAmount)} kr
                </p>
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
