import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileEdit, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ata {
  id: string;
  ata_number: string | null;
  description: string;
  reason: string | null;
  estimated_hours: number | null;
  estimated_cost: number | null;
  status: string;
  created_at: string;
}

interface ProjectAtaTabProps {
  projectId: string;
}

export default function ProjectAtaTab({ projectId }: ProjectAtaTabProps) {
  const [atas, setAtas] = useState<Ata[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAta, setEditingAta] = useState<Ata | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    reason: "",
    estimated_hours: "",
    estimated_cost: "",
    status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAtas();
  }, [projectId]);

  const fetchAtas = async () => {
    const { data, error } = await supabase
      .from("project_ata")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Kunde inte hämta ÄTA", description: error.message, variant: "destructive" });
    } else {
      setAtas(data || []);
    }
    setLoading(false);
  };

  const generateAtaNumber = () => {
    const year = new Date().getFullYear();
    const count = atas.length + 1;
    return `ÄTA-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast({ title: "Beskrivning krävs", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      setSaving(false);
      return;
    }

    const payload = {
      project_id: projectId,
      user_id: user.id,
      ata_number: editingAta?.ata_number || generateAtaNumber(),
      description: formData.description,
      reason: formData.reason || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
      status: formData.status,
    };

    if (editingAta) {
      const { error } = await supabase
        .from("project_ata")
        .update(payload)
        .eq("id", editingAta.id);

      if (error) {
        toast({ title: "Kunde inte uppdatera ÄTA", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "ÄTA uppdaterad" });
        fetchAtas();
        closeDialog();
      }
    } else {
      const { error } = await supabase.from("project_ata").insert(payload);

      if (error) {
        toast({ title: "Kunde inte skapa ÄTA", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "ÄTA skapad" });
        fetchAtas();
        closeDialog();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (ata: Ata) => {
    const { error } = await supabase.from("project_ata").delete().eq("id", ata.id);
    if (error) {
      toast({ title: "Kunde inte ta bort ÄTA", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ÄTA borttagen" });
      fetchAtas();
    }
  };

  const openEdit = (ata: Ata) => {
    setEditingAta(ata);
    setFormData({
      description: ata.description,
      reason: ata.reason || "",
      estimated_hours: ata.estimated_hours?.toString() || "",
      estimated_cost: ata.estimated_cost?.toString() || "",
      status: ata.status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAta(null);
    setFormData({ description: "", reason: "", estimated_hours: "", estimated_cost: "", status: "pending" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Godkänd</Badge>;
      case "rejected":
        return <Badge variant="destructive">Nekad</Badge>;
      default:
        return <Badge variant="secondary">Väntande</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Ändrings- och tilläggsarbeten</h3>
          <p className="text-sm text-muted-foreground">Hantera ÄTA för projektet</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ny ÄTA
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAta ? "Redigera ÄTA" : "Ny ÄTA"}</DialogTitle>
              <DialogDescription>
                {editingAta ? "Uppdatera ÄTA-informationen" : "Lägg till ett ändrings- eller tilläggsarbete"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning *</Label>
                <Textarea
                  id="description"
                  placeholder="Beskriv arbetet..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Anledning</Label>
                <Input
                  id="reason"
                  placeholder="Varför behövs detta?"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Uppskattade timmar</Label>
                  <Input
                    id="hours"
                    type="number"
                    placeholder="0"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Uppskattad kostnad</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Väntande</SelectItem>
                    <SelectItem value="approved">Godkänd</SelectItem>
                    <SelectItem value="rejected">Nekad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Avbryt</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Sparar..." : editingAta ? "Spara ändringar" : "Skapa ÄTA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : atas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Inga ÄTA registrerade</h3>
          <p className="text-sm text-muted-foreground mt-1">Lägg till ändrings- och tilläggsarbeten här</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {atas.map((ata) => (
            <Card key={ata.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{ata.ata_number}</span>
                      {getStatusBadge(ata.status)}
                    </div>
                    <p className="font-medium">{ata.description}</p>
                    {ata.reason && <p className="text-sm text-muted-foreground">{ata.reason}</p>}
                    <div className="flex gap-4 text-sm text-muted-foreground pt-1">
                      {ata.estimated_hours && <span>{ata.estimated_hours} timmar</span>}
                      {ata.estimated_cost && <span>{formatCurrency(ata.estimated_cost)}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(ata)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ata)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
