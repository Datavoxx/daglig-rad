import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Pencil, Trash2, User, Phone, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Employee {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function EmployeeManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    hourly_rate: "",
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("name");

      if (error) throw error;
      return data as Employee[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (employee: Partial<Employee>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      if (currentEmployee) {
        const { error } = await supabase
          .from("employees")
          .update({
            name: employee.name,
            role: employee.role || null,
            phone: employee.phone || null,
            email: employee.email || null,
            hourly_rate: employee.hourly_rate || null,
          })
          .eq("id", currentEmployee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert({
          user_id: userData.user.id,
          name: employee.name,
          role: employee.role || null,
          phone: employee.phone || null,
          email: employee.email || null,
          hourly_rate: employee.hourly_rate || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(currentEmployee ? "Anställd uppdaterad" : "Anställd tillagd");
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error("Kunde inte spara", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Anställd borttagen");
      setDeleteDialogOpen(false);
      setCurrentEmployee(null);
    },
    onError: (error: Error) => {
      toast.error("Kunde inte ta bort", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      hourly_rate: "",
    });
  };

  const openCreateDialog = () => {
    setCurrentEmployee(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      role: employee.role || "",
      phone: employee.phone || "",
      email: employee.email || "",
      hourly_rate: employee.hourly_rate?.toString() || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setCurrentEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCurrentEmployee(null);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Namn krävs");
      return;
    }

    saveMutation.mutate({
      name: formData.name.trim(),
      role: formData.role.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
    });
  };

  const handleDelete = () => {
    if (currentEmployee) {
      deleteMutation.mutate(currentEmployee.id);
    }
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
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Anställda</CardTitle>
                <CardDescription>Hantera personal för dina projekt</CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Lägg till
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Inga anställda tillagda ännu</p>
              <p className="text-xs mt-1">Klicka på "Lägg till" för att börja</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{employee.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {employee.role && <span>{employee.role}</span>}
                        {employee.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </span>
                        )}
                        {employee.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentEmployee ? "Redigera anställd" : "Lägg till anställd"}
            </DialogTitle>
            <DialogDescription>
              {currentEmployee
                ? "Uppdatera uppgifterna för denna anställd"
                : "Fyll i uppgifterna för den nya anställda"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Erik Svensson"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Roll/Titel</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Snickare"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="070-123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="erik@exempel.se"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Timpris (kr)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="450"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {currentEmployee ? "Spara" : "Lägg till"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort anställd?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {currentEmployee?.name}? Detta kan inte ångras.
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
