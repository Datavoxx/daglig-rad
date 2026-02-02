import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmployeeQuickCardProps {
  title: string;
  value: string;
  subValue?: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning";
}

export function EmployeeQuickCard({
  title,
  value,
  subValue,
  href,
  icon: Icon,
  variant = "default",
}: EmployeeQuickCardProps) {
  return (
    <Link to={href} className="block">
      <Card className={cn(
        "transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer h-full",
        variant === "success" && "border-green-500/30 bg-green-500/5",
        variant === "warning" && "border-amber-500/30 bg-amber-500/5"
      )}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              variant === "default" && "bg-primary/10",
              variant === "success" && "bg-green-500/10",
              variant === "warning" && "bg-amber-500/10"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                variant === "default" && "text-primary",
                variant === "success" && "text-green-600",
                variant === "warning" && "text-amber-600"
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-lg font-semibold truncate">{value}</p>
              {subValue && (
                <p className="text-xs text-muted-foreground truncate">{subValue}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
