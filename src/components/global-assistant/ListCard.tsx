import { Link } from "react-router-dom";
import { FolderOpen, Users, FileText, Receipt, ClipboardCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MessageData, ListItem } from "@/types/global-assistant";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ListCardProps {
  content?: string;
  data: MessageData;
}

const listTypeIcons: Record<string, typeof FolderOpen> = {
  project: FolderOpen,
  customer: Users,
  estimate: FileText,
  invoice: Receipt,
  inspection: ClipboardCheck,
};

const statusColorMap: Record<string, "success" | "warning" | "info" | "secondary"> = {
  green: "success",
  yellow: "warning",
  blue: "info",
  gray: "secondary",
};

export function ListCard({ content, data }: ListCardProps) {
  const { listItems = [], listType = "project" } = data;
  const Icon = listTypeIcons[listType] || FolderOpen;

  if (listItems.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        Inga resultat hittades.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {content && (
        <div className="prose prose-sm max-w-none text-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
      
      <div className="space-y-2">
        {listItems.map((item) => (
          <ListItemCard key={item.id} item={item} Icon={Icon} />
        ))}
      </div>
    </div>
  );
}

interface ListItemCardProps {
  item: ListItem;
  Icon: typeof FolderOpen;
}

function ListItemCard({ item, Icon }: ListItemCardProps) {
  const badgeVariant = item.statusColor 
    ? statusColorMap[item.statusColor] 
    : "secondary";

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            {item.status && (
              <Badge variant={badgeVariant} className="text-xs">
                {item.status}
              </Badge>
            )}
          </div>
          
          {item.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {item.subtitle}
            </p>
          )}
          
          {item.details && item.details.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
              {item.details.map((detail, idx) => (
                <span key={idx} className="text-xs text-muted-foreground">
                  <span className="font-medium">{detail.label}:</span> {detail.value}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {item.link && (
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link to={item.link}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Öppna</span>
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
