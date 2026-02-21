import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Receipt, Truck, BookOpen, Phone, Bell, Camera } from "lucide-react";
import { CustomerInvoiceList } from "@/components/invoices/CustomerInvoiceList";
import { VendorInvoiceList } from "@/components/invoices/VendorInvoiceList";
import { ReceiptList } from "@/components/invoices/ReceiptList";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import fortnoxLogo from "@/assets/fortnox-logo.png";
import vismaLogo from "@/assets/visma-logo.png";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("customer");
  const [selectedProgram, setSelectedProgram] = useState<string>("fortnox");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmitInterest = async () => {
    if (!phone.trim()) {
      toast.error("Vänligen ange ditt telefonnummer");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Du måste vara inloggad för att skicka en intresseanmälan");
        return;
      }

      // Get profile for full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send to edge function
      const { error } = await supabase.functions.invoke("request-accounting-integration", {
        body: {
          email: user.email,
          full_name: profile?.full_name || user.email,
          phone: phone.trim(),
          program: selectedProgram,
        }
      });

      if (error) {
        console.error("Error sending interest request:", error);
        toast.error("Något gick fel. Försök igen senare.");
        return;
      }

      toast.success("Din intresseanmälan har skickats! Vi kontaktar dig snart.");
      setHasSubmitted(true);
      setPhone("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Något gick fel. Försök igen senare.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Kundfakturor
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Leverantörsfakturor
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Kvitto
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

        <TabsContent value="receipts" className="space-y-4">
          <ReceiptList />
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

          {/* Interest Form */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Intresseanmälan</h3>
                <p className="text-sm text-muted-foreground">Bli först att få tillgång till integrationen</p>
              </div>
            </div>

            {hasSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-4">
                  <Bell className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="font-medium text-foreground">Tack för din intresseanmälan!</p>
                <p className="text-sm text-muted-foreground">Vi kontaktar dig så snart integrationen är redo.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Vilket program använder du?</Label>
                  <RadioGroup 
                    value={selectedProgram} 
                    onValueChange={setSelectedProgram}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fortnox" id="fortnox" />
                      <Label htmlFor="fortnox" className="font-normal cursor-pointer">Fortnox</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="visma" id="visma" />
                      <Label htmlFor="visma" className="font-normal cursor-pointer">Visma</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="annat" id="annat" />
                      <Label htmlFor="annat" className="font-normal cursor-pointer">Annat program</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Telefonnummer</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+46 70 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Vi ringer upp dig när integrationen är klar</p>
                </div>

                <Button 
                  onClick={handleSubmitInterest} 
                  disabled={!phone.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Skickar..." : "Skicka intresseanmälan"}
                </Button>
              </div>
            )}
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
