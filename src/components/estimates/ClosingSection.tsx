import { useState, useRef, useEffect } from "react";
import { ChevronDown, FileCheck } from "lucide-react";
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
    name: "Standard villkor",
    text: `Giltighetstid: Denna offert är giltig i 30 dagar från offertdatum.

Betalningsvillkor: 30 dagar netto. Fakturering sker löpande eller efter avslutat arbete enligt överenskommelse.

Garanti: Vi lämnar garanti enligt konsumenttjänstlagen. Garantitiden är 2 år på utfört arbete.

Tilläggsarbeten: Eventuella tilläggsarbeten som uppstår under projektets gång debiteras enligt löpande räkning med timpriser enligt denna offert.

Vid accept av denna offert ber vi er signera och returnera ett exemplar till oss.`,
  },
  {
    id: "short",
    name: "Kort version",
    text: `Offerten gäller i 30 dagar. Betalning 30 dagar netto. Vi lämnar 2 års garanti på utfört arbete.`,
  },
  {
    id: "rot",
    name: "ROT-villkor",
    text: `Giltighetstid: 30 dagar från offertdatum.

ROT-avdrag: Priserna är angivna inklusive ROT-avdrag. Vi ansöker om ROT-avdrag åt er hos Skatteverket. För att vi ska kunna göra detta behöver vi ert personnummer och en signerad fullmakt.

Betalningsvillkor: Faktura skickas efter avslutat arbete. Betalning inom 30 dagar.

Garanti: 2 år på utfört arbete enligt konsumenttjänstlagen.`,
  },
  {
    id: "empty",
    name: "Ingen avslutning",
    text: "",
  },
];

interface ClosingSectionProps {
  text: string;
  onChange: (text: string) => void;
  templates?: Template[];
}

export function ClosingSection({
  text,
  onChange,
  templates = DEFAULT_TEMPLATES,
}: ClosingSectionProps) {
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
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Villkor & Avslut
          </h2>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
            >
              <FileCheck className="h-3 w-3 mr-1" />
              Mall
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="text-[13px]"
              >
                {template.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={`relative rounded transition-colors ${
          isFocused ? "bg-muted/50" : "hover:bg-muted/30"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Lägg till villkor och avslutande text..."
          className="w-full min-h-[60px] p-2 text-[13px] leading-relaxed bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 whitespace-pre-wrap"
          rows={3}
        />
      </div>
    </section>
  );
}
