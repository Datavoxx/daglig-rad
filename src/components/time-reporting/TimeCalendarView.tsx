import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth
} from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";

interface TimeCalendarViewProps {
  onDayClick: (date: Date) => void;
  projectId?: string;
}

export function TimeCalendarView({ onDayClick, projectId }: TimeCalendarViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
      };
    }
    return {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    };
  }, [currentDate, viewMode]);

  // Fetch time entries for the current period
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["time-entries-calendar", dateRange.start, dateRange.end, projectId],
    queryFn: async () => {
      let query = supabase
        .from("time_entries")
        .select("id, date, hours, project_id")
        .gte("date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("date", format(dateRange.end, "yyyy-MM-dd"));

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const navigatePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTitle = () => {
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "d MMM", { locale: sv })} - ${format(weekEnd, "d MMM yyyy", { locale: sv })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: sv });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg min-w-[200px] text-center capitalize">
              {getTitle()}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2">
              Idag
            </Button>
          </div>

          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "week" | "month")}>
            <ToggleGroupItem value="week" aria-label="Veckovy">
              <CalendarDays className="h-4 w-4 mr-2" />
              Vecka
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Månadsvy">
              <Calendar className="h-4 w-4 mr-2" />
              Månad
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Laddar...
          </div>
        ) : viewMode === "week" ? (
          <WeekView 
            currentDate={currentDate} 
            entries={entries} 
            onDayClick={onDayClick} 
          />
        ) : (
          <MonthView 
            currentDate={currentDate} 
            entries={entries} 
            onDayClick={onDayClick} 
          />
        )}
      </CardContent>
    </Card>
  );
}
