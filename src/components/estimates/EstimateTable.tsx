import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Circle, Home, Sparkles, EyeOff } from "lucide-react";
import { EstimateItemsImportDialog, type ParsedEstimateItem } from "./EstimateItemsImportDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Map article values to labor/material/subcontractor types
function mapArticleToType(article: string): "labor" | "material" | "subcontractor" {
  const lower = article.toLowerCase().trim();
  
  // Material types
  if (["material", "mat", "bygg", "förbrukning"].includes(lower)) {
    return "material";
  }
  
  // Subcontractor
  if (["ue", "underentreprenör", "underleverantör"].includes(lower)) {
    return "subcontractor";
  }
  
  // Default to labor
  return "labor";
}

// Article categories - Bygglet style
const ARTICLE_OPTIONS = [
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
] as const;

export interface EstimateItem {
  id: string;
  article: string;
  description: string;
  show_only_total: boolean;
  moment: string;
  type: "labor" | "material" | "subcontractor";
  quantity: number | null;
  unit: string;
  hours: number | null;
  unit_price: number;
  markup_percent: number;
  subtotal: number;
  comment: string;
  uncertainty: "low" | "medium" | "high";
  sort_order: number;
  rot_eligible: boolean;
  rut_eligible: boolean;
}

interface EstimateTableProps {
  items: EstimateItem[];
  onItemsChange: (items: EstimateItem[]) => void;
  readOnly?: boolean;
  rotEnabled?: boolean;
  rutEnabled?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  labor: "Arbete",
  material: "Material",
  subcontractor: "UE",
};

const TYPE_SHORT: Record<string, string> = {
  labor: "Arb",
  material: "Mat",
  subcontractor: "UE",
};

const UNCERTAINTY_DOT_COLORS: Record<string, string> = {
  low: "text-emerald-500",
  medium: "text-amber-500",
  high: "text-rose-500",
};

const UNCERTAINTY_LABELS: Record<string, string> = {
  low: "Låg osäkerhet",
  medium: "Medel",
  high: "Hög osäkerhet",
};

export function EstimateTable({ items, onItemsChange, readOnly = false, rotEnabled = false, rutEnabled = false }: EstimateTableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ id: string; field: string } | null>(null);
  const isMobile = useIsMobile();
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateItem = (id: string, updates: Partial<EstimateItem>) => {
    const newItems = items.map((item) => {
      if (item.id !== id) return item;
      
      const updated = { ...item, ...updates };
      
      // Recalculate subtotal - treat null/undefined as 0 so calculations always run
      let base: number;
      if (updated.type === "labor") {
        base = (updated.hours || 0) * (updated.unit_price || 0);
      } else if (updated.unit === "klump") {
        base = updated.unit_price || 0;
      } else {
        base = (updated.quantity || 0) * (updated.unit_price || 0);
      }
      updated.subtotal = base * (1 + (updated.markup_percent || 0) / 100);
      
      return updated;
    });
    
    onItemsChange(newItems);
  };

  const addItem = () => {
    const newItem: EstimateItem = {
      id: crypto.randomUUID(),
      article: "",
      description: "",
      show_only_total: false,
      moment: "",
      type: "labor",
      quantity: 1,
      unit: "tim",
      hours: 1,
      unit_price: 0,
      markup_percent: 0,
      subtotal: 0,
      comment: "",
      uncertainty: "medium",
      sort_order: items.length,
      rot_eligible: rotEnabled, // Default to enabled when ROT is on
      rut_eligible: rutEnabled, // Default to enabled when RUT is on
    };
    onItemsChange([...items, newItem]);
    
    // Focus the new item's description field after render
    setTimeout(() => {
      const ref = inputRefs.current.get(`${newItem.id}-description`);
      ref?.focus();
    }, 50);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    newItems.forEach((item, i) => {
      item.sort_order = i;
    });
    
    setDraggedIndex(index);
    onItemsChange(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("sv-SE").format(num);
  };

  const cycleUncertainty = (id: string, current: string) => {
    const levels: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
    const currentIndex = levels.indexOf(current as any);
    const nextIndex = (currentIndex + 1) % levels.length;
    updateItem(id, { uncertainty: levels[nextIndex] });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, itemId: string, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Move to next row same field, or add new row if last
      const currentIndex = items.findIndex(item => item.id === itemId);
      if (currentIndex === items.length - 1) {
        addItem();
      } else {
        const nextItem = items[currentIndex + 1];
        const ref = inputRefs.current.get(`${nextItem.id}-${field}`);
        ref?.focus();
      }
    }
    if (e.key === "Tab" && !e.shiftKey) {
      const fields = ["description", "quantity", "unit_price"];
      const currentFieldIndex = fields.indexOf(field);
      if (currentFieldIndex < fields.length - 1) {
        e.preventDefault();
        const nextField = fields[currentFieldIndex + 1];
        const ref = inputRefs.current.get(`${itemId}-${nextField}`);
        ref?.focus();
      }
    }
  };

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-2">
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border bg-card transition-colors",
                isExpanded && "ring-1 ring-primary/20"
              )}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {readOnly ? (
                      <span className="font-medium text-sm">{item.moment || "—"}</span>
                    ) : (
                      <input
                        value={item.moment}
                        onChange={(e) => updateItem(item.id, { moment: e.target.value })}
                        className="w-full text-sm font-medium bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-1 -mx-1"
                        placeholder="Arbetsmoment..."
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">{TYPE_LABELS[item.type]}</span>
                      {(item.quantity || item.hours) && (
                        <span className="text-xs text-muted-foreground">
                          {item.type === "labor" ? `${item.hours}h` : `${item.quantity} ${item.unit}`}
                        </span>
                      )}
                      <button
                        onClick={() => !readOnly && cycleUncertainty(item.id, item.uncertainty)}
                        disabled={readOnly}
                        className="inline-flex"
                      >
                        <Circle className={cn("h-2 w-2 fill-current", UNCERTAINTY_DOT_COLORS[item.uncertainty])} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm tabular-nums">{formatNumber(item.subtotal)} kr</span>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleExpand(item.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                
                {!readOnly && isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Typ</label>
                        <Select
                          value={item.type}
                          onValueChange={(value: "labor" | "material" | "subcontractor") =>
                            updateItem(item.id, { type: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Arbete</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="subcontractor">UE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Enhet</label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, { unit: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tim">tim</SelectItem>
                            <SelectItem value="m2">m²</SelectItem>
                            <SelectItem value="lpm">lpm</SelectItem>
                            <SelectItem value="st">st</SelectItem>
                            <SelectItem value="klump">klump</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Antal</label>
                        <input
                          type="number"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, { quantity: e.target.value ? Number(e.target.value) : null })
                          }
                          className="w-full h-8 px-2 text-xs bg-muted/50 rounded border-0 outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Timmar</label>
                        <input
                          type="number"
                          value={item.hours ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, { hours: e.target.value ? Number(e.target.value) : null })
                          }
                          className="w-full h-8 px-2 text-xs bg-muted/50 rounded border-0 outline-none focus:ring-1 focus:ring-primary/50"
                          disabled={item.type !== "labor"}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Á-pris</label>
                        <input
                          type="number"
                          value={item.unit_price || ""}
                          onChange={(e) =>
                            updateItem(item.id, { unit_price: Number(e.target.value) || 0 })
                          }
                          className="w-full h-8 px-2 text-xs bg-muted/50 rounded border-0 outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive h-7 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Ta bort
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {!readOnly && (
          <button
            onClick={addItem}
            className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg border border-dashed transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-1.5" />
            Lägg till rad
          </button>
        )}
      </div>
    );
  }

  // Determine column count based on active deductions
  const hasDeductions = rotEnabled || rutEnabled;
  const deductionColumns = (rotEnabled ? 1 : 0) + (rutEnabled ? 1 : 0);
  
  // Desktop: Modern borderless table with Notion-style inline editing
  return (
    <div className="space-y-0.5">
      {/* Header row */}
      <div className={cn(
        "grid gap-0.5 px-0.5 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider",
        deductionColumns === 2 
          ? "grid-cols-[20px_90px_1fr_32px_50px_50px_70px_50px_80px_32px_32px_28px]"
          : deductionColumns === 1
            ? "grid-cols-[20px_90px_1fr_32px_50px_50px_70px_50px_80px_32px_28px]"
            : "grid-cols-[20px_90px_1fr_32px_50px_50px_70px_50px_80px_28px]"
      )}>
        <div></div>
        <div>Artikel</div>
        <div>Beskrivning</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <EyeOff className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Visa endast total (dölj prisdetaljer)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="text-right">Antal</div>
        <div>Enhet</div>
        <div className="text-right">Á-pris</div>
        <div className="text-right">Påsl%</div>
        <div className="text-right">Summa</div>
        {rotEnabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Home className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                ROT-avdrag
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {rutEnabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Sparkles className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                RUT-avdrag
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div></div>
      </div>

      {/* Rows */}
      <div className="space-y-0">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!readOnly}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "grid gap-0.5 px-0.5 py-0.5 items-center rounded transition-all duration-150 group stagger-item",
              deductionColumns === 2 
                ? "grid-cols-[20px_90px_1fr_32px_50px_50px_70px_50px_80px_32px_32px_28px]"
                : deductionColumns === 1
                  ? "grid-cols-[20px_90px_1fr_32px_50px_50px_70px_50px_80px_32px_28px]"
                  : "grid-cols-[20px_90px_1fr_32px_50px_50px_70px_50px_80px_28px]",
              draggedIndex === index ? "opacity-50 bg-muted scale-[0.99]" : "hover:bg-muted/40",
              focusedCell?.id === item.id && "bg-muted/50 shadow-sm",
              (item.rot_eligible && rotEnabled) || (item.rut_eligible && rutEnabled) ? "bg-primary/5" : "",
              item.show_only_total && "bg-muted/30"
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Drag handle */}
            {!readOnly ? (
              <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            ) : (
              <div />
            )}

            {/* Article dropdown */}
            {readOnly ? (
              <span className="text-[13px] text-muted-foreground truncate">{item.article || "–"}</span>
            ) : (
              <Select
                value={item.article || ""}
                onValueChange={(value) => updateItem(item.id, { article: value })}
              >
                <SelectTrigger className="h-6 text-[11px] border-0 bg-transparent hover:bg-muted/60 focus:bg-muted/60 focus:ring-0 px-1">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Description with uncertainty dot */}
            <div className="flex items-center gap-1.5 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !readOnly && cycleUncertainty(item.id, item.uncertainty)}
                      disabled={readOnly}
                      className="shrink-0"
                    >
                      <Circle 
                        className={cn(
                          "h-2 w-2 fill-current transition-colors", 
                          UNCERTAINTY_DOT_COLORS[item.uncertainty]
                        )} 
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {UNCERTAINTY_LABELS[item.uncertainty]}
                    {!readOnly && " (klicka för att ändra)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {readOnly ? (
                <span className="text-[13px] truncate">{item.description || item.moment}</span>
              ) : (
                <input
                  ref={(el) => el && inputRefs.current.set(`${item.id}-description`, el)}
                  value={item.description || ""}
                  onChange={(e) => updateItem(item.id, { description: e.target.value, moment: e.target.value })}
                  onFocus={() => setFocusedCell({ id: item.id, field: "description" })}
                  onBlur={() => setFocusedCell(null)}
                  onKeyDown={(e) => handleKeyDown(e, item.id, "description")}
                  placeholder="T.ex. Fasadtvätt..."
                  className="w-full text-[13px] bg-transparent border-0 outline-none focus:bg-muted/60 rounded px-1 py-0 -mx-1 truncate placeholder:text-muted-foreground/40"
                />
              )}
            </div>

            {/* Show only total checkbox */}
            <div className="flex items-center justify-center">
              <Checkbox
                checked={item.show_only_total}
                onCheckedChange={(checked) => 
                  !readOnly && updateItem(item.id, { show_only_total: !!checked })
                }
                disabled={readOnly}
                className="h-4 w-4"
              />
            </div>


            {/* Quantity / Hours */}
            {readOnly ? (
              <span className="text-[13px] text-right tabular-nums">
                {item.type === "labor" ? (item.hours ?? item.quantity) : item.quantity}
              </span>
            ) : (
              <input
                ref={(el) => el && inputRefs.current.set(`${item.id}-quantity`, el)}
                type="text"
                inputMode="decimal"
                value={item.type === "labor" ? (item.hours ?? item.quantity ?? "") : (item.quantity ?? "")}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  if (item.type === "labor") {
                    updateItem(item.id, { hours: val });
                  } else {
                    updateItem(item.id, { quantity: val });
                  }
                }}
                onFocus={() => setFocusedCell({ id: item.id, field: "quantity" })}
                onBlur={() => setFocusedCell(null)}
                onKeyDown={(e) => handleKeyDown(e, item.id, "quantity")}
                className="w-full text-[13px] text-right bg-transparent border-0 outline-none focus:bg-muted/60 rounded px-1 py-0 tabular-nums"
              />
            )}

            {/* Unit */}
            {readOnly ? (
              <span className="text-[13px] text-muted-foreground">
                {item.type === "labor" ? "h" : item.unit}
              </span>
            ) : (
              <Select
                value={item.unit}
                onValueChange={(value) => updateItem(item.id, { unit: value })}
              >
                <SelectTrigger className="h-6 text-[10px] border-0 bg-transparent hover:bg-muted/60 focus:bg-muted/60 focus:ring-0 px-0.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tim">tim</SelectItem>
                  <SelectItem value="m2">m²</SelectItem>
                  <SelectItem value="lpm">lpm</SelectItem>
                  <SelectItem value="st">st</SelectItem>
                  <SelectItem value="klump">klump</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Unit price */}
            {readOnly ? (
              <span className="text-[13px] text-right tabular-nums">{formatNumber(item.unit_price)}</span>
            ) : (
              <input
                ref={(el) => el && inputRefs.current.set(`${item.id}-unit_price`, el)}
                type="text"
                inputMode="decimal"
                value={item.unit_price || ""}
                onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) || 0 })}
                onFocus={() => setFocusedCell({ id: item.id, field: "unit_price" })}
                onBlur={() => setFocusedCell(null)}
                onKeyDown={(e) => handleKeyDown(e, item.id, "unit_price")}
                placeholder="0"
                className="w-full text-[13px] text-right bg-transparent border-0 outline-none focus:bg-muted/60 rounded px-1 py-0 tabular-nums placeholder:text-muted-foreground/40"
              />
            )}

            {/* Markup percent */}
            {readOnly ? (
              <span className="text-[13px] text-right tabular-nums text-muted-foreground">
                {item.markup_percent ? `${item.markup_percent}%` : ""}
              </span>
            ) : (
              <input
                type="text"
                inputMode="decimal"
                value={item.markup_percent || ""}
                onChange={(e) => updateItem(item.id, { markup_percent: Number(e.target.value) || 0 })}
                placeholder=""
                className="w-full text-[13px] text-right bg-transparent border-0 outline-none focus:bg-muted/60 rounded px-1 py-0 tabular-nums placeholder:text-muted-foreground/40"
              />
            )}

            {/* Subtotal */}
            <span className="text-[13px] text-right font-medium tabular-nums">
              {formatNumber(item.subtotal)}
            </span>

            {/* ROT checkbox - only for labor rows when ROT is enabled */}
            {rotEnabled && (
              <div className="flex items-center justify-center">
                {item.type === "labor" ? (
                  <Checkbox
                    checked={item.rot_eligible}
                    onCheckedChange={(checked) => 
                      !readOnly && onItemsChange(items.map(i => 
                        i.id === item.id ? { ...i, rot_eligible: !!checked, rut_eligible: checked ? false : i.rut_eligible } : i
                      ))
                    }
                    disabled={readOnly}
                    className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">–</span>
                )}
              </div>
            )}

            {/* RUT checkbox - only for labor rows when RUT is enabled */}
            {rutEnabled && (
              <div className="flex items-center justify-center">
                {item.type === "labor" ? (
                  <Checkbox
                    checked={item.rut_eligible}
                    onCheckedChange={(checked) => 
                      !readOnly && onItemsChange(items.map(i => 
                        i.id === item.id ? { ...i, rut_eligible: !!checked, rot_eligible: checked ? false : i.rot_eligible } : i
                      ))
                    }
                    disabled={readOnly}
                    className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">–</span>
                )}
              </div>
            )}

            {/* Delete */}
            {!readOnly ? (
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>

      {/* Add row button + Import */}
      {!readOnly && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={addItem}
            className="flex-1 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Lägg till rad
          </button>
          <EstimateItemsImportDialog
            existingItemCount={items.length}
            rotEnabled={rotEnabled}
            onImport={(parsedItems, mode) => {
              const newItems: EstimateItem[] = parsedItems.map((item, index) => ({
                id: crypto.randomUUID(),
                article: item.article || "Arbete",
                description: item.description || "",
                show_only_total: false,
                moment: item.moment || item.description || "",
                type: mapArticleToType(item.article || ""),
                quantity: item.quantity,
                unit: item.unit || "",
                hours: item.hours,
                unit_price: item.unit_price || 0,
                markup_percent: 0,
                subtotal: item.subtotal || 0,
                comment: "",
                uncertainty: "medium" as const,
                sort_order: mode === "replace" ? index : items.length + index,
                rot_eligible: rotEnabled,
                rut_eligible: rutEnabled,
              }));
              
              if (mode === "replace") {
                onItemsChange(newItems);
              } else {
                onItemsChange([...items, ...newItems]);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
