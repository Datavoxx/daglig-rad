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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, Download, Send } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { InvoiceRowEditor, InvoiceRow } from "./InvoiceRowEditor";
import { generateCustomerInvoicePdf } from "@/lib/generateCustomerInvoicePdf";

interface CustomerInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: any | null;
}

export function CustomerInvoiceDialog({ open, onOpenChange, invoice }: CustomerInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!invoice;

  const [projectId, setProjectId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [paymentTerms, setPaymentTerms] = useState("30 dagar netto");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [importFromEstimate, setImportFromEstimate] = useState(false);
  const [importAta, setImportAta] = useState(false);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-invoice"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, name, client_name, estimate_id")
        .eq("user_id", userData.user.id)
        .order("name");
      return data || [];
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-for-invoice"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", userData.user.id)
        .order("name");
      return data || [];
    },
  });

  // Fetch estimate items when project changes
  const { data: estimateItems = [] } = useQuery({
    queryKey: ["estimate-items-for-invoice", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const project = projects.find(p => p.id === projectId);
      if (!project?.estimate_id) return [];
      
      const { data } = await supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", project.estimate_id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!projectId && importFromEstimate,
  });

  // Fetch ATA items when project changes
  const { data: ataItems = [] } = useQuery({
    queryKey: ["ata-items-for-invoice", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("project_ata")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "approved")
        .order("sort_order");
      return data || [];
    },
    enabled: !!projectId && importAta,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (invoice) {
        setProjectId(invoice.project_id || "");
        setCustomerId(invoice.customer_id || "");
        setInvoiceDate(invoice.invoice_date);
        setDueDate(invoice.due_date);
        setPaymentTerms(invoice.payment_terms || "30 dagar netto");
        setNotes(invoice.notes || "");
        setRows(invoice.rows || []);
      } else {
        setProjectId("");
        setCustomerId("");
        setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
        setDueDate(format(addDays(new Date(), 30), "yyyy-MM-dd"));
        setPaymentTerms("30 dagar netto");
        setNotes("");
        setRows([{ id: crypto.randomUUID(), description: "", quantity: 1, unit: "st", unit_price: 0, vat_rate: 25, subtotal: 0 }]);
        setImportFromEstimate(false);
        setImportAta(false);
      }
    }
  }, [open, invoice]);

  // Auto-fill customer when project changes
  useEffect(() => {
    if (projectId && !customerId) {
      const project = projects.find(p => p.id === projectId);
      if (project?.client_name) {
        const matchingCustomer = customers.find(c => 
          c.name.toLowerCase() === project.client_name?.toLowerCase()
        );
        if (matchingCustomer) {
          setCustomerId(matchingCustomer.id);
        }
      }
    }
  }, [projectId, projects, customers, customerId]);

  // Import estimate items
  useEffect(() => {
    if (importFromEstimate && estimateItems.length > 0) {
      const newRows: InvoiceRow[] = estimateItems.map(item => ({
        id: crypto.randomUUID(),
        description: item.description || item.moment,
        quantity: item.quantity || item.hours || 1,
        unit: item.unit || (item.type === "labor" ? "h" : "st"),
        unit_price: item.unit_price || 0,
        vat_rate: 25,
        subtotal: item.subtotal || 0,
      }));
      setRows(prev => [...prev.filter(r => r.description), ...newRows]);
    }
  }, [estimateItems, importFromEstimate]);

  // Import ATA items
  useEffect(() => {
    if (importAta && ataItems.length > 0) {
      const newRows: InvoiceRow[] = ataItems.map(item => ({
        id: crypto.randomUUID(),
        description: `ÄTA: ${item.description}`,
        quantity: item.quantity || 1,
        unit: item.unit || "st",
        unit_price: item.unit_price || 0,
        vat_rate: 25,
        subtotal: item.subtotal || 0,
      }));
      setRows(prev => [...prev, ...newRows]);
    }
  }, [ataItems, importAta]);

  const calculateTotals = () => {
    const totalExVat = rows.reduce((sum, row) => sum + (row.subtotal || 0), 0);
    const vatAmount = totalExVat * 0.25;
    const totalIncVat = totalExVat + vatAmount;
    return { totalExVat, vatAmount, totalIncVat };
  };

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "sent") => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { totalExVat, vatAmount, totalIncVat } = calculateTotals();

      const invoiceData = {
        user_id: userData.user.id,
        project_id: projectId || null,
        customer_id: customerId || null,
        status,
        invoice_date: invoiceDate,
        due_date: dueDate,
        rows: rows as any,
        total_ex_vat: totalExVat,
        vat_amount: vatAmount,
        total_inc_vat: totalIncVat,
        payment_terms: paymentTerms,
        notes: notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("customer_invoices")
          .update(invoiceData)
          .eq("id", invoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_invoices")
          .insert(invoiceData);
        if (error) throw error;
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success(status === "sent" ? "Faktura sparad och markerad som skickad" : "Faktura sparad");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Kunde inte spara faktura");
    },
  });

  const handleDownloadPdf = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: company } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      const { totalExVat, vatAmount, totalIncVat } = calculateTotals();
      const customer = customers.find(c => c.id === customerId);
      const project = projects.find(p => p.id === projectId);

      await generateCustomerInvoicePdf({
        invoice: {
          invoice_number: invoice?.invoice_number || "UTKAST",
          invoice_date: invoiceDate,
          due_date: dueDate,
          rows,
          total_ex_vat: totalExVat,
          vat_amount: vatAmount,
          total_inc_vat: totalIncVat,
          payment_terms: paymentTerms,
        },
        company: company || undefined,
        customerName: customer?.name,
        projectName: project?.name,
      });
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  const { totalExVat, vatAmount, totalIncVat } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Redigera ${invoice.invoice_number}` : "Ny kundfaktura"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Project & Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Projekt</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj projekt (valfritt)" />
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
              <div className="space-y-2">
                <Label>Kund</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj kund" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Import options */}
            {projectId && !isEditing && (
              <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="import-estimate"
                    checked={importFromEstimate}
                    onCheckedChange={(checked) => setImportFromEstimate(!!checked)}
                  />
                  <Label htmlFor="import-estimate" className="text-sm cursor-pointer">
                    Hämta rader från offert
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="import-ata"
                    checked={importAta}
                    onCheckedChange={(checked) => setImportAta(!!checked)}
                  />
                  <Label htmlFor="import-ata" className="text-sm cursor-pointer">
                    Inkludera godkända ÄTA
                  </Label>
                </div>
              </div>
            )}

            {/* Dates */}
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
                <Label>Betalvillkor</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="30 dagar netto"
                />
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
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summa exkl. moms</span>
                  <span className="font-medium tabular-nums">{formatCurrency(totalExVat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moms 25%</span>
                  <span className="font-medium tabular-nums">{formatCurrency(vatAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Totalt inkl. moms</span>
                  <span className="font-bold tabular-nums">{formatCurrency(totalIncVat)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Interna anteckningar</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anteckningar visas inte på fakturan..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Ladda ner PDF
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" onClick={() => saveMutation.mutate("draft")} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Spara utkast
          </Button>
          <Button onClick={() => saveMutation.mutate("sent")} disabled={saveMutation.isPending}>
            <Send className="h-4 w-4 mr-2" />
            Markera som skickad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
