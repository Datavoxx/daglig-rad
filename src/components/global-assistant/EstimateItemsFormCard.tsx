import { useState } from "react";
import { FileText, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceFormSection } from "./VoiceFormSection";
import { useArticleCategories } from "@/hooks/useArticleCategories";

interface EstimateItem {
  id: string;
  article: string;
  description: string;
  quantity: number | null;
  unit: string;
  unit_price: number;
}

interface EstimateAddon {
  id: string;
  name: string;
  price: number;
}

export interface EstimateItemsFormData {
  estimateId: string;
  introduction: string;
  timeline: string;
  items: Array<{
    article: string;
    description: string;
    quantity: number | null;
    unit: string;
    unit_price: number;
  }>;
  addons: Array<{
    name: string;
    price: number;
  }>;
}

interface EstimateItemsFormCardProps {
  estimateId: string;
  offerNumber: string;
  onSubmit: (data: EstimateItemsFormData) => void;
  onCancel: () => void;
  onOpenEstimate: () => void;
  disabled?: boolean;
}

const FALLBACK_ARTICLE_OPTIONS = [
  "Arbete",
  "Bygg",
  "Deponi",
  "Framkörning",
  "Förbrukning",
  "Förvaltning",
  "Markarbete",
  "Maskin",
  "Material",
  "Målning",
  "Snöröjning",
  "Städ",
  "Trädgårdsskötsel",
];

const UNITS = ["tim", "st", "m", "m²", "m³", "kg", "kpl"];

export function EstimateItemsFormCard({
  estimateId,
  offerNumber,
  onSubmit,
  onCancel,
  onOpenEstimate,
  disabled = false,
}: EstimateItemsFormCardProps) {
  const { categoryNames, loading: categoriesLoading } = useArticleCategories();
  const articleOptions = categoryNames.length > 0 ? categoryNames : FALLBACK_ARTICLE_OPTIONS;

  const [introduction, setIntroduction] = useState("");
  const [timeline, setTimeline] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([
    {
      id: crypto.randomUUID(),
      article: "Arbete",
      description: "",
      quantity: null,
      unit: "tim",
      unit_price: 0,
    },
  ]);
  const [addons, setAddons] = useState<EstimateAddon[]>([]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        article: "Arbete",
        description: "",
        quantity: null,
        unit: "tim",
        unit_price: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (
    id: string,
    field: keyof EstimateItem,
    value: string | number | null
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddAddon = () => {
    setAddons((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        price: 0,
      },
    ]);
  };

  const handleRemoveAddon = (id: string) => {
    setAddons((prev) => prev.filter((addon) => addon.id !== id));
  };

  const handleAddonChange = (
    id: string,
    field: keyof EstimateAddon,
    value: string | number
  ) => {
    setAddons((prev) =>
      prev.map((addon) =>
        addon.id === id ? { ...addon, [field]: value } : addon
      )
    );
  };

  const handleSubmit = () => {
    // Filter out empty items
    const validItems = items.filter(
      (item) => item.description.trim() !== "" || item.unit_price > 0
    );

    const validAddons = addons.filter(
      (addon) => addon.name.trim() !== "" && addon.price > 0
    );

    onSubmit({
      estimateId,
      introduction,
      timeline,
      items: validItems.map(({ id, ...rest }) => rest),
      addons: validAddons.map(({ id, ...rest }) => rest),
    });
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => {
      const qty = item.quantity || 1;
      return sum + qty * item.unit_price;
    }, 0);
    const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
    return itemsTotal + addonsTotal;
  };

  const handleVoiceData = (data: Record<string, unknown>) => {
    // Fyll i projektbeskrivning
    if (data.introduction && typeof data.introduction === "string") {
      setIntroduction(data.introduction);
    }
    
    // Fyll i tidsplan
    if (data.timeline && typeof data.timeline === "string") {
      setTimeline(data.timeline);
    }
    
    // Fyll i offertposter
    if (Array.isArray(data.items) && data.items.length > 0) {
      const newItems = data.items.map((item: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        article: (item.article as string) || "Arbete",
        description: (item.description as string) || "",
        quantity: (item.quantity as number) || null,
        unit: (item.unit as string) || "tim",
        unit_price: (item.unit_price as number) || 0,
      }));
      setItems(newItems);
    }
    
    // Fyll i tillval
    if (Array.isArray(data.addons) && data.addons.length > 0) {
      const newAddons = data.addons.map((addon: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        name: (addon.name as string) || "",
        price: (addon.price as number) || 0,
      }));
      setAddons(newAddons);
    }
  };

  return (
    <Card className="w-full border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Lägg till offertposter</CardTitle>
              <p className="text-xs text-muted-foreground">{offerNumber}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenEstimate}
            className="text-xs"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Öppna offert
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice input section */}
        <VoiceFormSection
          formType="estimate-items"
          onDataExtracted={handleVoiceData}
          disabled={disabled}
        />

        {/* Projektbeskrivning */}
        <div className="space-y-1.5">
          <Label htmlFor="introduction" className="text-xs">
            Projektbeskrivning
          </Label>
          <Textarea
            id="introduction"
            placeholder="Beskriv projektet kort..."
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            disabled={disabled}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Tidsplan */}
        <div className="space-y-1.5">
          <Label htmlFor="timeline" className="text-xs">
            Tidsplan
          </Label>
          <Textarea
            id="timeline"
            placeholder="En punkt per rad..."
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            disabled={disabled}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Offertposter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Offertposter</Label>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-lg border border-border/50 bg-background/50 p-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Rad {index + 1}
                  </span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={item.article}
                    onValueChange={(value) =>
                      handleItemChange(item.id, "article", value)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        articleOptions.map((article) => (
                          <SelectItem key={article} value={article}>
                            {article}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={item.unit}
                    onValueChange={(value) =>
                      handleItemChange(item.id, "unit", value)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Beskrivning"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(item.id, "description", e.target.value)
                  }
                  disabled={disabled}
                  className="h-8 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Antal"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "quantity",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    disabled={disabled}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Á-pris"
                    value={item.unit_price || ""}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "unit_price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={disabled}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={disabled}
            className="w-full text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Lägg till rad
          </Button>
        </div>

        {/* Tillval */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Tillval (valfritt)</Label>
          {addons.length > 0 && (
            <div className="space-y-2">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-2"
                >
                  <Input
                    placeholder="Namn på tillval"
                    value={addon.name}
                    onChange={(e) =>
                      handleAddonChange(addon.id, "name", e.target.value)
                    }
                    disabled={disabled}
                    className="h-8 flex-1 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Pris"
                    value={addon.price || ""}
                    onChange={(e) =>
                      handleAddonChange(
                        addon.id,
                        "price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={disabled}
                    className="h-8 w-24 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveAddon(addon.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddAddon}
            disabled={disabled}
            className="w-full text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Lägg till tillval
          </Button>
        </div>

        {/* Total */}
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Totalt (exkl. moms)</span>
            <span className="text-sm font-medium">
              {calculateTotal().toLocaleString("sv-SE")} kr
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
            className="flex-1"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={disabled}
            className="flex-1"
          >
            Spara offert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
