import { Clock, FileText, Calculator, Calendar, Camera, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TiltCard from "./TiltCard";

const comparisons = [
  {
    icon: FileText,
    task: "Skapa dagrapport",
    traditional: { time: 45, unit: "min" },
    byggio: { time: 3, unit: "min" },
    saving: 93,
  },
  {
    icon: Calculator,
    task: "Skicka offert",
    traditional: { time: 2, unit: "tim" },
    byggio: { time: 15, unit: "min" },
    saving: 87,
  },
  {
    icon: Calendar,
    task: "Projektplanering",
    traditional: { time: 3, unit: "tim" },
    byggio: { time: 30, unit: "min" },
    saving: 83,
  },
  {
    icon: Camera,
    task: "Dokumentera arbete",
    traditional: { time: 20, unit: "min" },
    byggio: { time: 2, unit: "min" },
    saving: 90,
  },
];

const TimeComparisonSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Clock className="h-4 w-4" />
            Spara tid varje dag
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Se hur mycket snabbare du blir
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Jämför vanliga arbetsuppgifter – traditionella metoder mot Byggio.
          </p>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {comparisons.map((item, index) => {
            const Icon = item.icon;
            // Calculate bar widths (byggio is always shorter)
            const traditionalWidth = 100;
            const byggioWidth = Math.max(5, (100 - item.saving));
            
            return (
              <TiltCard
                key={item.task}
                maxTilt={10}
                glareEnabled={true}
                className="stagger-item"
              >
                <div className="group relative">
                  {/* Hover glow */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <Card 
                    className="relative border-border/50 bg-card shadow-lg transition-all duration-300 group-hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Top highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-xl" />
                    
                    <CardContent className="p-6">
                      {/* Task header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">{item.task}</h3>
                      </div>

                      {/* Time comparison bars */}
                      <div className="space-y-4">
                        {/* Traditional */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Traditionellt</span>
                            <span className="font-medium text-foreground/70">
                              {item.traditional.time} {item.traditional.unit}
                            </span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-400/60 to-red-500/60 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${traditionalWidth}%` }}
                            />
                          </div>
                        </div>

                        {/* Byggio */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Med Byggio</span>
                            <span className="font-medium text-primary">
                              {item.byggio.time} {item.byggio.unit}
                            </span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${byggioWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Saving badge */}
                      <div className="mt-5 flex items-center gap-2 text-sm">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="font-semibold text-emerald-600">
                          {item.saving}% snabbare
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TimeComparisonSection;
