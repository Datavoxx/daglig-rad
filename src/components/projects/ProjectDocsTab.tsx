import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/EmptyState";
import { useDocuments } from "@/hooks/useDocuments";
import { toast } from "sonner";

interface ProjectDocsTabProps {
  projectId: string;
}

export default function ProjectDocsTab({ projectId }: ProjectDocsTabProps) {
  const navigate = useNavigate();
  const { documents, createDocument } = useDocuments({ projectId });

  const handleCreate = async () => {
    const doc = await createDocument({ project_id: projectId });
    if (!doc) {
      toast.error("Kunde inte skapa dokumentet");
      return;
    }
    navigate(`/docs/${doc.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nytt dokument
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Inga dokument för projektet"
          description="Skapa ett dokument för mötesanteckningar, checklistor eller annat."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              onClick={() => navigate(`/docs/${doc.id}`)}
              className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Ändrad {format(new Date(doc.updated_at), "d MMM HH:mm", { locale: sv })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
