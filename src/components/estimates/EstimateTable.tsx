import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResizableColumns } from "@/hooks/useResizableColumns";
import { cn } from "@/lib/utils";

export interface EstimateItem {
  id: string;
  moment: string;
  type: "labor" | "material" | "subcontractor";
  quantity: number | null;
  unit: string;
  hours: number | null;
  unit_price: number;
  subtotal: number;
  comment: string;
  uncertainty: "low" | "medium" | "high";
  sort_order: number;
}

interface EstimateTableProps {
  items: EstimateItem[];
  onItemsChange: (items: EstimateItem[]) => void;
  readOnly?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  labor: "Arbete",
  material: "Material",
  subcontractor: "UE",
};

const UNCERTAINTY_DOT_COLORS: Record<string, string> = {
  low: "text-emerald-500",
  medium: "text-amber-500",
  high: "text-rose-500",
};

const UNCERTAINTY_LABELS: Record<string, string> = {
  low: "Låg osäkerhet",
  medium: "Medel osäkerhet",
  high: "Hög osäkerhet",
};

// Default column widths in pixels
const DEFAULT_COLUMN_WIDTHS = [32, 200, 80, 70, 60, 90, 100, 40];

export function EstimateTable({ items, onItemsChange, readOnly = false }: EstimateTableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  
  const { widths, startResize, isResizing } = useResizableColumns({
    storageKey: "estimate-table-columns",
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidth: 32,
  });

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
      
      // Recalculate subtotal
      if (updated.type === "labor" && updated.hours && updated.unit_price) {
        updated.subtotal = updated.hours * updated.unit_price;
      } else if (updated.quantity && updated.unit_price) {
        updated.subtotal = updated.quantity * updated.unit_price;
      } else if (updated.unit === "klump") {
        updated.subtotal = updated.unit_price;
      }
      
      return updated;
    });
    
    onItemsChange(newItems);
  };

  const addItem = () => {
    const newItem: EstimateItem = {
      id: crypto.randomUUID(),
      moment: "",
      type: "labor",
      quantity: null,
      unit: "tim",
      hours: null,
      unit_price: 0,
      subtotal: 0,
      comment: "",
      uncertainty: "medium",
      sort_order: items.length,
    };
    onItemsChange([...items, newItem]);
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
    
    // Update sort_order
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

  // Resize handle component
  const ResizeHandle = ({ index }: { index: number }) => (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors",
        isResizing && "bg-primary/30"
      )}
      onMouseDown={(e) => startResize(index, e)}
    />
  );

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {readOnly ? (
                        <span className="font-medium truncate">{item.moment || "—"}</span>
                      ) : (
                        <Input
                          value={item.moment}
                          onChange={(e) => updateItem(item.id, { moment: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Arbetsmoment..."
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[item.type]}</Badge>
                      {item.quantity && (
                        <Badge variant="secondary" className="text-xs">{item.quantity} {item.unit}</Badge>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Circle className={cn("h-2.5 w-2.5 fill-current", UNCERTAINTY_DOT_COLORS[item.uncertainty])} />
                          </TooltipTrigger>
                          <TooltipContent>{UNCERTAINTY_LABELS[item.uncertainty]}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        {item.hours ? `${item.hours}h` : ""}
                      </span>
                      <span className="font-medium text-sm">{formatNumber(item.subtotal)} kr</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!readOnly && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleExpand(item.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Expanded edit view */}
                {!readOnly && isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Typ</label>
                        <Select
                          value={item.type}
                          onValueChange={(value: "labor" | "material" | "subcontractor") =>
                            updateItem(item.id, { type: value })
                          }
                        >
                          <SelectTrigger className="h-9">
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
                        <label className="text-xs text-muted-foreground">Osäkerhet</label>
                        <Select
                          value={item.uncertainty}
                          onValueChange={(value: "low" | "medium" | "high") =>
                            updateItem(item.id, { uncertainty: value })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Låg</SelectItem>
                            <SelectItem value="medium">Medel</SelectItem>
                            <SelectItem value="high">Hög</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Antal</label>
                        <Input
                          type="number"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, { quantity: e.target.value ? Number(e.target.value) : null })
                          }
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Enhet</label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, { unit: value })}
                        >
                          <SelectTrigger className="h-9">
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
                      <div>
                        <label className="text-xs text-muted-foreground">Timmar</label>
                        <Input
                          type="number"
                          value={item.hours ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, { hours: e.target.value ? Number(e.target.value) : null })
                          }
                          className="h-9"
                          disabled={item.type !== "labor"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Á-pris (kr)</label>
                      <Input
                        type="number"
                        value={item.unit_price || ""}
                        onChange={(e) =>
                          updateItem(item.id, { unit_price: Number(e.target.value) || 0 })
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {!readOnly && (
          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Lägg till rad
          </Button>
        )}
      </div>
    );
  }

  // Desktop table view with resizable columns
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {!readOnly && (
                <TableHead 
                  style={{ width: widths[0] }} 
                  className="relative p-2"
                >
                  <ResizeHandle index={0} />
                </TableHead>
              )}
              <TableHead 
                style={{ width: widths[1] }} 
                className="relative"
              >
                Moment
                <ResizeHandle index={1} />
              </TableHead>
              <TableHead 
                style={{ width: widths[2] }} 
                className="relative"
              >
                Typ
                <ResizeHandle index={2} />
              </TableHead>
              <TableHead 
                style={{ width: widths[3] }} 
                className="relative text-right"
              >
                Antal
                <ResizeHandle index={3} />
              </TableHead>
              <TableHead 
                style={{ width: widths[4] }} 
                className="relative"
              >
                Enhet
                <ResizeHandle index={4} />
              </TableHead>
              <TableHead 
                style={{ width: widths[5] }} 
                className="relative text-right"
              >
                Á-pris
                <ResizeHandle index={5} />
              </TableHead>
              <TableHead 
                style={{ width: widths[6] }} 
                className="relative text-right"
              >
                Summa
                <ResizeHandle index={6} />
              </TableHead>
              {!readOnly && (
                <TableHead 
                  style={{ width: widths[7] }} 
                  className="p-2"
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={item.id}
                draggable={!readOnly}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  draggedIndex === index && "opacity-50",
                  "group"
                )}
              >
                {!readOnly && (
                  <TableCell className="cursor-grab p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                )}
                <TableCell className="p-1.5">
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Circle 
                            className={cn(
                              "h-2 w-2 fill-current flex-shrink-0", 
                              UNCERTAINTY_DOT_COLORS[item.uncertainty]
                            )} 
                          />
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>{UNCERTAINTY_LABELS[item.uncertainty]}</p>
                          {!readOnly && (
                            <div className="flex gap-1 mt-1">
                              {(["low", "medium", "high"] as const).map((level) => (
                                <button
                                  key={level}
                                  onClick={() => updateItem(item.id, { uncertainty: level })}
                                  className={cn(
                                    "px-2 py-0.5 text-xs rounded",
                                    item.uncertainty === level 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted hover:bg-muted/80"
                                  )}
                                >
                                  {level === "low" ? "Låg" : level === "medium" ? "Medel" : "Hög"}
                                </button>
                              ))}
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {readOnly ? (
                      <span className="truncate">{item.moment}</span>
                    ) : (
                      <Input
                        value={item.moment}
                        onChange={(e) => updateItem(item.id, { moment: e.target.value })}
                        className="h-7 text-sm border-0 bg-transparent focus-visible:bg-background focus-visible:ring-1 px-1"
                        placeholder="Arbetsmoment..."
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-1.5">
                  {readOnly ? (
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[item.type]}</Badge>
                  ) : (
                    <Select
                      value={item.type}
                      onValueChange={(value: "labor" | "material" | "subcontractor") =>
                        updateItem(item.id, { type: value })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:bg-background focus:ring-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Arbete</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="subcontractor">UE</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right p-1.5">
                  {readOnly ? (
                    <span className="tabular-nums text-sm">{item.quantity ?? "—"}</span>
                  ) : (
                    <Input
                      type="number"
                      value={item.quantity ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, { quantity: e.target.value ? Number(e.target.value) : null })
                      }
                      className="h-7 text-sm text-right border-0 bg-transparent focus-visible:bg-background focus-visible:ring-1 px-1 tabular-nums"
                      placeholder="0"
                    />
                  )}
                </TableCell>
                <TableCell className="p-1.5">
                  {readOnly ? (
                    <span className="text-sm">{item.unit}</span>
                  ) : (
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(item.id, { unit: value })}
                    >
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:bg-background focus:ring-1">
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
                </TableCell>
                <TableCell className="text-right p-1.5">
                  {readOnly ? (
                    <span className="tabular-nums text-sm">{formatNumber(item.unit_price)}</span>
                  ) : (
                    <Input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) =>
                        updateItem(item.id, { unit_price: Number(e.target.value) || 0 })
                      }
                      className="h-7 text-sm text-right border-0 bg-transparent focus-visible:bg-background focus-visible:ring-1 px-1 tabular-nums"
                      placeholder="0"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right p-1.5 font-medium tabular-nums text-sm">
                  {formatNumber(item.subtotal)}
                </TableCell>
                {!readOnly && (
                  <TableCell className="p-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button variant="outline" onClick={addItem} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Lägg till rad
        </Button>
      )}
    </div>
  );
}
