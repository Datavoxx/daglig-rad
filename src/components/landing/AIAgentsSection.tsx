import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import sagaAvatar from "@/assets/saga-avatar.png";
import boAvatar from "@/assets/bo-avatar.png";
import ullaAvatar from "@/assets/ulla-avatar.png";

const agents = [
  {
    slug: "saga",
    name: "Saga",
    title: "Kalkylexpert",
    description: "Skapar proffsiga offerter från röstinspelningar och hjälper dig med prissättning.",
    avatar: sagaAvatar,
    skills: ["Offerter", "Kalkylmallar", "ROT/RUT-beräkning"],
  },
  {
    slug: "bo",
    name: "Bo",
    title: "Projektplanerare",
    description: "Bygger realistiska tidsplaner och håller koll på projektets alla faser.",
    avatar: boAvatar,
    skills: ["Tidsplaner", "Gantt-schema", "Fasplanering"],
  },
  {
    slug: "ulla",
    name: "Ulla",
    title: "Dokumentationsassistent",
    description: "Strukturerar dagrapporter, hanterar ÄTA och skapar arbetsorder automatiskt.",
    avatar: ullaAvatar,
    skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder"],
  },
];

const AIAgentsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-foreground/[0.02] relative overflow-hidden">
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
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Möt dina AI-kollegor
          </h2>
        </div>

        {/* Simulation Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="relative bg-card rounded-2xl border border-border/50 p-6 md:p-8 overflow-hidden">
            {/* Top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            {/* Three agent previews side by side */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Saga - Offerter */}
              <div className="text-center">
                <img src={sagaAvatar} alt="Saga" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg" />
                <p className="text-primary font-semibold mb-2">Saga</p>
                <p className="text-xs text-muted-foreground mb-3">hanterar dina</p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                  <p className="font-medium text-primary text-lg">Offerter</p>
                  <p className="text-xs text-muted-foreground">Från röst till proffsig offert</p>
                </div>
              </div>
              
              {/* Bo - Projekt */}
              <div className="text-center">
                <img src={boAvatar} alt="Bo" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg" />
                <p className="text-primary font-semibold mb-2">Bo</p>
                <p className="text-xs text-muted-foreground mb-3">planerar dina</p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                  <p className="font-medium text-primary text-lg">Projekt</p>
                  <p className="text-xs text-muted-foreground">Tidsplaner & Gantt-schema</p>
                </div>
              </div>
              
              {/* Ulla - Rapporter */}
              <div className="text-center">
                <img src={ullaAvatar} alt="Ulla" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg" />
                <p className="text-primary font-semibold mb-2">Ulla</p>
                <p className="text-xs text-muted-foreground mb-3">dokumenterar dina</p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                  <p className="font-medium text-primary text-lg">Rapporter</p>
                  <p className="text-xs text-muted-foreground">Dagbok, ÄTA & arbetsorder</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agents grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {agents.map((agent) => (
            <Link
              key={agent.slug}
              to={`/ai/${agent.slug}`}
              className="group relative"
            >
              {/* Hover glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative bg-card rounded-2xl border border-border/50 p-6 sm:p-8 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:-translate-y-1 h-full">
                {/* Top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent rounded-t-2xl" />

                {/* Avatar with glow */}
                <div className="relative mb-6 flex justify-center">
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="w-32 h-32 rounded-full bg-primary/20 blur-2xl animate-glow-pulse" />
                  </div>
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-36 h-36 md:w-44 md:h-44 object-contain drop-shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Name & Title */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-primary mb-1">{agent.name}</h3>
                  <p className="text-muted-foreground font-medium">{agent.title}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                  {agent.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {agent.skills.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="secondary"
                      className="bg-primary/10 text-primary border-0 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  Läs mer
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIAgentsSection;
