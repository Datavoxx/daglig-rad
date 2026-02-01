import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Receipt, Truck } from "lucide-react";
import { CustomerInvoiceList } from "@/components/invoices/CustomerInvoiceList";
import { VendorInvoiceList } from "@/components/invoices/VendorInvoiceList";

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
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Kundfakturor
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Leverantörsfakturor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-4">
          <CustomerInvoiceList />
        </TabsContent>

        <TabsContent value="vendor" className="space-y-4">
          <VendorInvoiceList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
