import { Card } from "@/components/ui/card";
import { FileText, Image, File, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size?: number;
  category?: string;
  date: string;
}

interface FileListCardProps {
  content: string;
  files: FileItem[];
  onDelete?: (fileId: string) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string, category?: string) {
  if (category === "image" || type?.startsWith("image/")) {
    return <Image className="h-4 w-4 text-green-500" />;
  }
  if (category === "document" || type?.includes("pdf") || type?.includes("doc")) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  }
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function FileListCard({ content, files, onDelete }: FileListCardProps) {
  return (
    <Card className="p-4 space-y-3">
      {content && (
        <p className="text-sm text-muted-foreground">{content}</p>
      )}
      
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {getFileIcon(file.type, file.category)}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {file.size && " • "}
                  {format(new Date(file.date), "d MMM yyyy", { locale: sv })}
                </p>
              </div>
            </div>
            
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {files.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Inga filer hittades
        </p>
      )}
    </Card>
  );
}
