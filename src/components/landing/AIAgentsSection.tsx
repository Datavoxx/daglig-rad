import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Mic, FileText, CalendarDays, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import byggioAILogo from "@/assets/byggio-ai-logo.png";

const capabilities = [
  {
    icon: FileText,
    title: "Offerter",
    description: "Prata in projektet – AI:n skapar offerten med poster, mängder och belopp.",
  },
  {
    icon: CalendarDays,
    title: "Tidsplaner",
    description: "Beskriv projektet – AI:n ritar upp Gantt-schemat med faser och veckor.",
  },
  {
    icon: ClipboardList,
    title: "Dokumentation",
    description: "Berätta vad som hänt – AI:n skapar dagrapporter, ÄTA och arbetsorder.",
  },
];

const AIAgentsSection = () => {
  return (
    <section id="ai-agents" className="py-20 md:py-28 bg-foreground/[0.02] relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-[16%] w-32 h-32 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-[16%] w-48 h-48 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/3 blur-3xl animate-glow-pulse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-driven
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Möt Byggio AI
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Din kompletta AI-assistent för byggprojekt. Prata in vad som behövs – Byggio AI sköter resten.
          </p>
        </div>

        {/* Main card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-card rounded-2xl border border-border/50 p-8 md:p-12 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl">
            {/* Top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent rounded-t-2xl" />

            {/* Content */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Avatar with glow */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-40 h-40 rounded-full bg-primary/20 blur-2xl animate-glow-pulse" />
                </div>
                <img
                  src={byggioAILogo}
                  alt="Byggio AI"
                  className="w-44 h-44 md:w-56 md:h-56 object-contain drop-shadow-2xl relative z-10"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2">Byggio AI</h3>
                <p className="text-muted-foreground font-medium mb-4">Din AI-assistent för byggprojekt</p>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Slipp sitta vid datorn och skriva. Prata in vad som hänt eller vad projektet innehåller – 
                  Byggio AI strukturerar allt åt dig. Offerter, tidsplaner, dagrapporter och mer.
                </p>

                <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    <Mic className="w-3 h-3 mr-1" />
                    Röststyrd
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Snabb
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Smart
                  </Badge>
                </div>

                <Button size="lg" asChild>
                  <Link to="/register">
                    Kom igång gratis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <div
                key={index}
                className="bg-card rounded-xl border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{capability.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AIAgentsSection;
