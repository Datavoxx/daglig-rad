import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Mic, FolderOpen, FileText, Calendar, BarChart3, Layers, ClipboardList, FileCheck, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import sagaAvatar from "@/assets/saga-avatar-transparent.png";
import boAvatar from "@/assets/bo-avatar.png";
import ullaAvatar from "@/assets/ulla-avatar.png";

interface Capability {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface AgentData {
  name: string;
  title: string;
  heroDescription: string;
  fullDescription: string;
  avatar: string;
  capabilities: Capability[];
  skills: string[];
}

const agentData: Record<string, AgentData> = {
  saga: {
    name: "Saga",
    title: "Din kalkylexpert",
    heroDescription: "Slipp skriva offerter för hand. Prata in vad projektet innehåller – Saga strukturerar poster, mängder och belopp medan du pratar.",
    fullDescription: "Saga tar din röstinspelning och gör den till en färdig offert. Du säger 'rivning av kök, 8 timmar á 650 kronor' – hon lägger in det under rätt kategori med rätt beräkning. ROT- och RUT-avdrag beräknas automatiskt. Du får en proffsig offert utan att röra tangentbordet.",
    avatar: sagaAvatar,
    capabilities: [
      {
        icon: Mic,
        title: "Röststyrd offert",
        description: "Prata in moment, mängder och priser. Saga lägger in allt i rätt format – du slipper skriva och formatera."
      },
      {
        icon: FolderOpen,
        title: "Automatisk kategorisering",
        description: "Saga förstår att 'rivning' är Bygg och 'måla vägg' är Målning. Du behöver inte sortera manuellt."
      },
      {
        icon: FileText,
        title: "Kalkylmallar",
        description: "Spara vanliga projekt som mallar. Nästa gång behöver du bara prata in ändringarna."
      },
    ],
    skills: ["Offerter", "Kalkylmallar", "ROT/RUT-beräkning", "Artikelbibliotek"],
  },
  bo: {
    name: "Bo",
    title: "Din projektplanerare",
    heroDescription: "Slipp rita tidplaner manuellt. Beskriv projektet med rösten – Bo skapar ett Gantt-schema med faser och tidsuppskattningar.",
    fullDescription: "Bo tar din projektbeskrivning och gör den till en visuell tidplan. Du säger 'först rivning i två veckor, sen el och VVS parallellt' – han ritar upp det med rätt faser och veckor. Du får en tidplan att visa kunden utan att sitta och pilla i Excel.",
    avatar: boAvatar,
    capabilities: [
      {
        icon: Calendar,
        title: "Automatisk tidplan",
        description: "Beskriv projektet i stora drag – Bo skapar faser med veckonummer och längd automatiskt."
      },
      {
        icon: BarChart3,
        title: "Gantt-schema",
        description: "Visuell översikt över hela projektet. Se alla faser och hur de ligger i tid."
      },
      {
        icon: Layers,
        title: "Parallella faser",
        description: "Bo lägger upp arbeten som kan ske samtidigt sida vid sida i schemat."
      },
    ],
    skills: ["Tidsplaner", "Gantt-schema", "Fasplanering"],
  },
  ulla: {
    name: "Ulla",
    title: "Din dokumentationsassistent",
    heroDescription: "Slipp skriva dagrapporter vid datorn. Prata in vad som hänt på bygget – Ulla strukturerar allt medan du kör hem.",
    fullDescription: "Ulla tar din röstinspelning från bilen och gör den till en strukturerad rapport. Du säger 'idag var vi fyra snickare, monterade kök och väntade på elcentralen' – hon skapar en dagrapport med bemanning, utfört arbete och avvikelser. ÄTA-underlag på samma sätt.",
    avatar: ullaAvatar,
    capabilities: [
      {
        icon: ClipboardList,
        title: "Dagrapporter",
        description: "Berätta vad som hänt idag. Ulla strukturerar bemanning, timmar, utfört arbete och avvikelser."
      },
      {
        icon: FileCheck,
        title: "ÄTA-hantering",
        description: "Nämn ändringar eller tilläggsarbeten – Ulla dokumenterar dem separat med orsak och omfattning."
      },
      {
        icon: Wrench,
        title: "Arbetsorder",
        description: "Beskriv uppgiften med rösten – Ulla fyller i titel, beskrivning och tilldelning åt dig."
      },
    ],
    skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder"],
  },
};

const AgentDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const agent = slug ? agentData[slug] : null;

  // Scroll to top when navigating to agent page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agent hittades inte</h1>
          <Link to="/" className="text-primary hover:underline">
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-glow-pulse" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Back button */}
          <Link 
            to="/#ai-agents" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            {/* Avatar with glow */}
            <div className="relative mb-8 flex justify-center">
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-40 h-40 rounded-full bg-primary/30 blur-3xl animate-glow-pulse" />
              </div>
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl relative z-10"
              />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-assistent
            </div>

            {/* Name & Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
              {agent.name}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-6">
              {agent.title}
            </p>

            {/* Hero description */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              {agent.heroDescription}
            </p>

            {/* CTA */}
            <Button size="lg" className="text-base px-8" asChild>
              <Link to="/register">
                Kom igång gratis
              </Link>
            </Button>

            {/* Skills */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {agent.skills.map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary"
                  className="bg-primary/10 text-primary border-0"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 md:py-24 bg-foreground/[0.02]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              Vad kan {agent.name} göra?
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              {agent.fullDescription}
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {agent.capabilities.map((capability, index) => {
                const Icon = capability.icon;
                return (
                  <div 
                    key={index}
                    className="bg-card rounded-xl border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {capability.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Slipp adminarbetet
            </h2>
            <p className="text-muted-foreground mb-8">
              Testa {agent.name} gratis. Prata in ditt första projekt och se hur mycket tid du sparar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  Testa gratis
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/#how-it-works">
                  Se hur det fungerar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default AgentDetail;
