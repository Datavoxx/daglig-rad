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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";

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

const UNCERTAINTY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

const UNCERTAINTY_LABELS: Record<string, string> = {
  low: "Låg",
  medium: "Medel",
  high: "Hög",
};

export function EstimateTable({ items, onItemsChange, readOnly = false }: EstimateTableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {!readOnly && <TableHead className="w-8"></TableHead>}
                <TableHead className="min-w-[200px]">Moment</TableHead>
                <TableHead className="w-[100px]">Typ</TableHead>
                <TableHead className="w-[80px] text-right">Antal</TableHead>
                <TableHead className="w-[80px]">Enhet</TableHead>
                <TableHead className="w-[80px] text-right">Timmar</TableHead>
                <TableHead className="w-[100px] text-right">Á-pris</TableHead>
                <TableHead className="w-[120px] text-right">Delkostnad</TableHead>
                <TableHead className="w-[80px] text-center">Osäkerhet</TableHead>
                {!readOnly && <TableHead className="w-[50px]"></TableHead>}
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
                  className={draggedIndex === index ? "opacity-50" : ""}
                >
                  {!readOnly && (
                    <TableCell className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  )}
                  <TableCell>
                    {readOnly ? (
                      <span>{item.moment}</span>
                    ) : (
                      <Input
                        value={item.moment}
                        onChange={(e) => updateItem(item.id, { moment: e.target.value })}
                        className="h-8"
                        placeholder="Arbetsmoment..."
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Badge variant="outline">{TYPE_LABELS[item.type]}</Badge>
                    ) : (
                      <Select
                        value={item.type}
                        onValueChange={(value: "labor" | "material" | "subcontractor") =>
                          updateItem(item.id, { type: value })
                        }
                      >
                        <SelectTrigger className="h-8">
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
                  <TableCell className="text-right">
                    {readOnly ? (
                      <span>{item.quantity ?? "—"}</span>
                    ) : (
                      <Input
                        type="number"
                        value={item.quantity ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: e.target.value ? Number(e.target.value) : null })
                        }
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <span>{item.unit}</span>
                    ) : (
                      <Select
                        value={item.unit}
                        onValueChange={(value) => updateItem(item.id, { unit: value })}
                      >
                        <SelectTrigger className="h-8">
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
                  <TableCell className="text-right">
                    {readOnly ? (
                      <span>{item.hours ?? "—"}</span>
                    ) : (
                      <Input
                        type="number"
                        value={item.hours ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, { hours: e.target.value ? Number(e.target.value) : null })
                        }
                        className="h-8 text-right"
                        disabled={item.type !== "labor"}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? (
                      <span>{formatNumber(item.unit_price)} kr</span>
                    ) : (
                      <Input
                        type="number"
                        value={item.unit_price || ""}
                        onChange={(e) =>
                          updateItem(item.id, { unit_price: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(item.subtotal)} kr
                  </TableCell>
                  <TableCell className="text-center">
                    {readOnly ? (
                      <Badge variant="outline" className={UNCERTAINTY_COLORS[item.uncertainty]}>
                        {UNCERTAINTY_LABELS[item.uncertainty]}
                      </Badge>
                    ) : (
                      <Select
                        value={item.uncertainty}
                        onValueChange={(value: "low" | "medium" | "high") =>
                          updateItem(item.id, { uncertainty: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Låg</SelectItem>
                          <SelectItem value="medium">Medel</SelectItem>
                          <SelectItem value="high">Hög</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
