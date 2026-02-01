import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Receipt, Truck, BookOpen } from "lucide-react";
import { CustomerInvoiceList } from "@/components/invoices/CustomerInvoiceList";
import { VendorInvoiceList } from "@/components/invoices/VendorInvoiceList";
import { Badge } from "@/components/ui/badge";
import fortnoxLogo from "@/assets/fortnox-logo.png";
import vismaLogo from "@/assets/visma-logo.png";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("customer");

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fakturor</h1>
            <p className="text-muted-foreground">Hantera kund- och leverantörsfakturor</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Kundfakturor
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Leverantörsfakturor
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Bokföring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-4">
          <CustomerInvoiceList />
        </TabsContent>

        <TabsContent value="vendor" className="space-y-4">
          <VendorInvoiceList />
        </TabsContent>

        <TabsContent value="accounting" className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Bokföring & Integrationer</h2>
            <p className="text-muted-foreground">Koppla ihop med ditt bokföringsprogram</p>
          </div>

          {/* Integration cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Fortnox */}
            <div className="group relative bg-card rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:border-[#3B8230]/50 hover:shadow-lg hover:shadow-[#3B8230]/5">
              <Badge variant="outline" className="absolute top-4 right-4 border-primary/30 text-primary">
                Kommande snart
              </Badge>
              <div className="h-16 mb-6 flex items-center">
                <img 
                  src={fortnoxLogo} 
                  alt="Fortnox" 
                  className="h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fortnox</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Synka fakturor, kunder och projekt automatiskt. Exportera godkända offerter direkt till Fortnox.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B8230]" />
                  Automatisk fakturaexport
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B8230]" />
                  Synkade kundregister
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3B8230]" />
                  Projektredovisning
                </li>
              </ul>
            </div>

            {/* Visma */}
            <div className="group relative bg-card rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:border-[#E31937]/50 hover:shadow-lg hover:shadow-[#E31937]/5">
              <Badge variant="outline" className="absolute top-4 right-4 border-primary/30 text-primary">
                Kommande snart
              </Badge>
              <div className="h-16 mb-6 flex items-center">
                <img 
                  src={vismaLogo} 
                  alt="Visma" 
                  className="h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Visma</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Koppla ihop med Visma eEkonomi eller Visma.net för sömlös bokföring och rapportering.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E31937]" />
                  Realtidssynkronisering
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E31937]" />
                  Automatisk bokföring
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E31937]" />
                  Ekonomiska rapporter
                </li>
              </ul>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-muted-foreground">
            Har du önskemål om andra integrationer? Kontakta oss!
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
