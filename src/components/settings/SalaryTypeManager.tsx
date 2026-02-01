import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Pencil, Trash2, Wallet, GripVertical, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalaryType {
  id: string;
  user_id: string;
  name: string;
  abbreviation: string;
  hourly_cost: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function SalaryTypeManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSalaryType, setCurrentSalaryType] = useState<SalaryType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
    hourly_cost: "",
    sort_order: "",
  });

  const { data: salaryTypes = [], isLoading } = useQuery({
    queryKey: ["salary_types"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("salary_types")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("sort_order");

      if (error) throw error;
      return data as SalaryType[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (salaryType: Partial<SalaryType>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      if (currentSalaryType) {
        const { error } = await supabase
          .from("salary_types")
          .update({
            name: salaryType.name,
            abbreviation: salaryType.abbreviation,
            hourly_cost: salaryType.hourly_cost,
            sort_order: salaryType.sort_order,
          })
          .eq("id", currentSalaryType.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("salary_types").insert({
          user_id: userData.user.id,
          name: salaryType.name,
          abbreviation: salaryType.abbreviation,
          hourly_cost: salaryType.hourly_cost,
          sort_order: salaryType.sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary_types"] });
      toast.success(currentSalaryType ? "Lönetyp uppdaterad" : "Lönetyp tillagd");
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error("Kunde inte spara", { description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("salary_types")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary_types"] });
      toast.success("Status uppdaterad");
    },
    onError: (error: Error) => {
      toast.error("Kunde inte uppdatera status", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary_types"] });
      toast.success("Lönetyp borttagen");
      setDeleteDialogOpen(false);
      setCurrentSalaryType(null);
    },
    onError: (error: Error) => {
      toast.error("Kunde inte ta bort", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      abbreviation: "",
      hourly_cost: "",
      sort_order: "",
    });
  };

  const openCreateDialog = () => {
    setCurrentSalaryType(null);
    resetForm();
    const nextSortOrder = salaryTypes.length > 0 
      ? Math.max(...salaryTypes.map(st => st.sort_order)) + 1 
      : 1;
    setFormData(prev => ({ ...prev, sort_order: nextSortOrder.toString() }));
    setDialogOpen(true);
  };

  const openEditDialog = (salaryType: SalaryType) => {
    setCurrentSalaryType(salaryType);
    setFormData({
      name: salaryType.name,
      abbreviation: salaryType.abbreviation,
      hourly_cost: salaryType.hourly_cost?.toString() || "",
      sort_order: salaryType.sort_order?.toString() || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (salaryType: SalaryType) => {
    setCurrentSalaryType(salaryType);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCurrentSalaryType(null);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Namn krävs");
      return;
    }
    if (!formData.abbreviation.trim()) {
      toast.error("Förkortning krävs");
      return;
    }

    saveMutation.mutate({
      name: formData.name.trim(),
      abbreviation: formData.abbreviation.trim().toUpperCase(),
      hourly_cost: formData.hourly_cost ? parseFloat(formData.hourly_cost) : 0,
      sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0,
    });
  };

  const handleDelete = () => {
    if (currentSalaryType) {
      deleteMutation.mutate(currentSalaryType.id);
    }
  };

  const handleToggleActive = (salaryType: SalaryType) => {
    toggleActiveMutation.mutate({ id: salaryType.id, is_active: !salaryType.is_active });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Lönetyper</CardTitle>
                <CardDescription>Hantera personalkostnader per yrkesroll</CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Lägg till
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {salaryTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Inga lönetyper tillagda ännu</p>
              <p className="text-xs mt-1">Klicka på "Lägg till" för att börja</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_80px_80px] gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                <div>Namn</div>
                <div>Förkortning</div>
                <div className="text-right">Kostnad</div>
                <div className="text-center">Sortering</div>
                <div className="text-center">Status</div>
                <div></div>
              </div>
              {/* Data rows */}
              <div className="divide-y">
                {salaryTypes.map((salaryType) => (
                  <div
                    key={salaryType.id}
                    className={`grid grid-cols-[1fr_100px_100px_80px_80px_80px] gap-2 p-3 items-center hover:bg-muted/30 transition-colors ${
                      !salaryType.is_active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <span className="font-medium text-sm">{salaryType.name}</span>
                    </div>
                    <div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {salaryType.abbreviation}
                      </Badge>
                    </div>
                    <div className="text-right text-sm">
                      {salaryType.hourly_cost?.toLocaleString("sv-SE")} kr
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {salaryType.sort_order}
                    </div>
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${salaryType.is_active ? "text-green-600" : "text-muted-foreground"}`}
                        onClick={() => handleToggleActive(salaryType)}
                      >
                        {salaryType.is_active ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(salaryType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(salaryType)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentSalaryType ? "Redigera lönetyp" : "Lägg till lönetyp"}
            </DialogTitle>
            <DialogDescription>
              {currentSalaryType
                ? "Uppdatera uppgifterna för denna lönetyp"
                : "Fyll i uppgifterna för den nya lönetypen"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Snickare"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Förkortning *</Label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  placeholder="SNI"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_cost">Personalkostnad (kr/tim)</Label>
                <Input
                  id="hourly_cost"
                  type="number"
                  value={formData.hourly_cost}
                  onChange={(e) => setFormData({ ...formData, hourly_cost: e.target.value })}
                  placeholder="450"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sorteringsordning</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {currentSalaryType ? "Spara" : "Lägg till"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort lönetyp?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort "{currentSalaryType?.name}"? Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
