import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, FileText, Infinity as InfinityIcon } from "lucide-react";
import { toast } from "sonner";
import { DocEditorToolbar } from "@/components/docs/DocEditorToolbar";

const MM_TO_PX = 96 / 25.4;
const A4_PAGE_PX = 297 * MM_TO_PX;

export default function DocView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pageMode, setPageMode] = useState<"a4" | "endless">(
    () => (localStorage.getItem("docs:pageMode") as "a4" | "endless") ?? "endless"
  );
  const [pageCount, setPageCount] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();


  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({ placeholder: "Börja skriva…" }),
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: "doc-editor focus:outline-none min-h-[60vh]",
      },
    },
    onUpdate: () => scheduleSave(),
  });

  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), 800);
  };

  const save = async () => {
    if (!id || !editor) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("documents")
      .update({
        title: title.trim() || "Namnlöst dokument",
        content: editor.getJSON() as never,
        plain_text: editor.getText(),
        updated_by: user?.id ?? null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Kunde inte spara dokumentet");
      return;
    }
    setSavedAt(new Date());
  };

  useEffect(() => {
    const load = async () => {
      if (!id || !editor) return;
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Dokumentet kunde inte hittas");
        navigate("/docs");
        return;
      }
      setTitle(data.title ?? "");
      editor.commands.setContent((data.content as never) ?? "");
      setLoaded(true);
    };
    void load();
  }, [id, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("docs:pageMode", pageMode);
  }, [pageMode]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el || pageMode !== "a4") {
      setPageCount(1);
      return;
    }
    const measure = () => {
      setPageCount(Math.max(1, Math.ceil(el.scrollHeight / A4_PAGE_PX)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageMode, loaded, editor]);


  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Ta bort dokumentet?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("Kunde inte ta bort dokumentet");
      return;
    }
    toast.success("Dokumentet togs bort");
    navigate("/docs");
  };

  if (!loaded) return null;

  return (
    <div className={`mx-auto w-full space-y-4 p-4 md:p-6 ${pageMode === "a4" ? "max-w-5xl" : "max-w-4xl"}`}>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/docs")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Alla dokument
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={pageMode === "a4" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPageMode("a4")}
            >
              <FileText className="mr-1 h-3.5 w-3.5" /> A4
            </Button>
            <Button
              type="button"
              variant={pageMode === "endless" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPageMode("endless")}
            >
              <Infinity className="mr-1 h-3.5 w-3.5" /> Obegränsad
            </Button>
          </div>
          {pageMode === "a4" && (
            <span className="text-xs text-muted-foreground">
              {pageCount} {pageCount === 1 ? "sida" : "sidor"}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {saving
              ? "Sparar…"
              : savedAt
                ? `Sparat ${savedAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`
                : "Alla ändringar sparas automatiskt"}
          </span>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleSave();
        }}
        placeholder="Namnlöst dokument"
        className="h-auto border-0 px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
      />

      <DocEditorToolbar editor={editor} />

      {pageMode === "a4" ? (
        <div className="overflow-x-auto">
          <div ref={pageRef} className="doc-page-a4 rounded-lg border border-border shadow-sm">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

