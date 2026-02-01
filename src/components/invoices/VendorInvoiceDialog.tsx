import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, FileText, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { InvoiceRowEditor, InvoiceRow } from "./InvoiceRowEditor";

interface VendorInvoiceDialogProps {
  invoice: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorInvoiceDialog({ invoice, open, onOpenChange }: VendorInvoiceDialogProps) {
  const queryClient = useQueryClient();

  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [totalExVat, setTotalExVat] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalIncVat, setTotalIncVat] = useState(0);
  const [status, setStatus] = useState<"new" | "reviewed" | "attested">("new");

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-vendor-dialog"],
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

  // Populate form when invoice changes
  useEffect(() => {
    if (invoice) {
      setSupplierName(invoice.supplier_name || "");
      setInvoiceNumber(invoice.invoice_number || "");
      setInvoiceDate(invoice.invoice_date || "");
      setDueDate(invoice.due_date || "");
      setProjectId(invoice.project_id || "");
      setStatus(invoice.status || "new");
      setTotalExVat(invoice.total_ex_vat || 0);
      setVatAmount(invoice.vat_amount || 0);
      setTotalIncVat(invoice.total_inc_vat || 0);
      
      if (invoice.rows?.length > 0) {
        setRows(invoice.rows.map((r: any) => ({
          id: r.id || crypto.randomUUID(),
          description: r.description || "",
          quantity: r.quantity || 1,
          unit: r.unit || "st",
          unit_price: r.unit_price || 0,
          vat_rate: r.vat_rate || 25,
          subtotal: r.subtotal || 0,
        })));
      } else {
        setRows([{ id: crypto.randomUUID(), description: "", quantity: 1, unit: "st", unit_price: 0, vat_rate: 25, subtotal: 0 }]);
      }
    }
  }, [invoice]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) return;

      const calculatedExVat = rows.reduce((sum, r) => sum + (r.subtotal || 0), 0);
      const finalExVat = totalExVat || calculatedExVat;
      const finalVat = vatAmount || finalExVat * 0.25;
      const finalIncVat = totalIncVat || finalExVat + finalVat;

      const { error } = await supabase
        .from("vendor_invoices")
        .update({
          supplier_name: supplierName,
          project_id: projectId || null,
          invoice_number: invoiceNumber || null,
          invoice_date: invoiceDate || null,
          due_date: dueDate || null,
          rows: rows as any,
          total_ex_vat: finalExVat,
          vat_amount: finalVat,
          total_inc_vat: finalIncVat,
          status,
        })
        .eq("id", invoice.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices"] });
      toast.success("Faktura uppdaterad");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Kunde inte uppdatera faktura");
    },
  });

  const handleViewPdf = async () => {
    if (!invoice?.pdf_storage_path) return;
    const { data } = await supabase.storage
      .from("invoice-files")
      .createSignedUrl(invoice.pdf_storage_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Leverantörsfaktura
            {invoice.ai_extracted && (
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                AI-extraherad
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Ny</SelectItem>
                    <SelectItem value="reviewed">Granskad</SelectItem>
                    <SelectItem value="attested">Attesterad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  <Label>Projekt</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
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
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            {invoice.pdf_storage_path && (
              <Button type="button" variant="outline" onClick={handleViewPdf}>
                <FileText className="h-4 w-4 mr-2" />
                Visa PDF
              </Button>
            )}
            <div className="flex-1" />
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Spara ändringar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
