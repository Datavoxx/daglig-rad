import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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

interface DayDetailPopoverProps {
  date: Date;
  entries: TimeEntryWithDetails[];
  employees: Employee[];
  onAddEntry: (date: Date) => void;
  children: React.ReactNode;
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
  // Check if it's the current user (admin)
  if (userId === currentUserId) {
    return "Du";
  }
  
  // Find employee by linked_user_id
  const employee = employees.find(e => e.linked_user_id === userId);
  if (employee) {
    return employee.name;
  }
  
  return "Okänd";
}

export function DayDetailPopover({ 
  date, 
  entries, 
  employees, 
  onAddEntry,
  children 
}: DayDetailPopoverProps) {
  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  // Group entries by user for better display
  const entriesByUser = entries.reduce((acc, entry) => {
    if (!acc[entry.user_id]) {
      acc[entry.user_id] = [];
    }
    acc[entry.user_id].push(entry);
    return acc;
  }, {} as Record<string, TimeEntryWithDetails[]>);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-lg capitalize">
            {format(date, "d MMMM yyyy", { locale: sv })}
          </h3>
        </div>
        
        <Separator />
        
        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Inga tidsposter denna dag
            </p>
          ) : (
            entries.map((entry) => {
              const userName = getUserName(entry.user_id, employees);
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={`${getAvatarColor(userName)} text-white text-xs`}>
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{userName}</span>
                      <span className="font-semibold text-sm text-primary flex-shrink-0">
                        {Number(entry.hours).toFixed(1)}h
                      </span>
                    </div>
                    {entry.projects?.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.projects.name}
                      </p>
                    )}
                    {entry.description && (
                      <p className="text-xs text-muted-foreground italic truncate">
                        "{entry.description}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <Separator />
        
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Totalt</span>
            <span className="font-bold text-lg">{totalHours.toFixed(1)}h</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onAddEntry(date)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till tid
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
