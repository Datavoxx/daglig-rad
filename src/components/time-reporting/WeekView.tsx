import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { DayCell } from "./DayCell";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
}

interface WeekViewProps {
  currentDate: Date;
  entries: TimeEntry[];
  onDayClick: (date: Date) => void;
}

export function WeekView({ currentDate, entries, onDayClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, { hours: number; count: number }> = {};
    entries.forEach(entry => {
      const dateKey = entry.date;
      if (!map[dateKey]) {
        map[dateKey] = { hours: 0, count: 0 };
      }
      map[dateKey].hours += Number(entry.hours);
      map[dateKey].count += 1;
    });
    return map;
  }, [entries]);

  const weekTotal = useMemo(() => {
    return weekDays.reduce((sum, day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      return sum + (entriesByDate[dateKey]?.hours || 0);
    }, 0);
  }, [weekDays, entriesByDate]);

  const dayNames = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  return (
    <div className="space-y-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((name, i) => (
          <div key={name} className="text-center text-sm font-medium text-muted-foreground py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayData = entriesByDate[dateKey] || { hours: 0, count: 0 };
          
          return (
            <DayCell
              key={dateKey}
              date={day}
              hours={dayData.hours}
              entryCount={dayData.count}
              onDayClick={onDayClick}
            />
          );
        })}
      </div>

      {/* Week total */}
      <div className="flex justify-end pt-4 border-t">
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Totalt denna vecka</div>
          <div className="text-2xl font-bold text-primary">{weekTotal.toFixed(1)} timmar</div>
        </div>
      </div>
    </div>
  );
}
