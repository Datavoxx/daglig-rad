import { format, isToday, isWeekend } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

interface DayData {
  date: Date;
  dateKey: string;
  entries: TimeEntryWithDetails[];
  totalHours: number;
}

interface MobileDayListProps {
  days: Date[];
  entriesByDate: Record<string, TimeEntryWithDetails[]>;
  employees: Employee[];
  currentUserId?: string;
  onDayClick: (date: Date) => void;
  totalLabel: string;
  totalHours: number;
  isCurrentMonth?: (date: Date) => boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getUserName(userId: string, employees: Employee[], currentUserId?: string): string {
  if (userId === currentUserId) {
    return "Du";
  }
  const employee = employees.find(e => e.linked_user_id === userId);
  if (employee) {
    return employee.name;
  }
  return "Okänd";
}

export function MobileDayList({
  days,
  entriesByDate,
  employees,
  currentUserId,
  onDayClick,
  totalLabel,
  totalHours,
  isCurrentMonth,
}: MobileDayListProps) {
  const dayDataList: DayData[] = days.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const entries = entriesByDate[dateKey] || [];
    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    return { date, dateKey, entries, totalHours };
  });

  return (
    <div className="space-y-4">
      {/* Day list */}
      <div className="space-y-2">
        {dayDataList.map(({ date, dateKey, entries, totalHours }) => {
          const today = isToday(date);
          const weekend = isWeekend(date);
          const hasEntries = totalHours > 0;
          const isInCurrentMonth = isCurrentMonth ? isCurrentMonth(date) : true;

          // Get unique users for this day
          const uniqueUserIds = [...new Set(entries.map(e => e.user_id))];

          // Group entries by user for display
          const entriesByUser = entries.reduce((acc, entry) => {
            if (!acc[entry.user_id]) {
              acc[entry.user_id] = { hours: 0, projects: new Set<string>() };
            }
            acc[entry.user_id].hours += Number(entry.hours);
            if (entry.projects?.name) {
              acc[entry.user_id].projects.add(entry.projects.name);
            }
            return acc;
          }, {} as Record<string, { hours: number; projects: Set<string> }>);

          return (
            <div
              key={dateKey}
              className={cn(
                "p-4 border rounded-lg bg-card transition-colors cursor-pointer active:bg-accent/50",
                today && "ring-2 ring-primary",
                weekend && !hasEntries && "bg-muted/30",
                !isInCurrentMonth && "opacity-50"
              )}
              onClick={() => onDayClick(date)}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                    today ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {format(date, "d")}
                  </div>
                  <div>
                    <div className={cn(
                      "font-medium capitalize",
                      today && "text-primary"
                    )}>
                      {format(date, "EEEE", { locale: sv })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(date, "d MMMM", { locale: sv })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasEntries ? (
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {totalHours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entries.length} {entries.length === 1 ? "post" : "poster"}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(date);
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Entry details */}
              {hasEntries && uniqueUserIds.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {uniqueUserIds.slice(0, 3).map(userId => {
                    const name = getUserName(userId, employees, currentUserId);
                    const userData = entriesByUser[userId];
                    const projectNames = Array.from(userData.projects).slice(0, 2).join(", ");
                    const moreProjects = userData.projects.size > 2 ? ` +${userData.projects.size - 2}` : "";

                    return (
                      <div key={userId} className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className={`${getAvatarColor(name)} text-white text-[10px]`}>
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{name}</span>
                            <span className="text-sm text-primary font-semibold">
                              {userData.hours.toFixed(1)}h
                            </span>
                          </div>
                          {projectNames && (
                            <div className="text-xs text-muted-foreground truncate">
                              {projectNames}{moreProjects}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {uniqueUserIds.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-10">
                      +{uniqueUserIds.length - 3} fler personer
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!hasEntries && (
                <div className="text-sm text-muted-foreground pl-13">
                  Ingen tid registrerad
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex justify-end pt-4 border-t">
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{totalLabel}</div>
          <div className="text-2xl font-bold text-primary">{totalHours.toFixed(1)} timmar</div>
        </div>
      </div>
    </div>
  );
}
