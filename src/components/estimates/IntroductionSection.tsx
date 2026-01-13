import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  text: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "standard",
    name: "Standard",
    text: "Tack för ert förfrågningsunderlag. Vi har glädjen att presentera vår offert för ert projekt. Offerten inkluderar allt material och arbete enligt nedan specifikation.",
  },
  {
    id: "rot",
    name: "ROT-projekt",
    text: "Tack för att ni valt oss för ert renoveringsprojekt. Denna offert inkluderar ROT-avdrag vilket innebär att ni som privatperson kan få skattelättnad på arbetskostnaden. Vi hanterar ansökan om ROT-avdrag åt er.",
  },
  {
    id: "sales",
    name: "Försäljning",
    text: "Efter vår genomgång av era önskemål och behov har vi sammanställt denna offert. Vi är övertygade om att vår lösning kommer att möta era förväntningar och vi ser fram emot ett gott samarbete.",
  },
  {
    id: "empty",
    name: "Ingen inledning",
    text: "",
  },
];

interface IntroductionSectionProps {
  text: string;
  onChange: (text: string) => void;
  templates?: Template[];
}

export function IntroductionSection({
  text,
  onChange,
  templates = DEFAULT_TEMPLATES,
}: IntroductionSectionProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const applyTemplate = (template: Template) => {
    onChange(template.text);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inledning
          </h2>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Mall
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => applyTemplate(template)}
              >
                {template.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={`relative rounded-md transition-colors ${
          isFocused ? "bg-muted/50" : "hover:bg-muted/30"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Skriv en inledning till offerten..."
          className="w-full min-h-[60px] p-3 text-sm leading-relaxed bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50"
          rows={2}
        />
      </div>
    </section>
  );
}
