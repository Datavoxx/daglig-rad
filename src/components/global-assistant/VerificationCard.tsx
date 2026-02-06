import { Check, Search, Plus, User, FolderKanban, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MessageData, VerificationMatch } from "@/types/global-assistant";
import { cn } from "@/lib/utils";

interface VerificationCardProps {
  content: string;
  data: MessageData;
  onSelect: (match: VerificationMatch) => void;
  onSearchOther: () => void;
  onCreateNew: () => void;
  disabled?: boolean;
}

const entityIcons = {
  customer: User,
  project: FolderKanban,
  estimate: FileText,
};

export function VerificationCard({
  content,
  data,
  onSelect,
  onSearchOther,
  onCreateNew,
  disabled,
}: VerificationCardProps) {
  const Icon = entityIcons[data.entityType || "customer"];
  const matches = data.matches || [];

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header text */}
          <p className="text-sm text-muted-foreground">{content}</p>

          {/* Matches list */}
          <div className="space-y-2">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => onSelect(match)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-border/60 bg-card p-3 text-left transition-all",
                  "hover:border-primary/40 hover:bg-primary/5",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{match.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{match.subtitle}</p>
                  {match.metadata && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground/70">
                      {Object.entries(match.metadata).map(([key, value]) => (
                        <span key={key}>{value}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 self-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Alternative actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onSearchOther}
              disabled={disabled}
            >
              <Search className="h-4 w-4" />
              Sök annan
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onCreateNew}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
              Skapa ny
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
