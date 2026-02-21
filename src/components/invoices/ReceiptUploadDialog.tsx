import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Sparkles, Receipt, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface ExtractedReceipt {
  store_name: string;
  org_number: string;
  receipt_number: string;
  receipt_date: string;
  payment_method: string;
  items: Array<{ description: string; amount: number; vat_rate: number }>;
  vat_breakdown: Array<{ vat_rate: number; net_amount: number; vat_amount: number; total: number }>;
  total_ex_vat: number;
  total_vat: number;
  total_inc_vat: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptUploadDialog({ open, onOpenChange }: Props) {
  // Auto-trigger camera when dialog opens
  const autoTriggered = useRef(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedReceipt | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && !autoTriggered.current && !extracted && !isExtracting) {
      autoTriggered.current = true;
      // Small delay to let dialog render
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 300);
    }
    if (!open) {
      autoTriggered.current = false;
    }
  }, [open, extracted, isExtracting]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setImageBase64(base64);

      // Auto-extract immediately
      setIsExtracting(true);
      try {
        const { data, error } = await supabase.functions.invoke("extract-receipt", {
          body: { imageBase64: base64, fileName: file.name },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setExtracted(data.extracted);
        toast.success("Kvitto extraherat!");
      } catch (err: any) {
        console.error("Extraction error:", err);
        toast.error(err.message || "Kunde inte läsa kvittot");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!extracted) return;

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Upload image to storage
      let storagePath: string | null = null;
      if (imageBase64) {
        const bytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
        const path = `${userData.user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("invoice-files")
          .upload(path, bytes, { contentType: "image/jpeg" });
        if (!uploadError) storagePath = path;
      }

      const { error } = await supabase.from("receipts" as any).insert({
        user_id: userData.user.id,
        store_name: extracted.store_name || null,
        org_number: extracted.org_number || null,
        receipt_number: extracted.receipt_number || null,
        receipt_date: extracted.receipt_date || null,
        payment_method: extracted.payment_method || null,
        project_id: projectId !== "none" ? projectId : null,
        items: extracted.items || [],
        vat_breakdown: extracted.vat_breakdown || [],
        total_ex_vat: extracted.total_ex_vat || 0,
        total_vat: extracted.total_vat || 0,
        total_inc_vat: extracted.total_inc_vat || 0,
        image_storage_path: storagePath,
        original_file_name: fileName || null,
        ai_extracted: true,
        status: "new",
      } as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Kvitto sparat!");
      handleClose();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Kunde inte spara kvittot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setExtracted(null);
    setImageBase64(null);
    setFileName("");
    setProjectId("none");
    setIsExtracting(false);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 2 }).format(amount);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Nytt kvitto
          </DialogTitle>
          <DialogDescription>
            Ta en bild eller välj en bild från galleriet
          </DialogDescription>
        </DialogHeader>

        {!extracted && !isExtracting && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 flex flex-col gap-3"
              variant="outline"
            >
              <Camera className="h-8 w-8" />
              <span className="text-base">Ta bild på kvitto</span>
              <span className="text-xs text-muted-foreground">Kameran öppnas direkt på mobilen</span>
            </Button>
          </div>
        )}

        {isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Läser kvittot...</p>
              <p className="text-sm text-muted-foreground">AI analyserar bilden</p>
            </div>
          </div>
        )}

        {extracted && (
          <div className="space-y-4">
            {/* Store info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{extracted.store_name}</h3>
                {extracted.org_number && (
                  <p className="text-xs text-muted-foreground">Org.nr: {extracted.org_number}</p>
                )}
              </div>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI-extraherat
              </Badge>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {extracted.receipt_date && (
                <div>
                  <span className="text-muted-foreground">Datum:</span>{" "}
                  <span className="font-medium">{extracted.receipt_date}</span>
                </div>
              )}
              {extracted.payment_method && (
                <div>
                  <span className="text-muted-foreground">Betalning:</span>{" "}
                  <span className="font-medium">{extracted.payment_method}</span>
                </div>
              )}
              {extracted.receipt_number && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Kvittonr:</span>{" "}
                  <span className="font-medium text-xs">{extracted.receipt_number}</span>
                </div>
              )}
            </div>

            {/* Items */}
            {extracted.items?.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground flex justify-between">
                  <span>Artikel</span>
                  <span>Belopp</span>
                </div>
                <div className="divide-y">
                  {extracted.items.map((item, i) => (
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
            {extracted.vat_breakdown?.length > 0 && (
              <div className="border rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Momsuppdelning</p>
                {extracted.vat_breakdown.map((v, i) => (
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
                <span className="tabular-nums">{formatCurrency(extracted.total_ex_vat)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Moms</span>
                <span className="tabular-nums">{formatCurrency(extracted.total_vat)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Totalt</span>
                <span className="tabular-nums">{formatCurrency(extracted.total_inc_vat)}</span>
              </div>
            </div>

            {/* Project selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Koppla till projekt</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj projekt" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectId === "none" && (
                <p className="text-xs text-muted-foreground">Välj ett projekt för att spara kvittot</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isSaving || projectId === "none"} className="flex-1">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Spara kvitto
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
