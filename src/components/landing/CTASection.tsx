import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import AnimatedAIOrb from "./AnimatedAIOrb";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-emerald-500/5" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-10 opacity-30">
        <AnimatedAIOrb size="small" />
      </div>
      <div className="absolute bottom-1/4 right-10 opacity-20">
        <AnimatedAIOrb size="default" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main CTA card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 md:p-12 shadow-xl">
          <div className="flex justify-center mb-6">
            <AnimatedAIOrb size="large" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Redo att digitalisera ditt byggföretag?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Kom igång gratis idag – ingen bindningstid, inga dolda avgifter. 
            Se skillnaden på din första arbetsdag.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/25" asChild>
              <Link to="/register">
                Kom igång gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <Link to="/auth">
                Har redan konto? Logga in
              </Link>
            </Button>
          </div>

          {/* Trust line */}
          <p className="mt-8 text-sm text-muted-foreground">
            ✓ Gratis att börja &nbsp;&nbsp; ✓ Ingen kreditkort krävs &nbsp;&nbsp; ✓ Avsluta när som helst
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
