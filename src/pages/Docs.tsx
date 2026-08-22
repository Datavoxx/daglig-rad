import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { FileText, Plus, Search, Trash2, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/layout/EmptyState";
import { useDocuments } from "@/hooks/useDocuments";
import { toast } from "sonner";

export default function Docs() {
  const navigate = useNavigate();
  const { documents, createDocument, deleteDocument } = useDocuments();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.plain_text ?? "").toLowerCase().includes(q)
    );
  }, [documents, search]);

  const handleCreate = async () => {
    const doc = await createDocument();
    if (!doc) {
      toast.error("Kunde inte skapa dokumentet");
      return;
    }
    navigate(`/docs/${doc.id}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteDocument(id);
    toast[ok ? "success" : "error"](ok ? "Dokumentet togs bort" : "Kunde inte ta bort dokumentet");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Docs"
        subtitle="Företagets dokument och anteckningar"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nytt dokument
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök i dokument…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Inga dokument ännu"
          description="Skapa ditt första dokument för att börja anteckna."
          actions={
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nytt dokument
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <Card
              key={doc.id}
              onClick={() => navigate(`/docs/${doc.id}`)}
              className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {doc.plain_text?.slice(0, 120) || "Tomt dokument"}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Ändrad {format(new Date(doc.updated_at), "d MMM yyyy HH:mm", { locale: sv })}
                  </span>
                  {doc.project_id && <Badge variant="secondary">Projekt</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
