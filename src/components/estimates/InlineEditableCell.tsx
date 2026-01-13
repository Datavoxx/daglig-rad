import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface InlineEditableCellProps {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
  align?: "left" | "right" | "center";
  suffix?: string;
  readOnly?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function InlineEditableCell({
  value,
  onChange,
  type = "text",
  placeholder = "",
  className,
  align = "left",
  suffix,
  readOnly = false,
  onKeyDown,
}: InlineEditableCellProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value ?? ""));
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== String(value ?? "")) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(String(value ?? ""));
      inputRef.current?.blur();
    }
    onKeyDown?.(e);
  };

  const displayValue = localValue || "";
  const isEmpty = !displayValue && !isFocused;

  if (readOnly) {
    return (
      <span
        className={cn(
          "text-sm tabular-nums",
          align === "right" && "text-right",
          align === "center" && "text-center",
          className
        )}
      >
        {displayValue}
        {suffix && displayValue && <span className="text-muted-foreground ml-0.5">{suffix}</span>}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative group",
        align === "right" && "text-right",
        align === "center" && "text-center"
      )}
    >
      <input
        ref={inputRef}
        type={type === "number" ? "text" : "text"}
        inputMode={type === "number" ? "decimal" : "text"}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-sm tabular-nums",
          "border-0 outline-none",
          "transition-colors duration-150",
          "focus:bg-muted/60 rounded px-1.5 py-0.5 -mx-1.5",
          "group-hover:bg-muted/30",
          isEmpty && "text-muted-foreground/50",
          align === "right" && "text-right",
          align === "center" && "text-center",
          className
        )}
      />
      {suffix && displayValue && !isFocused && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
