import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { Clock, Plus, ChevronDown, ChevronUp, Users, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TimeCalendarView } from "@/components/time-reporting/TimeCalendarView";

interface ProjectTimeSectionProps {
  projectId: string;
  projectName: string;
  onRegisterTime?: () => void;
}

export default function ProjectTimeSection({ projectId, projectName, onRegisterTime }: ProjectTimeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch time entries for this project
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ["project-time-entries", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          billing_types:billing_type_id(name, abbreviation),
          salary_types:salary_type_id(name, abbreviation)
        `)
        .eq("project_id", projectId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = timeEntries.reduce((sum, e) => sum + Number(e.hours), 0);
    const uniqueUsers = new Set(timeEntries.map(e => e.user_id)).size;
    return {
      totalHours,
      totalEntries: timeEntries.length,
      uniqueUsers,
    };
  }, [timeEntries]);

  // Calculate weekly breakdown (last 4 weeks)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks = [];
    
    for (let i = 0; i < 4; i++) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
      
      const weekHours = timeEntries
        .filter(e => {
          const entryDate = new Date(e.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        })
        .reduce((sum, e) => sum + Number(e.hours), 0);
      
      weeks.unshift({
        label: `v.${format(weekStart, "w")}`,
        hours: weekHours,
      });
    }
    
    return weeks;
  }, [timeEntries]);

  const maxWeekHours = Math.max(...weeklyData.map(w => w.hours), 1);

  const handleDayClick = (date: Date) => {
    // Could open a registration dialog with the date prefilled
    console.log("Day clicked:", date);
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Tidsrapportering</CardTitle>
                <CardDescription>Arbetad tid på projektet</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Visa kalender</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-2xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Tidsrapportering - {projectName}</SheetTitle>
                    <SheetDescription>
                      Kalendervy över arbetade timmar
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <TimeCalendarView 
                      onDayClick={handleDayClick} 
                      projectId={projectId}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Laddar...</div>
          ) : timeEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground">Inga tidsregistreringar ännu</div>
          ) : (
            <div className="space-y-4">
              {/* Quick stats */}
              <div className="flex flex-wrap gap-2 md:gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stats.totalHours.toFixed(1)}h</span>
                  <span className="text-muted-foreground">totalt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stats.totalEntries}</span>
                  <span className="text-muted-foreground">poster</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stats.uniqueUsers}</span>
                  <span className="text-muted-foreground">{stats.uniqueUsers === 1 ? "person" : "personer"}</span>
                </div>
              </div>

              {/* Mini week bars */}
              <div className="flex gap-2">
                {weeklyData.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full h-6 md:h-8 flex items-end">
                      <div 
                        className="w-full bg-primary rounded-sm"
                        style={{ height: `${Math.max(2, (week.hours / maxWeekHours) * 16)}px` }}
                      />
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground mt-1">{week.label}</span>
                    <span className="text-[10px] md:text-xs font-medium">{week.hours > 0 ? `${week.hours.toFixed(0)}h` : "-"}</span>
                  </div>
                ))}
              </div>

              {/* Expandable content */}
              <CollapsibleContent className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Senaste registreringar
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {timeEntries.slice(0, 10).map((entry: any) => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-card text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {format(new Date(entry.date), "d MMM", { locale: sv })}
                        </span>
                        {entry.billing_types?.abbreviation && (
                          <Badge variant="outline" className="text-xs">
                            {entry.billing_types.abbreviation}
                          </Badge>
                        )}
                        {entry.description && (
                          <span className="text-muted-foreground truncate max-w-[150px]">
                            {entry.description}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{Number(entry.hours).toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
                {timeEntries.length > 10 && (
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    size="sm"
                    onClick={() => setIsSheetOpen(true)}
                  >
                    Visa alla {timeEntries.length} poster
                  </Button>
                )}
              </CollapsibleContent>
            </div>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
}
