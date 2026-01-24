import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Phone, Upload, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import byggioLogo from "@/assets/byggio-logo.png";

interface CompanyOnboardingWizardProps {
  onComplete: () => void;
  userId: string;
  userFullName?: string;
  userPhone?: string;
}

interface FormData {
  company_name: string;
  org_number: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  bankgiro: string;
  logo_url: string;
}

const INITIAL_FORM_DATA: FormData = {
  company_name: "",
  org_number: "",
  address: "",
  postal_code: "",
  city: "",
  phone: "",
  email: "",
  website: "",
  bankgiro: "",
  logo_url: "",
};

export function CompanyOnboardingWizard({ 
  onComplete, 
  userId,
  userFullName = "",
  userPhone = ""
}: CompanyOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.company_name.trim()) {
      toast({
        title: "Företagsnamn krävs",
        description: "Vänligen ange ett företagsnamn",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.address.trim() || !formData.postal_code.trim() || !formData.city.trim()) {
      toast({
        title: "Adressuppgifter krävs",
        description: "Vänligen fyll i adress, postnummer och ort",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.phone.trim() || !formData.email.trim()) {
      toast({
        title: "Kontaktuppgifter krävs",
        description: "Vänligen fyll i telefon och e-post",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.logo_url) {
      toast({
        title: "Logotyp krävs",
        description: "Vänligen ladda upp en företagslogotyp",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Filen är för stor",
        description: "Maximal filstorlek är 5 MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ogiltigt filformat",
        description: "Endast bilder är tillåtna",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      updateField("logo_url", publicUrl);
      toast({ title: "Logotyp uppladdad!" });
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        title: "Uppladdning misslyckades",
        description: "Kunde inte ladda upp logotypen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("company_settings").insert({
        user_id: userId,
        company_name: formData.company_name,
        org_number: formData.org_number || null,
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || null,
        bankgiro: formData.bankgiro || null,
        logo_url: formData.logo_url,
        contact_person: userFullName,
        contact_phone: userPhone,
      });

      if (error) throw error;

      toast({ title: "Företagsinformation sparad!", description: "Välkommen till Byggio!" });
      onComplete();
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte spara företagsinformationen",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === currentStep
                ? "bg-primary text-primary-foreground"
                : step < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step < currentStep ? <Check className="h-4 w-4" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-0.5 mx-1 ${
                step < currentStep ? "bg-primary/40" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-2">
        <Building2 className="h-5 w-5" />
        <span className="font-medium">Företagsinfo</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_name">Företagsnamn *</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => updateField("company_name", e.target.value)}
          placeholder="Ditt företagsnamn"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org_number">Organisationsnummer</Label>
        <Input
          id="org_number"
          value={formData.org_number}
          onChange={(e) => updateField("org_number", e.target.value)}
          placeholder="XXXXXX-XXXX"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-2">
        <MapPin className="h-5 w-5" />
        <span className="font-medium">Adress</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adress *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="Gatuadress"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postnummer *</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => updateField("postal_code", e.target.value)}
            placeholder="123 45"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ort *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Stockholm"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-2">
        <Phone className="h-5 w-5" />
        <span className="font-medium">Kontakt & Logotyp</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="070-123 45 67"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-post *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="info@företag.se"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">Webbplats</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="www.företag.se"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankgiro">Bankgiro</Label>
          <Input
            id="bankgiro"
            value={formData.bankgiro}
            onChange={(e) => updateField("bankgiro", e.target.value)}
            placeholder="123-4567"
          />
        </div>
      </div>
      
      {/* Logo upload */}
      <div className="space-y-2">
        <Label>Företagslogotyp *</Label>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            formData.logo_url 
              ? "border-primary/40 bg-primary/5" 
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Laddar upp...</span>
            </div>
          ) : formData.logo_url ? (
            <div className="flex flex-col items-center gap-2">
              <img 
                src={formData.logo_url} 
                alt="Företagslogotyp" 
                className="h-16 object-contain"
              />
              <span className="text-sm text-muted-foreground">Klicka för att byta</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Klicka för att ladda upp logotyp
              </span>
              <span className="text-xs text-muted-foreground/60">
                Max 5 MB, PNG/JPG/SVG
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
      
      <Card className="relative z-10 w-full max-w-lg border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <img src={byggioLogo} alt="Byggio" className="h-12 mx-auto" />
          </div>
          <CardTitle className="font-display text-xl">Konfigurera ditt företag</CardTitle>
          <CardDescription>
            Steg {currentStep} av 3 - {currentStep === 1 ? "Företagsinfo" : currentStep === 2 ? "Adress" : "Kontakt & Logotyp"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1"
              >
                Nästa
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Slutför
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
