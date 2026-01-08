import { useState, useEffect } from "react";
import { User, Mail, Save, Loader2, Info, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface PricingSettings {
  hourly_rate_carpenter: number;
  hourly_rate_painter: number;
  hourly_rate_tiler: number;
  hourly_rate_general: number;
  material_markup_percent: number;
  default_estimate_markup: number;
}

const defaultPricing: PricingSettings = {
  hourly_rate_carpenter: 520,
  hourly_rate_painter: 480,
  hourly_rate_tiler: 520,
  hourly_rate_general: 500,
  material_markup_percent: 10,
  default_estimate_markup: 15,
};

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [pricing, setPricing] = useState<PricingSettings>(defaultPricing);
  const [originalPricing, setOriginalPricing] = useState<PricingSettings>(defaultPricing);
  const [hasPricingChanges, setHasPricingChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchPricing();
  }, []);

  useEffect(() => {
    if (profile) {
      setHasChanges(fullName !== (profile.full_name || ""));
    }
  }, [fullName, profile]);

  useEffect(() => {
    setHasPricingChanges(JSON.stringify(pricing) !== JSON.stringify(originalPricing));
  }, [pricing, originalPricing]);

  const fetchProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setFullName(data.full_name || "");
    }
    setLoading(false);
  };

  const fetchPricing = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("user_pricing_settings")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!error && data) {
      const pricingData: PricingSettings = {
        hourly_rate_carpenter: Number(data.hourly_rate_carpenter) || defaultPricing.hourly_rate_carpenter,
        hourly_rate_painter: Number(data.hourly_rate_painter) || defaultPricing.hourly_rate_painter,
        hourly_rate_tiler: Number(data.hourly_rate_tiler) || defaultPricing.hourly_rate_tiler,
        hourly_rate_general: Number(data.hourly_rate_general) || defaultPricing.hourly_rate_general,
        material_markup_percent: Number(data.material_markup_percent) || defaultPricing.material_markup_percent,
        default_estimate_markup: Number(data.default_estimate_markup) || defaultPricing.default_estimate_markup,
      };
      setPricing(pricingData);
      setOriginalPricing(pricingData);
    }
  };

  const handleSave = async () => {
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

  const handleSavePricing = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setSavingPricing(true);

    // Upsert pricing settings
    const { error } = await supabase
      .from("user_pricing_settings")
      .upsert({
        user_id: userData.user.id,
        ...pricing,
      }, { onConflict: "user_id" });

    if (error) {
      toast({
        title: "Kunde inte spara priser",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Kalkylpriser sparade" });
      setOriginalPricing(pricing);
    }
    setSavingPricing(false);
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
        <p className="page-subtitle">Hantera ditt konto och preferenser</p>
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
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
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

      {/* Pricing card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Kalkylpriser</CardTitle>
              <CardDescription>Dina standardpriser för kalkyler</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hourly rates */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Timpriser
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rate-carpenter" className="text-sm">Snickare</Label>
                <div className="relative">
                  <Input
                    id="rate-carpenter"
                    type="number"
                    value={pricing.hourly_rate_carpenter}
                    onChange={(e) => setPricing({ ...pricing, hourly_rate_carpenter: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-painter" className="text-sm">Målare</Label>
                <div className="relative">
                  <Input
                    id="rate-painter"
                    type="number"
                    value={pricing.hourly_rate_painter}
                    onChange={(e) => setPricing({ ...pricing, hourly_rate_painter: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-tiler" className="text-sm">Plattsättare</Label>
                <div className="relative">
                  <Input
                    id="rate-tiler"
                    type="number"
                    value={pricing.hourly_rate_tiler}
                    onChange={(e) => setPricing({ ...pricing, hourly_rate_tiler: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-general" className="text-sm">Allmänt arbete</Label>
                <div className="relative">
                  <Input
                    id="rate-general"
                    type="number"
                    value={pricing.hourly_rate_general}
                    onChange={(e) => setPricing({ ...pricing, hourly_rate_general: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
            </div>
          </div>

          {/* Markups */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Påslag
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="material-markup" className="text-sm">Materialpåslag</Label>
                <div className="relative">
                  <Input
                    id="material-markup"
                    type="number"
                    value={pricing.material_markup_percent}
                    onChange={(e) => setPricing({ ...pricing, material_markup_percent: Number(e.target.value) })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimate-markup" className="text-sm">Kalkylpåslag</Label>
                <div className="relative">
                  <Input
                    id="estimate-markup"
                    type="number"
                    value={pricing.default_estimate_markup}
                    onChange={(e) => setPricing({ ...pricing, default_estimate_markup: Number(e.target.value) })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePricing} disabled={savingPricing || !hasPricingChanges} className="gap-2">
            {savingPricing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Spara priser
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
                <CardTitle className="text-base">Om Dagrapport</CardTitle>
                <Badge variant="secondary" className="text-2xs">v1.0</Badge>
              </div>
              <CardDescription>Byggbranschens dagrapportverktyg</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dagrapport hjälper dig att snabbt skapa strukturerade dagrapporter från
            röst- eller texttranskript med hjälp av AI. Perfekt för byggbranschen
            och andra områden där dokumentation är viktigt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
