import { useState } from "react";
import { Mic, MicOff, Loader2, X, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VoiceFormType = 
  | "daily-report" 
  | "estimate" 
  | "work-order" 
  | "customer" 
  | "time";

interface VoiceFormSectionProps {
  formType: VoiceFormType;
  onDataExtracted: (data: Record<string, unknown>) => void;
  projectId?: string;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "confirming" | "processing";

export function VoiceFormSection({
  formType,
  onDataExtracted,
  projectId,
  disabled,
}: VoiceFormSectionProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");

  const {
    isRecording,
    isTranscribing,
    interimTranscript,
    finalTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
  } = useVoiceRecorder({
    onTranscriptUpdate: (text) => {
      setTranscript(text);
    },
    onTranscriptComplete: (text) => {
      setTranscript(text);
      setEditedTranscript(text);
      setState("confirming");
    },
  });

  const handleStartRecording = () => {
    setTranscript("");
    setEditedTranscript("");
    setState("recording");
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
    // State will change to "confirming" via onTranscriptComplete callback
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setState("idle");
    setTranscript("");
    setEditedTranscript("");
  };

  const handleCancelConfirm = () => {
    setState("idle");
    setTranscript("");
    setEditedTranscript("");
  };

  const handleProcessTranscript = async () => {
    if (!editedTranscript.trim()) {
      toast.error("Inget röstmeddelande att bearbeta");
      return;
    }

    setState("processing");

    try {
      const { data, error } = await supabase.functions.invoke("extract-form-data", {
        body: {
          transcript: editedTranscript.trim(),
          formType,
          context: {
            projectId,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      onDataExtracted(data);
      toast.success("Formuläret har fyllts i automatiskt");
      setState("idle");
      setTranscript("");
      setEditedTranscript("");
    } catch (error) {
      console.error("[VoiceFormSection] Error processing transcript:", error);
      toast.error("Kunde inte bearbeta röstmeddelandet");
      setState("confirming"); // Go back to confirmation state
    }
  };

  const getFormTypeLabel = () => {
    switch (formType) {
      case "daily-report":
        return "dagrapport";
      case "estimate":
        return "offert";
      case "work-order":
        return "arbetsorder";
      case "customer":
        return "kundinformation";
      case "time":
        return "tidsregistrering";
      default:
        return "formulär";
    }
  };

  if (!isSupported) {
    return null;
  }

  // Idle state
  if (state === "idle") {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">
              Låt Byggio AI hjälpa dig
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Spela in ett röstmeddelande så fyller vi i {getFormTypeLabel()}en automatiskt
            </p>
          </div>
        </div>

        <Button
          onClick={handleStartRecording}
          disabled={disabled}
          className="mt-3 w-full gap-2"
          variant="outline"
        >
          <Mic className="h-4 w-4" />
          Starta inspelning
        </Button>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          <span>Spara 70% av din tid genom att prata</span>
        </div>
      </div>
    );
  }

  // Recording state
  if (state === "recording") {
    const displayTranscript = finalTranscript || interimTranscript || transcript;
    
    return (
      <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {isTranscribing ? "Transkriberar..." : "Spelar in..."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelRecording}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {displayTranscript && (
          <div className="rounded-lg bg-background/50 border border-border/40 p-3 mb-3 min-h-[60px]">
            <p className="text-sm text-foreground/80 italic">
              "{displayTranscript}"
            </p>
          </div>
        )}

        <Button
          onClick={handleStopRecording}
          disabled={isTranscribing}
          className="w-full gap-2"
          variant="destructive"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Bearbetar ljud...
            </>
          ) : (
            <>
              <MicOff className="h-4 w-4" />
              Stoppa inspelning
            </>
          )}
        </Button>
      </div>
    );
  }

  // Confirming state
  if (state === "confirming") {
    return (
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">
            Bekräfta röstmeddelande
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelConfirm}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-xs text-muted-foreground">
            Redigera vid behov:
          </p>
          <Textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            placeholder="Transkriberad text..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancelConfirm}
            className="flex-1"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleProcessTranscript}
            disabled={!editedTranscript.trim()}
            className="flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            Fyll i formulär
          </Button>
        </div>
      </div>
    );
  }

  // Processing state
  if (state === "processing") {
    return (
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">
            Byggio AI analyserar ditt meddelande...
          </span>
        </div>
      </div>
    );
  }

  return null;
}
