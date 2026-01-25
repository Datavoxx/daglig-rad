import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import AnimatedAIOrb from "./AnimatedAIOrb";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating orbs in background */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm font-medium text-primary">Nyhet: AI-genererade offerter</span>
        </div>

        {/* Main heading with AI orb */}
        <div className="flex flex-col items-center gap-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <AnimatedAIOrb size="large" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground">
              Digitalisera dina
            </h1>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
            <span className="text-gradient bg-gradient-to-r from-primary via-primary to-emerald-500">
              byggprojekt
            </span>
          </h1>
        </div>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Byggio gör det enkelt att dokumentera, planera och kalkylera – 
          allt på en plattform byggd för svenska byggföretag.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/25" asChild>
            <Link to="/register">
              Kom igång gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
            <a href="#how-it-works">
              <Play className="mr-2 h-4 w-4" />
              Se hur det fungerar
            </a>
          </Button>
        </div>

        {/* App preview mockup */}
        <div className="relative max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-500/20 rounded-2xl blur-2xl" />
          <div 
            className="relative bg-card rounded-xl border border-border/50 shadow-2xl overflow-hidden"
            style={{
              transform: "perspective(1000px) rotateX(5deg)",
              transformOrigin: "center bottom"
            }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                  app.byggio.se
                </div>
              </div>
            </div>
            {/* App content placeholder */}
            <div className="aspect-[16/10] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <AnimatedAIOrb size="small" />
                </div>
                <p className="text-muted-foreground text-sm">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-sm text-muted-foreground mb-4">Används av byggföretag i hela Sverige</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-foreground">50+</div>
            <div className="h-8 w-px bg-border" />
            <div className="text-sm text-muted-foreground">Aktiva företag</div>
            <div className="h-8 w-px bg-border" />
            <div className="text-2xl font-bold text-foreground">1000+</div>
            <div className="h-8 w-px bg-border" />
            <div className="text-sm text-muted-foreground">Projekt skapade</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
