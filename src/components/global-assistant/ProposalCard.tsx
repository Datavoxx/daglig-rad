import { Check, X, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MessageData } from "@/types/global-assistant";

interface ProposalCardProps {
  data: MessageData;
  onConfirm: () => void;
  onCancel: () => void;
  onModify: () => void;
  disabled?: boolean;
}

export function ProposalCard({ data, onConfirm, onCancel, onModify, disabled }: ProposalCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Action heading */}
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Jag kommer att:</p>
              <p className="text-sm text-muted-foreground">{data.action}</p>
            </div>
          </div>

          {/* Details list */}
          {data.details && data.details.length > 0 && (
            <ul className="ml-8 space-y-1 text-sm text-muted-foreground">
              {data.details.map((detail, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {/* Warnings */}
          {data.warnings && data.warnings.length > 0 && (
            <div className="ml-8 space-y-1">
              {data.warnings.map((warning, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={onConfirm}
              disabled={disabled}
            >
              <Check className="h-4 w-4" />
              Godkänn
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onModify}
              disabled={disabled}
            >
              <Pencil className="h-4 w-4" />
              Ändra
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={onCancel}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              Avbryt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
