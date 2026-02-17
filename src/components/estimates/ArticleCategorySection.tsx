import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Tags, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useArticleCategories, type ArticleCategory } from "@/hooks/useArticleCategories";

const TYPE_LABELS: Record<string, string> = {
  labor: "Arbete",
  material: "Material",
  subcontractor: "UE",
};

export function ArticleCategorySection() {
  const { categories, loading, refetch } = useArticleCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ArticleCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("material");

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormType("material");
    setDialogOpen(true);
  };

  const openEdit = (cat: ArticleCategory) => {
    setEditing(cat);
    setFormName(cat.name);
    setFormType(cat.type || "material");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Namn krävs"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("article_categories")
        .update({ name: formName.trim(), type: formType })
        .eq("id", editing.id);
      if (error) toast.error("Kunde inte uppdatera");
      else { toast.success("Kategori uppdaterad"); setDialogOpen(false); refetch(); }
    } else {
      const { error } = await supabase
        .from("article_categories")
        .insert({ user_id: user.id, name: formName.trim(), type: formType, sort_order: categories.length });
      if (error) toast.error("Kunde inte skapa kategori");
      else { toast.success("Kategori skapad"); setDialogOpen(false); refetch(); }
    }
    setSaving(false);
  };

  const handleDelete = async (cat: ArticleCategory) => {
    if (!confirm(`Ta bort "${cat.name}"?`)) return;
    const { error } = await supabase.from("article_categories").delete().eq("id", cat.id);
    if (error) toast.error("Kunde inte ta bort");
    else { toast.success("Kategori borttagen"); refetch(); }
  };

  if (loading) {
    return (
      <Card className="border bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border bg-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Artikelkategorier</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={openCreate} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Ny
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Inga kategorier</p>
          ) : (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/40 group transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm truncate">{cat.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {TYPE_LABELS[cat.type || "material"] || cat.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(cat)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Redigera kategori" : "Ny kategori"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Namn</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Plattsättning" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Typ</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Arbete</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="subcontractor">UE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
