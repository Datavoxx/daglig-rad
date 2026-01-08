import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputOverlayProps {
  onTranscriptComplete: (transcript: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
}

export function VoiceInputOverlay({
  onTranscriptComplete,
  isProcessing = false,
  className,
}: VoiceInputOverlayProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
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
    toast.success("Spela in dina ändringar...");
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setInterimTranscript("");

      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        await onTranscriptComplete(transcript);
        setFinalTranscript("");
      } else {
        toast.info("Ingen text tolkades");
      }
    }
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

  if (isRecording) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50 max-w-md", className)}>
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
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applicerar...
              </>
            ) : (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stoppa och applicera
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg", className)}
      onClick={startRecording}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
