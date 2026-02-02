import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import SparklineChart from "./SparklineChart";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  icon: LucideIcon;
  onClick?: () => void;
  accentColor?: "primary" | "blue" | "amber" | "emerald" | "violet" | "red";
  delay?: number;
  subtitle?: string;
}

const colorMap = {
  primary: {
    bg: "from-primary/8 via-primary/4 to-transparent",
    icon: "text-primary bg-primary/10 ring-primary/20",
    sparkline: "hsl(var(--primary))",
    trend: "text-primary",
  },
  blue: {
    bg: "from-blue-500/8 via-blue-500/4 to-transparent",
    icon: "text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-blue-500/20",
    sparkline: "hsl(217, 91%, 60%)",
    trend: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    bg: "from-amber-500/8 via-amber-500/4 to-transparent",
    icon: "text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-amber-500/20",
    sparkline: "hsl(45, 93%, 47%)",
    trend: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    bg: "from-emerald-500/8 via-emerald-500/4 to-transparent",
    icon: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
    sparkline: "hsl(160, 84%, 39%)",
    trend: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "from-violet-500/8 via-violet-500/4 to-transparent",
    icon: "text-violet-600 dark:text-violet-400 bg-violet-500/10 ring-violet-500/20",
    sparkline: "hsl(263, 70%, 50%)",
    trend: "text-violet-600 dark:text-violet-400",
  },
  red: {
    bg: "from-red-500/8 via-red-500/4 to-transparent",
    icon: "text-red-600 dark:text-red-400 bg-red-500/10 ring-red-500/20",
    sparkline: "hsl(0, 84%, 60%)",
    trend: "text-red-600 dark:text-red-400",
  },
};

const KpiCard = ({
  title,
  value,
  change,
  changeLabel = "denna månad",
  sparklineData,
  icon: Icon,
  onClick,
  accentColor = "primary",
  delay = 0,
  subtitle,
}: KpiCardProps) => {
  const colors = colorMap[accentColor];
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined && change !== 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm",
        "ring-1 ring-black/5 dark:ring-white/5",
        "transition-all duration-300 ease-out",
        "hover:shadow-elevated hover:scale-[1.02] hover:border-border/60",
        onClick && "cursor-pointer",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          colors.bg
        )}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("rounded-lg p-2 ring-1", colors.icon)}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          {onClick && (
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          )}
        </div>

        {/* Value */}
        <div className="mb-3">
          <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </span>
          {subtitle && (
            <span className="ml-2 text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mb-3 -mx-1">
            <SparklineChart data={sparklineData} color={colors.sparkline} height={36} />
          </div>
        )}

        {/* Trend indicator */}
        {hasChange && (
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium rounded-full px-1.5 py-0.5",
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : "text-red-600 dark:text-red-400 bg-red-500/10"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isPositive ? "+" : ""}{change.toFixed(0)}%</span>
            </div>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}

        {!hasChange && !subtitle && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Ingen förändring {changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
