import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import TiltCard from "./TiltCard";

// Offerter Mockup
const EstimateMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs sm:text-sm font-medium text-foreground">OFFERT #2025-042</span>
      <Badge variant="default" className="text-[10px]">Skickad</Badge>
    </div>
    <div className="space-y-2 text-xs sm:text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Badrumsrenovering</span>
        <span className="blur-sm select-none text-foreground">45 000 kr</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Köksinstallation</span>
        <span className="blur-sm select-none text-foreground">78 000 kr</span>
      </div>
      <div className="border-t border-border/40 pt-2 mt-2">
        <div className="flex justify-between font-medium">
          <span className="text-foreground">Totalt</span>
          <span className="blur-sm select-none text-foreground">123 000 kr</span>
        </div>
      </div>
    </div>
  </div>
);

// Projekt Mockup (kombinerar dagbok + planering)
const ProjectMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm space-y-3">
    {/* Mini dagbok */}
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-sm font-medium text-foreground">📅 Dagbok</span>
      <Badge variant="success" className="text-[10px]">3 rapporter</Badge>
    </div>
    {/* Mini Gantt */}
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-14 truncate">Rivning</span>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[100%] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-14 truncate">Stomme</span>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[60%] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-14 truncate">Ytskikt</span>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[20%] bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
        </div>
      </div>
    </div>
    <div className="flex gap-2 pt-1">
      <Badge variant="outline" className="text-[10px]">ÄTA</Badge>
      <Badge variant="outline" className="text-[10px]">Filer</Badge>
    </div>
  </div>
);

// Fakturering Mockup
const InvoiceMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs sm:text-sm font-medium text-foreground">FAKTURA #F2025-018</span>
      <Badge variant="success" className="text-[10px]">Betald</Badge>
    </div>
    <div className="space-y-2 text-xs">
      <div className="flex justify-between items-center py-1.5 border-b border-border/30">
        <span className="text-muted-foreground">Från offert #2025-038</span>
        <span className="text-foreground blur-sm select-none">89 500 kr</span>
      </div>
      <div className="flex justify-between items-center py-1.5 border-b border-border/30">
        <span className="text-muted-foreground">Från offert #2025-041</span>
        <span className="text-foreground blur-sm select-none">156 000 kr</span>
      </div>
    </div>
    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
      <span className="text-xs text-muted-foreground">Denna månad</span>
      <span className="text-sm font-medium text-foreground blur-sm select-none">245 500 kr</span>
    </div>
  </div>
);

// AI Mockup
const AIMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm relative overflow-hidden">
    {/* Animated gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
    
    <div className="relative space-y-3">
      {/* Voice waveform simulation */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-0.5">
          {[3, 5, 8, 12, 8, 15, 10, 6, 9, 14, 7, 4, 11, 8, 5].map((h, i) => (
            <div 
              key={i} 
              className="w-1 bg-primary/60 rounded-full animate-pulse" 
              style={{ 
                height: `${h}px`,
                animationDelay: `${i * 50}ms`
              }} 
            />
          ))}
        </div>
      </div>
      
      {/* Generated content preview */}
      <div className="text-xs text-muted-foreground italic">
        "Vi rev badrummet idag, tre man..."
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-[10px]">→ Dagrapport</Badge>
        <Badge variant="secondary" className="text-[10px]">→ Offert</Badge>
        <Badge variant="secondary" className="text-[10px]">→ Plan</Badge>
      </div>
    </div>
  </div>
);

const features = [
  {
    slug: "offerter",
    title: "Offerter som säljer",
    description: "Skapa proffsiga offerter på minuter. Kunden signerar digitalt direkt i mobilen.",
    mockup: EstimateMockup,
  },
  {
    slug: "projekt",
    title: "Projekt under kontroll", 
    description: "Arbetsdagbok, tidsplaner och all dokumentation samlat. Delbart med kund och team.",
    mockup: ProjectMockup,
  },
  {
    slug: "fakturering",
    title: "Fakturering på autopilot",
    description: "Omvandla godkända offerter till fakturor. Spåra betalningar automatiskt.",
    mockup: InvoiceMockup,
  },
  {
    slug: "ai",
    title: "AI som binder ihop allt",
    description: "Prata in dina anteckningar – AI skapar dokument, offerter och rapporter åt dig.",
    mockup: AIMockup,
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funktioner
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Enklare vardag för dig som bygger
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Slipp krångliga system. Få ordning på dokumentation, planering och offerter – på några minuter.
          </p>
        </div>

        {/* Features grid - 1 column on mobile, 2 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Link 
              key={feature.slug} 
              to={`/features/${feature.slug}`}
              className="block group"
            >
              <TiltCard 
                maxTilt={15} 
                glareEnabled={true}
                className="stagger-item h-full"
              >
                <div className="relative h-full">
                  {/* Hover glow effect - matches hero dashboard */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/15 via-primary/10 to-emerald-500/15 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <Card 
                    className="relative h-full border-border/50 bg-card shadow-xl transition-all duration-300 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] group-hover:border-primary/30"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    {/* Top highlight line - simulates light reflection */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-xl" />
                    
                    {/* Mockup */}
                    <div className="p-4 sm:p-6 pb-0">
                      <feature.mockup />
                    </div>

                    <CardContent className="p-4 sm:p-6 pt-4 sm:pt-5">
                      {/* Content */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                    
                    {/* Bottom gradient for depth */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-b-xl" />
                  </Card>
                </div>
              </TiltCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
