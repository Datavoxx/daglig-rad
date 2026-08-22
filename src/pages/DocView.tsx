import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocEditor } from "@/components/docs/DocEditor";
import { DocLinkPicker } from "@/components/docs/DocLinkPicker";
import type { DocumentRecord } from "@/hooks/useDocuments";
import { toast } from "sonner";

export default function DocView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [title, setTitle] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Dokumentet kunde inte hämtas");
        navigate("/docs");
        return;
      }
      setDoc(data as DocumentRecord);
      setTitle((data as DocumentRecord).title);
    };
    load();
  }, [id, navigate]);

  const persist = useCallback(
    async (patch: Partial<DocumentRecord>) => {
      if (!id) return;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("documents")
        .update({ ...patch, updated_by: userData.user?.id ?? null })
        .eq("id", id);

      if (error) {
        console.error("Error saving document:", error);
        toast.error("Kunde inte spara");
        return;
      }
      setSavedAt(new Date());
    },
    [id]
  );

  const scheduleSave = useCallback(
    (patch: Partial<DocumentRecord>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(patch), 1500);
    },
    [persist]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!doc) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/docs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Docs
        </Button>
        <span className="text-xs text-muted-foreground">
          {savedAt ? `Sparat ${format(savedAt, "HH:mm")}` : ""}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value });
          }}
          placeholder="Namnlöst dokument"
          className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
        />
      </div>

      <DocLinkPicker
        projectId={doc.project_id}
        customerId={doc.customer_id}
        onChange={(values) => {
          setDoc({ ...doc, ...values });
          persist(values);
        }}
      />

      <DocEditor
        content={doc.content}
        onChange={(content, plainText) => scheduleSave({ content, plain_text: plainText })}
      />
    </div>
  );
}
