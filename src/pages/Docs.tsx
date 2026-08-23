import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DocRow {
  id: string;
  title: string;
  plain_text: string | null;
  updated_at: string;
}

export default function Docs() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [search, setSearch] = useState("");

  const fetchDocs = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, plain_text, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Kunde inte hämta dokument");
      return;
    }
    setDocs((data ?? []) as DocRow[]);
  };

  useEffect(() => {
    void fetchDocs();
  }, []);

  const createDoc = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        created_by: user.id,
        title: "Namnlöst dokument",
        content: { type: "doc", content: [{ type: "paragraph" }] } as never,
        plain_text: "",
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Kunde inte skapa dokument");
      return;
    }
    navigate(`/docs/${data.id}`);
  };

  const deleteDoc = async (id: string) => {
    if (!window.confirm("Ta bort dokumentet?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("Kunde inte ta bort dokumentet");
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const filtered = docs.filter((d) =>
    `${d.title} ${d.plain_text ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Docs"
        subtitle="Dina dokument och anteckningar"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button onClick={createDoc}>
            <Plus className="mr-2 h-4 w-4" /> Nytt dokument
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök dokument…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Inga dokument ännu</p>
          <Button variant="outline" onClick={createDoc}>
            <Plus className="mr-2 h-4 w-4" /> Skapa ditt första dokument
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <Card
              key={doc.id}
              onClick={() => navigate(`/docs/${doc.id}`)}
              className="group cursor-pointer p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{doc.title || "Namnlöst dokument"}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {doc.plain_text?.trim() || "Tomt dokument"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteDoc(doc.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ändrad {new Date(doc.updated_at).toLocaleDateString("sv-SE")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
