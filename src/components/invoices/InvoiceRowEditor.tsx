import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface InvoiceRow {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
}

interface InvoiceRowEditorProps {
  rows: InvoiceRow[];
  onChange: (rows: InvoiceRow[]) => void;
}

const UNITS = ["st", "h", "m", "m2", "m3", "kg", "l", "paket"];

export function InvoiceRowEditor({ rows, onChange }: InvoiceRowEditorProps) {
  const updateRow = (id: string, field: keyof InvoiceRow, value: any) => {
    onChange(
      rows.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        // Recalculate subtotal
        if (field === "quantity" || field === "unit_price") {
          updated.subtotal = (updated.quantity || 0) * (updated.unit_price || 0);
        }
        return updated;
      })
    );
  };

  const addRow = () => {
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit: "st",
        unit_price: 0,
        vat_rate: 25,
        subtotal: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    onChange(rows.filter((row) => row.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="hidden md:grid md:grid-cols-[1fr,80px,80px,100px,100px,40px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Beskrivning</span>
        <span className="text-right">Antal</span>
        <span>Enhet</span>
        <span className="text-right">À-pris</span>
        <span className="text-right">Summa</span>
        <span></span>
      </div>

      {/* Rows */}
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-1 md:grid-cols-[1fr,80px,80px,100px,100px,40px] gap-2 p-2 bg-muted/30 rounded-lg group"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 hidden md:block cursor-grab" />
            <Input
              value={row.description}
              onChange={(e) => updateRow(row.id, "description", e.target.value)}
              placeholder="Beskrivning"
              className="flex-1"
            />
          </div>
          <Input
            type="number"
            value={row.quantity || ""}
            onChange={(e) => updateRow(row.id, "quantity", parseFloat(e.target.value) || 0)}
            className="text-right"
            min={0}
            step={0.5}
          />
          <Select value={row.unit} onValueChange={(value) => updateRow(row.id, "unit", value)}>
            <SelectTrigger>
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
          <Input
            type="number"
            value={row.unit_price || ""}
            onChange={(e) => updateRow(row.id, "unit_price", parseFloat(e.target.value) || 0)}
            className="text-right"
            min={0}
          />
          <div className="flex items-center justify-end font-medium text-sm tabular-nums">
            {formatCurrency(row.subtotal)} kr
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={() => removeRow(row.id)}
            disabled={rows.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add Row Button */}
      <Button variant="outline" size="sm" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Lägg till rad
      </Button>
    </div>
  );
}
