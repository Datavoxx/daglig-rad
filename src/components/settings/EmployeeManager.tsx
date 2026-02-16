import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Pencil, Trash2, User, Phone, Mail, Users, Clock, Shield, Wrench, Copy, Link, Check } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatHours(hours: number): string {
  if (hours === 0) return "0h";
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

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
  linked_user_id: string | null;
  invitation_status: string | null;
  employment_number: string | null;
  personal_number: string | null;
  employee_role: string;
}

export function EmployeeManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inviteLinkDialogOpen, setInviteLinkDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteEmployeeName, setInviteEmployeeName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    employment_number: "",
    personal_number: "",
    employee_role: "worker" as "worker" | "admin",
  });

  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      const { data, error } = await supabase
        .from("company_settings")
        .select("organization_name, company_name")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
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

  const { data: employeeHours = {} } = useQuery({
    queryKey: ["employee-hours-summary"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return {};

      const { data: entries, error } = await supabase
        .from("time_entries")
        .select("user_id, hours, date")
        .eq("employer_id", userData.user.id);

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const hoursByUser: Record<string, { thisMonth: number; total: number }> = {};
      
      entries?.forEach(entry => {
        if (!hoursByUser[entry.user_id]) {
          hoursByUser[entry.user_id] = { thisMonth: 0, total: 0 };
        }
        
        const entryDate = new Date(entry.date);
        hoursByUser[entry.user_id].total += Number(entry.hours);
        
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
          hoursByUser[entry.user_id].thisMonth += Number(entry.hours);
        }
      });

      return hoursByUser;
    },
  });

  const createInvitation = async (employee: { id: string; name: string; email: string; employee_role: string }) => {
    const organizationName = companySettings?.organization_name || companySettings?.company_name || "Din organisation";

    const { data, error } = await supabase.functions.invoke("send-employee-invitation", {
      body: {
        employeeId: employee.id,
        employeeEmail: employee.email || "",
        employeeName: employee.name,
        employeeRole: employee.employee_role,
        organizationName,
        baseUrl: "https://byggio.io",
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

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
            employment_number: employee.employment_number || null,
            personal_number: employee.personal_number || null,
            employee_role: employee.employee_role || "worker",
          })
          .eq("id", currentEmployee.id);
        if (error) throw error;
        return { isNew: false, employeeId: currentEmployee.id };
      } else {
        const { data, error } = await supabase.from("employees").insert({
          user_id: userData.user.id,
          name: employee.name,
          role: employee.role || null,
          phone: employee.phone || null,
          email: employee.email || null,
          hourly_rate: employee.hourly_rate || null,
          employment_number: employee.employment_number || null,
          personal_number: employee.personal_number || null,
          employee_role: employee.employee_role || "worker",
        }).select("id").single();
        if (error) throw error;
        return { isNew: true, employeeId: data.id };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      
      if (currentEmployee) {
        toast.success("Anställd uppdaterad");
        closeDialog();
      } else {
        toast.success("Anställd tillagd");
        closeDialog();
        
        // Create invitation and show link
        try {
          const invData = await createInvitation({
            id: result.employeeId,
            name: formData.name.trim(),
            email: formData.email.trim(),
            employee_role: formData.employee_role,
          });
          
          if (invData?.inviteUrl) {
            setInviteLink(invData.inviteUrl);
            setInviteEmployeeName(formData.name.trim());
            setLinkCopied(false);
            setInviteLinkDialogOpen(true);
            queryClient.invalidateQueries({ queryKey: ["employees"] });
          }
        } catch (err) {
          console.error("Failed to create invitation:", err);
          toast.error("Anställd tillagd men kunde inte skapa inbjudningslänk");
        }
      }
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
      phone: "",
      email: "",
      employment_number: "",
      personal_number: "",
      employee_role: "worker",
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
      phone: employee.phone || "",
      email: employee.email || "",
      employment_number: employee.employment_number || "",
      personal_number: employee.personal_number || "",
      employee_role: (employee.employee_role as "worker" | "admin") || "worker",
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
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      employment_number: formData.employment_number.trim(),
      personal_number: formData.personal_number.trim(),
      employee_role: formData.employee_role,
    } as any);
  };

  const handleDelete = () => {
    if (currentEmployee) {
      deleteMutation.mutate(currentEmployee.id);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast.success("Länk kopierad!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  };

  const getInvitationStatusBadge = (employee: Employee) => {
    switch (employee.invitation_status) {
      case "accepted":
        return <Badge variant="success" className="text-xs">Aktiv</Badge>;
      case "pending":
        return <Badge variant="warning" className="text-xs">Inbjudan skapad</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Ej inbjuden</Badge>;
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{employee.name}</p>
                        {employee.employee_role === "admin" ? (
                          <Badge variant="default" className="text-xs gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Wrench className="h-3 w-3" />
                            Arbetare
                          </Badge>
                        )}
                        {getInvitationStatusBadge(employee)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                      {(() => {
                        const hours = employee.linked_user_id ? employeeHours[employee.linked_user_id] : null;
                        return hours && (hours.thisMonth > 0 || hours.total > 0) ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatHours(hours.thisMonth)} denna månad</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{formatHours(hours.total)} totalt</span>
                          </div>
                        ) : null;
                      })()}
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
              <Label htmlFor="employee_role">Roll *</Label>
              <Select
                value={formData.employee_role}
                onValueChange={(value: "worker" | "admin") => setFormData({ ...formData, employee_role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Arbetare
                    </span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin (full åtkomst)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.employee_role === "admin"
                  ? "Admin har tillgång till alla moduler – samma som du."
                  : "Arbetare har tillgång till närvaro, tidsrapportering och dagrapporter."}
              </p>
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

            {/* Visma-fält */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3">Visma Lön-identifiering (för löneexport)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employment_number">Anställningsnummer</Label>
                  <Input
                    id="employment_number"
                    value={formData.employment_number}
                    onChange={(e) => setFormData({ ...formData, employment_number: e.target.value })}
                    placeholder="1001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal_number">Personnummer</Label>
                  <Input
                    id="personal_number"
                    value={formData.personal_number}
                    onChange={(e) => setFormData({ ...formData, personal_number: e.target.value })}
                    placeholder="YYYYMMDD-XXXX"
                  />
                </div>
              </div>
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

      {/* Invite Link Dialog */}
      <Dialog open={inviteLinkDialogOpen} onOpenChange={setInviteLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" />
              Inbjudningslänk skapad
            </DialogTitle>
            <DialogDescription>
              Kopiera länken nedan och skicka den till <strong>{inviteEmployeeName}</strong> via SMS, WhatsApp eller annan kanal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button onClick={handleCopyLink} variant="outline" className="shrink-0 gap-2">
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Kopierad
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Kopiera
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Länken är giltig i 7 dagar. Mottagaren skapar ett lösenord och aktiverar sitt konto.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setInviteLinkDialogOpen(false)}>
              Klar
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
