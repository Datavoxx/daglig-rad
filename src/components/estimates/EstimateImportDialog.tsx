import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ParsedEstimate {
  offer_number: string;
  manual_project_name: string;
  manual_client_name: string;
  manual_address?: string;
  manual_postal_code?: string;
  manual_city?: string;
  total_excl_vat?: number;
  total_incl_vat?: number;
  status: string;
  items: ParsedEstimateItem[];
}

interface ParsedEstimateItem {
  article?: string;
  moment: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  subtotal?: number;
  hours?: number;
}

interface EstimateImportDialogProps {
  onImportComplete: () => void;
}

type ImportStep = "upload" | "preview" | "result";

// Column mappings for estimate metadata
const ESTIMATE_COLUMN_MAPPINGS: Record<string, string> = {
  // Offer number
  "offertnr": "offer_number",
  "offert nr": "offer_number",
  "offertnummer": "offer_number",
  "offert": "offer_number",
  "nr": "offer_number",
  "nummer": "offer_number",
  
  // Project name
  "projektnamn": "manual_project_name",
  "projekt": "manual_project_name",
  "benämning": "manual_project_name",
  "arbetsplats": "manual_project_name",
  "namn": "manual_project_name",
  
  // Customer
  "kund": "manual_client_name",
  "kundnamn": "manual_client_name",
  "beställare": "manual_client_name",
  "kund/projekt": "manual_client_name",
  
  // Address
  "adress": "manual_address",
  "plats": "manual_address",
  "projektadress": "manual_address",
  
  // Postal code / city
  "postnr": "manual_postal_code",
  "postnummer": "manual_postal_code",
  "ort": "manual_city",
  
  // Status
  "status": "status",
  
  // Totals
  "summa ex moms": "total_excl_vat",
  "summa exkl moms": "total_excl_vat",
  "netto": "total_excl_vat",
  "pris": "total_excl_vat",
  "summa inkl moms": "total_incl_vat",
  "brutto": "total_incl_vat",
  "totalsumma": "total_incl_vat",
};

// Column mappings for estimate items (line items)
const ITEM_COLUMN_MAPPINGS: Record<string, string> = {
  // Article/category
  "artikel": "article",
  "typ": "article",
  "kategori": "article",
  "art": "article",
  
  // Moment/description
  "moment": "moment",
  "beskrivning": "description",
  "text": "description",
  "rad": "moment",
  "arbete": "moment",
  "benämning": "moment",
  
  // Quantity
  "antal": "quantity",
  "mängd": "quantity",
  "st": "quantity",
  
  // Unit
  "enhet": "unit",
  
  // Price
  "á-pris": "unit_price",
  "a-pris": "unit_price",
  "apris": "unit_price",
  "styckpris": "unit_price",
  "pris": "unit_price",
  "pris/st": "unit_price",
  
  // Subtotal
  "summa": "subtotal",
  "belopp": "subtotal",
  "rad summa": "subtotal",
  "radsumma": "subtotal",
  
  // Hours
  "timmar": "hours",
  "tim": "hours",
  "h": "hours",
};

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const str = String(value).replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
}

function parseStatus(value: string | undefined): string {
  if (!value) return "draft";
  const lower = value.toLowerCase().trim();
  if (lower.includes("klar") || lower.includes("godkänd") || lower.includes("skickad") || lower.includes("completed")) {
    return "completed";
  }
  return "draft";
}

// Detect if data is flat (one row per item) or grouped (one row per estimate)
function detectDataStructure(rows: Record<string, unknown>[], headers: string[]): "flat" | "grouped" {
  // Check if we have item-specific columns
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  const hasItemColumns = normalizedHeaders.some(h => 
    ITEM_COLUMN_MAPPINGS[h] === "quantity" || 
    ITEM_COLUMN_MAPPINGS[h] === "unit_price" ||
    ITEM_COLUMN_MAPPINGS[h] === "moment"
  );
  
  // Check if offer numbers repeat
  const offerNumberKey = headers.find(h => {
    const norm = normalizeColumnName(h);
    return ESTIMATE_COLUMN_MAPPINGS[norm] === "offer_number";
  });
  
  if (offerNumberKey && hasItemColumns) {
    const offerNumbers = rows.map(r => r[offerNumberKey]).filter(Boolean);
    const uniqueOfferNumbers = new Set(offerNumbers);
    // If same offer number appears multiple times, it's flat
    if (uniqueOfferNumbers.size < offerNumbers.length * 0.8) {
      return "flat";
    }
  }
  
  return hasItemColumns ? "flat" : "grouped";
}

export function EstimateImportDialog({ onImportComplete }: EstimateImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [parsedEstimates, setParsedEstimates] = useState<ParsedEstimate[]>([]);
  const [skippedRows, setSkippedRows] = useState(0);
  const [existingOfferNumbers, setExistingOfferNumbers] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; items: number }>({ 
    imported: 0, 
    skipped: 0,
    items: 0 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setParsedEstimates([]);
    setSkippedRows(0);
    setExistingOfferNumbers(new Set());
    setImportResult({ imported: 0, skipped: 0, items: 0 });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    setOpen(isOpen);
  };

  const fetchExistingOfferNumbers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set<string>();

    const { data } = await supabase
      .from("project_estimates")
      .select("offer_number")
      .eq("user_id", user.id);

    return new Set((data || []).map(e => e.offer_number?.toLowerCase().trim()).filter(Boolean) as string[]);
  };

  const parseExcelFile = useCallback(async (file: File) => {
    try {
      const existing = await fetchExistingOfferNumbers();
      setExistingOfferNumbers(existing);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
      
      if (jsonData.length === 0) {
        toast.error("Filen verkar vara tom");
        return;
      }

      // Get headers from first row
      const headers = Object.keys(jsonData[0]);
      
      // Create column mappings
      const estimateColumnMap = new Map<string, string>();
      const itemColumnMap = new Map<string, string>();
      
      headers.forEach(header => {
        const normalized = normalizeColumnName(header);
        if (ESTIMATE_COLUMN_MAPPINGS[normalized]) {
          estimateColumnMap.set(header, ESTIMATE_COLUMN_MAPPINGS[normalized]);
        }
        if (ITEM_COLUMN_MAPPINGS[normalized]) {
          itemColumnMap.set(header, ITEM_COLUMN_MAPPINGS[normalized]);
        }
      });

      // Detect structure
      const structure = detectDataStructure(jsonData, headers);
      
      const estimates: ParsedEstimate[] = [];
      let skipped = 0;

      if (structure === "flat") {
        // Group rows by offer number
        const groupedByOffer = new Map<string, { metadata: Record<string, unknown>; items: Record<string, unknown>[] }>();
        
        jsonData.forEach((row) => {
          // Extract offer number
          let offerNumber = "";
          estimateColumnMap.forEach((targetField, sourceColumn) => {
            if (targetField === "offer_number" && row[sourceColumn]) {
              offerNumber = String(row[sourceColumn]).trim();
            }
          });
          
          if (!offerNumber) {
            skipped++;
            return;
          }
          
          if (!groupedByOffer.has(offerNumber)) {
            groupedByOffer.set(offerNumber, { metadata: row, items: [] });
          }
          groupedByOffer.get(offerNumber)!.items.push(row);
        });
        
        // Convert grouped data to estimates
        groupedByOffer.forEach(({ metadata, items }, offerNumber) => {
          const estimate = parseEstimateFromRow(metadata, estimateColumnMap, offerNumber);
          estimate.items = items.map((itemRow, index) => parseItemFromRow(itemRow, itemColumnMap, index));
          estimates.push(estimate);
        });
      } else {
        // Each row is a separate estimate (no items or items in separate sheet)
        jsonData.forEach((row) => {
          let offerNumber = "";
          estimateColumnMap.forEach((targetField, sourceColumn) => {
            if (targetField === "offer_number" && row[sourceColumn]) {
              offerNumber = String(row[sourceColumn]).trim();
            }
          });
          
          if (!offerNumber) {
            skipped++;
            return;
          }
          
          const estimate = parseEstimateFromRow(row, estimateColumnMap, offerNumber);
          estimates.push(estimate);
        });
      }

      setParsedEstimates(estimates);
      setSkippedRows(skipped);
      setStep("preview");
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Kunde inte läsa Excel-filen");
    }
  }, []);

  const parseEstimateFromRow = (
    row: Record<string, unknown>, 
    columnMap: Map<string, string>,
    offerNumber: string
  ): ParsedEstimate => {
    const estimate: Partial<ParsedEstimate> = {
      offer_number: offerNumber,
      items: [],
      status: "draft",
    };
    
    columnMap.forEach((targetField, sourceColumn) => {
      const value = row[sourceColumn];
      if (value !== undefined && value !== null && value !== "") {
        switch (targetField) {
          case "offer_number":
            // Already set
            break;
          case "total_excl_vat":
          case "total_incl_vat":
            (estimate as Record<string, unknown>)[targetField] = parseNumber(value);
            break;
          case "status":
            estimate.status = parseStatus(String(value));
            break;
          default:
            (estimate as Record<string, unknown>)[targetField] = String(value).trim();
        }
      }
    });
    
    // Ensure required fields
    if (!estimate.manual_project_name) {
      estimate.manual_project_name = estimate.offer_number || "Importerad offert";
    }
    if (!estimate.manual_client_name) {
      estimate.manual_client_name = "Okänd kund";
    }
    
    return estimate as ParsedEstimate;
  };

  const parseItemFromRow = (
    row: Record<string, unknown>,
    columnMap: Map<string, string>,
    sortOrder: number
  ): ParsedEstimateItem => {
    const item: Partial<ParsedEstimateItem> = {};
    
    columnMap.forEach((targetField, sourceColumn) => {
      const value = row[sourceColumn];
      if (value !== undefined && value !== null && value !== "") {
        switch (targetField) {
          case "quantity":
          case "unit_price":
          case "subtotal":
          case "hours":
            (item as Record<string, unknown>)[targetField] = parseNumber(value);
            break;
          default:
            (item as Record<string, unknown>)[targetField] = String(value).trim();
        }
      }
    });
    
    // Ensure moment is set (required field)
    if (!item.moment) {
      item.moment = item.description || "Importerad rad";
    }
    
    return item as ParsedEstimateItem;
  };

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".xls", ".xlsx"];
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error("Vänligen välj en Excel-fil (.xls eller .xlsx)");
      return;
    }

    parseExcelFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getNewEstimates = () => {
    return parsedEstimates.filter(
      e => !existingOfferNumbers.has(e.offer_number.toLowerCase().trim())
    );
  };

  const getDuplicateCount = () => {
    return parsedEstimates.filter(
      e => existingOfferNumbers.has(e.offer_number.toLowerCase().trim())
    ).length;
  };

  const getTotalItemCount = () => {
    return getNewEstimates().reduce((sum, e) => sum + e.items.length, 0);
  };

  const handleImport = async () => {
    const newEstimates = getNewEstimates();
    if (newEstimates.length === 0) {
      toast.info("Inga nya offerter att importera");
      return;
    }

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      let totalItemsImported = 0;

      // Import each estimate with its items
      for (const estimate of newEstimates) {
        // Insert estimate
        const { data: insertedEstimate, error: estimateError } = await supabase
          .from("project_estimates")
          .insert({
            user_id: user.id,
            offer_number: estimate.offer_number,
            manual_project_name: estimate.manual_project_name,
            manual_client_name: estimate.manual_client_name,
            manual_address: estimate.manual_address || null,
            manual_postal_code: estimate.manual_postal_code || null,
            manual_city: estimate.manual_city || null,
            total_excl_vat: estimate.total_excl_vat || null,
            total_incl_vat: estimate.total_incl_vat || null,
            status: estimate.status,
          })
          .select("id")
          .single();

        if (estimateError) {
          console.error("Error inserting estimate:", estimateError);
          continue;
        }

        // Insert items if any
        if (estimate.items.length > 0 && insertedEstimate) {
          const itemsToInsert = estimate.items.map((item, index) => ({
            estimate_id: insertedEstimate.id,
            article: item.article || null,
            moment: item.moment,
            description: item.description || null,
            quantity: item.quantity || null,
            unit: item.unit || null,
            unit_price: item.unit_price || null,
            subtotal: item.subtotal || (item.quantity && item.unit_price ? item.quantity * item.unit_price : null),
            hours: item.hours || null,
            sort_order: index,
            type: item.article || "Arbete",
          }));

          const { error: itemsError } = await supabase
            .from("estimate_items")
            .insert(itemsToInsert);

          if (itemsError) {
            console.error("Error inserting items:", itemsError);
          } else {
            totalItemsImported += estimate.items.length;
          }
        }
      }

      setImportResult({
        imported: newEstimates.length,
        skipped: getDuplicateCount(),
        items: totalItemsImported,
      });
      setStep("result");
      onImportComplete();
    } catch (error) {
      console.error("Error importing estimates:", error);
      toast.error("Kunde inte importera offerter");
    } finally {
      setImporting(false);
    }
  };

  const renderUploadStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Importera offerter från Bygglet</DialogTitle>
        <DialogDescription>
          Ladda upp en Excel-fil (.xls eller .xlsx) exporterad från Bygglet
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={handleInputChange}
          />
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium mb-1">
            Dra och släpp en Excel-fil här
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            eller klicka för att välja fil
          </p>
          <p className="text-xs text-muted-foreground">
            Stöder .xls och .xlsx (Bygglet-export)
          </p>
        </div>
      </div>
    </>
  );

  const renderPreviewStep = () => {
    const newEstimates = getNewEstimates();
    const duplicateCount = getDuplicateCount();
    const totalItems = getTotalItemCount();
    const previewEstimates = parsedEstimates.slice(0, 5);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Förhandsgranskning</DialogTitle>
          <DialogDescription>
            Kontrollera offerterna innan import
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium">
              {parsedEstimates.length} offerter hittades
              {totalItems > 0 && ` med totalt ${totalItems} rader`}
            </span>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offertnr</TableHead>
                  <TableHead>Kund</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Rader</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewEstimates.map((estimate, index) => {
                  const isDuplicate = existingOfferNumbers.has(estimate.offer_number.toLowerCase().trim());
                  return (
                    <TableRow key={index} className={isDuplicate ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {estimate.offer_number}
                        {isDuplicate && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            finns redan
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[120px] truncate">
                        {estimate.manual_client_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[120px] truncate">
                        {estimate.manual_project_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {estimate.items.length}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={estimate.status === "draft" ? "secondary" : "default"}
                          className={estimate.status === "completed" ? "bg-green-600" : ""}
                        >
                          {estimate.status === "draft" ? "Draft" : "Klar"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {parsedEstimates.length > 5 && (
              <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground text-center">
                ... och {parsedEstimates.length - 5} till
              </div>
            )}
          </div>

          {skippedRows > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>{skippedRows} rader saknar offertnummer och hoppas över</span>
            </div>
          )}

          {duplicateCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>{duplicateCount} offerter finns redan och hoppas över</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("upload")}>
            Tillbaka
          </Button>
          <Button onClick={handleImport} disabled={importing || newEstimates.length === 0}>
            {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Importera {newEstimates.length} offerter
          </Button>
        </DialogFooter>
      </>
    );
  };

  const renderResultStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Import klar!</DialogTitle>
      </DialogHeader>
      <div className="py-8 text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
        <div className="space-y-1">
          <p className="text-lg font-medium">
            {importResult.imported} offerter importerades
          </p>
          {importResult.items > 0 && (
            <p className="text-sm text-muted-foreground">
              med totalt {importResult.items} rader
            </p>
          )}
          {importResult.skipped > 0 && (
            <p className="text-sm text-muted-foreground">
              {importResult.skipped} hoppades över (finns redan)
            </p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => handleClose(false)}>
          Stäng
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        {step === "upload" && renderUploadStep()}
        {step === "preview" && renderPreviewStep()}
        {step === "result" && renderResultStep()}
      </DialogContent>
    </Dialog>
  );
}
