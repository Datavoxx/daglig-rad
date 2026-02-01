import { useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek,
  isSameMonth 
} from "date-fns";
import { DayCell } from "./DayCell";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
}

interface MonthViewProps {
  currentDate: Date;
  entries: TimeEntry[];
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, entries, onDayClick }: MonthViewProps) {
  // Get all days to display (including padding from adjacent months)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
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

  const monthTotal = useMemo(() => {
    return entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
  }, [entries]);

  const dayNames = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  return (
    <div className="space-y-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map(name => (
          <div key={name} className="text-center text-sm font-medium text-muted-foreground py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayData = entriesByDate[dateKey] || { hours: 0, count: 0 };
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <DayCell
              key={dateKey}
              date={day}
              hours={dayData.hours}
              entryCount={dayData.count}
              onDayClick={onDayClick}
              isCurrentMonth={isCurrentMonth}
            />
          );
        })}
      </div>

      {/* Month total */}
      <div className="flex justify-end pt-4 border-t">
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Totalt denna månad</div>
          <div className="text-2xl font-bold text-primary">{monthTotal.toFixed(1)} timmar</div>
        </div>
      </div>
    </div>
  );
}
