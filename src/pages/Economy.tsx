import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Landmark, Clock, RefreshCw, FileText, BarChart3, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import fortnoxLogo from "@/assets/fortnox-logo.png";
import vismaLogo from "@/assets/visma-logo.png";

export default function Economy() {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const handleInterestSubmit = () => {
    if (!selectedIntegration) {
      toast.error("Välj vilken integration du är intresserad av");
      return;
    }
    setSubmitted(true);
    toast.success("Tack! Vi hör av oss när integrationen är redo.");
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Landmark className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ekonomi</h1>
            <p className="text-muted-foreground">Koppla samman ditt bokföringssystem</p>
          </div>
        </div>
      </section>

      {/* Integration Cards */}
      <div className="space-y-4">
        {/* Fortnox */}
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Logo Section */}
              <div className="flex items-center justify-center p-8 bg-[#00433A]/5 md:w-56 md:min-h-[140px]">
                <img 
                  src={fortnoxLogo} 
                  alt="Fortnox" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              
              {/* Info Section */}
              <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">Fortnox</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sveriges ledande bokföringsprogram för småföretag
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Fakturering</Badge>
                    <Badge variant="secondary">Bokföring</Badge>
                    <Badge variant="secondary">Kunder</Badge>
                  </div>
                </div>
                <Button variant="outline" disabled className="shrink-0 w-full md:w-auto">
                  <Clock className="h-4 w-4 mr-2" />
                  Kommer snart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visma */}
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Logo Section */}
              <div className="flex items-center justify-center p-8 bg-[#E6007E]/5 md:w-56 md:min-h-[140px]">
                <img 
                  src={vismaLogo} 
                  alt="Visma" 
                  className="h-16 w-auto object-contain"
                />
              </div>
              
              {/* Info Section */}
              <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">Visma</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Komplett affärssystem för företag i alla storlekar
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Fakturering</Badge>
                    <Badge variant="secondary">Bokföring</Badge>
                    <Badge variant="secondary">Projekt</Badge>
                  </div>
                </div>
                <Button variant="outline" disabled className="shrink-0 w-full md:w-auto">
                  <Clock className="h-4 w-4 mr-2" />
                  Kommer snart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Automatisk synkronisering</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Fakturor och kunder synkas automatiskt
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Enkel fakturering</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Skapa fakturor direkt från projekt
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Ekonomisk översikt</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Se projektens lönsamhet i realtid
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Interest CTA Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 border-primary/20">
        <CardContent className="p-8 md:p-10">
          {!submitted ? (
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              
              {/* Headline */}
              <div className="space-y-2 max-w-lg">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  Bli en av de första att testa
                </h2>
                <p className="text-muted-foreground">
                  Anmäl ditt intresse för att vara bland de första som får tillgång 
                  till våra ekonomi-integrationer. Vi meddelar dig så snart det är klart!
                </p>
              </div>

              {/* Integration Selection */}
              <div className="w-full max-w-sm space-y-4">
                <Label className="text-sm font-medium">
                  Vilken integration är du intresserad av?
                </Label>
                <RadioGroup 
                  value={selectedIntegration} 
                  onValueChange={setSelectedIntegration}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fortnox" id="fortnox" />
                    <Label htmlFor="fortnox" className="cursor-pointer">Fortnox</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="visma" id="visma" />
                    <Label htmlFor="visma" className="cursor-pointer">Visma</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="cursor-pointer">Båda</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <Button 
                size="lg" 
                onClick={handleInterestSubmit}
                className="shadow-lg shadow-primary/25"
              >
                <Send className="h-4 w-4 mr-2" />
                Anmäl intresse
              </Button>
            </div>
          ) : (
            /* Success State */
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Tack för din anmälan!</h3>
                <p className="text-muted-foreground">
                  Vi hör av oss så snart integrationen är redo för dig att testa.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
