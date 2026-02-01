import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, FileText, Download, MoreHorizontal, CheckCircle, Send, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { CustomerInvoiceDialog } from "./CustomerInvoiceDialog";
import { generateCustomerInvoicePdf } from "@/lib/generateCustomerInvoicePdf";

type InvoiceStatus = "draft" | "sent" | "paid";

interface CustomerInvoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  project_id: string | null;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string;
  rows: any[];
  total_ex_vat: number;
  vat_amount: number;
  total_inc_vat: number;
  payment_terms: string;
  notes: string | null;
  created_at: string;
  customers?: { name: string } | null;
  projects?: { name: string } | null;
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: "secondary" | "default" | "outline" }> = {
  draft: { label: "Utkast", variant: "secondary" },
  sent: { label: "Skickad", variant: "default" },
  paid: { label: "Betald", variant: "outline" },
};

export function CustomerInvoiceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<CustomerInvoice | null>(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["customer-invoices"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("customer_invoices")
        .select(`
          *,
          customers(name),
          projects(name)
        `)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomerInvoice[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Faktura raderad");
    },
    onError: () => {
      toast.error("Kunde inte radera faktura");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const { error } = await supabase
        .from("customer_invoices")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Status uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera status");
    },
  });

  const handleDownloadPdf = async (invoice: CustomerInvoice) => {
    try {
      // Fetch company settings
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: company } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      await generateCustomerInvoicePdf({
        invoice,
        company: company || undefined,
        customerName: invoice.customers?.name,
        projectName: invoice.projects?.name,
      });
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  const handleMarkAsSent = (invoice: CustomerInvoice) => {
    updateStatusMutation.mutate({ id: invoice.id, status: "sent" });
  };

  const handleMarkAsPaid = (invoice: CustomerInvoice) => {
    updateStatusMutation.mutate({ id: invoice.id, status: "paid" });
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.projects?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök fakturanummer, kund, projekt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla</SelectItem>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="sent">Skickad</SelectItem>
            <SelectItem value="paid">Betald</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditingInvoice(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ny kundfaktura
        </Button>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20 bg-muted/30" />
            </Card>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">Inga fakturor</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Skapa din första kundfaktura för att komma igång
            </p>
            <Button onClick={() => { setEditingInvoice(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa faktura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{invoice.invoice_number}</span>
                      <Badge variant={statusConfig[invoice.status].variant} className="text-xs">
                        {statusConfig[invoice.status].label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{invoice.customers?.name || "Ingen kund"}</span>
                      {invoice.projects?.name && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {invoice.projects.name}
                        </span>
                      )}
                      <span>{format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: sv })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg tabular-nums">
                      {formatCurrency(invoice.total_inc_vat)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingInvoice(invoice); setDialogOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visa/Redigera
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                          <Download className="h-4 w-4 mr-2" />
                          Ladda ner PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => handleMarkAsSent(invoice)}>
                            <Send className="h-4 w-4 mr-2" />
                            Markera som skickad
                          </DropdownMenuItem>
                        )}
                        {invoice.status === "sent" && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Markera som betald
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Radera
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerInvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editingInvoice}
      />
    </div>
  );
}
