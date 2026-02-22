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
    <div className="page-transition space-y-6">
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
        <TabsList className="flex w-full max-w-2xl overflow-x-auto scrollbar-hide">
          <TabsTrigger value="customer" className="flex items-center gap-2 whitespace-nowrap flex-1 min-w-0">
            <Receipt className="h-4 w-4 shrink-0" />
            {!isMobile && "Kundfakturor"}
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2 whitespace-nowrap flex-1 min-w-0">
            <Truck className="h-4 w-4 shrink-0" />
            {!isMobile && "Leverantörsfakturor"}
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2 whitespace-nowrap flex-1 min-w-0">
            <Camera className="h-4 w-4 shrink-0" />
            {!isMobile && "Kvitto"}
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
