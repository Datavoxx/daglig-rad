import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { DayCell } from "./DayCell";

interface TimeEntryWithDetails {
  id: string;
  date: string;
  hours: number;
  project_id: string;
  user_id: string;
  description?: string | null;
  projects?: { name: string } | null;
  billing_types?: { abbreviation: string } | null;
}

interface Employee {
  id: string;
  name: string;
  linked_user_id: string | null;
}

interface WeekViewProps {
  currentDate: Date;
  entries: TimeEntryWithDetails[];
  employees: Employee[];
  currentUserId?: string;
  onDayClick: (date: Date) => void;
}

export function WeekView({ currentDate, entries, employees, currentUserId, onDayClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, TimeEntryWithDetails[]> = {};
    entries.forEach(entry => {
      const dateKey = entry.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(entry);
    });
    return map;
  }, [entries]);

  const weekTotal = useMemo(() => {
    return entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
  }, [entries]);

  const dayNames = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  return (
    <div className="space-y-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-sm font-medium text-muted-foreground py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEntries = entriesByDate[dateKey] || [];
          
          return (
            <DayCell
              key={dateKey}
              date={day}
              entries={dayEntries}
              employees={employees}
              currentUserId={currentUserId}
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
