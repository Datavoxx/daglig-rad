import { useRef, useState } from "react";
import { ChevronDown, Settings2, ImageIcon, Upload, Star, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdvancedSettingsSectionProps {
  ourReference: string;
  ourReferencePhone: string;
  paymentTermsDays: number;
  validDays: number;
  vatPercent: number;
  hideUnitPrice: boolean;
  logoUrl?: string | null;
  companyLogoUrl?: string | null;
  referenceOptions?: { name: string; phone?: string | null }[];
  onChange: (patch: {
    ourReference?: string;
    ourReferencePhone?: string;
    paymentTermsDays?: number;
    validDays?: number;
    vatPercent?: number;
    hideUnitPrice?: boolean;
    logoUrl?: string | null;
  }) => void;
}

export function AdvancedSettingsSection({
  ourReference,
  ourReferencePhone,
  paymentTermsDays,
  validDays,
  vatPercent,
  hideUnitPrice,
  logoUrl = null,
  companyLogoUrl = null,
  referenceOptions = [],
  onChange,
}: AdvancedSettingsSectionProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLogo = logoUrl || companyLogoUrl;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Inte inloggad");

      const ext = file.name.split(".").pop() || "png";
      const filePath = `${userData.user.id}/estimate-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
      onChange({ logoUrl: urlData.publicUrl });
      toast.success("Logotyp uppdaterad för denna offert");
    } catch (e: any) {
      toast.error("Kunde inte ladda upp logotyp", { description: e.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAsDefault = async () => {
    if (!logoUrl) return;
    setSavingDefault(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Inte inloggad");

      const { error } = await supabase
        .from("company_settings")
        .upsert(
          { user_id: userData.user.id, logo_url: logoUrl, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      toast.success("Logotypen är nu företagets standardlogga");
    } catch (e: any) {
      toast.error("Kunde inte spara logotypen", { description: e.message });
    } finally {
      setSavingDefault(false);
    }
  };

  const toNumber = (value: string, fallback: number) => {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return (
    <Card className="border bg-card">
      <CardHeader
        className="pb-2 pt-3 px-3 cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Avancerade inställningar</CardTitle>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300 ease-out",
              open && "rotate-180"
            )}
          />
        </div>
      </CardHeader>

      {open && (
        <CardContent className="px-3 pb-4 pt-0 space-y-4">
          {/* Logo */}
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Logotyp på offerten</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-16 w-28 shrink-0 rounded-md border border-border bg-background flex items-center justify-center overflow-hidden">
                {activeLogo ? (
                  <img src={activeLogo} alt="Offertens logotyp" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Ingen logga</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Byt bild
                </Button>

                {logoUrl && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={savingDefault}
                      onClick={handleSaveAsDefault}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      Spara som permanent
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onChange({ logoUrl: null })}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Återställ
                    </Button>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Bilden används bara i denna offert tills du sparar den som permanent.
            </p>
          </div>

          {/* Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="our-reference" className="text-xs">
                Vår referens
              </Label>
              <Input
                id="our-reference"
                value={ourReference}
                onChange={(e) => onChange({ ourReference: e.target.value })}
                placeholder="Namn på offertens avsändare"
                className="h-9"
              />
              {referenceOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {referenceOptions.map((option) => (
                    <Button
                      key={option.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        onChange({
                          ourReference: option.name,
                          ourReferencePhone: option.phone || "",
                        })
                      }
                    >
                      {option.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="our-reference-phone" className="text-xs">
                Referensens telefon
              </Label>
              <Input
                id="our-reference-phone"
                value={ourReferencePhone}
                onChange={(e) => onChange({ ourReferencePhone: e.target.value })}
                placeholder="070-123 45 67"
                className="h-9"
              />
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payment-days" className="text-xs">
                Betalningsvillkor (dagar netto)
              </Label>
              <Input
                id="payment-days"
                inputMode="numeric"
                value={String(paymentTermsDays)}
                onChange={(e) => onChange({ paymentTermsDays: toNumber(e.target.value, 10) })}
                className="h-9 tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valid-days" className="text-xs">
                Giltighetstid (dagar)
              </Label>
              <Input
                id="valid-days"
                inputMode="numeric"
                value={String(validDays)}
                onChange={(e) => onChange({ validDays: toNumber(e.target.value, 30) })}
                className="h-9 tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vat-percent" className="text-xs">
                Momssats (%)
              </Label>
              <Input
                id="vat-percent"
                inputMode="decimal"
                value={String(vatPercent)}
                onChange={(e) => onChange({ vatPercent: toNumber(e.target.value, 25) })}
                className="h-9 tabular-nums"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Dölj à-pris i PDF</p>
                <p className="text-xs text-muted-foreground">
                  Visar bara antal, enhet och summa per rad.
                </p>
              </div>
              <Switch
                checked={hideUnitPrice}
                onCheckedChange={(checked) => onChange({ hideUnitPrice: checked })}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
