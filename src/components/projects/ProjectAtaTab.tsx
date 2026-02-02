import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  FileEdit,
  Trash2,
  GripVertical,
  AlertTriangle,
  Eye,
  EyeOff,
  FileDown,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generateAtaPdf } from "@/lib/generateAtaPdf";
import { VoicePromptButton } from "@/components/shared/VoicePromptButton";
import { AI_AGENTS } from "@/config/aiAgents";

interface Ata {
  id: string;
  ata_number: string | null;
  description: string;
  reason: string | null;
  estimated_hours: number | null;
  estimated_cost: number | null;
  status: string;
  created_at: string;
  article: string | null;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  subtotal: number | null;
  rot_eligible: boolean | null;
  show_only_total: boolean | null;
  sort_order: number | null;
}

interface ProjectAtaTabProps {
  projectId: string;
  projectName?: string;
  clientName?: string;
  projectAddress?: string;
  projectPostalCode?: string;
  projectCity?: string;
}

const articleCategories = [
  "Arbete",
  "Bygg",
  "Deponi",
  "El",
  "Maskin",
  "Material",
  "Målning",
  "Plattsättning",
  "VVS",
  "Övrigt",
];

const unitOptions = ["tim", "st", "m", "m²", "m³", "lpm", "kg", "klump"];

const statusOptions = [
  { value: "pending", label: "Väntande" },
  { value: "approved", label: "Godkänd" },
  { value: "rejected", label: "Nekad" },
];

export default function ProjectAtaTab({ 
  projectId, 
  projectName = "Projekt", 
  clientName,
  projectAddress,
  projectPostalCode,
  projectCity 
}: ProjectAtaTabProps) {
  const [atas, setAtas] = useState<Ata[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    article: "Arbete",
    description: "",
    reason: "",
    unit: "tim",
    quantity: "1",
    unit_price: "",
    rot_eligible: false,
    status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const { toast } = useToast();

  const handleVoiceInput = async (transcript: string) => {
    setIsVoiceProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-voice-edits", {
        body: {
          transcript,
          currentData: formData,
          documentType: "ata",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFormData({
        article: data.article || formData.article,
        description: data.description || formData.description,
        reason: data.reason || formData.reason,
        unit: data.unit || formData.unit,
        quantity: data.quantity?.toString() || formData.quantity,
        unit_price: data.unit_price?.toString() || formData.unit_price,
        rot_eligible: data.rot_eligible ?? formData.rot_eligible,
        status: data.status || formData.status,
      });

      toast({ title: "Fält ifyllda från röstinspelning" });
    } catch (error) {
      console.error("Voice input error:", error);
      toast({ title: "Kunde inte tolka röstinspelning", variant: "destructive" });
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  useEffect(() => {
    fetchAtas();
  }, [projectId]);

  const fetchAtas = async () => {
    const { data, error } = await supabase
      .from("project_ata")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
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
    return `ÄTA-${year}-${String(count).padStart(3, "0")}`;
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

    const quantity = formData.quantity ? parseFloat(formData.quantity) : 1;
    const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : 0;
    const subtotal = quantity * unitPrice;

    const payload = {
      project_id: projectId,
      user_id: user.id,
      ata_number: generateAtaNumber(),
      article: formData.article,
      description: formData.description,
      reason: formData.reason || null,
      unit: formData.unit,
      quantity,
      unit_price: unitPrice,
      subtotal,
      rot_eligible: formData.rot_eligible,
      status: formData.status,
      estimated_hours: formData.unit === "tim" ? quantity : null,
      estimated_cost: subtotal > 0 ? subtotal : null,
      sort_order: atas.length,
    };

    const { error } = await supabase.from("project_ata").insert(payload);

    if (error) {
      toast({ title: "Kunde inte skapa ÄTA", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ÄTA skapad" });
      fetchAtas();
      closeDialog();
    }

    setSaving(false);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData({
      article: "Arbete",
      description: "",
      reason: "",
      unit: "tim",
      quantity: "1",
      unit_price: "",
      rot_eligible: false,
      status: "pending",
    });
  };

  const handleFieldUpdate = async (ataId: string, field: string, value: any) => {
    const ata = atas.find((a) => a.id === ataId);
    if (!ata) return;

    let updateData: any = { [field]: value };

    // Recalculate subtotal if quantity or unit_price changes
    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? value : ata.quantity || 1;
      const unitPrice = field === "unit_price" ? value : ata.unit_price || 0;
      updateData.subtotal = quantity * unitPrice;
      updateData.estimated_cost = updateData.subtotal > 0 ? updateData.subtotal : null;
      if (ata.unit === "tim" && field === "quantity") {
        updateData.estimated_hours = value;
      }
    }

    const { error } = await supabase
      .from("project_ata")
      .update(updateData)
      .eq("id", ataId);

    if (error) {
      toast({ title: "Kunde inte uppdatera", description: error.message, variant: "destructive" });
    } else {
      setAtas((prev) =>
        prev.map((a) => (a.id === ataId ? { ...a, ...updateData } : a))
      );
    }
  };

  const handleDelete = async (ataId: string) => {
    const { error } = await supabase.from("project_ata").delete().eq("id", ataId);
    if (error) {
      toast({ title: "Kunde inte ta bort ÄTA", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "ÄTA borttagen" });
      setAtas((prev) => prev.filter((a) => a.id !== ataId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Godkänd</Badge>;
      case "rejected":
        return <Badge variant="destructive">Nekad</Badge>;
      default:
        return <Badge variant="secondary">Väntande</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount && amount !== 0) return "-";
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals by status
  const totals = atas.reduce(
    (acc, ata) => {
      const subtotal = ata.subtotal || 0;
      if (ata.status === "approved") acc.approved += subtotal;
      else if (ata.status === "rejected") acc.rejected += subtotal;
      else acc.pending += subtotal;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const hasMissingPricing = (ata: Ata) => {
    return !ata.unit_price || ata.unit_price === 0;
  };

  const handleExportPdf = async () => {
    if (atas.length === 0) {
      toast({ title: "Inga ÄTA att exportera", variant: "destructive" });
      return;
    }

    setExportingPdf(true);
    try {
      // Fetch company settings for logo
      const { data: companySettings } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      await generateAtaPdf({
        ataItems: atas,
        project: {
          name: projectName,
          client_name: clientName || null,
          address: projectAddress || null,
          postal_code: projectPostalCode || null,
          city: projectCity || null,
        },
        companySettings,
      });

      toast({ title: "PDF exporterad" });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({ title: "Kunde inte exportera PDF", variant: "destructive" });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Ändrings- och tilläggsarbeten</h3>
          <p className="text-sm text-muted-foreground">
            Hantera ÄTA för projektet – strukturerat som offertposter
          </p>
        </div>
        <div className="flex items-center gap-2">
          {atas.length > 0 && (
            <Button variant="outline" onClick={handleExportPdf} disabled={exportingPdf}>
              {exportingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Exportera PDF
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ny ÄTA
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ny ÄTA</DialogTitle>
              <DialogDescription>
                Lägg till ett ändrings- eller tilläggsarbete
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Voice input prompt */}
              <VoicePromptButton
                onTranscriptComplete={handleVoiceInput}
                isProcessing={isVoiceProcessing}
                agentName="Ulla AI"
                agentAvatar={AI_AGENTS.diary.avatar}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Artikel</Label>
                  <Select
                    value={formData.article}
                    onValueChange={(value) => setFormData({ ...formData, article: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {articleCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Enhet</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beskrivning *</Label>
                <Textarea
                  placeholder="Beskriv arbetet..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Anledning</Label>
                <Input
                  placeholder="Varför behövs detta?"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Antal</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>À-pris</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rot-new"
                  checked={formData.rot_eligible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rot_eligible: checked === true })
                  }
                />
                <Label htmlFor="rot-new" className="cursor-pointer">
                  ROT-avdrag
                </Label>
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
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Avbryt
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Sparar..." : "Skapa ÄTA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      ) : atas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
          <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Inga ÄTA registrerade</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Lägg till ändrings- och tilläggsarbeten här
          </p>
        </div>
      ) : (
        <TooltipProvider delayDuration={0}>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-24">ÄTA-nr</TableHead>
                  <TableHead className="w-28">Artikel</TableHead>
                  <TableHead className="min-w-[200px]">Beskrivning</TableHead>
                  <TableHead className="w-16 text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <Eye className="h-4 w-4 mx-auto" />
                      </TooltipTrigger>
                      <TooltipContent>Visa endast total</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-20 text-right">Antal</TableHead>
                  <TableHead className="w-20">Enhet</TableHead>
                  <TableHead className="w-24 text-right">À-pris</TableHead>
                  <TableHead className="w-28 text-right">Summa</TableHead>
                  <TableHead className="w-12 text-center">ROT</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atas.map((ata) => (
                  <TableRow
                    key={ata.id}
                    className={cn(
                      "group",
                      ata.status === "rejected" && "opacity-50"
                    )}
                  >
                    <TableCell className="text-muted-foreground">
                      <GripVertical className="h-4 w-4 cursor-grab" />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {hasMissingPricing(ata) && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Saknar prisuppgifter för fakturering
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {ata.ata_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ata.article || "Arbete"}
                        onValueChange={(value) => handleFieldUpdate(ata.id, "article", value)}
                      >
                        <SelectTrigger className="h-8 text-xs border-0 bg-transparent hover:bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {articleCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={ata.description}
                        onChange={(e) => handleFieldUpdate(ata.id, "description", e.target.value)}
                        className="h-8 text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-card"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={ata.show_only_total || false}
                        onCheckedChange={(checked) =>
                          handleFieldUpdate(ata.id, "show_only_total", checked === true)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.5"
                        value={ata.quantity ?? 1}
                        onChange={(e) =>
                          handleFieldUpdate(ata.id, "quantity", parseFloat(e.target.value) || 1)
                        }
                        className="h-8 text-sm text-right border-0 bg-transparent hover:bg-muted/50 focus:bg-card tabular-nums"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ata.unit || "tim"}
                        onValueChange={(value) => handleFieldUpdate(ata.id, "unit", value)}
                      >
                        <SelectTrigger className="h-8 text-xs border-0 bg-transparent hover:bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={ata.unit_price ?? ""}
                        onChange={(e) =>
                          handleFieldUpdate(
                            ata.id,
                            "unit_price",
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0"
                        className="h-8 text-sm text-right border-0 bg-transparent hover:bg-muted/50 focus:bg-card tabular-nums"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(ata.subtotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={ata.rot_eligible || false}
                        onCheckedChange={(checked) =>
                          handleFieldUpdate(ata.id, "rot_eligible", checked === true)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ata.status}
                        onValueChange={(value) => handleFieldUpdate(ata.id, "status", value)}
                      >
                        <SelectTrigger className="h-8 text-xs border-0 bg-transparent hover:bg-muted/50">
                          {getStatusBadge(ata.status)}
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ata.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex flex-wrap gap-4 justify-end pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Väntande</Badge>
              <span className="font-medium tabular-nums">{formatCurrency(totals.pending)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="success">Godkänd</Badge>
              <span className="font-medium tabular-nums">{formatCurrency(totals.approved)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="destructive">Nekad</Badge>
              <span className="font-medium tabular-nums line-through text-muted-foreground">
                {formatCurrency(totals.rejected)}
              </span>
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
