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
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ParsedCustomer {
  name: string;
  customer_number?: string;
  org_number?: string;
  customer_type: "business" | "private";
  address?: string;
  visit_address?: string;
  invoice_address?: string;
  postal_code?: string;
  city?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

interface CustomerImportDialogProps {
  onImportComplete: () => void;
}

type ImportStep = "upload" | "preview" | "result";

// Column name mappings from Bygglet to our schema
const COLUMN_MAPPINGS: Record<string, keyof ParsedCustomer> = {
  // Name variations
  "namn": "name",
  "kundnamn": "name",
  "name": "name",
  
  // Customer number
  "nummer": "customer_number",
  "kundnummer": "customer_number",
  "kund nr": "customer_number",
  
  // Organization number
  "org.nr/pers.nr": "org_number",
  "org.nr": "org_number",
  "orgnr": "org_number",
  "organisationsnummer": "org_number",
  "pers.nr": "org_number",
  "personnummer": "org_number",
  
  // Type
  "typ": "customer_type",
  "kundtyp": "customer_type",
  "type": "customer_type",
  
  // Addresses
  "postadress": "address",
  "adress": "address",
  "address": "address",
  "besöksadress": "visit_address",
  "fakturaadress": "invoice_address",
  
  // Postal code and city
  "postnummer": "postal_code",
  "postnr": "postal_code",
  "ort": "city",
  "stad": "city",
  "city": "city",
  
  // Contact info
  "e-post": "email",
  "epost": "email",
  "email": "email",
  "mail": "email",
  "mobil": "mobile",
  "mobilnummer": "mobile",
  "telefon": "phone",
  "tel": "phone",
  "telefonnummer": "phone",
  
  // Website
  "hemsida": "website",
  "webbplats": "website",
  "website": "website",
  "webb": "website",
  
  // Notes
  "anteckning": "notes",
  "anteckningar": "notes",
  "notering": "notes",
  "notes": "notes",
  "kommentar": "notes",
};

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function parseCustomerType(value: string | undefined): "business" | "private" {
  if (!value) return "business";
  const lower = value.toLowerCase().trim();
  if (lower.includes("privat") || lower === "privatperson" || lower === "private") {
    return "private";
  }
  return "business";
}

export function CustomerImportDialog({ onImportComplete }: CustomerImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [skippedRows, setSkippedRows] = useState(0);
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number }>({ imported: 0, skipped: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setParsedCustomers([]);
    setSkippedRows(0);
    setExistingNames(new Set());
    setImportResult({ imported: 0, skipped: 0 });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    setOpen(isOpen);
  };

  const fetchExistingCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set<string>();

    const { data } = await supabase
      .from("customers")
      .select("name")
      .eq("user_id", user.id);

    return new Set((data || []).map(c => c.name.toLowerCase().trim()));
  };

  const parseExcelFile = useCallback(async (file: File) => {
    try {
      const existing = await fetchExistingCustomers();
      setExistingNames(existing);

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
      
      // Create column mapping
      const columnMap = new Map<string, keyof ParsedCustomer>();
      headers.forEach(header => {
        const normalized = normalizeColumnName(header);
        const mapped = COLUMN_MAPPINGS[normalized];
        if (mapped) {
          columnMap.set(header, mapped);
        }
      });

      // Parse customers
      const customers: ParsedCustomer[] = [];
      let skipped = 0;

      jsonData.forEach((row) => {
        const customer: Partial<ParsedCustomer> = {};
        
        columnMap.forEach((targetField, sourceColumn) => {
          const value = row[sourceColumn];
          if (value !== undefined && value !== null && value !== "") {
            if (targetField === "customer_type") {
              customer[targetField] = parseCustomerType(String(value));
            } else {
              (customer as Record<string, unknown>)[targetField] = String(value).trim();
            }
          }
        });

        // Name is required
        if (!customer.name || customer.name.trim() === "") {
          skipped++;
          return;
        }

        // Set default customer type if not found
        if (!customer.customer_type) {
          customer.customer_type = "business";
        }

        customers.push(customer as ParsedCustomer);
      });

      setParsedCustomers(customers);
      setSkippedRows(skipped);
      setStep("preview");
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Kunde inte läsa Excel-filen");
    }
  }, []);

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

  const getNewCustomers = () => {
    return parsedCustomers.filter(
      c => !existingNames.has(c.name.toLowerCase().trim())
    );
  };

  const getDuplicateCount = () => {
    return parsedCustomers.filter(
      c => existingNames.has(c.name.toLowerCase().trim())
    ).length;
  };

  const handleImport = async () => {
    const newCustomers = getNewCustomers();
    if (newCustomers.length === 0) {
      toast.info("Inga nya kunder att importera");
      return;
    }

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      // Batch insert customers
      const customersToInsert = newCustomers.map(c => ({
        user_id: user.id,
        name: c.name,
        customer_number: c.customer_number || null,
        org_number: c.org_number || null,
        customer_type: c.customer_type,
        address: c.address || null,
        visit_address: c.visit_address || null,
        invoice_address: c.invoice_address || null,
        postal_code: c.postal_code || null,
        city: c.city || null,
        email: c.email || null,
        mobile: c.mobile || null,
        phone: c.phone || null,
        website: c.website || null,
        notes: c.notes || null,
      }));

      const { error } = await supabase
        .from("customers")
        .insert(customersToInsert);

      if (error) throw error;

      setImportResult({
        imported: newCustomers.length,
        skipped: getDuplicateCount(),
      });
      setStep("result");
      onImportComplete();
    } catch (error) {
      console.error("Error importing customers:", error);
      toast.error("Kunde inte importera kunder");
    } finally {
      setImporting(false);
    }
  };

  const renderUploadStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Importera kunder från Bygglet</DialogTitle>
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
    const newCustomers = getNewCustomers();
    const duplicateCount = getDuplicateCount();
    const previewCustomers = parsedCustomers.slice(0, 5);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Förhandsgranskning</DialogTitle>
          <DialogDescription>
            Kontrollera kunderna innan import
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium">{parsedCustomers.length} kunder hittades i filen</span>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Nummer</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Typ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewCustomers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.customer_number || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.email ? (
                        <span className="truncate max-w-[150px] block">
                          {customer.email}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          customer.customer_type === "business"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        }
                      >
                        {customer.customer_type === "business" ? (
                          <><Building2 className="h-3 w-3 mr-1" />Företag</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" />Privat</>
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedCustomers.length > 5 && (
              <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground text-center">
                ... och {parsedCustomers.length - 5} till
              </div>
            )}
          </div>

          {skippedRows > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>{skippedRows} rader saknar namn och hoppas över</span>
            </div>
          )}

          {duplicateCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>{duplicateCount} kunder finns redan och hoppas över</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("upload")}>
            Tillbaka
          </Button>
          <Button onClick={handleImport} disabled={importing || newCustomers.length === 0}>
            {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Importera {newCustomers.length} kunder
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
            {importResult.imported} kunder importerades
          </p>
          {importResult.skipped > 0 && (
            <p className="text-sm text-muted-foreground">
              {importResult.skipped} kunder fanns redan (hoppades över)
            </p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => handleClose(false)}>Stäng</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === "upload" && renderUploadStep()}
        {step === "preview" && renderPreviewStep()}
        {step === "result" && renderResultStep()}
      </DialogContent>
    </Dialog>
  );
}
