import { useState, useRef, useEffect } from "react";
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
import { Plus, Search, Receipt, MoreHorizontal, CheckCircle, Eye, Trash2, Sparkles, Camera, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { ReceiptUploadDialog } from "./ReceiptUploadDialog";
import { ReceiptDetailDialog } from "./ReceiptDetailDialog";

type ReceiptStatus = "new" | "reviewed";

interface ReceiptRow {
  id: string;
  store_name: string | null;
  org_number: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  payment_method: string | null;
  project_id: string | null;
  category: string | null;
  items: any[];
  vat_breakdown: any[];
  total_ex_vat: number;
  total_vat: number;
  total_inc_vat: number;
  image_storage_path: string | null;
  original_file_name: string | null;
  ai_extracted: boolean;
  status: ReceiptStatus;
  created_at: string;
  projects?: { name: string } | null;
}

const statusConfig: Record<ReceiptStatus, { label: string; variant: "secondary" | "default" }> = {
  new: { label: "Nytt", variant: "secondary" },
  reviewed: { label: "Granskat", variant: "default" },
};

interface ReceiptListProps {
  autoOpen?: boolean;
}

export function ReceiptList({ autoOpen }: ReceiptListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Auto-open upload dialog if navigated with auto param
  useEffect(() => {
    if (autoOpen) {
      setUploadOpen(true);
    }
  }, [autoOpen]);

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("receipts" as any)
        .select(`*, projects(name)`)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ReceiptRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receipts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Kvitto raderat");
    },
    onError: () => toast.error("Kunde inte radera kvitto"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReceiptStatus }) => {
      const { error } = await supabase.from("receipts" as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Status uppdaterad");
    },
    onError: () => toast.error("Kunde inte uppdatera status"),
  });

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.store_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.projects?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadOpen(true);
    }
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Hidden camera input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök butik, kvittonummer, projekt..."
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
            <SelectItem value="new">Nytt</SelectItem>
            <SelectItem value="reviewed">Granskat</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setUploadOpen(true)}>
          <Camera className="h-4 w-4 mr-2" />
          Nytt kvitto
        </Button>
      </div>

      {/* Receipt List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20 bg-muted/30" />
            </Card>
          ))}
        </div>
      ) : filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">Inga kvitton</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Ta en bild på ditt kvitto så extraherar AI all data automatiskt
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Ta bild på kvitto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((receipt) => (
            <Card key={receipt.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{receipt.store_name || "Okänd butik"}</span>
                      <Badge variant={statusConfig[receipt.status].variant} className="text-xs">
                        {statusConfig[receipt.status].label}
                      </Badge>
                      {receipt.category && (
                        <Badge variant="info" className="text-xs">
                          {receipt.category === "material" ? "Material" : "Lunch"}
                        </Badge>
                      )}
                      {receipt.ai_extracted && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {receipt.receipt_number && <span className="truncate max-w-[140px]">{receipt.receipt_number}</span>}
                      {receipt.projects?.name && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{receipt.projects.name}</span>
                      )}
                      {receipt.receipt_date && (
                        <span>{format(new Date(receipt.receipt_date), "d MMM yyyy", { locale: sv })}</span>
                      )}
                      {receipt.payment_method && <span>{receipt.payment_method}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg tabular-nums">{formatCurrency(receipt.total_inc_vat)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingReceipt(receipt)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visa/Redigera
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {receipt.status === "new" && (
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: receipt.id, status: "reviewed" })}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Markera som granskad
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(receipt.id)}>
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

      <ReceiptUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <ReceiptDetailDialog
        receipt={viewingReceipt}
        open={!!viewingReceipt}
        onOpenChange={(open) => !open && setViewingReceipt(null)}
      />
    </div>
  );
}
