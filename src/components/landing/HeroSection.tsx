import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, FolderKanban, Calculator, Wallet, Users, TrendingUp, Sparkles } from "lucide-react";
import AnimatedAIOrb from "./AnimatedAIOrb";
import TiltCard from "./TiltCard";
import SparklineChart from "../dashboard/SparklineChart";

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
