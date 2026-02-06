import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputOverlayProps {
  onTranscriptComplete: (transcript: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
  agentName?: string;
  agentAvatar?: string;
}

export function VoiceInputOverlay({
  onTranscriptComplete,
  isProcessing = false,
  className,
  agentName,
  agentAvatar,
}: VoiceInputOverlayProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef(false);

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
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    isRecordingRef.current = true;
    setIsRecording(true);
    const recordingMessage = agentName ? `${agentName} lyssnar...` : "Spela in dina ändringar...";
    toast.success(recordingMessage);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      isRecordingRef.current = false;
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
      isRecordingRef.current = false;
      setIsRecording(false);
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setInterimTranscript("");
      setFinalTranscript("");
      toast.info("Inspelning avbruten");
    }
  };

  if (showConfirmation) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50 max-w-md", className)}>
        <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {agentAvatar && (
                <img 
                  src={agentAvatar} 
                  alt={agentName || "AI"} 
                  className="w-16 h-16 object-contain drop-shadow-md"
                />
              )}
              <span className="text-sm font-medium">Bekräfta röstkommando</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelConfirmation}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Redigera vid behov:</p>
            <Textarea
              value={finalTranscript}
              onChange={(e) => {
                setFinalTranscript(e.target.value);
                finalTranscriptRef.current = e.target.value;
              }}
              className="min-h-[80px] resize-none text-sm"
              autoFocus
            />
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

  if (isRecording) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50 max-w-md", className)}>
        <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {agentAvatar && (
                <img 
                  src={agentAvatar} 
                  alt={agentName || "AI"} 
                  className="w-16 h-16 object-contain drop-shadow-md"
                />
              )}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-sm font-medium">{agentName ? `${agentName.replace(" AI", "")} lyssnar...` : "Spelar in..."}</span>
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

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg", className)}
      onClick={startRecording}
      disabled={isProcessing}
      data-voice-trigger
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
