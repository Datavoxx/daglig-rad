import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TiltCard from "./TiltCard";

// Arbetsdagbok Mockup
const WorkDiaryMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs sm:text-sm font-medium text-foreground">📅 26 januari 2025</span>
      <Badge variant="success" className="text-[10px] sm:text-xs">Klar</Badge>
    </div>
    <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground mb-3">
      <span>👥 3 pers</span>
      <span>⏱ 24h</span>
    </div>
    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
      "Rivning av gammalt badrum klar. Började med membran..."
    </p>
    <div className="flex gap-2">
      <Badge variant="warning" className="text-[10px]">1 avvikelse</Badge>
      <Badge variant="info" className="text-[10px]">ÄTA</Badge>
    </div>
  </div>
);

// Projektplanering Mockup (Mini Gantt)
const PlanningMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm">
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] sm:text-xs text-muted-foreground w-16 sm:w-20 truncate">Rivning</span>
        <div className="flex-1 h-4 sm:h-5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[40%] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] sm:text-xs text-muted-foreground w-16 sm:w-20 truncate">Stomme</span>
        <div className="flex-1 h-4 sm:h-5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[60%] ml-[20%] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] sm:text-xs text-muted-foreground w-16 sm:w-20 truncate">Ytskikt</span>
        <div className="flex-1 h-4 sm:h-5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[50%] ml-[50%] bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
        </div>
      </div>
    </div>
    <div className="flex justify-between mt-2 sm:mt-3 text-[10px] text-muted-foreground">
      <span>Jan</span>
      <span>Feb</span>
      <span>Mar</span>
    </div>
  </div>
);

// Offerter Mockup (med suddade priser)
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

// Kundregister Mockup
const CustomersMockup = () => (
  <div className="bg-background rounded-lg border border-border/60 p-3 sm:p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-muted/50 rounded-md">
      <span className="text-muted-foreground text-xs">🔍</span>
      <span className="text-xs text-muted-foreground">Sök kunder...</span>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] sm:text-xs text-blue-700">EA</div>
          <span className="text-xs sm:text-sm text-foreground">Eriksson AB</span>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground">3 projekt</span>
      </div>
      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] sm:text-xs text-emerald-700">SC</div>
          <span className="text-xs sm:text-sm text-foreground">Sundström & Co</span>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground">1 projekt</span>
      </div>
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-100 flex items-center justify-center text-[10px] sm:text-xs text-purple-700">FN</div>
          <span className="text-xs sm:text-sm text-foreground">Fastigheter Nordic</span>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground">5 projekt</span>
      </div>
    </div>
  </div>
);

const features = [
  {
    title: "Arbetsdagbok på minuter",
    description: "Spela in vad som hände idag med rösten – appen skriver rapporten åt dig. Perfekt när händerna är smutsiga.",
    mockup: WorkDiaryMockup,
  },
  {
    title: "Tidsplaner som du faktiskt använder",
    description: "Dra och släpp faser. Dela med kunden. Uppdatera på sekunder – direkt från mobilen.",
    mockup: PlanningMockup,
  },
  {
    title: "Offerter utan krångel",
    description: "Beskriv projektet, lägg till poster – få en proffsig offert som kunden kan signera digitalt.",
    mockup: EstimateMockup,
  },
  {
    title: "Alla kunder på ett ställe",
    description: "Sök fram kontaktuppgifter, se projekthistorik och skicka offerter – utan att leta i pappershögar.",
    mockup: CustomersMockup,
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
            <TiltCard 
              key={feature.title}
              maxTilt={8} 
              glareEnabled={true}
              className="stagger-item"
            >
              <Card 
                className="group relative overflow-hidden h-full border-border/50 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Mockup */}
                <div className="p-4 sm:p-6 pb-0">
                  <feature.mockup />
                </div>

                <CardContent className="p-4 sm:p-6 pt-4 sm:pt-5">
                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </CardContent>
              </Card>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
