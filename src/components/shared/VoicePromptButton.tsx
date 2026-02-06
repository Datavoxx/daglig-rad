import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2, X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

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
      return;
    }
    setShowConfirmation(false);
    await onTranscriptComplete(transcript);
    setEditableTranscript("");
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setEditableTranscript("");
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  const handleStartRecording = () => {
    if (!isSupported) {
      console.error("Voice recording not supported");
      return;
    }
    startRecording();
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

  // Recording state
  if (isRecording || isTranscribing) {
    return (
      <div className={cn("w-full", className)}>
        <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                  <span className="text-sm font-medium">Spelar in...</span>
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

  // Idle state - different variants
  if (variant === "compact") {
    return (
      <Button
        variant="outline"
        className={cn("gap-2", className)}
        onClick={handleStartRecording}
        disabled={isProcessing || !isSupported}
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
        onClick={handleStartRecording}
        disabled={isProcessing || !isSupported}
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
      onClick={handleStartRecording}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {agentAvatar && (
        <img 
            src={agentAvatar} 
            alt={agentName || "AI"} 
            className="w-32 h-32 object-contain drop-shadow-lg"
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
