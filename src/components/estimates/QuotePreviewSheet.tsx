import { format, addDays } from "date-fns";
import { FileText, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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
  contact_person?: string;
  contact_phone?: string;
  momsregnr?: string;
  f_skatt?: boolean;
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
  rot_eligible?: boolean;
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
  onRefresh?: () => void;
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
  onRefresh,
}: QuotePreviewSheetProps) {
  const isMobile = useIsMobile();
  const today = new Date();
  const validUntil = addDays(today, validDays);

  // Calculate totals
  const laborCost = items
    .filter((i) => i.type === "labor")
    .reduce((sum, i) => sum + i.subtotal, 0);
    
  // ROT-eligible labor cost (only items marked as rot_eligible)
  const rotEligibleLaborCost = items
    .filter((i) => i.type === "labor" && i.rot_eligible)
    .reduce((sum, i) => sum + i.subtotal, 0);
    
  const materialCost = items
    .filter((i) => i.type === "material")
    .reduce((sum, i) => sum + i.subtotal, 0);
  const subcontractorCost = items
    .filter((i) => i.type === "subcontractor")
    .reduce((sum, i) => sum + i.subtotal, 0);

  const subtotal = laborCost + materialCost + subcontractorCost;
  
  // Per-item markup
  const markupFromItems = items.reduce((sum, i) => {
    if ((i as any).markup_enabled && (i as any).markup_percent > 0) {
      return sum + (i.subtotal || 0) * ((i as any).markup_percent / 100);
    }
    return sum;
  }, 0);
  const markup = markupFromItems > 0 ? markupFromItems : subtotal * (markupPercent / 100);
  const totalExclVat = subtotal + markup;
  const vat = totalExclVat * 0.25;
  const totalInclVat = totalExclVat + vat;
  
  // ROT calculation on rot_eligible labor cost including VAT
  const rotEligibleWithVat = rotEligibleLaborCost * 1.25;
  const rotAmount = rotEnabled ? rotEligibleWithVat * (rotPercent / 100) : 0;
  const amountToPay = totalInclVat - rotAmount;

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("sv-SE").format(Math.round(num));

  // Parse address into lines
  const parseAddress = (address?: string) => {
    if (!address) return [];
    return address.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const customerAddressLines = parseAddress(project?.address);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={cn(
          "p-0",
          isMobile ? "w-full max-w-none" : "w-full sm:max-w-2xl"
        )}
      >
        <SheetHeader className="p-4 md:p-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base md:text-lg">Förhandsgranska</SheetTitle>
                <SheetDescription className="text-xs md:text-sm truncate">
                  Så här ser offerten ut
                </SheetDescription>
              </div>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="shrink-0">
                <RefreshCw className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Uppdatera</span>}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
          {/* Scaled container for mobile - zooms out to show entire quote */}
          <div className={cn(
            "origin-top-left",
            isMobile && "transform scale-[0.55] w-[182%]"
          )}>
          {/* ============ PAGE 1 - Main Quote ============ */}
          <div className={cn(
            "bg-white text-black min-h-[297mm] relative",
            isMobile ? "p-6" : "p-8"
          )}>
            {/* Header with logo and offer title */}
            <div className="flex justify-between items-start mb-6">
              <div>
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Företagslogotyp"
                    className="h-16 w-auto mb-4 object-contain"
                  />
                )}
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-black mb-2">Offert</h1>
                <p className="text-sm text-gray-600">Nr: {offerNumber}</p>
              </div>
            </div>

            {/* Reference and customer info */}
            <div className={cn(
              "gap-4 md:gap-8 mb-6 md:mb-8 border-t border-b border-gray-300 py-3 md:py-4",
              isMobile ? "grid grid-cols-1 space-y-3" : "grid grid-cols-2"
            )}>
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Vår referens</p>
                <p className="font-medium text-black text-sm md:text-base">
                  {company?.contact_person || "–"}
                  {company?.contact_phone && ` ${company.contact_phone}`}
                </p>
                <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                  Datum: {format(today, "yyyy-MM-dd")}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Kund</p>
                <p className="font-medium text-black text-sm md:text-base">{project?.client_name || "–"}</p>
                {customerAddressLines.map((line, idx) => (
                  <p key={idx} className="text-xs md:text-sm text-gray-600">{line}</p>
                ))}
              </div>
            </div>

            {/* Project name */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-2">
                Projekt: {project?.name || "–"}
              </h2>
            </div>

            {/* Project description */}
            <div className="mb-6">
              <h3 className="font-bold text-black mb-2">Projektbeskrivning</h3>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {scope || "Ej angiven"}
              </p>
            </div>

            {/* Work items / Arbete */}
            {assumptions && assumptions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-2">Tidsplan:</h3>
                <ul className="space-y-1">
                  {assumptions.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price table */}
            <div className={cn(
              "mb-6",
              isMobile && "overflow-x-auto -mx-4 px-4"
            )}>
              <table className={cn(
                "w-full border-collapse",
                isMobile ? "text-[11px] min-w-[400px]" : "text-sm"
              )}>
                <thead>
                  <tr className="border-b-2 border-gray-400">
                    <th className="text-left py-2 font-bold text-black">Beskrivning</th>
                    <th className={cn("text-right py-2 font-bold text-black", isMobile ? "w-12" : "w-20")}>Antal</th>
                    <th className={cn("text-right py-2 font-bold text-black", isMobile ? "w-10" : "w-16")}>Enhet</th>
                    <th className={cn("text-right py-2 font-bold text-black", isMobile ? "w-16" : "w-24")}>À-pris</th>
                    <th className={cn("text-right py-2 font-bold text-black", isMobile ? "w-16" : "w-24")}>Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-2 text-gray-800">{item.moment}</td>
                      <td className="py-2 text-right text-gray-600">
                        {item.type === "labor" ? (item.hours ?? item.quantity) : item.quantity}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {item.type === "labor" ? "tim" : item.unit}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-2 text-right font-medium text-black">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Subtotals */}
                  <tr className="border-t-2 border-gray-400">
                    <td colSpan={4} className="py-2 text-right font-medium text-black">
                      Summa exkl. moms
                    </td>
                    <td className="py-2 text-right font-medium text-black">
                      {formatCurrency(totalExclVat)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-2 text-right text-gray-600">
                      Moms 25%
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {formatCurrency(vat)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-300">
                    <td colSpan={4} className="py-2 text-right font-bold text-black">
                      Totalt inkl. moms
                    </td>
                    <td className="py-2 text-right font-bold text-black">
                      {formatCurrency(totalInclVat)}
                    </td>
                  </tr>
                  
                  {rotEnabled && (
                    <>
                      <tr>
                        <td colSpan={4} className="py-2 text-right text-gray-600 italic">
                          * {rotPercent}% ROT-avdrag inkl moms
                        </td>
                        <td className="py-2 text-right text-gray-600 italic">
                          -{formatCurrency(rotAmount)}
                        </td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td colSpan={4} className={cn(
                          "py-3 text-right font-bold text-black",
                          isMobile ? "text-sm" : "text-lg"
                        )}>
                          Att betala
                        </td>
                        <td className={cn(
                          "py-3 text-right font-bold text-black",
                          isMobile ? "text-sm" : "text-lg"
                        )}>
                          {formatCurrency(amountToPay)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={cn(
              "border-t border-gray-300 pt-3 md:pt-4 mt-8",
              isMobile ? "relative" : "absolute bottom-8 left-8 right-8"
            )}>
              <div className={cn(
                "gap-3 md:gap-4 text-[10px] md:text-xs text-gray-600",
                isMobile ? "grid grid-cols-2" : "grid grid-cols-4"
              )}>
                <div>
                  <p className="font-medium text-black">Postadress</p>
                  <p>{company?.company_name || "–"}</p>
                  <p>{company?.address || "–"}</p>
                  <p>{company?.postal_code} {company?.city}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Telefon</p>
                  <p>{company?.phone || "–"}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Bankgiro</p>
                  <p>{company?.bankgiro || "–"}</p>
                  {company?.momsregnr && (
                    <>
                      <p className="font-medium text-black mt-2">Momsreg.nr</p>
                      <p>{company.momsregnr}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="font-medium text-black">F-skatt</p>
                  <p>{company?.f_skatt !== false ? "Ja" : "Nej"}</p>
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-gray-400 text-right mt-2">Sida 1 (3)</p>
            </div>
          </div>

          {/* ============ PAGE 2 - Acceptance ============ */}
          <div className="bg-white text-black p-8 min-h-[297mm] relative border-t-4 border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Företagslogotyp"
                    className="h-12 w-auto object-contain"
                  />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Offert Nr: {offerNumber}</p>
              </div>
            </div>

            <div className="mb-12">
              <p className="text-lg text-gray-800 mb-8">Med vänliga hälsningar</p>
              <p className="font-bold text-black text-lg">{company?.contact_person || "–"}</p>
              {company?.contact_phone && (
                <p className="text-gray-600">Mobil: {company.contact_phone}</p>
              )}
              {company?.email && (
                <p className="text-gray-600">E-post: {company.email}</p>
              )}
            </div>

            <div className="border-t border-gray-300 pt-8">
              <h3 className="font-bold text-black text-lg mb-8">Acceptera ovanstående</h3>
              
              <div className="space-y-6">
                <div className="flex items-end gap-2">
                  <span className="text-gray-800">Ort:</span>
                  <div className="flex-1 border-b border-dotted border-gray-400 h-6"></div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-gray-800">Datum:</span>
                  <div className="flex-1 border-b border-dotted border-gray-400 h-6"></div>
                </div>
                <div className="mt-12">
                  <div className="border-b border-dotted border-gray-400 h-12 mb-2"></div>
                  <p className="text-xs text-gray-500 italic">Namnteckning</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-12">
                Undertecknat dokument mailas till {company?.email || "info@foretag.se"}
              </p>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-8 right-8 border-t border-gray-300 pt-4">
              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                <div>
                  <p className="font-medium text-black">Postadress</p>
                  <p>{company?.company_name || "–"}</p>
                  <p>{company?.address || "–"}</p>
                  <p>{company?.postal_code} {company?.city}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Telefon</p>
                  <p>{company?.phone || "–"}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Bankgiro</p>
                  <p>{company?.bankgiro || "–"}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Godkänd för F-skatt</p>
                  <p>{company?.f_skatt !== false ? "Ja" : "Nej"}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-right mt-2">Sida 2 (3)</p>
            </div>
          </div>

          {/* ============ PAGE 3 - Terms ============ */}
          <div className="bg-white text-black p-8 min-h-[297mm] relative border-t-4 border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Företagslogotyp"
                    className="h-12 w-auto object-contain"
                  />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Offert Nr: {offerNumber}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-black mb-8">Förutsättningar & villkor</h2>

            <div className="space-y-6 text-sm text-gray-800">
              <div>
                <h4 className="font-bold text-black mb-2">Offertens giltighetstid</h4>
                <p>
                  Offertens giltighetstid gäller {validDays} dagar från ovanstående datum.
                  Giltig t.o.m. {format(validUntil, "yyyy-MM-dd")}.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-black mb-2">Betalningsvillkor</h4>
                <p>10 dagar netto.</p>
              </div>

              {rotEnabled && (
                <div>
                  <h4 className="font-bold text-black mb-2">ROT</h4>
                  <p>
                    För fullständig information om hur ROT-avdraget fungerar hänvisar vi till 
                    Skatteverkets hemsida www.skatteverket.se. Kunden ansvarar för att kraven 
                    för ROT-avdrag uppfylls.
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-black mb-2">Personuppgifter</h4>
                <p>
                  Vid godkännande av denna offert accepterar du att vi behandlar dina personuppgifter för att kunna fullfölja vårt åtagande gentemot dig som kund. Den information vi behandlar för er är information som berörs och är nödvändig för byggprojektens administration. Personuppgifterna lagras och hanteras i projektverktyget Bygglet som har tekniska och organisatoriska säkerhetsåtgärder för att skydda hanteringen av Personuppgifter och lever upp till de krav som ställs enligt EU:s dataskyddsförordning (GDPR). Vi kommer om ni begär det att radera eller anonymisera och oavsett anledning därtill, inklusive att radera samtliga kopior som inte enligt GDPR måste sparas. Vi kommer inte att överföra Personuppgifter till land utanför EU/ESS
                </p>
              </div>

              <div>
                <h4 className="font-bold text-black mb-2">Övrigt</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Arbetet utförs enligt gällande branschregler</li>
                  <li>Eventuella tillkommande arbeten faktureras enligt överenskommelse</li>
                  <li>Garanti enligt konsumenttjänstlagen</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-8 right-8 border-t border-gray-300 pt-4">
              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                <div>
                  <p className="font-medium text-black">Postadress</p>
                  <p>{company?.company_name || "–"}</p>
                  <p>{company?.address || "–"}</p>
                  <p>{company?.postal_code} {company?.city}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Telefon</p>
                  <p>{company?.phone || "–"}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Bankgiro</p>
                  <p>{company?.bankgiro || "–"}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Godkänd för F-skatt</p>
                  <p>{company?.f_skatt !== false ? "Ja" : "Nej"}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-right mt-2">Sida 3 (3)</p>
            </div>
          </div>
          </div>{/* End of scaled container */}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
