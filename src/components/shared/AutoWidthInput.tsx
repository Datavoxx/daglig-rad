import { useRef, useState, useLayoutEffect, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AutoWidthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minWidth?: number;
  maxWidth?: number;
}

export function AutoWidthInput({
  value,
  onChange,
  minWidth = 80,
  maxWidth = 300,
  placeholder = "0",
  className,
  ...props
}: AutoWidthInputProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(minWidth);

  const displayValue = value !== null && value !== undefined && value !== "" 
    ? String(value) 
    : placeholder;

  useLayoutEffect(() => {
    if (spanRef.current) {
      const measuredWidth = spanRef.current.getBoundingClientRect().width;
      // Add padding (16px each side) + border (2px) + some extra space
      const totalWidth = measuredWidth + 40;
      setWidth(Math.max(minWidth, Math.min(maxWidth, totalWidth)));
    }
  }, [displayValue, minWidth, maxWidth]);

  return (
    <div className="relative inline-flex">
      {/* Hidden span to measure text width */}
      <span
        ref={spanRef}
        className={cn(
          "invisible absolute whitespace-pre",
          "text-sm tabular-nums", // Match input font
        )}
        aria-hidden="true"
      >
        {displayValue}
      </span>
      <input
        type="number"
        value={value !== null && value !== undefined ? value : ""}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: `${width}px` }}
        className={cn(
          "h-8 rounded-md border border-input bg-background px-3 py-1",
          "text-sm tabular-nums text-right",
          "ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
}
