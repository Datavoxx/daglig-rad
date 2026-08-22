import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentRecord {
  id: string;
  user_id: string;
  created_by: string;
  updated_by: string | null;
  title: string;
  content: any;
  plain_text: string | null;
  project_id: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Returns the company owner id (employer) for the signed-in user. */
export async function getCompanyOwnerId(userId: string): Promise<string> {
  const { data } = await supabase
    .from("employees")
    .select("user_id")
    .eq("linked_user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return data?.user_id ?? userId;
}

export function useDocuments(options?: { projectId?: string }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    let query = supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false });

    if (options?.projectId) {
      query = query.eq("project_id", options.projectId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } else {
      setDocuments((data ?? []) as DocumentRecord[]);
    }
    setLoading(false);
  }, [options?.projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = useCallback(
    async (values?: Partial<Pick<DocumentRecord, "title" | "project_id" | "customer_id">>) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const ownerId = await getCompanyOwnerId(user.id);

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: ownerId,
          created_by: user.id,
          updated_by: user.id,
          title: values?.title ?? "Namnlöst dokument",
          content: { type: "doc", content: [{ type: "paragraph" }] },
          plain_text: "",
          project_id: values?.project_id ?? null,
          customer_id: values?.customer_id ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating document:", error);
        return null;
      }

      await fetchDocuments();
      return data as DocumentRecord;
    },
    [fetchDocuments]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) {
        console.error("Error deleting document:", error);
        return false;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      return true;
    },
    []
  );

  return { documents, loading, refetch: fetchDocuments, createDocument, deleteDocument };
}
