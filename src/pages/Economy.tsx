import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landmark, Clock, RefreshCw, FileText, BarChart3 } from "lucide-react";
import fortnoxLogo from "@/assets/fortnox-logo.png";
import vismaLogo from "@/assets/visma-logo.png";

export default function Economy() {
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
                  className="h-10 w-auto object-contain"
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
    </div>
  );
}
