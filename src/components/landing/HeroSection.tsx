import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, FolderKanban, Calculator, Wallet, Users, TrendingUp, Sparkles } from "lucide-react";
import TiltCard from "./TiltCard";
import SparklineChart from "../dashboard/SparklineChart";

const rotatingWords = ["projekt", "fakturor", "offerter", "dagrapporter", "arbetsorder"];

// Mock data for dashboard visualization
const mockKpiData = [
  { title: "Projekt", value: "12", change: 15, icon: FolderKanban, color: "primary", sparklineColor: "hsl(var(--primary))" },
  { title: "Offerter", value: "8", change: 23, icon: Calculator, color: "blue", sparklineColor: "hsl(217, 91%, 60%)" },
  { title: "Offertvärde", value: "1.2M kr", change: 0, icon: Wallet, color: "emerald", sparklineColor: "hsl(160, 84%, 39%)" },
  { title: "Kunder", value: "24", change: 8, icon: Users, color: "amber", sparklineColor: "hsl(45, 93%, 47%)" },
];

const mockSparklineData = [2, 3, 5, 4, 6, 8, 7, 9, 8, 10, 11, 12, 14, 12];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  primary: { bg: "bg-primary/10", icon: "text-primary" },
  blue: { bg: "bg-blue-500/10", icon: "text-blue-500" },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-500" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-500" },
};

const HeroSection = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsVisible(true);
      }, 200);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient - cleaner, more subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background to-background" />

      {/* Floating orbs in background - reduced opacity for cleaner look */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/3 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/2 blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">

        {/* Main heading - outcome-driven, higher contrast */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tighter text-foreground mb-4 animate-fade-in">
          Få full kontroll på dina
        </h1>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tighter mb-8 animate-fade-in">
          <span 
            className={`text-gradient bg-gradient-to-r from-primary via-primary to-emerald-500 inline-block transition-all duration-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {rotatingWords[wordIndex]}
          </span>
        </h1>

        {/* Subheading - business impact focused, tighter */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Samla dokumentation, planering och offerter i ett system – 
          byggt för byggföretag som vill spara tid och öka lönsamheten.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/25" asChild>
            <Link to="/register">
              Kom igång gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" className="text-base px-8 h-12" asChild>
            <a href="#how-it-works">
              <Play className="mr-2 h-4 w-4" />
              Se hur det fungerar
            </a>
          </Button>
        </div>

        {/* App preview mockup with Dashboard visualization */}
        <div className="relative max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-500/20 rounded-2xl blur-2xl" />
          <TiltCard 
            className="bg-card rounded-xl border border-border/50 shadow-2xl overflow-hidden"
            maxTilt={10}
            glareEnabled={true}
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

            {/* Dashboard content */}
            <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-4 sm:p-6">
              {/* Dashboard header */}
              <div className="mb-4 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-semibold text-foreground">Hej, Erik! 👋</span>
                </div>
                <p className="text-xs text-muted-foreground">Här är din översikt för idag</p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {mockKpiData.map((kpi, index) => {
                  const Icon = kpi.icon;
                  const colors = colorClasses[kpi.color];
                  return (
                    <div 
                      key={index} 
                      className="rounded-lg border border-border/40 bg-card/80 backdrop-blur-sm p-3 text-left transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`rounded-md p-1.5 ${colors.bg}`}>
                          <Icon className={`h-3 w-3 ${colors.icon}`} />
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{kpi.title}</span>
                      </div>
                      <div className="text-lg sm:text-xl font-semibold tabular-nums text-foreground mb-1">{kpi.value}</div>
                      <div className="h-6 mb-1.5 -mx-1">
                        <SparklineChart data={mockSparklineData} color={kpi.sparklineColor} height={24} />
                      </div>
                      {kpi.change > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="h-2.5 w-2.5" />
                          <span>+{kpi.change}%</span>
                        </div>
                      )}
                      {kpi.change === 0 && (
                        <div className="text-[10px] text-muted-foreground">Ingen förändring</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
