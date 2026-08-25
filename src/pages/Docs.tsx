import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FileText, Plus, Search, Trash2, Folder, FolderPlus, Inbox, FolderInput } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocRow {
  id: string;
  title: string;
  plain_text: string | null;
  updated_at: string;
  folder_id: string | null;
}

interface FolderRow {
  id: string;
  name: string;
}

export default function Docs() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | "all" | "unfiled">("all");
  const [search, setSearch] = useState("");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");

  const fetchDocs = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, plain_text, updated_at, folder_id")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Kunde inte hämta dokument");
      return;
    }
    setDocs((data ?? []) as DocRow[]);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("document_folders")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) return;
    setFolders((data ?? []) as FolderRow[]);
  };

  useEffect(() => {
    void fetchDocs();
    void fetchFolders();
  }, []);

  const createFolder = async () => {
    const name = folderName.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("document_folders")
      .insert({ user_id: user.id, name })
      .select("id, name")
      .single();
    if (error || !data) {
      toast.error("Kunde inte skapa mappen");
      return;
    }
    setFolders((prev) => [...prev, data as FolderRow].sort((a, b) => a.name.localeCompare(b.name)));
    setFolderName("");
    setShowFolderDialog(false);
    toast.success("Mapp skapad");
  };

  const deleteFolder = async (id: string) => {
    if (!window.confirm("Ta bort mappen? Dokumenten flyttas till Osorterade.")) return;
    const { error } = await supabase.from("document_folders").delete().eq("id", id);
    if (error) {
      toast.error("Kunde inte ta bort mappen");
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setDocs((prev) => prev.map((d) => (d.folder_id === id ? { ...d, folder_id: null } : d)));
    if (activeFolder === id) setActiveFolder("all");
  };

  const moveDoc = async (docId: string, folderId: string | null) => {
    const { error } = await supabase.from("documents").update({ folder_id: folderId }).eq("id", docId);
    if (error) {
      toast.error("Kunde inte flytta dokumentet");
      return;
    }
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, folder_id: folderId } : d)));
    toast.success("Dokumentet flyttades");
  };

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
        folder_id: activeFolder !== "all" && activeFolder !== "unfiled" ? activeFolder : null,
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

  const filtered = docs
    .filter((d) =>
      activeFolder === "all"
        ? true
        : activeFolder === "unfiled"
        ? !d.folder_id
        : d.folder_id === activeFolder
    )
    .filter((d) =>
      `${d.title} ${d.plain_text ?? ""}`.toLowerCase().includes(search.toLowerCase())
    );

  const countFor = (key: string | "all" | "unfiled") =>
    key === "all"
      ? docs.length
      : key === "unfiled"
      ? docs.filter((d) => !d.folder_id).length
      : docs.filter((d) => d.folder_id === key).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Docs"
        subtitle="Dina dokument och anteckningar"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFolderDialog(true)}>
              <FolderPlus className="mr-2 h-4 w-4" /> Ny mapp
            </Button>
            <Button onClick={createDoc}>
              <Plus className="mr-2 h-4 w-4" /> Nytt dokument
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <button
            onClick={() => setActiveFolder("all")}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              activeFolder === "all" ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
            )}
          >
            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Alla dokument</span>
            <span className="text-xs text-muted-foreground">{countFor("all")}</span>
          </button>
          <button
            onClick={() => setActiveFolder("unfiled")}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              activeFolder === "unfiled" ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
            )}
          >
            <span className="flex items-center gap-2"><Inbox className="h-4 w-4" /> Osorterade</span>
            <span className="text-xs text-muted-foreground">{countFor("unfiled")}</span>
          </button>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className={cn(
                "group flex items-center rounded-md transition-colors",
                activeFolder === folder.id ? "bg-primary/10" : "hover:bg-muted"
              )}
            >
              <button
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  "flex flex-1 items-center justify-between px-3 py-2 text-left text-sm",
                  activeFolder === folder.id && "font-medium text-primary"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </span>
                <span className="ml-2 text-xs text-muted-foreground">{countFor(folder.id)}</span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => void deleteFolder(folder.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </aside>

        <div className="space-y-4">
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
              <p className="text-sm text-muted-foreground">Inga dokument här ännu</p>
              <Button variant="outline" onClick={createDoc}>
                <Plus className="mr-2 h-4 w-4" /> Skapa dokument
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Flytta till mapp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FolderInput className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => void moveDoc(doc.id, null)}>
                            Osorterade
                          </DropdownMenuItem>
                          {folders.map((f) => (
                            <DropdownMenuItem key={f.id} onClick={() => void moveDoc(doc.id, f.id)}>
                              {f.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteDoc(doc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ändrad {new Date(doc.updated_at).toLocaleDateString("sv-SE")}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ny mapp</DialogTitle>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Mappnamn"
            onKeyDown={(e) => e.key === "Enter" && void createFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>Avbryt</Button>
            <Button onClick={createFolder}>Skapa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
