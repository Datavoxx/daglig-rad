import { useState, useRef, useEffect } from "react";
import { Send, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReferenceTagPicker, type ReferenceTag } from "./ReferenceTagPicker";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  activeReference?: ReferenceTag | null;
  onReferenceSelect?: (ref: ReferenceTag) => void;
  onReferenceClear?: () => void;
}

const refColors: Record<string, string> = {
  customer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  project: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  estimate: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
};

const refLabels: Record<string, string> = {
  customer: "Kund",
  project: "Projekt",
  estimate: "Offert",
};

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Fråga vad som helst...",
  activeReference,
  onReferenceSelect,
  onReferenceClear,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleRefSelect = (ref: ReferenceTag) => {
    setPickerOpen(false);
    onReferenceSelect?.(ref);
  };

  const showRef = activeReference && onReferenceClear;

  return (
    <div className="space-y-0">
      {/* Active reference chip */}
      {showRef && (
        <div className="px-2 pb-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              refColors[activeReference.type]
            )}
          >
            <span className="text-[10px] opacity-70">{refLabels[activeReference.type]}</span>
            <span className="truncate max-w-[180px]">{activeReference.name}</span>
            <button
              onClick={onReferenceClear}
              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      <div className="relative flex items-end gap-2 rounded-2xl border border-border/60 bg-card p-2 shadow-sm transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
        {/* Plus button with popover */}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              type="button"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-auto p-0 border-0 bg-transparent shadow-none"
          >
            <ReferenceTagPicker
              onSelect={handleRefSelect}
              onClose={() => setPickerOpen(false)}
            />
          </PopoverContent>
        </Popover>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60",
            "max-h-[200px] min-h-[36px]",
            disabled && "opacity-50"
          )}
        />

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
    </div>
  );
}
