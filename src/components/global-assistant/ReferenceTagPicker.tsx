import { useState, useEffect, useCallback } from "react";
import { Users, FileText, FolderOpen, ArrowLeft, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ReferenceType = "customer" | "project" | "estimate";

export interface ReferenceTag {
  type: ReferenceType;
  id: string;
  name: string;
}

interface ReferenceTagPickerProps {
  onSelect: (ref: ReferenceTag) => void;
  onClose: () => void;
}

const categories: { type: ReferenceType; label: string; icon: typeof Users; color: string }[] = [
  { type: "customer", label: "Kunder", icon: Users, color: "text-emerald-500" },
  { type: "estimate", label: "Offerter", icon: FileText, color: "text-violet-500" },
  { type: "project", label: "Projekt", icon: FolderOpen, color: "text-sky-500" },
];

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
}

export function ReferenceTagPicker({ onSelect, onClose }: ReferenceTagPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReferenceType | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (type: ReferenceType, q: string) => {
    setLoading(true);
    try {
      let items: SearchResult[] = [];

      if (type === "customer") {
        const { data } = await supabase
          .from("customers")
          .select("id, name, city")
          .ilike("name", `%${q}%`)
          .limit(10);
        items = (data || []).map((c) => ({ id: c.id, title: c.name, subtitle: c.city || undefined }));
      } else if (type === "project") {
        const { data } = await supabase
          .from("projects")
          .select("id, name, address")
          .ilike("name", `%${q}%`)
          .limit(10);
        items = (data || []).map((p) => ({ id: p.id, title: p.name, subtitle: p.address || undefined }));
      } else if (type === "estimate") {
        const { data } = await supabase
          .from("project_estimates")
          .select("id, offer_number, manual_project_name, manual_client_name")
          .or(`manual_project_name.ilike.%${q}%,offer_number.ilike.%${q}%,manual_client_name.ilike.%${q}%`)
          .limit(10);
        items = (data || []).map((e) => ({
          id: e.id,
          title: e.manual_project_name || e.offer_number || "Offert",
          subtitle: e.manual_client_name || e.offer_number || undefined,
        }));
      }

      setResults(items);
    } catch (err) {
      console.error("Reference search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on query change
  useEffect(() => {
    if (!selectedCategory) return;
    const timer = setTimeout(() => {
      search(selectedCategory, query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, search]);

  // Load initial results when category is selected
  useEffect(() => {
    if (selectedCategory) {
      search(selectedCategory, "");
    }
  }, [selectedCategory, search]);

  const handleSelect = (result: SearchResult) => {
    onSelect({
      type: selectedCategory!,
      id: result.id,
      name: result.title,
    });
  };

  const categoryMeta = selectedCategory
    ? categories.find((c) => c.type === selectedCategory)
    : null;

  return (
    <div className="w-72 rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
      {!selectedCategory ? (
        // Category selection
        <div className="p-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground px-1 mb-2">Tagga referens</p>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.type}
                onClick={() => setSelectedCategory(cat.type)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80", cat.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                {cat.label}
              </button>
            );
          })}
        </div>
      ) : (
        // Search view
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setQuery("");
                setResults([]);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", categoryMeta?.color)}>
              {categoryMeta && <categoryMeta.icon className="h-3.5 w-3.5" />}
            </div>
            <span className="text-sm font-medium">{categoryMeta?.label}</span>
          </div>

          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              autoFocus
              type="text"
              placeholder={`Sök ${categoryMeta?.label?.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          <ScrollArea className="max-h-52">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {query ? "Inga resultat" : "Inga poster hittades"}
              </p>
            ) : (
              <div className="p-1.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60"
                  >
                    <span className="text-sm font-medium text-foreground truncate w-full">{r.title}</span>
                    {r.subtitle && (
                      <span className="text-xs text-muted-foreground truncate w-full">{r.subtitle}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
