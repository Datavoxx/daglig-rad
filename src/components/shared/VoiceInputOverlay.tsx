import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState("");

  const {
    isRecording,
    isTranscribing,
    interimTranscript,
    finalTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
    isIOSDevice,
  } = useVoiceRecorder({
    agentName,
    onTranscriptComplete: (transcript) => {
      if (transcript) {
        setEditableTranscript(transcript);
        setShowConfirmation(true);
      }
    },
  });

  const confirmTranscript = async () => {
    const transcript = editableTranscript.trim();
    if (!transcript) {
      toast.info("Ingen text att skicka");
      return;
    }
    setShowConfirmation(false);
    await onTranscriptComplete(transcript);
    setEditableTranscript("");
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setEditableTranscript("");
    toast.info("Kommando avbrutet");
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  const handleStartRecording = () => {
    if (!isSupported) {
      toast.error("Din webbläsare stöder inte röstinspelning. Prova Chrome, Edge eller Safari.");
      return;
    }
    startRecording();
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
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
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

  if (isRecording || isTranscribing) {
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
              {isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Transkriberar...</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                  </span>
                  <span className="text-sm font-medium">
                    {agentName ? `${agentName.replace(" AI", "")} lyssnar...` : "Spelar in..."}
                  </span>
                </>
              )}
            </div>
            {!isTranscribing && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelRecording}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Show interim transcript for Web Speech API (non-iOS) */}
          {!isIOSDevice && (finalTranscript || interimTranscript) && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2 max-h-24 overflow-y-auto">
              {finalTranscript && <span>{finalTranscript} </span>}
              {interimTranscript && <span className="italic opacity-70">{interimTranscript}</span>}
            </div>
          )}

          {/* iOS message */}
          {isIOSDevice && isRecording && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
              <span className="italic">Transkribering sker efter inspelning...</span>
            </div>
          )}

          {!isTranscribing && (
            <Button 
              variant="default" 
              className="w-full" 
              onClick={stopRecording}
            >
              <MicOff className="mr-2 h-4 w-4" />
              Stoppa inspelning
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg", className)}
      onClick={handleStartRecording}
      disabled={isProcessing || !isSupported}
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
