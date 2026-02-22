import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Loader2, Sparkles, Check, Upload, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedItem {
  description: string;
  amount: number;
  vat_rate: number;
  quantity?: number;
  unit_price?: number;
}

interface ExtractedReceipt {
  store_name: string;
  org_number: string;
  receipt_date: string;
  items: ExtractedItem[];
  total_ex_vat: number;
  total_vat: number;
  total_inc_vat: number;
}

interface MaterialRow {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  is_billable: boolean;
  selected: boolean;
}

interface Props {
  workOrderId: string;
  projectId: string;
  onMaterialsAdded: () => void;
}

export default function JobReceiptScanner({ workOrderId, projectId, onMaterialsAdded }: Props) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedReceipt | null>(null);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setImageBase64(base64);

      setIsExtracting(true);
      try {
        const { data, error } = await supabase.functions.invoke("extract-receipt", {
          body: { imageBase64: base64, fileName: file.name },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setExtracted(data.extracted);
        // Convert to material rows
        const rows: MaterialRow[] = (data.extracted.items || []).map((item: ExtractedItem, i: number) => ({
          id: crypto.randomUUID(),
          article_name: item.description,
          quantity: item.quantity || 1,
          unit: "st",
          unit_price: item.unit_price || item.amount || 0,
          is_billable: true,
          selected: true,
        }));
        setMaterialRows(rows);
        toast.success("Kvitto tolkat!");
      } catch (err: any) {
        console.error("Extraction error:", err);
        toast.error(err.message || "Kunde inte läsa kvittot");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateRow = (id: string, field: keyof MaterialRow, value: any) => {
    setMaterialRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRow = (id: string) => {
    setMaterialRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    const selected = materialRows.filter(r => r.selected && r.article_name.trim());
    if (selected.length === 0) { toast.error("Välj minst en rad"); return; }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      // Upload receipt image
      let storagePath: string | null = null;
      if (imageBase64) {
        const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const path = `${projectId}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("project-files").upload(path, bytes, { contentType: "image/jpeg" });
        if (!uploadError) {
          storagePath = path;
          // Save file record
          await supabase.from("project_files").insert({
            project_id: projectId,
            user_id: user.id,
            file_name: `Kvitto - ${extracted?.store_name || fileName}`,
            storage_path: path,
            file_type: "image/jpeg",
            category: "receipt",
          });
        }
      }

      // Add materials to work order
      const inserts = selected.map((r, i) => ({
        work_order_id: workOrderId,
        user_id: user.id,
        article_name: r.article_name,
        quantity: r.quantity,
        unit: r.unit,
        unit_price: r.unit_price,
        is_billable: r.is_billable,
        sort_order: i,
        category: "kvitto",
      }));

      const { error } = await supabase.from("work_order_materials").insert(inserts);
      if (error) throw error;

      toast.success(`${selected.length} materialrader tillagda från kvitto`);
      onMaterialsAdded();
      handleReset();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Kunde inte spara");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setExtracted(null);
    setMaterialRows([]);
    setImageBase64(null);
    setFileName("");
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 0 }).format(amount);

  // Initial state - capture buttons
  if (!extracted && !isExtracting) {
    return (
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
              }
            }}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Fota kvitto</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
              }
            }}
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Ladda upp</span>
          </Button>
        </div>
      </div>
    );
  }

  // Extracting
  if (isExtracting) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium text-sm">Läser kvittot...</p>
          <p className="text-xs text-muted-foreground">AI analyserar bilden</p>
        </div>
      </div>
    );
  }

  // Extracted - show rows for review
  return (
    <div className="space-y-3">
      {/* Store info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{extracted?.store_name}</p>
          <p className="text-xs text-muted-foreground">{extracted?.receipt_date} · {formatCurrency(extracted?.total_inc_vat || 0)}</p>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          AI-tolkat
        </Badge>
      </div>

      {/* Material rows */}
      <div className="space-y-2">
        {materialRows.map(row => (
          <div key={row.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
            <Checkbox
              checked={row.selected}
              onCheckedChange={c => updateRow(row.id, "selected", !!c)}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <Input
                value={row.article_name}
                onChange={e => updateRow(row.id, "article_name", e.target.value)}
                className="h-8 text-sm"
                placeholder="Artikelnamn"
              />
              <div className="grid grid-cols-3 gap-1">
                <Input
                  type="number"
                  value={row.quantity}
                  onChange={e => updateRow(row.id, "quantity", Number(e.target.value) || 1)}
                  className="h-7 text-xs"
                  placeholder="Antal"
                />
                <Input
                  value={row.unit}
                  onChange={e => updateRow(row.id, "unit", e.target.value)}
                  className="h-7 text-xs"
                  placeholder="Enhet"
                />
                <Input
                  type="number"
                  value={row.unit_price}
                  onChange={e => updateRow(row.id, "unit_price", Number(e.target.value) || 0)}
                  className="h-7 text-xs"
                  placeholder="Pris"
                />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRow(row.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
          Avbryt
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Lägg i material
        </Button>
      </div>
    </div>
  );
}
