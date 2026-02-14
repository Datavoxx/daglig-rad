import { FileText, FolderKanban, ClipboardList, Clock, Receipt, MapPin, UserPlus, Pencil, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickSuggestionsProps {
  onSelect: (prompt: string) => void;
}

const suggestions = [
  {
    label: "Skapa offert",
    icon: FileText,
    prompt: "Jag vill skapa en ny offert",
  },
  {
    label: "Skapa projekt",
    icon: FolderKanban,
    prompt: "Skapa ett nytt projekt",
  },
  {
    label: "Ny kund",
    icon: UserPlus,
    prompt: "Skapa en ny kund",
  },
  {
    label: "Ny dagrapport",
    icon: ClipboardList,
    prompt: "Skapa en ny dagrapport",
  },
  {
    label: "Registrera tid",
    icon: Clock,
    prompt: "Registrera tid på ett projekt",
  },
  {
    label: "Visa fakturor",
    icon: Receipt,
    prompt: "Visa mina kundfakturor",
  },
  {
    label: "Checka in",
    icon: MapPin,
    prompt: "Checka in mig på ett projekt",
  },
  {
    label: "Uppdatera projekt",
    icon: Pencil,
    prompt: "Jag vill uppdatera ett projekt",
  },
  {
    label: "Ny arbetsorder",
    icon: ClipboardList,
    prompt: "Skapa en ny arbetsorder",
  },
  {
    label: "Skapa planering",
    icon: CalendarDays,
    prompt: "Skapa en planering för ett projekt",
  },
];

export function QuickSuggestions({ onSelect }: QuickSuggestionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.label}
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all"
          onClick={() => onSelect(suggestion.prompt)}
        >
          <suggestion.icon className="h-4 w-4 text-muted-foreground" />
          <span>{suggestion.label}</span>
        </Button>
      ))}
    </div>
  );
}
