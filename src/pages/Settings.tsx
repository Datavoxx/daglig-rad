import { useState, useEffect } from "react";
import { User, Mail, Save, Loader2, Info, Building2, Phone, CreditCard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface CompanySettings {
  id?: string;
  user_id: string;
  company_name: string;
  org_number: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  bankgiro: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  
  // Company settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    org_number: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    bankgiro: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [hasCompanyChanges, setHasCompanyChanges] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      setHasProfileChanges(fullName !== (profile.full_name || ""));
    }
  }, [fullName, profile]);

  useEffect(() => {
    if (companySettings) {
      const hasChanges = 
        companyForm.company_name !== (companySettings.company_name || "") ||
        companyForm.org_number !== (companySettings.org_number || "") ||
        companyForm.address !== (companySettings.address || "") ||
        companyForm.postal_code !== (companySettings.postal_code || "") ||
        companyForm.city !== (companySettings.city || "") ||
        companyForm.phone !== (companySettings.phone || "") ||
        companyForm.email !== (companySettings.email || "") ||
        companyForm.website !== (companySettings.website || "") ||
        companyForm.bankgiro !== (companySettings.bankgiro || "");
      setHasCompanyChanges(hasChanges);
    } else {
      // If no settings exist yet, check if any field has content
      const hasContent = Object.values(companyForm).some(v => v.trim() !== "");
      setHasCompanyChanges(hasContent);
    }
  }, [companyForm, companySettings]);

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || "");
    }

    // Fetch company settings
    const { data: companyData } = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (companyData) {
      setCompanySettings(companyData);
      setCompanyForm({
        company_name: companyData.company_name || "",
        org_number: companyData.org_number || "",
        address: companyData.address || "",
        postal_code: companyData.postal_code || "",
        city: companyData.city || "",
        phone: companyData.phone || "",
        email: companyData.email || "",
        website: companyData.website || "",
        bankgiro: companyData.bankgiro || "",
      });
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Kunde inte spara",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profil uppdaterad" });
      setProfile({ ...profile, full_name: fullName });
    }
    setSaving(false);
  };

  const handleSaveCompany = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setSavingCompany(true);

    const companyData = {
      ...companyForm,
      user_id: userData.user.id,
    };

    let error;

    if (companySettings?.id) {
      // Update existing
      const result = await supabase
        .from("company_settings")
        .update(companyData)
        .eq("id", companySettings.id);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from("company_settings")
        .insert(companyData)
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        setCompanySettings(result.data);
      }
    }

    if (error) {
      toast({
        title: "Kunde inte spara företagsinställningar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Företagsinställningar sparade" });
      setCompanySettings(prev => prev ? { ...prev, ...companyForm } : { ...companyData, id: "", user_id: userData.user!.id });
    }
    setSavingCompany(false);
  };

  const updateCompanyField = (field: keyof typeof companyForm, value: string) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Inställningar</h1>
        <p className="page-subtitle">Hantera ditt konto och företagsuppgifter</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profil</CardTitle>
              <CardDescription>Din personliga information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              E-post
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="pl-10 bg-muted/50 border-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">E-postadressen kan inte ändras</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Namn
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ditt namn"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveProfile} disabled={saving || !hasProfileChanges} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Spara ändringar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Company settings card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Företagsuppgifter</CardTitle>
              <CardDescription>Visas på offerter och dokument</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Company name and org number */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Företagsnamn
              </Label>
              <Input
                id="company_name"
                value={companyForm.company_name}
                onChange={(e) => updateCompanyField("company_name", e.target.value)}
                placeholder="AB Byggföretaget"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_number" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Organisationsnummer
              </Label>
              <Input
                id="org_number"
                value={companyForm.org_number}
                onChange={(e) => updateCompanyField("org_number", e.target.value)}
                placeholder="556677-8899"
              />
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Adress
              </Label>
              <Input
                id="address"
                value={companyForm.address}
                onChange={(e) => updateCompanyField("address", e.target.value)}
                placeholder="Storgatan 1"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Postnummer
                </Label>
                <Input
                  id="postal_code"
                  value={companyForm.postal_code}
                  onChange={(e) => updateCompanyField("postal_code", e.target.value)}
                  placeholder="123 45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ort
                </Label>
                <Input
                  id="city"
                  value={companyForm.city}
                  onChange={(e) => updateCompanyField("city", e.target.value)}
                  placeholder="Stockholm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Telefon
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="company_phone"
                  value={companyForm.phone}
                  onChange={(e) => updateCompanyField("phone", e.target.value)}
                  placeholder="070-123 45 67"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                E-post
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="company_email"
                  value={companyForm.email}
                  onChange={(e) => updateCompanyField("email", e.target.value)}
                  placeholder="info@foretaget.se"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Webbplats
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="website"
                  value={companyForm.website}
                  onChange={(e) => updateCompanyField("website", e.target.value)}
                  placeholder="www.foretaget.se"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankgiro" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bankgiro
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="bankgiro"
                  value={companyForm.bankgiro}
                  onChange={(e) => updateCompanyField("bankgiro", e.target.value)}
                  placeholder="123-4567"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveCompany} disabled={savingCompany || !hasCompanyChanges} className="gap-2">
            {savingCompany ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Spara företagsuppgifter
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* About card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Om Byggio</CardTitle>
                <Badge variant="secondary" className="text-2xs">Beta</Badge>
              </div>
              <CardDescription>Byggprojekt, enkelt och digitalt</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Byggio hjälper dig att hantera dina byggprojekt digitalt – från dagrapporter 
            och planering till egenkontroller och kalkyler. Allt på ett ställe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
