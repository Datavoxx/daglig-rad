import { useState, useRef, useEffect } from "react";
import { ChevronDown, FileCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}

export function ClosingSection({
  text,
  onChange,
}: ClosingSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user templates from database
  const { data: userTemplates } = useQuery({
    queryKey: ["estimate-text-templates", "closing"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("estimate_text_templates")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("type", "closing")
        .order("name");

      if (error) throw error;
      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        text: t.content,
      }));
    },
  });

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

  const hasUserTemplates = userTemplates && userTemplates.length > 0;

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Villkor & Avslut</CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                <FileCheck className="h-3 w-3 mr-1" />
                Mall
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {hasUserTemplates && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Mina mallar
                  </div>
                  {userTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="text-[13px]"
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Standardmallar
                  </div>
                </>
              )}
              {DEFAULT_TEMPLATES.map((template) => (
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
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Lägg till villkor och avslutande text..."
          className="w-full min-h-[80px] p-2 text-[13px] leading-relaxed bg-muted/30 border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-background placeholder:text-muted-foreground/50 transition-colors whitespace-pre-wrap"
          rows={3}
        />
      </CardContent>
    </Card>
  );
}
