import { useState, useRef, useEffect } from "react";
import { Send, Plus, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Fråga vad som helst..." }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    isSupported,
  } = useVoiceRecorder({
    onTranscriptComplete: (transcript) => {
      setInput(transcript);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border border-border/60 bg-card p-2 shadow-sm transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
      {/* Plus button for attachments (future) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        disabled
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isTranscribing}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60",
          "max-h-[200px] min-h-[36px]",
          (disabled || isTranscribing) && "opacity-50"
        )}
      />

      {/* Voice button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 shrink-0 rounded-full transition-all",
          isRecording 
            ? "text-red-500 bg-red-500/10 animate-pulse" 
            : "text-muted-foreground hover:text-foreground",
          !isSupported && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleMicClick}
        disabled={!isSupported || disabled || isTranscribing}
        title={isRecording ? "Stoppa inspelning" : "Starta röstinspelning"}
      >
        {isTranscribing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {/* Send button */}
      <Button
        size="icon"
        className={cn(
          "h-9 w-9 shrink-0 rounded-full transition-all duration-200",
          input.trim() 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "bg-muted text-muted-foreground"
        )}
        onClick={handleSubmit}
        disabled={!input.trim() || disabled}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
