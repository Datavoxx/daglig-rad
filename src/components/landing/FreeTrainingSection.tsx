import { useState } from "react";
import { ArrowRight, Clock, Zap, BookOpen, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import byggioLogo from "@/assets/byggio-logo.png";
import TrainingBookingDialog from "./TrainingBookingDialog";

const trainingOptions = [
  {
    duration: "30 min",
    title: "Snabbstart",
    features: ["Grunderna i Byggio", "Kom igång direkt", "Perfekt för dig som vill testa"],
    icon: Zap,
  },
  {
    duration: "60 min",
    title: "Djupdykning",
    features: ["Alla moduler genomgång", "Personlig Q&A-session", "Skräddarsytt efter dina behov"],
    icon: BookOpen,
  },
];

const FreeTrainingSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={byggioLogo} 
            alt="Byggio" 
            className="h-10 w-auto opacity-80"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Gratis personlig utbildning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Alla nya användare får en kostnadsfri genomgång av Byggio – anpassad efter dina behov och din tid.
          </p>
        </div>

        {/* Training options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {trainingOptions.map((option) => (
            <div
              key={option.duration}
              className="group relative bg-card rounded-2xl border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent rounded-t-2xl" />

              {/* Duration badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {option.duration}
                </div>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <option.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{option.title}</h3>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
            Boka din utbildning
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="mt-3 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <MessageCircleQuestion className="w-4 h-4" />
            Helt kostnadsfritt, inga förpliktelser
          </p>
        </div>
      </div>

      <TrainingBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
};

export default FreeTrainingSection;
