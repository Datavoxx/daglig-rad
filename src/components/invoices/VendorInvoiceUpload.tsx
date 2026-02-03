import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Loader2, Save, Sparkles, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvoiceRowEditor, InvoiceRow } from "./InvoiceRowEditor";

interface VendorInvoiceUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtractedData {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_ex_vat: number;
  vat_amount: number;
  total_inc_vat: number;
  rows: InvoiceRow[];
  suggested_project?: string;
}

export function VendorInvoiceUpload({ open, onOpenChange }: VendorInvoiceUploadProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState(false);
  
  // Form state
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [totalExVat, setTotalExVat] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalIncVat, setTotalIncVat] = useState(0);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-vendor-invoice"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", userData.user.id)
        .order("name");
      return data || [];
    },
  });

  const resetForm = () => {
    setFile(null);
    setExtractedData(null);
    setExtractionError(null);
    setProjectError(false);
    setSupplierName("");
    setInvoiceNumber("");
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
    setProjectId("");
    setRows([{ id: crypto.randomUUID(), description: "", quantity: 1, unit: "st", unit_price: 0, vat_rate: 25, subtotal: 0 }]);
    setTotalExVat(0);
    setVatAmount(0);
    setTotalIncVat(0);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      handleExtract(droppedFile);
    } else {
      toast.error("Endast PDF-filer stöds");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleExtract(selectedFile);
    }
  };

  const handleExtract = async (pdfFile: File) => {
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:application/pdf;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });

      // Call AI extraction edge function
      const { data, error } = await supabase.functions.invoke("extract-vendor-invoice", {
        body: { pdfBase64: base64, fileName: pdfFile.name },
      });

      if (error) throw error;

      if (data?.extracted) {
        setExtractedData(data.extracted);
        // Populate form with extracted data
        setSupplierName(data.extracted.supplier_name || "");
        setInvoiceNumber(data.extracted.invoice_number || "");
        setInvoiceDate(data.extracted.invoice_date || format(new Date(), "yyyy-MM-dd"));
        setDueDate(data.extracted.due_date || "");
        setTotalExVat(data.extracted.total_ex_vat || 0);
        setVatAmount(data.extracted.vat_amount || 0);
        setTotalIncVat(data.extracted.total_inc_vat || 0);
        
        if (data.extracted.rows?.length > 0) {
          setRows(data.extracted.rows.map((r: any) => ({
            id: crypto.randomUUID(),
            description: r.description || "",
            quantity: r.quantity || 1,
            unit: r.unit || "st",
            unit_price: r.unit_price || 0,
            vat_rate: r.vat_rate || 25,
            subtotal: r.subtotal || 0,
          })));
        }

        // Try to match suggested project
        if (data.extracted.suggested_project) {
          const matchedProject = projects.find(p => 
            p.name.toLowerCase().includes(data.extracted.suggested_project.toLowerCase())
          );
          if (matchedProject) {
            setProjectId(matchedProject.id);
          }
        }

        toast.success("Data extraherad från PDF");
      } else {
        throw new Error("Ingen data kunde extraheras");
      }
    } catch (error: any) {
      console.error("Extraction error:", error);
      setExtractionError(error.message || "Kunde inte extrahera data från PDF");
      // Set default empty form
      setRows([{ id: crypto.randomUUID(), description: "", quantity: 1, unit: "st", unit_price: 0, vat_rate: 25, subtotal: 0 }]);
    } finally {
      setIsExtracting(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      let pdfStoragePath: string | null = null;

      // Upload PDF if available
      if (file) {
        const fileName = `${userData.user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("invoice-files")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        pdfStoragePath = fileName;
      }

      // Calculate totals from rows if not set
      const calculatedExVat = rows.reduce((sum, r) => sum + (r.subtotal || 0), 0);
      const finalExVat = totalExVat || calculatedExVat;
      const finalVat = vatAmount || finalExVat * 0.25;
      const finalIncVat = totalIncVat || finalExVat + finalVat;

      const { error } = await supabase.from("vendor_invoices").insert({
        user_id: userData.user.id,
        supplier_name: supplierName || "Okänd leverantör",
        project_id: projectId || null,
        invoice_number: invoiceNumber || null,
        invoice_date: invoiceDate || null,
        due_date: dueDate || null,
        rows: rows as any,
        total_ex_vat: finalExVat,
        vat_amount: finalVat,
        total_inc_vat: finalIncVat,
        pdf_storage_path: pdfStoragePath,
        original_file_name: file?.name || null,
        ai_extracted: !!extractedData,
        status: "new",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices"] });
      toast.success("Leverantörsfaktura sparad");
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Kunde inte spara faktura");
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Lägg till leverantörsfaktura</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Upload Zone */}
            {!file && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                  ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}
                `}
                onClick={() => document.getElementById("pdf-upload")?.click()}
              >
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="font-medium mb-1">Dra och släpp PDF här</p>
                <p className="text-sm text-muted-foreground">eller klicka för att välja fil</p>
              </div>
            )}

            {/* File info */}
            {file && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {extractedData && (
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    AI-extraherad
                  </div>
                )}
              </div>
            )}

            {/* Extraction loading */}
            {isExtracting && (
              <div className="flex items-center justify-center gap-3 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">AI analyserar fakturan...</span>
              </div>
            )}

            {/* Extraction error */}
            {extractionError && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Kunde inte extrahera data</p>
                  <p className="text-sm">{extractionError}</p>
                  <p className="text-sm mt-1">Du kan fylla i uppgifterna manuellt nedan.</p>
                </div>
              </div>
            )}

            {/* Form (shown after file selected or if extraction failed) */}
            {(file && !isExtracting) && (
              <>
                <Separator />

                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leverantör *</Label>
                    <Input
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Leverantörsnamn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fakturanummer</Label>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="F-12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fakturadatum</Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Förfallodatum</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Projekt *</Label>
                    <Select value={projectId} onValueChange={(v) => { setProjectId(v); setProjectError(false); }}>
                      <SelectTrigger className={projectError ? "border-destructive" : ""}>
                        <SelectValue placeholder="Välj projekt" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {projectError && (
                      <p className="text-xs text-destructive">Projekt måste väljas</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Invoice Rows */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Fakturarader</Label>
                  <InvoiceRowEditor rows={rows} onChange={setRows} />
                </div>

                <Separator />

                {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Summa exkl. moms</Label>
                    <Input
                      type="number"
                      value={totalExVat || ""}
                      onChange={(e) => setTotalExVat(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moms</Label>
                    <Input
                      type="number"
                      value={vatAmount || ""}
                      onChange={(e) => setVatAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Totalt inkl. moms</Label>
                    <Input
                      type="number"
                      value={totalIncVat || ""}
                      onChange={(e) => setTotalIncVat(parseFloat(e.target.value) || 0)}
                      className="font-semibold"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Avbryt
          </Button>
          <div className="flex-1" />
          <Button
            onClick={() => {
              if (!projectId) {
                setProjectError(true);
                toast.error("Du måste välja ett projekt");
                return;
              }
              saveMutation.mutate();
            }}
            disabled={!file || isExtracting || saveMutation.isPending || !supplierName}
          >
            <Save className="h-4 w-4 mr-2" />
            Spara faktura
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
