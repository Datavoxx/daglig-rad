import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Gift } from "lucide-react";
import type { EstimateAddon } from "@/hooks/useEstimate";

interface AddonsSectionProps {
  addons: EstimateAddon[];
  onToggle: (addonId: string) => void;
  onAdd: (name: string, price: number, description?: string) => void;
  onRemove: (addonId: string) => void;
  readOnly?: boolean;
}

export function AddonsSection({
  addons,
  onToggle,
  onAdd,
  onRemove,
  readOnly = false,
}: AddonsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const handleAdd = () => {
    if (newName.trim() && newPrice) {
      onAdd(newName.trim(), Number(newPrice));
      setNewName("");
      setNewPrice("");
      setIsAdding(false);
    }
  };

  const selectedCount = addons.filter((a) => a.is_selected).length;
  const selectedTotal = addons
    .filter((a) => a.is_selected)
    .reduce((sum, a) => sum + a.price, 0);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  if (addons.length === 0 && readOnly) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Tillval</CardTitle>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedCount} valda (+{formatNumber(selectedTotal)} kr)
              </Badge>
            )}
          </div>
          {!readOnly && !isAdding && (
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Lägg till
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {addons.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Lägg till tillval som kunden kan välja till
          </p>
        )}

        {addons.map((addon) => (
          <div
            key={addon.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              addon.is_selected
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 border-transparent"
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <Switch
                checked={addon.is_selected}
                onCheckedChange={() => onToggle(addon.id)}
                disabled={readOnly}
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${addon.is_selected ? "text-foreground" : "text-muted-foreground"}`}>
                  {addon.name}
                </p>
                {addon.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {addon.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-medium text-sm ${addon.is_selected ? "text-primary" : "text-muted-foreground"}`}>
                +{formatNumber(addon.price)} kr
              </span>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(addon.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {isAdding && (
          <div className="flex gap-2 items-end p-3 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Namn</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="T.ex. Extra städning"
                className="h-9"
                autoFocus
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-muted-foreground mb-1 block">Pris (kr)</label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0"
                className="h-9"
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || !newPrice}>
              Lägg till
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Avbryt
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
