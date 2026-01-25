import { Mic, Sparkles, FileCheck } from "lucide-react";
import AnimatedAIOrb from "./AnimatedAIOrb";

const steps = [
  {
    number: "01",
    icon: Mic,
    title: "Beskriv med röst",
    description: "Prata in vad du vill dokumentera – projektbeskrivning, dagrapport eller offertunderlag."
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI bearbetar",
    description: "Vår AI analyserar din inspelning och skapar strukturerade dokument automatiskt."
  },
  {
    number: "03",
    icon: FileCheck,
    title: "Granska & skicka",
    description: "Redigera vid behov och dela professionella dokument med kunden direkt."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Hur det fungerar
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Från röst till dokument på sekunder
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Spara timmar varje vecka med AI-driven dokumentation.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className="relative group stagger-item"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector line (only between steps) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              {/* Step content */}
              <div className="text-center">
                {/* Number badge */}
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-muted border border-border/50 shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:border-primary/30 transition-all duration-300">
                  {index === 1 ? (
                    <AnimatedAIOrb size="small" />
                  ) : (
                    <step.icon className="h-8 w-8 text-primary" />
                  )}
                </div>

                {/* Text */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Demo section */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 rounded-3xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* AI Orb */}
              <div className="flex-shrink-0">
                <AnimatedAIOrb size="large" />
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                  "Spela in din röst – få en komplett rapport"
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xl">
                  Byggio's AI lyssnar på din beskrivning och skapar automatiskt dagrapporter, 
                  offerter och projektplaner. Allt strukturerat och professionellt.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-primary">62%</div>
                    <div className="text-sm text-muted-foreground">Snabbare dokumentation</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-primary">100%</div>
                    <div className="text-sm text-muted-foreground">Inga missade detaljer</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-primary">∞</div>
                    <div className="text-sm text-muted-foreground">Obegränsade projekt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
