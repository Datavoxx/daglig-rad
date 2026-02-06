import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { MessageData } from "@/types/global-assistant";

interface ResultCardProps {
  data: MessageData;
}

export function ResultCard({ data }: ResultCardProps) {
  const navigate = useNavigate();
  const isSuccess = data.success !== false;

  return (
    <Card className={isSuccess ? "border-green-500/20 bg-green-500/5" : "border-destructive/20 bg-destructive/5"}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
          )}
          <div className="flex-1 space-y-2">
            <p className="text-sm text-foreground">{data.resultMessage}</p>
            {data.link && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate(data.link!.href)}
              >
                {data.link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
