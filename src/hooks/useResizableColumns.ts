import { useState, useCallback, useEffect } from "react";

interface UseResizableColumnsOptions {
  storageKey: string;
  defaultWidths: number[];
  minWidth?: number;
}

export function useResizableColumns({
  storageKey,
  defaultWidths,
  minWidth = 40,
}: UseResizableColumnsOptions) {
  const [widths, setWidths] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === defaultWidths.length) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return defaultWidths;
  });

  const [resizing, setResizing] = useState<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const startResize = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      setResizing({
        index,
        startX: e.clientX,
        startWidth: widths[index],
      });
    },
    [widths]
  );

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(minWidth, resizing.startWidth + delta);

      setWidths((prev) => {
        const next = [...prev];
        next[resizing.index] = newWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      setWidths((current) => {
        localStorage.setItem(storageKey, JSON.stringify(current));
        return current;
      });
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, minWidth, storageKey]);

  const resetWidths = useCallback(() => {
    setWidths(defaultWidths);
    localStorage.removeItem(storageKey);
  }, [defaultWidths, storageKey]);

  return {
    widths,
    startResize,
    isResizing: resizing !== null,
    resetWidths,
  };
}
