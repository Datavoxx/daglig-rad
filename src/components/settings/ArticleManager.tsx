import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Article {
  id: string;
  name: string;
  description: string | null;
  article_category: string;
  unit: string;
  default_price: number;
  is_active: boolean;
  sort_order: number;
}

const ARTICLE_CATEGORIES = [
  "Material",
  "Arbete",
  "Bygg",
  "Deponi",
  "El",
  "Maskin",
  "Målning",
  "Plattsättning",
  "UE",
  "VVS",
  "Övrigt",
];

const UNITS = ["st", "m", "m²", "m³", "kg", "tim", "h", "dag", "paket", "rulle"];

export function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    article_category: "Material",
    unit: "st",
    default_price: "",
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Kunde inte hämta artiklar");
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingArticle(null);
    setFormData({
      name: "",
      description: "",
      article_category: "Material",
      unit: "st",
      default_price: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      name: article.name,
      description: article.description || "",
      article_category: article.article_category,
      unit: article.unit,
      default_price: article.default_price.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Namn krävs");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    const articleData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      article_category: formData.article_category,
      unit: formData.unit,
      default_price: parseFloat(formData.default_price) || 0,
    };

    if (editingArticle) {
      const { error } = await supabase
        .from("articles")
        .update(articleData)
        .eq("id", editingArticle.id);

      if (error) {
        toast.error("Kunde inte uppdatera artikel");
      } else {
        toast.success("Artikel uppdaterad");
        setDialogOpen(false);
        fetchArticles();
      }
    } else {
      const { error } = await supabase
        .from("articles")
        .insert({
          ...articleData,
          user_id: user.id,
          sort_order: articles.length,
        });

      if (error) {
        toast.error("Kunde inte skapa artikel");
      } else {
        toast.success("Artikel skapad");
        setDialogOpen(false);
        fetchArticles();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`Vill du ta bort "${article.name}"?`)) return;

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", article.id);

    if (error) {
      toast.error("Kunde inte ta bort artikel");
    } else {
      toast.success("Artikel borttagen");
      fetchArticles();
    }
  };

  const toggleActive = async (article: Article) => {
    const { error } = await supabase
      .from("articles")
      .update({ is_active: !article.is_active })
      .eq("id", article.id);

    if (error) {
      toast.error("Kunde inte uppdatera artikel");
    } else {
      fetchArticles();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Artikelbibliotek</CardTitle>
              <CardDescription>
                Spara artiklar som kan återanvändas i offerter
              </CardDescription>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Ny artikel
          </Button>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga artiklar ännu</p>
              <p className="text-sm">Skapa din första artikel för att komma igång</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Enhet</TableHead>
                    <TableHead className="text-right">Pris</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id} className={!article.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{article.name}</p>
                          {article.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {article.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{article.article_category}</Badge>
                      </TableCell>
                      <TableCell>{article.unit}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(article.default_price)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={article.is_active ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleActive(article)}
                        >
                          {article.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(article)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(article)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Redigera artikel" : "Ny artikel"}
            </DialogTitle>
            <DialogDescription>
              {editingArticle
                ? "Uppdatera artikelns information"
                : "Skapa en ny artikel för ditt bibliotek"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Gipsplatta 13mm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Valfri beskrivning..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.article_category}
                  onValueChange={(value) => setFormData({ ...formData, article_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Enhet</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Standardpris (kr)</Label>
              <Input
                id="price"
                type="number"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
