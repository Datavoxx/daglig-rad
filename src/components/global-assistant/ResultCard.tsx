import { CheckCircle2, XCircle, ExternalLink, Plus, List, Clock, Search, Folder, FileText, LogIn, LogOut, Calendar, Users, Edit, DollarSign, PlusCircle, Check, Clipboard } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { MessageData, NextAction } from "@/types/global-assistant";

interface ResultCardProps {
  data: MessageData;
  content?: string;
  onNextAction?: (action: NextAction) => void;
}

const iconMap: Record<string, React.ElementType> = {
  plus: Plus,
  list: List,
  clock: Clock,
  search: Search,
  folder: Folder,
  "file-text": FileText,
  "log-in": LogIn,
  "log-out": LogOut,
  calendar: Calendar,
  users: Users,
  eye: Search,
  edit: Edit,
  check: Check,
  clipboard: Clipboard,
  "dollar-sign": DollarSign,
  "plus-circle": PlusCircle,
};

export function ResultCard({ data, content, onNextAction }: ResultCardProps) {
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
          <div className="flex-1 space-y-3">
            {content && (
              <div className="prose prose-sm max-w-none text-foreground">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
            {data.resultMessage && (
              <p className="text-sm text-foreground">{data.resultMessage}</p>
            )}
            
            {/* Link to navigate */}
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
            
            {/* Next Actions */}
            {data.nextActions && data.nextActions.length > 0 && onNextAction && (
              <div className="flex flex-wrap gap-2 pt-1">
                {data.nextActions.map((action, index) => {
                  const IconComponent = iconMap[action.icon] || Plus;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => onNextAction(action)}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
