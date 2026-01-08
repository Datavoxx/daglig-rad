import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Check } from "lucide-react";

interface WorkItem {
  wbs: string;
  name: string;
  unit: string;
  resource: string;
  hours_per_unit: number;
}

interface CostLibraryItem {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface ParsedTemplate {
  name: string;
  description?: string;
  hourly_rates: Record<string, number>;
  work_items: WorkItem[];
  cost_library: CostLibraryItem[];
  material_spill_percent?: number;
  overhead_percent?: number;
  risk_percent?: number;
  profit_percent?: number;
  vat_percent?: number;
  establishment_cost?: number;
}

interface TemplateEditorProps {
  template: ParsedTemplate;
  onSave: (template: ParsedTemplate) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function TemplateEditor({ template, onSave, onCancel, isSaving }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<ParsedTemplate>(template);

  const updateHourlyRate = (resource: string, value: number) => {
    setEditedTemplate({
      ...editedTemplate,
      hourly_rates: {
        ...editedTemplate.hourly_rates,
        [resource]: value,
      },
    });
  };

  const updateWorkItem = (index: number, field: keyof WorkItem, value: string | number) => {
    const newItems = [...editedTemplate.work_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedTemplate({ ...editedTemplate, work_items: newItems });
  };

  const addWorkItem = () => {
    const newWbs = `${editedTemplate.work_items.length + 1}.1`;
    setEditedTemplate({
      ...editedTemplate,
      work_items: [
        ...editedTemplate.work_items,
        { wbs: newWbs, name: "", unit: "m²", resource: "", hours_per_unit: 1 },
      ],
    });
  };

  const removeWorkItem = (index: number) => {
    const newItems = editedTemplate.work_items.filter((_, i) => i !== index);
    setEditedTemplate({ ...editedTemplate, work_items: newItems });
  };

  const updateCostLibraryItem = (index: number, field: keyof CostLibraryItem, value: string | number) => {
    const newItems = [...editedTemplate.cost_library];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedTemplate({ ...editedTemplate, cost_library: newItems });
  };

  const addCostLibraryItem = () => {
    setEditedTemplate({
      ...editedTemplate,
      cost_library: [
        ...editedTemplate.cost_library,
        { id: `MAT_${Date.now()}`, name: "", unit: "m²", price: 0 },
      ],
    });
  };

  const removeCostLibraryItem = (index: number) => {
    const newItems = editedTemplate.cost_library.filter((_, i) => i !== index);
    setEditedTemplate({ ...editedTemplate, cost_library: newItems });
  };

  return (
    <div className="space-y-6">
      {/* Name and description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Mallnamn</Label>
          <Input
            value={editedTemplate.name}
            onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
            placeholder="T.ex. Badrumsrenovering Standard"
          />
        </div>
        <div className="space-y-2">
          <Label>Beskrivning (valfritt)</Label>
          <Input
            value={editedTemplate.description || ""}
            onChange={(e) => setEditedTemplate({ ...editedTemplate, description: e.target.value })}
            placeholder="T.ex. Mall för badrum 4-10 kvm"
          />
        </div>
      </div>

      {/* Hourly rates */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Timpriser</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(editedTemplate.hourly_rates).map(([resource, rate]) => (
              <div key={resource} className="space-y-1">
                <Label className="text-xs capitalize">{resource}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => updateHourlyRate(resource, parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">kr/h</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work items */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Moment (WBS)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="grid grid-cols-[60px_1fr_60px_100px_80px_40px] gap-2 text-xs font-medium text-muted-foreground pb-1">
            <span>WBS</span>
            <span>Moment</span>
            <span>Enhet</span>
            <span>Resurs</span>
            <span>Tim/enh</span>
            <span></span>
          </div>
          {editedTemplate.work_items.map((item, index) => (
            <div key={index} className="grid grid-cols-[60px_1fr_60px_100px_80px_40px] gap-2 items-center">
              <Input
                value={item.wbs}
                onChange={(e) => updateWorkItem(index, "wbs", e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                value={item.name}
                onChange={(e) => updateWorkItem(index, "name", e.target.value)}
                className="h-8 text-sm"
                placeholder="Moment..."
              />
              <Input
                value={item.unit}
                onChange={(e) => updateWorkItem(index, "unit", e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                value={item.resource}
                onChange={(e) => updateWorkItem(index, "resource", e.target.value)}
                className="h-8 text-sm"
                placeholder="Resurs..."
              />
              <Input
                type="number"
                step="0.1"
                value={item.hours_per_unit}
                onChange={(e) => updateWorkItem(index, "hours_per_unit", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeWorkItem(index)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addWorkItem} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Lägg till moment
          </Button>
        </CardContent>
      </Card>

      {/* Cost library */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Materialkostnader</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="grid grid-cols-[1fr_60px_100px_40px] gap-2 text-xs font-medium text-muted-foreground pb-1">
            <span>Material</span>
            <span>Enhet</span>
            <span>Pris</span>
            <span></span>
          </div>
          {editedTemplate.cost_library.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_60px_100px_40px] gap-2 items-center">
              <Input
                value={item.name}
                onChange={(e) => updateCostLibraryItem(index, "name", e.target.value)}
                className="h-8 text-sm"
                placeholder="Material..."
              />
              <Input
                value={item.unit}
                onChange={(e) => updateCostLibraryItem(index, "unit", e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateCostLibraryItem(index, "price", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">kr</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeCostLibraryItem(index)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCostLibraryItem} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Lägg till material
          </Button>
        </CardContent>
      </Card>

      {/* Percentages */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Påslag och moms</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Materialspill</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editedTemplate.material_spill_percent ?? 7}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, material_spill_percent: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Omkostnader</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editedTemplate.overhead_percent ?? 12}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, overhead_percent: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Risk</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editedTemplate.risk_percent ?? 8}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, risk_percent: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vinst</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editedTemplate.profit_percent ?? 10}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, profit_percent: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Moms</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editedTemplate.vat_percent ?? 25}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, vat_percent: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Etablering</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editedTemplate.establishment_cost ?? 4500}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, establishment_cost: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">kr</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Tillbaka
        </Button>
        <Button onClick={() => onSave(editedTemplate)} disabled={!editedTemplate.name || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Spara mall
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
