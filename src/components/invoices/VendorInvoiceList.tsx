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
import { Plus, Search, Truck, FileText, MoreHorizontal, CheckCircle, Eye, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { VendorInvoiceUpload } from "./VendorInvoiceUpload";
import { VendorInvoiceDialog } from "./VendorInvoiceDialog";

type VendorStatus = "new" | "reviewed" | "attested";

interface VendorInvoice {
  id: string;
  supplier_name: string;
  project_id: string | null;
  status: VendorStatus;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  rows: any[];
  total_ex_vat: number;
  vat_amount: number;
  total_inc_vat: number;
  pdf_storage_path: string | null;
  original_file_name: string | null;
  ai_extracted: boolean;
  created_at: string;
  projects?: { name: string } | null;
}

const statusConfig: Record<VendorStatus, { label: string; variant: "secondary" | "default" | "outline" }> = {
  new: { label: "Ny", variant: "secondary" },
  reviewed: { label: "Granskad", variant: "default" },
  attested: { label: "Attesterad", variant: "outline" },
};

export function VendorInvoiceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["vendor-invoices"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vendor_invoices")
        .select(`
          *,
          projects(name)
        `)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VendorInvoice[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices"] });
      toast.success("Faktura raderad");
    },
    onError: () => {
      toast.error("Kunde inte radera faktura");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VendorStatus }) => {
      const { error } = await supabase
        .from("vendor_invoices")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices"] });
      toast.success("Status uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera status");
    },
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
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
            placeholder="Sök leverantör, fakturanummer, projekt..."
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
            <SelectItem value="new">Ny</SelectItem>
            <SelectItem value="reviewed">Granskad</SelectItem>
            <SelectItem value="attested">Attesterad</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Lägg till faktura
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
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">Inga leverantörsfakturor</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Ladda upp en PDF och låt AI extrahera data automatiskt
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till faktura
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
                      <span className="font-semibold text-sm">{invoice.supplier_name}</span>
                      <Badge variant={statusConfig[invoice.status].variant} className="text-xs">
                        {statusConfig[invoice.status].label}
                      </Badge>
                      {invoice.ai_extracted && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {invoice.invoice_number && <span>{invoice.invoice_number}</span>}
                      {invoice.projects?.name && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {invoice.projects.name}
                        </span>
                      )}
                      {invoice.invoice_date && (
                        <span>{format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: sv })}</span>
                      )}
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
                        <DropdownMenuItem onClick={() => setViewingInvoice(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visa/Redigera
                        </DropdownMenuItem>
                        {invoice.pdf_storage_path && (
                          <DropdownMenuItem onClick={async () => {
                            const { data } = await supabase.storage
                              .from("invoice-files")
                              .createSignedUrl(invoice.pdf_storage_path!, 60);
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, "_blank");
                            }
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            Visa PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {invoice.status === "new" && (
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "reviewed" })}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Markera som granskad
                          </DropdownMenuItem>
                        )}
                        {invoice.status === "reviewed" && (
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "attested" })}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Attestera
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

      <VendorInvoiceUpload open={uploadOpen} onOpenChange={setUploadOpen} />
      <VendorInvoiceDialog
        invoice={viewingInvoice}
        open={!!viewingInvoice}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
      />
    </div>
  );
}
