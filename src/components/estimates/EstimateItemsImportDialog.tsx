import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import type { EstimateItem } from "./EstimateTable";

// Column mappings for estimate items (Bygglet-compatible)
const ITEM_COLUMN_MAPPINGS: Record<string, string> = {
  // Artikel/kategori
  "artikel": "article",
  "typ": "article",
  "kategori": "article",
  "art": "article",
  "art.": "article",
  "artikeltyp": "article",
  
  // Moment/beskrivning
  "moment": "moment",
  "beskrivning": "description",
  "text": "description",
  "rad": "moment",
  "arbete": "moment",
  "benämning": "moment",
  "post": "moment",
  "rubrik": "moment",
  "namn": "moment",
  
  // Antal
  "antal": "quantity",
  "mängd": "quantity",
  "st": "quantity",
  "kvm": "quantity",
  "m2": "quantity",
  "lm": "quantity",
  
  // Enhet
  "enhet": "unit",
  
  // Pris
  "a-pris": "unit_price",
  "a pris": "unit_price",
  "apris": "unit_price",
  "styckpris": "unit_price",
  "pris": "unit_price",
  "pris/st": "unit_price",
  "pris/enhet": "unit_price",
  "á-pris": "unit_price",
  "à-pris": "unit_price",
  
  // Summa
  "summa": "subtotal",
  "belopp": "subtotal",
  "rad summa": "subtotal",
  "radsumma": "subtotal",
  "totalt": "subtotal",
  "total": "subtotal",
  
  // Timmar
  "timmar": "hours",
  "tim": "hours",
  "h": "hours",
};

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

// Normalize Swedish number format
function parseSwedishNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  
  const str = String(value).trim();
  // Replace Swedish decimal comma with dot
  const normalized = str.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

export interface ParsedEstimateItem {
  article: string;
  moment: string;
  description: string;
  quantity: number | null;
  unit: string;
  hours: number | null;
  unit_price: number;
  subtotal: number;
}

interface EstimateItemsImportDialogProps {
  existingItemCount: number;
  onImport: (items: ParsedEstimateItem[], mode: "append" | "replace") => void;
  rotEnabled?: boolean;
}

type Step = "upload" | "preview" | "result";

export function EstimateItemsImportDialog({ 
  existingItemCount, 
  onImport,
  rotEnabled = false 
}: EstimateItemsImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [parsedItems, setParsedItems] = useState<ParsedEstimateItem[]>([]);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const resetState = () => {
    setStep("upload");
    setParsedItems([]);
    setImportMode("append");
    setError(null);
    setImportedCount(0);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetState, 200);
  };

  const parseFile = useCallback(async (file: File) => {
    try {
      setError(null);
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (rows.length < 2) {
        setError("Filen verkar vara tom eller saknar data.");
        return;
      }
      
      // First row is headers
      const headers = rows[0].map((h: any) => String(h || "").toLowerCase().trim());
      
      // Map columns
      const columnMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        const mappedField = ITEM_COLUMN_MAPPINGS[header];
        if (mappedField && !(mappedField in columnMap)) {
          columnMap[mappedField] = index;
        }
      });
      
      // Parse data rows
      const items: ParsedEstimateItem[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        // Check if row has any content
        const hasContent = row.some((cell: any) => cell !== null && cell !== undefined && cell !== "");
        if (!hasContent) continue;
        
        // Extract values
        const article = columnMap.article !== undefined ? String(row[columnMap.article] || "") : "";
        const moment = columnMap.moment !== undefined ? String(row[columnMap.moment] || "") : "";
        const description = columnMap.description !== undefined ? String(row[columnMap.description] || "") : "";
        const quantity = columnMap.quantity !== undefined ? parseSwedishNumber(row[columnMap.quantity]) : null;
        const unit = columnMap.unit !== undefined ? String(row[columnMap.unit] || "") : "";
        const hours = columnMap.hours !== undefined ? parseSwedishNumber(row[columnMap.hours]) : null;
        const unitPrice = columnMap.unit_price !== undefined ? parseSwedishNumber(row[columnMap.unit_price]) || 0 : 0;
        let subtotal = columnMap.subtotal !== undefined ? parseSwedishNumber(row[columnMap.subtotal]) || 0 : 0;
        
        // Calculate subtotal if not provided
        if (subtotal === 0) {
          if (hours !== null && unitPrice > 0) {
            subtotal = hours * unitPrice;
          } else if (quantity !== null && unitPrice > 0) {
            subtotal = quantity * unitPrice;
          }
        }
        
        // Skip rows without meaningful content
        const displayText = moment || description;
        if (!displayText && subtotal === 0 && unitPrice === 0) continue;
        
        items.push({
          article: article || "Arbete",
          moment: moment || description || `Rad ${i}`,
          description: description || moment || "",
          quantity,
          unit,
          hours,
          unit_price: unitPrice,
          subtotal,
        });
      }
      
      if (items.length === 0) {
        setError("Inga giltiga rader hittades i filen. Kontrollera att kolumnnamnen matchar (t.ex. 'Beskrivning', 'Antal', 'A-pris', 'Summa').");
        return;
      }
      
      setParsedItems(items);
      setStep("preview");
      
    } catch (err) {
      console.error("Failed to parse file:", err);
      setError("Kunde inte läsa filen. Kontrollera att det är en giltig Excel-fil (.xls eller .xlsx).");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      parseFile(files[0]);
    }
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseFile(files[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [parseFile]);

  const handleImport = () => {
    onImport(parsedItems, importMode);
    setImportedCount(parsedItems.length);
    setStep("result");
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("sv-SE").format(num);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Importera rader
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importera offertposter
          </DialogTitle>
          <DialogDescription>
            Ladda upp en Excel-fil med offertposter för att lägga till dem i denna offert.
          </DialogDescription>
        </DialogHeader>
        
        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
              )}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Dra och släpp Excel-fil här</p>
              <p className="text-xs text-muted-foreground mb-3">eller</p>
              <label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>Välj fil</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-3">
                Stödjer .xls och .xlsx
              </p>
            </div>
            
            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Förväntade kolumner:</p>
              <p>Beskrivning/Moment, Antal, Enhet, A-pris, Summa, Artikel (valfritt)</p>
            </div>
          </div>
        )}
        
        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("upload")}
              className="gap-1 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka
            </Button>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {parsedItems.length} rader hittades
              </p>
              {existingItemCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Offerten har {existingItemCount} befintliga rader
                </p>
              )}
            </div>
            
            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Artikel</th>
                      <th className="text-left p-2 font-medium">Beskrivning</th>
                      <th className="text-right p-2 font-medium">Antal</th>
                      <th className="text-left p-2 font-medium">Enhet</th>
                      <th className="text-right p-2 font-medium">À-pris</th>
                      <th className="text-right p-2 font-medium">Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 text-muted-foreground">{item.article || "–"}</td>
                        <td className="p-2 max-w-[200px] truncate">{item.moment || item.description}</td>
                        <td className="p-2 text-right tabular-nums">{item.quantity ?? item.hours ?? "–"}</td>
                        <td className="p-2">{item.unit || "–"}</td>
                        <td className="p-2 text-right tabular-nums">{formatNumber(item.unit_price)}</td>
                        <td className="p-2 text-right tabular-nums font-medium">{formatNumber(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedItems.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30 border-t">
                  ... och {parsedItems.length - 10} rader till
                </div>
              )}
            </div>
            
            {/* Import mode */}
            {existingItemCount > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Importläge</Label>
                <RadioGroup 
                  value={importMode} 
                  onValueChange={(v) => setImportMode(v as "append" | "replace")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="append" id="append" />
                    <Label htmlFor="append" className="font-normal">
                      Lägg till ({parsedItems.length} nya rader)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="font-normal text-destructive">
                      Ersätt befintliga ({existingItemCount} rader tas bort)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* Total */}
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium">Total summa</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatNumber(parsedItems.reduce((sum, item) => sum + item.subtotal, 0))} kr
              </span>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button onClick={handleImport}>
                Importera {parsedItems.length} rader
              </Button>
            </div>
          </div>
        )}
        
        {/* Step: Result */}
        {step === "result" && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500" />
            <div>
              <p className="text-lg font-semibold">Import klar!</p>
              <p className="text-sm text-muted-foreground">
                {importedCount} rader har {importMode === "append" ? "lagts till" : "ersatt befintliga rader"} i offerten.
              </p>
            </div>
            <Button onClick={handleClose}>
              Stäng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
