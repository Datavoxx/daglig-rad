import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mic, Calculator, FileText, Calendar, BarChart3, Users, ClipboardList, FileCheck, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import sagaAvatar from "@/assets/saga-avatar.png";
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
    heroDescription: "Saga förstår byggprojekt in och ut. Beskriv vad du ska göra – Saga skapar en proffsig offert med rätt priser och ROT/RUT-beräkning.",
    fullDescription: "Med Saga vid din sida behöver du aldrig oroa dig för att missa en post i offerten. Hon analyserar dina projektbeskrivningar, föreslår rimliga priser baserat på din prislista, och ser till att ROT- och RUT-avdrag beräknas korrekt. Saga lär sig från dina tidigare offerter och blir smartare ju mer du använder henne.",
    avatar: sagaAvatar,
    capabilities: [
      {
        icon: Mic,
        title: "Röststyrd offert",
        description: "Prata in din projektbeskrivning så strukturerar Saga allt automatiskt med rätt moment, artiklar och priser."
      },
      {
        icon: Calculator,
        title: "Smart prissättning",
        description: "Saga föreslår priser baserat på din prislista och tidigare offerter. Du justerar enkelt om något behöver ändras."
      },
      {
        icon: FileText,
        title: "Kalkylmallar",
        description: "Spara tid med återanvändbara mallar. Saga hjälper dig bygga upp ett bibliotek av standardofferter."
      },
    ],
    skills: ["Offerter", "Kalkylmallar", "ROT/RUT-beräkning", "Prissättning", "Artikelbibliotek"],
  },
  bo: {
    name: "Bo",
    title: "Din projektplanerare",
    heroDescription: "Bo bygger realistiska tidsplaner på några sekunder. Beskriv projektet så skapar han ett Gantt-schema med alla faser och beroenden.",
    fullDescription: "Bo har koll på hur byggprojekt fungerar i praktiken. Han vet att målning måste vänta på spackling, att VVS-arbeten påverkar kakelsättning, och att städ alltid kommer sist. Med Bo får du en genomtänkt tidplan som faktiskt håller.",
    avatar: boAvatar,
    capabilities: [
      {
        icon: Calendar,
        title: "Automatisk tidplan",
        description: "Beskriv projektet i stora drag så skapar Bo en detaljerad tidplan med alla faser, uppgifter och realistiska tidsuppskattningar."
      },
      {
        icon: BarChart3,
        title: "Gantt-schema",
        description: "Visuell överblick över hela projektet. Se beroenden, kritiska punkter och var du ligger tidsmässigt."
      },
      {
        icon: Users,
        title: "Resursplanering",
        description: "Bo håller koll på vilka yrkesgrupper som behövs när, så du kan planera bemanning och underentreprenörer."
      },
    ],
    skills: ["Tidsplaner", "Gantt-schema", "Fasplanering", "Beroenden", "Resursöversikt"],
  },
  ulla: {
    name: "Ulla",
    title: "Din dokumentationsassistent",
    heroDescription: "Ulla tar hand om allt pappersarbete. Prata in vad som hänt på bygget – hon skapar dagrapporter, ÄTA-underlag och arbetsorder.",
    fullDescription: "Dokumentation är ofta det som hamnar efter i stressiga projekt. Med Ulla behöver du bara prata in vad som hänt så strukturerar hon allt snyggt. Dagrapporter, ÄTA-underlag, arbetsorder – allt på plats utan att du behöver sitta vid datorn.",
    avatar: ullaAvatar,
    capabilities: [
      {
        icon: ClipboardList,
        title: "Dagrapporter",
        description: "Prata in dagens händelser på väg hem från bygget. Ulla skapar en proffsig dagrapport med bemanning, utfört arbete och avvikelser."
      },
      {
        icon: FileCheck,
        title: "ÄTA-hantering",
        description: "När det dyker upp tilläggsarbeten dokumenterar Ulla allt korrekt med tid, material och kostnadsuppskattning."
      },
      {
        icon: Wrench,
        title: "Arbetsorder",
        description: "Skapa tydliga arbetsorder till medarbetare och underentreprenörer. Ulla ser till att alla vet vad som ska göras."
      },
    ],
    skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder", "Egenkontroller", "Avvikelselogg"],
  },
};

const AgentDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const agent = slug ? agentData[slug] : null;

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
              Redo att träffa {agent.name}?
            </h2>
            <p className="text-muted-foreground mb-8">
              Kom igång gratis och upplev hur {agent.name} kan effektivisera ditt arbete.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  Skapa konto gratis
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/">
                  Läs mer om Byggio
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
