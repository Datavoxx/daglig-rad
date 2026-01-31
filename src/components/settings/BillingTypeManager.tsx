import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Pencil, Trash2, DollarSign, GripVertical, Check, X } from "lucide-react";
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

interface BillingType {
  id: string;
  user_id: string;
  name: string;
  abbreviation: string;
  hourly_rate: number | null;
  sort_order: number;
  is_active: boolean;
  billing_category: string;
  created_at: string;
  updated_at: string;
}

export function BillingTypeManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentBillingType, setCurrentBillingType] = useState<BillingType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
    hourly_rate: "",
    sort_order: "",
  });

  const { data: billingTypes = [], isLoading } = useQuery({
    queryKey: ["billing_types"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("billing_types")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("sort_order");

      if (error) throw error;
      return data as BillingType[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (billingType: Partial<BillingType>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      if (currentBillingType) {
        const { error } = await supabase
          .from("billing_types")
          .update({
            name: billingType.name,
            abbreviation: billingType.abbreviation,
            hourly_rate: billingType.hourly_rate,
            sort_order: billingType.sort_order,
          })
          .eq("id", currentBillingType.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("billing_types").insert({
          user_id: userData.user.id,
          name: billingType.name,
          abbreviation: billingType.abbreviation,
          hourly_rate: billingType.hourly_rate,
          sort_order: billingType.sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing_types"] });
      toast.success(currentBillingType ? "Debiteringstyp uppdaterad" : "Debiteringstyp tillagd");
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error("Kunde inte spara", { description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("billing_types")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing_types"] });
      toast.success("Status uppdaterad");
    },
    onError: (error: Error) => {
      toast.error("Kunde inte uppdatera status", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("billing_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing_types"] });
      toast.success("Debiteringstyp borttagen");
      setDeleteDialogOpen(false);
      setCurrentBillingType(null);
    },
    onError: (error: Error) => {
      toast.error("Kunde inte ta bort", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      abbreviation: "",
      hourly_rate: "",
      sort_order: "",
    });
  };

  const openCreateDialog = () => {
    setCurrentBillingType(null);
    resetForm();
    // Set default sort order to next available
    const nextSortOrder = billingTypes.length > 0 
      ? Math.max(...billingTypes.map(bt => bt.sort_order)) + 1 
      : 1;
    setFormData(prev => ({ ...prev, sort_order: nextSortOrder.toString() }));
    setDialogOpen(true);
  };

  const openEditDialog = (billingType: BillingType) => {
    setCurrentBillingType(billingType);
    setFormData({
      name: billingType.name,
      abbreviation: billingType.abbreviation,
      hourly_rate: billingType.hourly_rate?.toString() || "",
      sort_order: billingType.sort_order?.toString() || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (billingType: BillingType) => {
    setCurrentBillingType(billingType);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCurrentBillingType(null);
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
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : 0,
      sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0,
    });
  };

  const handleDelete = () => {
    if (currentBillingType) {
      deleteMutation.mutate(currentBillingType.id);
    }
  };

  const handleToggleActive = (billingType: BillingType) => {
    toggleActiveMutation.mutate({ id: billingType.id, is_active: !billingType.is_active });
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
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Debiteringstyper</CardTitle>
                <CardDescription>Hantera löne- och arbetstyper för tidsrapportering</CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Lägg till
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {billingTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Inga debiteringstyper tillagda ännu</p>
              <p className="text-xs mt-1">Klicka på "Lägg till" för att börja</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_80px_80px] gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                <div>Namn</div>
                <div>Förkortning</div>
                <div className="text-right">Pris</div>
                <div className="text-center">Sortering</div>
                <div className="text-center">Status</div>
                <div></div>
              </div>
              {/* Data rows */}
              <div className="divide-y">
                {billingTypes.map((billingType) => (
                  <div
                    key={billingType.id}
                    className={`grid grid-cols-[1fr_100px_100px_80px_80px_80px] gap-2 p-3 items-center hover:bg-muted/30 transition-colors ${
                      !billingType.is_active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <span className="font-medium text-sm">{billingType.name}</span>
                    </div>
                    <div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {billingType.abbreviation}
                      </Badge>
                    </div>
                    <div className="text-right text-sm">
                      {billingType.hourly_rate?.toLocaleString("sv-SE")} kr
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {billingType.sort_order}
                    </div>
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${billingType.is_active ? "text-green-600" : "text-muted-foreground"}`}
                        onClick={() => handleToggleActive(billingType)}
                      >
                        {billingType.is_active ? (
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
                        onClick={() => openEditDialog(billingType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(billingType)}
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
              {currentBillingType ? "Redigera debiteringstyp" : "Lägg till debiteringstyp"}
            </DialogTitle>
            <DialogDescription>
              {currentBillingType
                ? "Uppdatera uppgifterna för denna debiteringstyp"
                : "Fyll i uppgifterna för den nya debiteringstypen"}
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
                  placeholder="Målare"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Förkortning *</Label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  placeholder="MÅL"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Timpris (kr)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  placeholder="550"
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
              {currentBillingType ? "Spara" : "Lägg till"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort debiteringstyp?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort "{currentBillingType?.name}"? Detta kan inte ångras.
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
