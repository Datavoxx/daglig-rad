import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, FileText } from "lucide-react";
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
}

export function IntroductionSection({
  text,
  onChange,
}: IntroductionSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user templates from database
  const { data: userTemplates } = useQuery({
    queryKey: ["estimate-text-templates", "introduction"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("estimate_text_templates")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("type", "introduction")
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
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Inledning</CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                <Sparkles className="h-3 w-3 mr-1" />
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
          placeholder="Skriv en inledning till offerten..."
          className="w-full min-h-[60px] p-2 text-[13px] leading-relaxed bg-muted/30 border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-background placeholder:text-muted-foreground/50 transition-colors"
          rows={2}
        />
      </CardContent>
    </Card>
  );
}
