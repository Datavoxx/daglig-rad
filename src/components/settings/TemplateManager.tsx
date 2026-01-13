import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Pencil, Trash2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  content: string;
  type: string;
  is_default: boolean;
}

type TemplateType = "introduction" | "closing";

const TYPE_LABELS: Record<TemplateType, string> = {
  introduction: "Inledningsmallar",
  closing: "Villkorsmallar",
};

const TYPE_DESCRIPTIONS: Record<TemplateType, string> = {
  introduction: "Mallar för offertens inledning",
  closing: "Mallar för villkor och avslut",
};

export function TemplateManager() {
  const queryClient = useQueryClient();
  const [introOpen, setIntroOpen] = useState(true);
  const [closingOpen, setClosingOpen] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [currentType, setCurrentType] = useState<TemplateType>("introduction");
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");

  // Fetch all templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["estimate-text-templates"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("estimate_text_templates")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("name");

      if (error) throw error;
      return (data || []) as Template[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      content,
      type,
    }: {
      id?: string;
      name: string;
      content: string;
      type: TemplateType;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      if (id) {
        const { error } = await supabase
          .from("estimate_text_templates")
          .update({ name, content })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("estimate_text_templates").insert({
          user_id: userData.user.id,
          name,
          content,
          type,
          is_default: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate-text-templates"] });
      setEditDialogOpen(false);
      resetForm();
      toast.success(currentTemplate ? "Mall uppdaterad" : "Mall skapad");
    },
    onError: (error: any) => {
      toast.error("Kunde inte spara mall", { description: error.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estimate_text_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate-text-templates"] });
      setDeleteDialogOpen(false);
      setCurrentTemplate(null);
      toast.success("Mall borttagen");
    },
    onError: (error: any) => {
      toast.error("Kunde inte ta bort mall", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormContent("");
    setCurrentTemplate(null);
  };

  const openCreateDialog = (type: TemplateType) => {
    resetForm();
    setCurrentType(type);
    setEditDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setCurrentTemplate(template);
    setCurrentType(template.type as TemplateType);
    setFormName(template.name);
    setFormContent(template.content);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (template: Template) => {
    setCurrentTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("Ange ett namn för mallen");
      return;
    }
    saveMutation.mutate({
      id: currentTemplate?.id,
      name: formName.trim(),
      content: formContent,
      type: currentType,
    });
  };

  const handleDelete = () => {
    if (currentTemplate) {
      deleteMutation.mutate(currentTemplate.id);
    }
  };

  const introTemplates = templates?.filter((t) => t.type === "introduction") || [];
  const closingTemplates = templates?.filter((t) => t.type === "closing") || [];

  const renderTemplateList = (
    type: TemplateType,
    templateList: Template[],
    isOpen: boolean,
    setIsOpen: (open: boolean) => void
  ) => (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2 -ml-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
            />
            <span className="font-medium">{TYPE_LABELS[type]}</span>
            <span className="text-xs text-muted-foreground">
              ({templateList.length})
            </span>
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCreateDialog(type)}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Lägg till
        </Button>
      </div>
      <CollapsibleContent className="space-y-2">
        {templateList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 px-2">
            Inga egna mallar ännu. Klicka "Lägg till" för att skapa en.
          </p>
        ) : (
          templateList.map((template) => (
            <div
              key={template.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {template.content || "Tom mall"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(template)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Offertmallar</CardTitle>
              <CardDescription>Hantera mallar för offerter</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Offertmallar</CardTitle>
              <CardDescription>
                Skapa egna mallar för inledning och villkor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderTemplateList("introduction", introTemplates, introOpen, setIntroOpen)}
          <div className="border-t" />
          {renderTemplateList("closing", closingTemplates, closingOpen, setClosingOpen)}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate ? "Redigera mall" : "Skapa ny mall"}
            </DialogTitle>
            <DialogDescription>
              {TYPE_DESCRIPTIONS[currentType]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Namn</Label>
              <Input
                id="template-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="T.ex. Standardvillkor, ROT-inledning..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Innehåll</Label>
              <Textarea
                id="template-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Skriv mallens innehåll här..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saveMutation.isPending}
            >
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : currentTemplate ? (
                "Spara ändringar"
              ) : (
                "Skapa mall"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort mall?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort mallen "{currentTemplate?.name}"?
              Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tar bort...
                </>
              ) : (
                "Ta bort"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
