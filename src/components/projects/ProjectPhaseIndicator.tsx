import { Check, CircleDot, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PlanPhase {
  name: string;
  weeks: number;
}

interface ProjectPhaseIndicatorProps {
  projectStatus: string | null;
  plan: {
    phases: PlanPhase[];
    total_weeks: number | null;
    start_date: string | null;
  } | null;
}

const STATUS_STEPS = [
  { key: "planning", label: "Planering" },
  { key: "active", label: "Pågående" },
  { key: "closing", label: "Slutskede" },
  { key: "completed", label: "Avslutat" },
];

export default function ProjectPhaseIndicator({ projectStatus, plan }: ProjectPhaseIndicatorProps) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === projectStatus);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Calculate planning progress if plan exists
  let planProgress = 0;
  let currentPhaseName: string | null = null;

  if (plan?.start_date && plan?.total_weeks && plan.phases?.length) {
    const start = new Date(plan.start_date);
    const now = new Date();
    const elapsedWeeks = Math.max(0, (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    planProgress = Math.min(100, Math.round((elapsedWeeks / plan.total_weeks) * 100));

    // Find current phase
    let weekAccum = 0;
    for (const phase of plan.phases) {
      weekAccum += phase.weeks || 0;
      if (elapsedWeeks <= weekAccum) {
        currentPhaseName = phase.name;
        break;
      }
    }
    if (!currentPhaseName && plan.phases.length > 0) {
      currentPhaseName = plan.phases[plan.phases.length - 1].name;
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Projektstatus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Phase stepper */}
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-border" />
          <div
            className="absolute top-5 left-[calc(12.5%)] h-0.5 bg-primary transition-all duration-500"
            style={{
              width: activeIndex === 0 ? "0%" : `${(activeIndex / (STATUS_STEPS.length - 1)) * 75}%`,
            }}
          />

          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i < activeIndex;
            const isActive = i === activeIndex;
            const isFuture = i > activeIndex;

            return (
              <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isActive && "bg-primary/10 border-primary text-primary ring-4 ring-primary/20 animate-pulse",
                    isFuture && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <CircleDot className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    isActive && "text-primary",
                    isCompleted && "text-foreground",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Plan details if available */}
        {plan?.phases?.length ? (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {currentPhaseName ? (
                  <>
                    Aktuell fas: <span className="font-medium text-foreground">{currentPhaseName}</span>
                  </>
                ) : (
                  "Planering ej startad"
                )}
              </span>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">{planProgress}%</span>
            </div>
            <Progress value={planProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {plan.total_weeks} veckor totalt · {plan.phases.length} faser
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
