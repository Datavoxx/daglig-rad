import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TemplateEditor } from "./TemplateEditor";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface ParsedTemplate {
  name: string;
  description?: string;
  hourly_rates: Record<string, number>;
  work_items: Array<{
    wbs: string;
    name: string;
    unit: string;
    resource: string;
    hours_per_unit: number;
  }>;
  cost_library: Array<{
    id: string;
    name: string;
    unit: string;
    price: number;
  }>;
  material_spill_percent?: number;
  overhead_percent?: number;
  risk_percent?: number;
  profit_percent?: number;
  vat_percent?: number;
  establishment_cost?: number;
}

export function CreateTemplateDialog({ open, onOpenChange, onCreated }: CreateTemplateDialogProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [parsedTemplate, setParsedTemplate] = useState<ParsedTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Din webbläsare stöder inte röstinspelning");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "sv-SE";

    finalTranscriptRef.current = transcript;

    recognitionRef.current.onresult = (event: any) => {
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final.trim();
        setTranscript(finalTranscriptRef.current);
      }
      
      setInterimTranscript(interim);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setInterimTranscript("");
  };

  const handleParseTemplate = async () => {
    if (!transcript.trim()) {
      toast.error("Beskriv mallen först");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-template-voice", {
        body: { transcript: transcript.trim() },
      });

      if (error) throw error;

      setParsedTemplate(data);
      setStep("review");
    } catch (error) {
      console.error("Error parsing template:", error);
      toast.error("Kunde inte tolka mallen. Försök igen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTemplate = async (template: ParsedTemplate) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Du måste vara inloggad");
        return;
      }

      const { error } = await supabase.from("estimate_templates").insert({
        user_id: user.id,
        name: template.name,
        description: template.description,
        hourly_rates: template.hourly_rates,
        work_items: template.work_items,
        cost_library: template.cost_library,
        material_spill_percent: template.material_spill_percent ?? 7,
        overhead_percent: template.overhead_percent ?? 12,
        risk_percent: template.risk_percent ?? 8,
        profit_percent: template.profit_percent ?? 10,
        vat_percent: template.vat_percent ?? 25,
        establishment_cost: template.establishment_cost ?? 4500,
      });

      if (error) throw error;

      toast.success("Mall skapad!");
      resetAndClose();
      onCreated();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Kunde inte spara mallen");
    } finally {
      setIsSaving(false);
    }
  };

  const resetAndClose = () => {
    setStep("input");
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    setParsedTemplate(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? "Skapa kalkylmall" : "Granska mall"}
          </DialogTitle>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Beskriv din mall med röst eller text. Exempel:
              <p className="mt-2 italic">
                "Badrumsrenovering standard. Snickare sexhundratjugo i timmen, plattsättare sexhundranittio, VVS sjuhundrafemtio. 
                Momenten är rivning, underarbete, tätskikt golv och vägg, kakel och klinker, VVS-arbeten och el."
              </p>
            </div>

            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <div className="relative">
                <Textarea
                  value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    finalTranscriptRef.current = e.target.value;
                  }}
                  placeholder="Beskriv mallens priser, moment och material..."
                  className="min-h-[150px] pr-12"
                  disabled={isRecording}
                />
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Lyssnar...
                  {interimTranscript && (
                    <span className="text-muted-foreground italic truncate max-w-[200px]">
                      "{interimTranscript}"
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetAndClose}>
                Avbryt
              </Button>
              <Button 
                onClick={handleParseTemplate} 
                disabled={!transcript.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Tolkar...
                  </>
                ) : (
                  "Skapa mall"
                )}
              </Button>
            </div>
          </div>
        ) : parsedTemplate ? (
          <TemplateEditor
            template={parsedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setStep("input")}
            isSaving={isSaving}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
