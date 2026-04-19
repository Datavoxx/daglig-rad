import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Check, Mic, FileSignature, Clock, Calendar, FileText, AlertTriangle, Share2, ArrowRightLeft, CreditCard, BarChart3, Sparkles, Wand2, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

interface SubFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface FeatureData {
  title: string;
  subtitle: string;
  heroDescription: string;
  subFeatures: SubFeature[];
  color: string;
}

const featureData: Record<string, FeatureData> = {
  offerter: {
    title: "Offerter utan krångel",
    subtitle: "Skapa proffsiga offerter som säljer",
    heroDescription: "Sluta fumla med Excel. Beskriv projektet med rösten eller skriv in posterna – få en proffsig offert som kunden kan signera digitalt. Automatisk uppföljning säkerställer att du aldrig tappar affären.",
    color: "from-blue-500 to-blue-600",
    subFeatures: [
      {
        icon: Mic,
        title: "Röstinspelning",
        description: "Prata in projektbeskrivningen så skapar AI:n offertutkastet åt dig."
      },
      {
        icon: FileSignature,
        title: "Digital signering",
        description: "Kunden signerar direkt i mobilen. Inga papper, inga skanningar."
      },
      {
        icon: Clock,
        title: "Automatisk uppföljning",
        description: "Få påminnelser och se när kunden öppnar offerten."
      }
    ]
  },
  projekt: {
    title: "Projekt under kontroll",
    subtitle: "Arbetsdagbok, tidsplaner och dokumentation",
    heroDescription: "Allt ditt projektarbete samlat på ett ställe. Spela in dagrapporter med rösten, se tidsplaner visuellt, hantera ÄTA och dela med kund och team. Slipp leta i mappar och mejlkorgar.",
    color: "from-emerald-500 to-emerald-600",
    subFeatures: [
      {
        icon: Calendar,
        title: "Dagrapporter med röst",
        description: "Spela in vad som hände idag – appen strukturerar rapporten automatiskt."
      },
      {
        icon: FileText,
        title: "Visuella tidsplaner",
        description: "Se hela projektet i en tidslinje. Dra och släpp för att justera."
      },
      {
        icon: AlertTriangle,
        title: "ÄTA-hantering",
        description: "Dokumentera tilläggsarbeten direkt. Koppla till ursprungsofferten."
      },
      {
        icon: Share2,
        title: "Dela med kund",
        description: "Ge kunden tillgång till att följa projektets framsteg i realtid."
      }
    ]
  },
  fakturering: {
    title: "Fakturering på autopilot",
    subtitle: "Från offert till betalning utan krångel",
    heroDescription: "När offerten är godkänd är fakturan ett knapptryck bort. Spåra betalningar, skicka påminnelser automatiskt och exportera till ditt bokföringsprogram. Allt flyter på utan manuellt dubbelarbete.",
    color: "from-purple-500 to-purple-600",
    subFeatures: [
      {
        icon: ArrowRightLeft,
        title: "Offert till faktura",
        description: "Konvertera godkända offerter till fakturor med ett klick."
      },
      {
        icon: CreditCard,
        title: "Betalningsspårning",
        description: "Se vilka fakturor som är betalda, förfallna eller väntar."
      },
      {
        icon: BarChart3,
        title: "Bokföringsexport",
        description: "Exportera direkt till Fortnox, Visma eller som SIE-fil."
      }
    ]
  },
  ai: {
    title: "AI som binder ihop allt",
    subtitle: "Prata – vi sköter resten",
    heroDescription: "Byggio använder AI för att förstå vad du säger och automatiskt skapa strukturerade dokument. Prata in dina anteckningar efter arbetsdagen – AI:n skapar dagrapporter, offerter och projektplaner åt dig. Du fokuserar på att bygga, vi sköter pappersarbetet.",
    color: "from-primary to-emerald-500",
    subFeatures: [
      {
        icon: Mic,
        title: "Röst till text",
        description: "Högkvalitativ transkribering som förstår byggtermer och dialekter."
      },
      {
        icon: Wand2,
        title: "Smart strukturering",
        description: "AI:n förstår kontexten och skapar rätt typ av dokument automatiskt."
      },
      {
        icon: FileOutput,
        title: "Automatiska dokument",
        description: "Från röstmemo till färdig dagrapport eller offert på sekunder."
      }
    ]
  }
};

// Large mockups for detail pages
const EstimateLargeMockup = () => (
  <div className="bg-card rounded-xl border border-border/60 p-6 shadow-2xl max-w-md mx-auto">
    <div className="flex items-center justify-between mb-6">
      <div>
        <span className="text-lg font-semibold text-foreground">OFFERT #2025-042</span>
        <p className="text-sm text-muted-foreground">Skapad 26 januari 2025</p>
      </div>
      <Badge className="bg-primary text-primary-foreground">Skickad</Badge>
    </div>
    <div className="space-y-4">
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="font-medium text-foreground">Badrumsrenovering komplett</span>
          <span className="text-foreground">45 000 kr</span>
        </div>
        <p className="text-sm text-muted-foreground">Inkl. rivning, våtrum, kakel och inredning</p>
      </div>
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="font-medium text-foreground">Köksinstallation</span>
          <span className="text-foreground">78 000 kr</span>
        </div>
        <p className="text-sm text-muted-foreground">Nytt kök med vitvaror och bänkskiva</p>
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex justify-between text-lg font-semibold">
          <span className="text-foreground">Totalt ink. moms</span>
          <span className="text-primary">123 000 kr</span>
        </div>
      </div>
    </div>
  </div>
);

const ProjectLargeMockup = () => (
  <div className="bg-card rounded-xl border border-border/60 p-6 shadow-2xl max-w-lg mx-auto">
    <div className="flex items-center justify-between mb-6">
      <span className="text-lg font-semibold text-foreground">🏗️ Villarenovering Andersson</span>
      <Badge variant="outline">V1-V8</Badge>
    </div>
    
    {/* Week headers */}
    <div className="flex gap-1 text-[10px] text-muted-foreground pl-20 mb-2">
      <span className="flex-1 text-center">V1</span>
      <span className="flex-1 text-center">V2</span>
      <span className="flex-1 text-center">V3</span>
      <span className="flex-1 text-center">V4</span>
      <span className="flex-1 text-center">V5</span>
      <span className="flex-1 text-center">V6</span>
      <span className="flex-1 text-center">V7</span>
      <span className="flex-1 text-center">V8</span>
    </div>
    
    {/* Gantt Timeline */}
    <div className="space-y-2 mb-6">
      {/* Rivning: V1 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-20">Rivning</span>
        <div className="flex-1 flex gap-1">
          <div className="flex-1 h-5 bg-emerald-500 rounded" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
        </div>
      </div>
      {/* Stomme: V2-V4 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-20">Stomme</span>
        <div className="flex-1 flex gap-1">
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-blue-500 rounded-l" />
          <div className="flex-1 h-5 bg-blue-500" />
          <div className="flex-1 h-5 bg-blue-500 rounded-r" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
        </div>
      </div>
      {/* El & VVS: V3-V5 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-20">El & VVS</span>
        <div className="flex-1 flex gap-1">
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-amber-500 rounded-l" />
          <div className="flex-1 h-5 bg-amber-500" />
          <div className="flex-1 h-5 bg-amber-500 rounded-r" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
        </div>
      </div>
      {/* Ytskikt: V5-V8 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-20">Ytskikt</span>
        <div className="flex-1 flex gap-1">
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-transparent" />
          <div className="flex-1 h-5 bg-purple-500 rounded-l" />
          <div className="flex-1 h-5 bg-purple-500" />
          <div className="flex-1 h-5 bg-purple-500" />
          <div className="flex-1 h-5 bg-purple-500 rounded-r" />
        </div>
      </div>
    </div>
    
    {/* Recent activity */}
    <div className="border-t border-border pt-4">
      <span className="text-sm font-medium text-foreground">Senaste aktivitet</span>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Dagrapport tillagd</span>
          <span className="text-muted-foreground/60 ml-auto">idag 16:30</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">ÄTA registrerad</span>
          <span className="text-muted-foreground/60 ml-auto">igår</span>
        </div>
      </div>
    </div>
  </div>
);

const InvoiceLargeMockup = () => (
  <div className="bg-card rounded-xl border border-border/60 p-6 shadow-2xl max-w-md mx-auto">
    <div className="flex items-center justify-between mb-6">
      <div>
        <span className="text-lg font-semibold text-foreground">FAKTURA #F2025-018</span>
        <p className="text-sm text-muted-foreground">Förfaller 15 februari 2025</p>
      </div>
      <Badge className="bg-emerald-500 text-white">Betald</Badge>
    </div>
    <div className="space-y-3 mb-6">
      <div className="flex justify-between py-2 border-b border-border/50">
        <span className="text-muted-foreground">Badrumsrenovering (Offert #2025-038)</span>
        <span className="text-foreground">89 500 kr</span>
      </div>
      <div className="flex justify-between py-2 border-b border-border/50">
        <span className="text-muted-foreground">ÄTA: Extra eluttag</span>
        <span className="text-foreground">3 500 kr</span>
      </div>
    </div>
    <div className="bg-emerald-500/10 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <span className="text-foreground font-medium">Totalt betalt</span>
        <span className="text-lg font-semibold text-emerald-600">93 000 kr</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Betalning mottagen 10 februari 2025</p>
    </div>
  </div>
);

const AILargeMockup = () => (
  <div className="bg-card rounded-xl border border-border/60 p-6 shadow-2xl max-w-lg mx-auto relative overflow-hidden">
    {/* Animated gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
    
    <div className="relative">
      {/* Voice input visualization */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary animate-pulse" />
        </div>
        <div>
          <span className="text-lg font-semibold text-foreground">AI lyssnar...</span>
          <p className="text-sm text-muted-foreground">Transkriberar din röstinspelning</p>
        </div>
      </div>
      
      {/* Waveform */}
      <div className="flex items-center justify-center gap-1 mb-6 py-4">
        {[4, 8, 12, 18, 24, 18, 28, 20, 14, 22, 16, 10, 20, 26, 18, 12, 8, 16, 22, 14].map((h, i) => (
          <div 
            key={i} 
            className="w-1.5 bg-primary/60 rounded-full animate-pulse" 
            style={{ 
              height: `${h}px`,
              animationDelay: `${i * 30}ms`,
              animationDuration: '0.8s'
            }} 
          />
        ))}
      </div>
      
      {/* Transcription */}
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-foreground italic">
          "Vi rev det gamla badrummet idag, tre man på plats. Började klockan sju och höll på till fyra. Hittade lite fukt bakom kaklet som vi behöver ta hand om imorgon..."
        </p>
      </div>
      
      {/* Generated documents */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-primary/10 text-primary border-0">
          <FileText className="w-3 h-3 mr-1" />
          Dagrapport skapad
        </Badge>
        <Badge className="bg-amber-500/10 text-amber-600 border-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Avvikelse noterad
        </Badge>
      </div>
    </div>
  </div>
);

const mockupComponents: Record<string, React.FC> = {
  offerter: EstimateLargeMockup,
  projekt: ProjectLargeMockup,
  fakturering: InvoiceLargeMockup,
  ai: AILargeMockup
};

const FeatureDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Scroll to top when page loads or slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  if (!slug || !featureData[slug]) {
    return <Navigate to="/" replace />;
  }
  
  const feature = featureData[slug];
  const MockupComponent = mockupComponents[slug];
  
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      <main className="pt-20">
        {/* Back link */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link 
            to="/#features" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till start
          </Link>
        </div>
        
        {/* Hero section */}
        <section className="py-12 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className={`bg-gradient-to-r ${feature.color} text-white mb-4`}>
                  {feature.subtitle}
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground mb-6">
                  {feature.title}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {feature.heroDescription}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <Link to="/auth">Kom igång gratis</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/#how-it-works">Se hur det fungerar</Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                {/* Glow effect behind mockup */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-20 blur-3xl rounded-full`} />
                <MockupComponent />
              </div>
            </div>
          </div>
        </section>
        
        {/* Sub-features section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
                Vad ingår?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Allt du behöver för att effektivisera ditt arbete.
              </p>
            </div>
            
            <div className={`grid md:grid-cols-${feature.subFeatures.length > 3 ? '2' : '3'} gap-6`}>
              {feature.subFeatures.map((subFeature, index) => (
                <Card 
                  key={subFeature.title}
                  className="border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <subFeature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {subFeature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {subFeature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              Redo att komma igång?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Skapa ett gratiskonto på under en minut. Inga kort, inga bindningstider.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Kom igång gratis
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Gratis att börja</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Ingen bindningstid</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Svensk support</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default FeatureDetail;
