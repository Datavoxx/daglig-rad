import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addWeeks, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import type { PlanPhase } from "./GanttTimeline";

interface PlanningMobileOverviewProps {
  phases: PlanPhase[];
  totalWeeks: number;
  startDate?: Date;
}

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
};

// Get date range for a phase
const getPhaseWeekDates = (startDate: Date, startWeek: number, durationWeeks: number): string => {
  const phaseStart = addWeeks(startDate, startWeek - 1);
  const phaseEnd = addDays(addWeeks(phaseStart, durationWeeks - 1), 4); // Friday
  return `${format(phaseStart, "d MMM", { locale: sv })} – ${format(phaseEnd, "d MMM", { locale: sv })}`;
};

export function PlanningMobileOverview({ phases, totalWeeks, startDate }: PlanningMobileOverviewProps) {
  return (
    <div className="space-y-3">
      {phases.map((phase, index) => {
        const colors = colorClasses[phase.color] || colorClasses.slate;
        
        return (
          <Card 
            key={`${phase.name}-${index}`}
            className={`${colors.border} border-l-4 animate-in fade-in slide-in-from-bottom-2`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${colors.text}`}>{phase.name}</h3>
                  {phase.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {phase.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant="secondary" className={`${colors.bg} ${colors.text} text-xs`}>
                    V{phase.start_week}–V{phase.start_week + phase.duration_weeks - 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {phase.duration_weeks} {phase.duration_weeks === 1 ? 'vecka' : 'veckor'}
                  </span>
                </div>
              </div>
              
              {startDate && (
                <div className="mt-2 text-xs text-muted-foreground">
                  📅 {getPhaseWeekDates(startDate, phase.start_week, phase.duration_weeks)}
                </div>
              )}
              
              {phase.parallel_with && (
                <div className="mt-1 text-xs text-muted-foreground">
                  ⚡ Parallellt med {phase.parallel_with}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {/* Summary */}
      <div className="text-center py-4 border-t border-border mt-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{phases.length} moment</span>
          {" • "}
          <span className="font-medium text-foreground">ca {totalWeeks} veckor</span>
        </p>
      </div>
    </div>
  );
}
