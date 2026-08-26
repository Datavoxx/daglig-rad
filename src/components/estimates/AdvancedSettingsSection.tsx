import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";

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
  roundTotal: boolean;
  referenceOptions?: { name: string; phone?: string | null }[];
  onChange: (patch: {
    ourReference?: string;
    ourReferencePhone?: string;
    paymentTermsDays?: number;
    validDays?: number;
    vatPercent?: number;
    hideUnitPrice?: boolean;
    roundTotal?: boolean;
  }) => void;
}

export function AdvancedSettingsSection({
  ourReference,
  ourReferencePhone,
  paymentTermsDays,
  validDays,
  vatPercent,
  hideUnitPrice,
  roundTotal,
  referenceOptions = [],
  onChange,
}: AdvancedSettingsSectionProps) {
  const [open, setOpen] = useState(false);

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

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Avrunda att betala</p>
                <p className="text-xs text-muted-foreground">
                  Avrundar slutsumman till närmaste hundralapp.
                </p>
              </div>
              <Switch
                checked={roundTotal}
                onCheckedChange={(checked) => onChange({ roundTotal: checked })}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
