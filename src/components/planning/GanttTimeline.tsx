import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { PhaseFlipCard } from "./PhaseFlipCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PlanPhase {
  name: string;
  start_week: number;
  duration_weeks: number;
  color: string;
  parallel_with?: string | null;
  description?: string;
}

interface GanttTimelineProps {
  phases: PlanPhase[];
  totalWeeks: number;
  className?: string;
}

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-300" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
};

export function GanttTimeline({ phases, totalWeeks, className }: GanttTimelineProps) {
  const weeks = useMemo(() => 
    Array.from({ length: totalWeeks }, (_, i) => i + 1), 
    [totalWeeks]
  );

  const columnWidth = 100 / totalWeeks;

  return (
    <TooltipProvider>
      <div className={cn("w-full overflow-x-auto", className)}>
        <div className="min-w-[600px]">
          {/* Header with week numbers */}
          <div className="flex border-b border-border pb-2 mb-4">
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 flex">
              {weeks.map((week) => (
                <div
                  key={week}
                  className="text-xs font-medium text-muted-foreground text-center"
                  style={{ width: `${columnWidth}%` }}
                >
                  V{week}
                </div>
              ))}
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-3">
            {phases.map((phase, index) => {
              const colors = colorClasses[phase.color] || colorClasses.slate;
              const leftOffset = ((phase.start_week - 1) / totalWeeks) * 100;
              const width = (phase.duration_weeks / totalWeeks) * 100;

              return (
                <div
                  key={`${phase.name}-${index}`}
                  className="flex items-center h-10 animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Phase name with tooltip */}
                  <div className="w-48 flex-shrink-0 pr-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn("text-sm font-medium truncate block cursor-default", colors.text)}>
                          {phase.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-medium">{phase.name}</p>
                        {phase.description && (
                          <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Timeline bar container */}
                  <div className="flex-1 relative h-8">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {weeks.map((week) => (
                        <div
                          key={week}
                          className="border-l border-border/30 first:border-l-0"
                          style={{ width: `${columnWidth}%` }}
                        />
                      ))}
                    </div>

                    {/* Phase bar with flip card */}
                    <PhaseFlipCard
                      phase={phase}
                      style={{
                        left: `${leftOffset}%`,
                        width: `${width}%`,
                      }}
                      colorClasses={colors}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary footer */}
          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {phases.length} moment • Klicka på en fas för detaljer
            </span>
            <span className="text-sm font-medium">
              Total: ca {totalWeeks} veckor
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
