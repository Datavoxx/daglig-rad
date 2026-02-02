import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, X, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoicePromptButtonProps {
  onTranscriptComplete: (transcript: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
  subtext?: string;
  variant?: "default" | "compact" | "inline";
  agentName?: string;
  agentAvatar?: string;
}

export function VoicePromptButton({
  onTranscriptComplete,
  isProcessing = false,
  className,
  subtext = "Spara upp till 70% av din tid",
  variant = "default",
  agentName,
  agentAvatar,
}: VoicePromptButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const isSpeechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

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
    setFinalTranscript("");

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
        setFinalTranscript(finalTranscriptRef.current);
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
    toast.success("Spela in...");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setInterimTranscript("");

      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        setShowConfirmation(true);
      } else {
        toast.info("Ingen text tolkades");
      }
    }
  };

  const confirmTranscript = async () => {
    const transcript = finalTranscriptRef.current.trim();
    setShowConfirmation(false);
    await onTranscriptComplete(transcript);
    setFinalTranscript("");
    finalTranscriptRef.current = "";
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setFinalTranscript("");
    finalTranscriptRef.current = "";
    toast.info("Kommando avbrutet");
  };

  const cancelRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setInterimTranscript("");
      setFinalTranscript("");
      toast.info("Inspelning avbruten");
    }
  };

  // Confirmation dialog
  if (showConfirmation) {
    return (
      <div className={cn("w-full", className)}>
        <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bekräfta röstkommando</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelConfirmation}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm bg-muted/50 rounded p-3 max-h-32 overflow-y-auto">
            <p className="font-medium mb-1">Du sa:</p>
            <p className="text-muted-foreground">"{finalTranscript}"</p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={cancelConfirmation}
            >
              Avbryt
            </Button>
            <Button 
              variant="default" 
              className="flex-1" 
              onClick={confirmTranscript}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bearbetar...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Kör kommando
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <div className={cn("w-full", className)}>
        <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-sm font-medium">Spelar in...</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelRecording}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {(finalTranscript || interimTranscript) && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2 max-h-24 overflow-y-auto">
              {finalTranscript && <span>{finalTranscript} </span>}
              {interimTranscript && <span className="italic opacity-70">{interimTranscript}</span>}
            </div>
          )}

          <Button 
            variant="default" 
            className="w-full" 
            onClick={stopRecording}
          >
            <MicOff className="mr-2 h-4 w-4" />
            Stoppa inspelning
          </Button>
        </div>
      </div>
    );
  }

  // Idle state - different variants
  if (variant === "compact") {
    return (
      <Button
        variant="outline"
        className={cn("gap-2", className)}
        onClick={startRecording}
        disabled={isProcessing || !isSpeechRecognitionSupported}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {agentName && <Sparkles className="h-3 w-3 ml-0.5" />}
          </>
        )}
        {agentName ? `Låt ${agentName} hjälpa dig` : "Spela in"}
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-2 text-muted-foreground hover:text-primary", className)}
        onClick={startRecording}
        disabled={isProcessing || !isSpeechRecognitionSupported}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        <span className="text-xs">{subtext}</span>
      </Button>
    );
  }

  // Default variant - prominent with subtext
  return (
    <div
      className={cn(
        "w-full p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer",
        className
      )}
      onClick={startRecording}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {agentAvatar && (
          <img 
            src={agentAvatar} 
            alt={agentName || "AI"} 
            className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 shadow-md"
          />
        )}
        <div className="flex items-center gap-2 text-primary">
          <div className="relative">
            <Mic className="h-5 w-5" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-primary/70" />
          </div>
          <span className="font-medium">
            {agentName ? `Låt ${agentName} hjälpa dig` : "Spela in"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{subtext}</span>
      </div>
    </div>
  );
}
