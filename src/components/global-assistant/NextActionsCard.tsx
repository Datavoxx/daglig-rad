import { FileText, FolderKanban, Eye, ArrowRight, Plus, Search, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { NextAction } from "@/types/global-assistant";

interface NextActionsCardProps {
  actions: NextAction[];
  onSelect: (action: NextAction) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  folder: FolderKanban,
  eye: Eye,
  arrow: ArrowRight,
  plus: Plus,
  search: Search,
  clipboard: ClipboardList,
};

export function NextActionsCard({ actions, onSelect }: NextActionsCardProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <Card className="border-border/40 bg-muted/30">
      <CardContent className="p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Nästa steg
        </p>
        <div className="flex flex-wrap gap-2">
          {actions.slice(0, 3).map((action, i) => {
            const Icon = iconMap[action.icon] || ArrowRight;
            return (
              <Button
                key={i}
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => onSelect(action)}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
