import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PhaseFlipCard } from "./PhaseFlipCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { addDays, format } from "date-fns";
import { sv } from "date-fns/locale";

export interface PlanPhase {
  name: string;
  start_day: number;
  duration_days: number;
  color: string;
  parallel_with?: string | null;
  description?: string;
  // Legacy fields for backward compatibility
  start_week?: number;
  duration_weeks?: number;
}

// Convert legacy week-based phase to day-based
export function normalizePhaseToDays(phase: any): PlanPhase {
  if (phase.start_day !== undefined && phase.duration_days !== undefined) {
    return phase as PlanPhase;
  }
  // Legacy conversion: week -> days (5 working days per week)
  const startWeek = phase.start_week || 1;
  const durationWeeks = phase.duration_weeks || 1;
  return {
    ...phase,
    start_day: (startWeek - 1) * 5 + 1,
    duration_days: durationWeeks * 5,
  };
}

interface GanttTimelineProps {
  phases: PlanPhase[];
  totalDays: number;
  startDate?: Date;
  className?: string;
  // Legacy prop
  totalWeeks?: number;
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

export function GanttTimeline({ phases: rawPhases, totalDays: rawTotalDays, totalWeeks, startDate, className }: GanttTimelineProps) {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  // Normalize phases to day-based
  const phases = useMemo(() => rawPhases.map(normalizePhaseToDays), [rawPhases]);

  // Calculate totalDays from legacy totalWeeks if needed
  const totalDays = rawTotalDays || (totalWeeks ? totalWeeks * 5 : 
    Math.max(...phases.map(p => p.start_day + p.duration_days - 1), 1));

  // Group days into weeks for header display
  const totalWeeksDisplay = Math.ceil(totalDays / 5);
  const weeks = useMemo(() => 
    Array.from({ length: totalWeeksDisplay }, (_, i) => i + 1), 
    [totalWeeksDisplay]
  );

  const columnWidth = 100 / totalWeeksDisplay;

  // Get week date range
  const getWeekDateRange = (weekNumber: number): string => {
    if (!startDate) return "";
    const weekStart = addDays(startDate, (weekNumber - 1) * 5);
    const weekEnd = addDays(weekStart, 4);
    return `${format(weekStart, "d", { locale: sv })}-${format(weekEnd, "d MMM", { locale: sv })}`;
  };

  const endDate = startDate ? addDays(startDate, totalDays - 1) : undefined;

  return (
    <TooltipProvider>
      <div className={cn("w-full overflow-x-auto", className)}>
        <div className="min-w-[600px]">
          {/* Header with week numbers and dates */}
          <div className="flex border-b border-border pb-2 mb-4">
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 flex">
              {weeks.map((week) => (
                <div
                  key={week}
                  className="text-center"
                  style={{ width: `${columnWidth}%` }}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    V{week}
                  </div>
                  {startDate && (
                    <div className="text-[10px] text-muted-foreground/70">
                      {getWeekDateRange(week)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-3">
            {phases.map((phase, index) => {
              const colors = colorClasses[phase.color] || colorClasses.slate;
              const leftOffset = ((phase.start_day - 1) / totalDays) * 100;
              const width = (phase.duration_days / totalDays) * 100;

              return (
                <div
                  key={`${phase.name}-${index}`}
                  className="flex items-center h-10 animate-in fade-in slide-in-from-left-2 relative"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    zIndex: flippedIndex === index ? 50 : 'auto'
                  }}
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
                    {/* Grid lines (per week) */}
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
                      isFlipped={flippedIndex === index}
                      onFlip={() => setFlippedIndex(flippedIndex === index ? null : index)}
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
              Total: ca {totalDays} dagar
              {startDate && endDate && (
                <span className="text-muted-foreground font-normal">
                  {" "}• {format(startDate, "d MMM", { locale: sv })} → {format(endDate, "d MMM yyyy", { locale: sv })}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
