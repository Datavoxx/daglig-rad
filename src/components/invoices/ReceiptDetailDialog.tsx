import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Sparkles, Image as ImageIcon } from "lucide-react";

interface ReceiptRow {
  id: string;
  store_name: string | null;
  org_number: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  payment_method: string | null;
  items: any[];
  vat_breakdown: any[];
  total_ex_vat: number;
  total_vat: number;
  total_inc_vat: number;
  image_storage_path: string | null;
  ai_extracted: boolean;
  status: string;
  projects?: { name: string } | null;
}

interface Props {
  receipt: ReceiptRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailDialog({ receipt, open, onOpenChange }: Props) {
  if (!receipt) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 2 }).format(amount);

  const handleViewImage = async () => {
    if (!receipt.image_storage_path) return;
    const { data } = await supabase.storage
      .from("invoice-files")
      .createSignedUrl(receipt.image_storage_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {receipt.store_name || "Kvitto"}
          </DialogTitle>
          <DialogDescription>
            {receipt.receipt_date || "Okänt datum"}
            {receipt.projects?.name && ` · ${receipt.projects.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {receipt.ai_extracted && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" /> AI-extraherat
              </Badge>
            )}
            <Badge variant={receipt.status === "reviewed" ? "default" : "secondary"}>
              {receipt.status === "reviewed" ? "Granskat" : "Nytt"}
            </Badge>
            {receipt.payment_method && <Badge variant="outline">{receipt.payment_method}</Badge>}
          </div>

          {receipt.org_number && (
            <p className="text-sm text-muted-foreground">Org.nr: {receipt.org_number}</p>
          )}
          {receipt.receipt_number && (
            <p className="text-sm text-muted-foreground">Kvittonr: {receipt.receipt_number}</p>
          )}

          {/* Items */}
          {receipt.items?.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground flex justify-between">
                <span>Artikel</span>
                <span>Belopp</span>
              </div>
              <div className="divide-y">
                {receipt.items.map((item: any, i: number) => (
                  <div key={i} className="px-3 py-2 flex justify-between items-center text-sm">
                    <div className="flex-1 min-w-0 mr-3">
                      <span className="truncate block">{item.description}</span>
                      <span className="text-xs text-muted-foreground">{item.vat_rate}% moms</span>
                    </div>
                    <span className="font-medium tabular-nums whitespace-nowrap">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VAT breakdown */}
          {receipt.vat_breakdown?.length > 0 && (
            <div className="border rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Momsuppdelning</p>
              {receipt.vat_breakdown.map((v: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{v.vat_rate}% moms</span>
                  <div className="flex gap-4 tabular-nums">
                    <span>Netto: {formatCurrency(v.net_amount)}</span>
                    <span>Moms: {formatCurrency(v.vat_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="border rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exkl. moms</span>
              <span className="tabular-nums">{formatCurrency(receipt.total_ex_vat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Moms</span>
              <span className="tabular-nums">{formatCurrency(receipt.total_vat)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t">
              <span>Totalt</span>
              <span className="tabular-nums">{formatCurrency(receipt.total_inc_vat)}</span>
            </div>
          </div>

          {/* View image */}
          {receipt.image_storage_path && (
            <Button variant="outline" onClick={handleViewImage} className="w-full">
              <ImageIcon className="h-4 w-4 mr-2" />
              Visa kvittobild
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
