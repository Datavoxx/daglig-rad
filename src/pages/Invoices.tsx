import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Receipt, Truck, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CustomerInvoiceList } from "@/components/invoices/CustomerInvoiceList";
import { VendorInvoiceList } from "@/components/invoices/VendorInvoiceList";
import { ReceiptList } from "@/components/invoices/ReceiptList";

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "customer");
  const [autoOpenReceipt, setAutoOpenReceipt] = useState(() => searchParams.get("auto") === "true");

  // Clear URL params after reading them
  useEffect(() => {
    if (searchParams.has("tab") || searchParams.has("auto")) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  return (
    <div className="page-transition space-y-4 md:space-y-6">
      {/* Hero Section — compact on mobile */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border p-4 md:p-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-primary/10">
            <FileText className="h-5 w-5 md:h-7 md:w-7 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Fakturor</h1>
            <p className="text-xs md:text-base text-muted-foreground">Hantera kund- och leverantörsfakturor</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full max-w-2xl overflow-x-auto scrollbar-hide">
          <TabsTrigger value="customer" className="flex items-center gap-1.5 whitespace-nowrap flex-1 min-w-0 text-xs md:text-sm">
            <Receipt className="h-4 w-4 shrink-0" />
            <span>{isMobile ? "Kund" : "Kundfakturor"}</span>
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-1.5 whitespace-nowrap flex-1 min-w-0 text-xs md:text-sm">
            <Truck className="h-4 w-4 shrink-0" />
            <span>{isMobile ? "Lev." : "Leverantörsfakturor"}</span>
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-1.5 whitespace-nowrap flex-1 min-w-0 text-xs md:text-sm">
            <Camera className="h-4 w-4 shrink-0" />
            <span>Kvitto</span>
          </TabsTrigger>
        </TabsList>


        <TabsContent value="customer" className="space-y-4">
          <CustomerInvoiceList />
        </TabsContent>

        <TabsContent value="vendor" className="space-y-4">
          <VendorInvoiceList />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <ReceiptList autoOpen={autoOpenReceipt} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
