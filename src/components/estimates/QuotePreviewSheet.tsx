import { format, addDays } from "date-fns";
import { X, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CompanyInfo {
  company_name?: string;
  org_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankgiro?: string;
  logo_url?: string;
}

interface EstimateItem {
  id: string;
  moment: string;
  type: "labor" | "material" | "subcontractor";
  quantity: number;
  unit: string;
  hours: number;
  unit_price: number;
  subtotal: number;
}

interface QuotePreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { name: string; client_name?: string; address?: string } | null;
  company: CompanyInfo | null;
  scope: string;
  assumptions: string[];
  items: EstimateItem[];
  markupPercent: number;
  rotEnabled: boolean;
  rotPercent: number;
  offerNumber?: string;
  validDays?: number;
}

export function QuotePreviewSheet({
  open,
  onOpenChange,
  project,
  company,
  scope,
  assumptions,
  items,
  markupPercent,
  rotEnabled,
  rotPercent,
  offerNumber = "OFF-001",
  validDays = 30,
}: QuotePreviewSheetProps) {
  const today = new Date();
  const validUntil = addDays(today, validDays);

  // Calculate totals
  const laborCost = items
    .filter((i) => i.type === "labor")
    .reduce((sum, i) => sum + i.subtotal, 0);
  const materialCost = items
    .filter((i) => i.type === "material")
    .reduce((sum, i) => sum + i.subtotal, 0);
  const subcontractorCost = items
    .filter((i) => i.type === "subcontractor")
    .reduce((sum, i) => sum + i.subtotal, 0);

  const subtotal = laborCost + materialCost + subcontractorCost;
  const markup = subtotal * (markupPercent / 100);
  const totalExclVat = subtotal + markup;
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;
  const rotAmount = rotEnabled ? laborCost * (rotPercent / 100) : 0;
  const amountToPay = totalInclVat - rotAmount;

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  const laborItems = items.filter((i) => i.type === "labor");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Förhandsgranska offert</SheetTitle>
              <SheetDescription>
                Så här ser offerten ut för kunden
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Header with logo and title */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Företagslogotyp"
                    className="h-12 w-auto mb-2 object-contain"
                  />
                )}
                <p className="font-semibold text-foreground">
                  {company?.company_name || "Ditt Företag AB"}
                </p>
                {company?.org_number && (
                  <p className="text-xs text-muted-foreground">
                    Org.nr: {company.org_number}
                  </p>
                )}
                {company?.address && (
                  <p className="text-xs text-muted-foreground">
                    {company.address}
                  </p>
                )}
                {company?.postal_code && company?.city && (
                  <p className="text-xs text-muted-foreground">
                    {company.postal_code} {company.city}
                  </p>
                )}
                {company?.phone && (
                  <p className="text-xs text-muted-foreground">
                    Tel: {company.phone}
                  </p>
                )}
                {company?.email && (
                  <p className="text-xs text-muted-foreground">
                    {company.email}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-primary">OFFERT</h2>
                <p className="text-sm text-foreground">Nr: {offerNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Datum: {format(today, "yyyy-MM-dd")}
                </p>
              </div>
            </div>

            <Separator className="bg-primary/30" />

            {/* Customer and project info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Kund
                </p>
                <p className="font-medium text-foreground">
                  {project?.client_name || "–"}
                </p>
                {project?.address && (
                  <p className="text-sm text-muted-foreground">
                    {project.address}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Projekt
                </p>
                <p className="font-medium text-foreground">
                  {project?.name || "–"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Giltig t.o.m. {format(validUntil, "yyyy-MM-dd")}
                </p>
              </div>
            </div>

            {/* Project description */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">
                PROJEKTBESKRIVNING
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {scope || "Ej angiven"}
              </p>
            </div>

            {/* Conditions */}
            {assumptions && assumptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-2">
                  FÖRUTSÄTTNINGAR
                </p>
                <ul className="space-y-1">
                  {assumptions.map((condition, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-foreground flex items-start gap-2"
                    >
                      <span className="text-muted-foreground">•</span>
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Work items table */}
            {laborItems.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-2">
                  ARBETE
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                          Arbetsmoment
                        </th>
                        <th className="text-right p-2 text-xs font-semibold text-muted-foreground">
                          Timmar
                        </th>
                        <th className="text-right p-2 text-xs font-semibold text-muted-foreground">
                          À-pris
                        </th>
                        <th className="text-right p-2 text-xs font-semibold text-muted-foreground">
                          Summa
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {laborItems.map((item) => (
                        <tr key={item.id} className="border-t border-muted/30">
                          <td className="p-2 text-foreground">{item.moment}</td>
                          <td className="p-2 text-right text-muted-foreground">
                            {item.hours || "–"}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {formatCurrency(item.unit_price)} kr
                          </td>
                          <td className="p-2 text-right font-medium text-foreground">
                            {formatCurrency(item.subtotal)} kr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Price summary */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">
                PRISSAMMANSTÄLLNING
              </p>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Arbetskostnad</span>
                  <span className="text-foreground">
                    {formatCurrency(laborCost)} kr
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Materialkostnad</span>
                  <span className="text-foreground">
                    {formatCurrency(materialCost)} kr
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Underentreprenörer
                  </span>
                  <span className="text-foreground">
                    {formatCurrency(subcontractorCost)} kr
                  </span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between text-sm font-medium">
                  <span className="text-foreground">Summa exkl. moms</span>
                  <span className="text-foreground">
                    {formatCurrency(totalExclVat)} kr
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Moms 25%</span>
                  <span className="text-foreground">
                    {formatCurrency(vat)} kr
                  </span>
                </div>

                <div className="flex justify-between text-sm font-semibold bg-primary text-primary-foreground rounded-md p-2 -mx-2">
                  <span>Totalt inkl. moms</span>
                  <span>{formatCurrency(totalInclVat)} kr</span>
                </div>

                {rotEnabled && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        ROT-avdrag ({rotPercent}% på arbetskostnad)
                      </span>
                      <span>-{formatCurrency(rotAmount)} kr</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold bg-foreground text-background rounded-md p-2 -mx-2">
                      <span>ATT BETALA</span>
                      <span>{formatCurrency(amountToPay)} kr</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Terms */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">VILLKOR</p>
              <ul className="space-y-1">
                <li className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  Offerten är giltig i {validDays} dagar från offertdatum.
                </li>
                <li className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  Betalningsvillkor: 30 dagar netto
                </li>
                {company?.bankgiro && (
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    Bankgiro: {company.bankgiro}
                  </li>
                )}
                {rotEnabled && (
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    ROT-avdrag: Kunden ansvarar för att uppfylla kraven för
                    ROT-avdrag.
                  </li>
                )}
              </ul>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                {[
                  company?.company_name,
                  company?.phone ? `Tel: ${company.phone}` : null,
                  company?.email,
                ]
                  .filter(Boolean)
                  .join("  •  ")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
