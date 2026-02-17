import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ArticleCategory {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const DEFAULT_CATEGORIES = [
  { name: "Arbete", type: "labor" },
  { name: "Bygg", type: "material" },
  { name: "Deponi", type: "material" },
  { name: "Framkörning", type: "labor" },
  { name: "Förbrukning", type: "material" },
  { name: "Förvaltning", type: "labor" },
  { name: "Markarbete", type: "labor" },
  { name: "Maskin", type: "material" },
  { name: "Material", type: "material" },
  { name: "Målning", type: "labor" },
  { name: "Snöröjning", type: "labor" },
  { name: "Städ", type: "labor" },
  { name: "Trädgårdsskötsel", type: "labor" },
];

export function useArticleCategories() {
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("article_categories")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch categories:", error);
      setLoading(false);
      return;
    }

    // Seed defaults if empty
    if (!data || data.length === 0) {
      const seeds = DEFAULT_CATEGORIES.map((cat, i) => ({
        user_id: user.id,
        name: cat.name,
        type: cat.type,
        sort_order: i,
        is_active: true,
      }));

      const { data: seeded, error: seedErr } = await supabase
        .from("article_categories")
        .insert(seeds)
        .select();

      if (seedErr) {
        console.error("Failed to seed categories:", seedErr);
      } else {
        setCategories(seeded || []);
      }
    } else {
      setCategories(data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryNames = categories
    .filter((c) => c.is_active !== false)
    .map((c) => c.name);

  return { categories, categoryNames, loading, refetch: fetchCategories };
}
