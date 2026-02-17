import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Plus, Search, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useArticleCategories } from "@/hooks/useArticleCategories";
import { toast } from "sonner";

interface Article {
  id: string;
  name: string;
  description: string | null;
  article_category: string;
  unit: string;
  default_price: number;
}

interface EstimateItem {
  id: string;
  moment: string;
  type: "labor" | "material" | "subcontractor";
  article: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  hours: number;
  subtotal: number;
  rot_eligible: boolean;
  rut_eligible: boolean;
  show_only_total: boolean;
  comment: string;
  uncertainty: "high" | "low" | "medium";
  sort_order: number;
  markup_enabled: boolean;
  markup_percent: number;
}

interface ArticleLibrarySectionProps {
  onAddArticles: (items: EstimateItem[]) => void;
}

const UNIT_OPTIONS = ["st", "m", "m²", "m³", "kg", "l", "tim", "pkt", "rulle"];

export function ArticleLibrarySection({ onAddArticles }: ArticleLibrarySectionProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newArticle, setNewArticle] = useState({ name: "", description: "", category: "", unit: "st", price: "" });
  const { categoryNames } = useArticleCategories();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) setArticles(data);
    setLoading(false);
  };

  const handleCreateArticle = async () => {
    if (!newArticle.name.trim()) { toast.error("Ange ett namn"); return; }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const { error } = await supabase.from("articles").insert({
      user_id: user.id,
      name: newArticle.name.trim(),
      description: newArticle.description.trim() || null,
      article_category: newArticle.category || "Material",
      unit: newArticle.unit,
      default_price: parseFloat(newArticle.price) || 0,
      sort_order: articles.length,
    });

    if (error) {
      toast.error("Kunde inte skapa artikel");
    } else {
      toast.success("Artikel skapad");
      setNewArticle({ name: "", description: "", category: "", unit: "st", price: "" });
      setShowCreateDialog(false);
      await fetchArticles();
    }
    setCreating(false);
  };

  const filteredArticles = articles.filter((article) => {
    const query = searchQuery.toLowerCase();
    return (
      article.name.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query) ||
      article.article_category.toLowerCase().includes(query)
    );
  });

  const toggleArticle = (articleId: string) => {
    setSelectedArticles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) newSet.delete(articleId);
      else newSet.add(articleId);
      return newSet;
    });
  };

  const handleAddSelected = () => {
    const selectedItems: EstimateItem[] = [];
    let sortOrder = 0;
    selectedArticles.forEach((articleId) => {
      const article = articles.find((a) => a.id === articleId);
      if (article) {
        let itemType: "labor" | "material" | "subcontractor" = "material";
        if (article.article_category === "Arbete" || article.article_category === "Bygg") itemType = "labor";
        else if (article.article_category === "UE") itemType = "subcontractor";

        selectedItems.push({
          id: crypto.randomUUID(), moment: article.name, type: itemType,
          article: article.article_category, description: article.description || "",
          quantity: 1, unit: article.unit, unit_price: article.default_price,
          hours: 0, subtotal: article.default_price, rot_eligible: false, rut_eligible: false,
          show_only_total: false, comment: "", uncertainty: "medium",
          sort_order: sortOrder++, markup_enabled: false, markup_percent: 0,
        });
      }
    });
    if (selectedItems.length > 0) {
      onAddArticles(selectedItems);
      setSelectedArticles(new Set());
      setIsExpanded(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);

  const groupedArticles = filteredArticles.reduce((acc, article) => {
    const category = article.article_category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  if (loading) return null;

  return (
    <>
      <Card className="border bg-card">
        <CardHeader
          className="pb-2 pt-3 px-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Artikelbibliotek</CardTitle>
              <Badge variant="secondary" className="text-xs">{articles.length} artiklar</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              {isExpanded ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Sök artiklar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={(e) => { e.stopPropagation(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Ny
              </Button>
            </div>

            <ScrollArea className="h-[240px]">
              <div className="space-y-4">
                {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
                    <div className="space-y-1">
                      {categoryArticles.map((article) => {
                        const isSelected = selectedArticles.has(article.id);
                        return (
                          <div key={article.id} onClick={() => toggleArticle(article.id)}
                            className={cn("flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                              isSelected ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                            )}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn("flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                              )}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{article.name}</p>
                                {article.description && <p className="text-xs text-muted-foreground truncate">{article.description}</p>}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="text-sm font-medium">{formatCurrency(article.default_price)}</p>
                              <p className="text-xs text-muted-foreground">/{article.unit}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredArticles.length === 0 && articles.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">Inga artiklar ännu</p>
                    <Button variant="link" size="sm" onClick={() => setShowCreateDialog(true)}>Skapa din första artikel</Button>
                  </div>
                )}
                {filteredArticles.length === 0 && articles.length > 0 && (
                  <div className="text-center py-6 text-muted-foreground"><p className="text-sm">Inga artiklar hittades</p></div>
                )}
              </div>
            </ScrollArea>

            {selectedArticles.size > 0 && (
              <Button onClick={handleAddSelected} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Lägg till {selectedArticles.size} {selectedArticles.size === 1 ? "artikel" : "artiklar"}
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Ny artikel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Namn *</Label>
              <Input value={newArticle.name} onChange={(e) => setNewArticle(p => ({ ...p, name: e.target.value }))} placeholder="T.ex. Gipsplatta 13mm" />
            </div>
            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Textarea value={newArticle.description} onChange={(e) => setNewArticle(p => ({ ...p, description: e.target.value }))} placeholder="Valfri beskrivning" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={newArticle.category} onValueChange={(v) => setNewArticle(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Välj kategori" /></SelectTrigger>
                  <SelectContent>
                    {categoryNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Enhet</Label>
                <Select value={newArticle.unit} onValueChange={(v) => setNewArticle(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Standardpris (kr)</Label>
              <Input type="number" value={newArticle.price} onChange={(e) => setNewArticle(p => ({ ...p, price: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Avbryt</Button>
            <Button onClick={handleCreateArticle} disabled={creating}>{creating ? "Sparar..." : "Skapa artikel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
