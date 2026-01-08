import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, MicOff, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectPricing {
  hourly_rate_carpenter: number;
  hourly_rate_painter: number;
  hourly_rate_tiler: number;
  hourly_rate_general: number;
  material_markup_percent: number;
  default_estimate_markup: number;
  vat_percent: number;
}

interface ProjectPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  pricing: ProjectPricing;
  onPricingChange: (pricing: ProjectPricing) => void;
  onSave: () => Promise<void>;
}

const defaultPricing: ProjectPricing = {
  hourly_rate_carpenter: 520,
  hourly_rate_painter: 480,
  hourly_rate_tiler: 520,
  hourly_rate_general: 500,
  material_markup_percent: 10,
  default_estimate_markup: 15,
  vat_percent: 25,
};

export function ProjectPricingDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  pricing,
  onPricingChange,
  onSave,
}: ProjectPricingDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const isSpeechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = () => {
    if (!isSpeechRecognitionSupported) {
      toast.error("Din webbläsare stöder inte röstinspelning. Prova Chrome eller Edge.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final.trim();
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        toast.error("Röstinspelningen avbröts");
      }
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      if (isRecording && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Spela in dina priser – t.ex. 'Snickare 520, målare 480...'");
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setInterimTranscript("");

      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        await parsePricingFromVoice(transcript);
      } else {
        toast.info("Ingen text tolkades");
      }
    }
  };

  const parsePricingFromVoice = async (transcript: string) => {
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-pricing-voice", {
        body: { transcript },
      });

      if (error) throw error;

      if (data) {
        const newPricing: ProjectPricing = {
          hourly_rate_carpenter: data.hourly_rate_carpenter ?? pricing.hourly_rate_carpenter,
          hourly_rate_painter: data.hourly_rate_painter ?? pricing.hourly_rate_painter,
          hourly_rate_tiler: data.hourly_rate_tiler ?? pricing.hourly_rate_tiler,
          hourly_rate_general: data.hourly_rate_general ?? pricing.hourly_rate_general,
          material_markup_percent: data.material_markup_percent ?? pricing.material_markup_percent,
          default_estimate_markup: data.default_estimate_markup ?? pricing.default_estimate_markup,
          vat_percent: data.vat_percent ?? pricing.vat_percent,
        };
        onPricingChange(newPricing);
        toast.success("Priser uppdaterade från röstinput");
      }
    } catch (error: any) {
      console.error("Failed to parse pricing:", error);
      toast.error("Kunde inte tolka priserna");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      toast.success("Projektpriser sparade");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save pricing:", error);
      toast.error("Kunde inte spara priserna");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Priser för: {projectName}</span>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isParsing}
            >
              {isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tolkar...
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stoppa
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Spela in
                </>
              )}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Ställ in timpriser och påslag för detta projekt. Du kan även spela in med rösten.
          </DialogDescription>
        </DialogHeader>

        {interimTranscript && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground italic">
            {interimTranscript}
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* Hourly rates */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Timpriser
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rate-carpenter" className="text-sm">Snickare</Label>
                <div className="relative">
                  <Input
                    id="rate-carpenter"
                    type="number"
                    value={pricing.hourly_rate_carpenter}
                    onChange={(e) => onPricingChange({ ...pricing, hourly_rate_carpenter: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-painter" className="text-sm">Målare</Label>
                <div className="relative">
                  <Input
                    id="rate-painter"
                    type="number"
                    value={pricing.hourly_rate_painter}
                    onChange={(e) => onPricingChange({ ...pricing, hourly_rate_painter: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-tiler" className="text-sm">Plattsättare</Label>
                <div className="relative">
                  <Input
                    id="rate-tiler"
                    type="number"
                    value={pricing.hourly_rate_tiler}
                    onChange={(e) => onPricingChange({ ...pricing, hourly_rate_tiler: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-general" className="text-sm">Allmänt arbete</Label>
                <div className="relative">
                  <Input
                    id="rate-general"
                    type="number"
                    value={pricing.hourly_rate_general}
                    onChange={(e) => onPricingChange({ ...pricing, hourly_rate_general: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/tim</span>
                </div>
              </div>
            </div>
          </div>

          {/* Markups */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Påslag
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="material-markup" className="text-sm">Materialpåslag</Label>
                <div className="relative">
                  <Input
                    id="material-markup"
                    type="number"
                    value={pricing.material_markup_percent}
                    onChange={(e) => onPricingChange({ ...pricing, material_markup_percent: Number(e.target.value) })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimate-markup" className="text-sm">Kalkylpåslag</Label>
                <div className="relative">
                  <Input
                    id="estimate-markup"
                    type="number"
                    value={pricing.default_estimate_markup}
                    onChange={(e) => onPricingChange({ ...pricing, default_estimate_markup: Number(e.target.value) })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Spara
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
