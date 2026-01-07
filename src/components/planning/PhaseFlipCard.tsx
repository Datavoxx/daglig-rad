import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { PlanPhase } from "./GanttTimeline";

interface PhaseFlipCardProps {
  phase: PlanPhase;
  style: React.CSSProperties;
  colorClasses: { bg: string; text: string; border: string };
}

export function PhaseFlipCard({ phase, style, colorClasses }: PhaseFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const endWeek = phase.start_week + phase.duration_weeks - 1;
  const weekRange = phase.duration_weeks === 1 
    ? `V${phase.start_week}` 
    : `V${phase.start_week} → V${endWeek}`;

  return (
    <div
      className="absolute top-0 h-full cursor-pointer"
      style={{
        ...style,
        perspective: "1000px",
      }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          "relative w-full h-full transition-all duration-500",
          isFlipped && "flip-card-flipped"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front side */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg border transition-all duration-300",
            "flex items-center justify-center",
            "shadow-sm hover:shadow-md hover:scale-[1.02]",
            colorClasses.bg,
            colorClasses.border
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className={cn("text-xs font-medium truncate px-2", colorClasses.text)}>
            {phase.duration_weeks}v
          </span>
        </div>

        {/* Back side */}
        <div
          className={cn(
            "absolute rounded-xl border-2 shadow-lg p-3",
            "flex flex-col gap-1.5 min-w-[200px] z-10",
            colorClasses.bg,
            colorClasses.border
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            top: "-8px",
            left: "-20px",
            height: "auto",
            minHeight: "80px",
          }}
        >
          {/* Close indicator */}
          <button 
            className={cn(
              "absolute top-1.5 right-1.5 rounded-full p-0.5",
              "opacity-60 hover:opacity-100 transition-opacity",
              colorClasses.text
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
            }}
          >
            <X className="h-3 w-3" />
          </button>

          {/* Phase name */}
          <h4 className={cn("font-semibold text-sm pr-5 leading-tight", colorClasses.text)}>
            {phase.name}
          </h4>

          {/* Week range */}
          <div className={cn("text-xs font-medium opacity-80", colorClasses.text)}>
            {weekRange} ({phase.duration_weeks} {phase.duration_weeks === 1 ? "vecka" : "veckor"})
          </div>

          {/* Description */}
          {phase.description && (
            <p className={cn("text-xs leading-relaxed mt-1 opacity-90", colorClasses.text)}>
              {phase.description}
            </p>
          )}

          {/* Parallel info */}
          {phase.parallel_with && (
            <div className={cn("text-xs italic opacity-70 mt-1", colorClasses.text)}>
              Parallellt med: {phase.parallel_with}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
