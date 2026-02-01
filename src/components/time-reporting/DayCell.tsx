import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isWeekend } from "date-fns";

interface DayCellProps {
  date: Date;
  hours: number;
  entryCount: number;
  onDayClick: (date: Date) => void;
  isCurrentMonth?: boolean;
  compact?: boolean;
}

export function DayCell({ 
  date, 
  hours, 
  entryCount, 
  onDayClick,
  isCurrentMonth = true,
  compact = false
}: DayCellProps) {
  const dayNumber = format(date, "d");
  const hasEntries = hours > 0;
  const today = isToday(date);
  const weekend = isWeekend(date);

  if (compact) {
    return (
      <button
        onClick={() => onDayClick(date)}
        className={cn(
          "flex flex-col items-center p-1 rounded-md text-xs transition-colors",
          "hover:bg-accent/50",
          today && "ring-1 ring-primary",
          !isCurrentMonth && "opacity-40"
        )}
      >
        <span className="font-medium">{dayNumber}</span>
        {hasEntries ? (
          <span className="text-primary font-semibold">{hours.toFixed(1)}h</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "min-h-[80px] p-2 border rounded-md transition-colors relative group",
        today && "ring-2 ring-primary",
        weekend && "bg-muted/30",
        !isCurrentMonth && "opacity-40 bg-muted/20",
        "hover:bg-accent/50"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn(
          "text-sm font-medium",
          today && "text-primary font-bold"
        )}>
          {dayNumber}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDayClick(date)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="mt-2 flex flex-col items-center">
        {hasEntries ? (
          <>
            <span className="text-lg font-bold text-primary">{hours.toFixed(1)}h</span>
            {entryCount > 1 && (
              <span className="text-xs text-muted-foreground">{entryCount} poster</span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>
      
      {/* Activity indicator bar */}
      {hasEntries && (
        <div className="absolute bottom-1 left-2 right-2">
          <div 
            className="h-1 rounded-full bg-primary/30"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${Math.min(100, (hours / 8) * 100)}%, transparent ${Math.min(100, (hours / 8) * 100)}%)`
            }}
          />
        </div>
      )}
    </div>
  );
}
