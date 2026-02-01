import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, isToday, isWeekend } from "date-fns";
import { DayDetailPopover } from "./DayDetailPopover";

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

interface DayCellProps {
  date: Date;
  entries: TimeEntryWithDetails[];
  employees: Employee[];
  currentUserId?: string;
  onDayClick: (date: Date) => void;
  isCurrentMonth?: boolean;
  compact?: boolean;
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

export function DayCell({ 
  date, 
  entries,
  employees,
  currentUserId,
  onDayClick,
  isCurrentMonth = true,
  compact = false
}: DayCellProps) {
  const dayNumber = format(date, "d");
  const hours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const hasEntries = hours > 0;
  const today = isToday(date);
  const weekend = isWeekend(date);

  // Get unique users for avatars
  const uniqueUserIds = [...new Set(entries.map(e => e.user_id))];
  const maxAvatars = 3;
  const visibleUserIds = uniqueUserIds.slice(0, maxAvatars);
  const remainingCount = uniqueUserIds.length - maxAvatars;

  if (compact) {
    return (
      <DayDetailPopover 
        date={date} 
        entries={entries} 
        employees={employees}
        currentUserId={currentUserId}
        onAddEntry={onDayClick}
      >
        <button
          className={cn(
            "flex flex-col items-center p-1 rounded-md text-xs transition-colors",
            "hover:bg-accent/50",
            today && "ring-1 ring-primary",
            !isCurrentMonth && "opacity-40"
          )}
        >
          <span className="font-medium">{dayNumber}</span>
          {hasEntries ? (
            <>
              <span className="text-primary font-semibold">{hours.toFixed(1)}h</span>
              {uniqueUserIds.length > 0 && (
                <div className="flex -space-x-1 mt-0.5">
                  {visibleUserIds.slice(0, 2).map(userId => {
                    const name = getUserName(userId, employees, currentUserId);
                    return (
                      <Avatar key={userId} className="h-4 w-4 border border-background">
                        <AvatarFallback className={`${getAvatarColor(name)} text-white text-[6px]`}>
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </button>
      </DayDetailPopover>
    );
  }

  const cellContent = (
    <div
      className={cn(
        "min-h-[100px] p-2 border rounded-md transition-colors relative group cursor-pointer",
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
          onClick={(e) => {
            e.stopPropagation();
            onDayClick(date);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="mt-2 flex flex-col items-center">
        {hasEntries ? (
          <>
            <span className="text-lg font-bold text-primary">{hours.toFixed(1)}h</span>
            
            {/* Avatars row */}
            {uniqueUserIds.length > 0 && (
              <div className="flex -space-x-2 mt-1.5">
                {visibleUserIds.map(userId => {
                  const name = getUserName(userId, employees, currentUserId);
                  return (
                    <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className={`${getAvatarColor(name)} text-white text-[8px]`}>
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {remainingCount > 0 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-[8px] font-medium text-muted-foreground">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <span className="text-xs text-muted-foreground mt-1">
              {entries.length} {entries.length === 1 ? "post" : "poster"}
            </span>
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

  return (
    <DayDetailPopover 
      date={date} 
      entries={entries} 
      employees={employees}
      currentUserId={currentUserId}
      onAddEntry={onDayClick}
    >
      {cellContent}
    </DayDetailPopover>
  );
}
