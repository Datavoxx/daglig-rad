import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectPipelineProps {
  projects: { status: string | null }[];
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
}

interface StatusConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

const STATUS_CONFIG: StatusConfig[] = [
  { key: "planning", label: "Planering", color: "bg-amber-500", bgColor: "bg-amber-500/20" },
  { key: "active", label: "Pågående", color: "bg-blue-500", bgColor: "bg-blue-500/20" },
  { key: "closing", label: "Slutskede", color: "bg-violet-500", bgColor: "bg-violet-500/20" },
  { key: "completed", label: "Avslutat", color: "bg-emerald-500", bgColor: "bg-emerald-500/20" },
];

export default function ProjectPipeline({ projects, statusFilter, onStatusFilterChange }: ProjectPipelineProps) {
  const totalProjects = projects.length;

  const segments = STATUS_CONFIG.map((config) => {
    const count = projects.filter((p) => p.status === config.key).length;
    const percent = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
    return { ...config, count, percent };
  });

  const handleSegmentClick = (status: string) => {
    if (statusFilter === status) {
      onStatusFilterChange(null);
    } else {
      onStatusFilterChange(status);
    }
  };

  if (totalProjects === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Projekt-pipeline</h3>
        {statusFilter && (
          <button
            onClick={() => onStatusFilterChange(null)}
            className="text-xs text-primary hover:underline"
          >
            Rensa filter
          </button>
        )}
      </div>

      {/* Horizontal bar */}
      <TooltipProvider delayDuration={0}>
        <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted/50">
          {segments.map((seg) =>
            seg.percent > 0 ? (
              <Tooltip key={seg.key}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "h-full transition-all duration-500 cursor-pointer hover:opacity-80 focus:outline-none",
                      seg.color,
                      statusFilter && statusFilter !== seg.key && "opacity-40"
                    )}
                    style={{ width: `${seg.percent}%` }}
                    onClick={() => handleSegmentClick(seg.key)}
                    aria-label={`Filtrera på ${seg.label}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {seg.label}: {seg.count} ({Math.round(seg.percent)}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : null
          )}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {segments.map((seg) => (
          <button
            key={seg.key}
            className={cn(
              "flex items-center gap-1.5 transition-opacity",
              statusFilter && statusFilter !== seg.key ? "opacity-40" : "opacity-100",
              "hover:opacity-100"
            )}
            onClick={() => handleSegmentClick(seg.key)}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", seg.color)} />
            <span className={cn(statusFilter === seg.key && "font-medium")}>{seg.label}</span>
            <span className="text-muted-foreground">({seg.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
