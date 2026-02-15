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
  Lightbulb,
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
  interface AtaRow {
    id: string;
    article: string;
    unit: string;
    description: string;
    quantity: string;
    unit_price: string;
    rot_eligible: boolean;
  }

  const createEmptyRow = (): AtaRow => ({
    id: crypto.randomUUID(),
    article: "Arbete",
    unit: "tim",
    description: "",
    quantity: "1",
    unit_price: "",
    rot_eligible: false,
  });

  const [formRows, setFormRows] = useState<AtaRow[]>([createEmptyRow()]);
  const [formReason, setFormReason] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const { toast } = useToast();

  const updateRow = (id: string, field: keyof AtaRow, value: any) => {
    setFormRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setFormRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (formRows.length === 1) return;
    setFormRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleVoiceInput = async (transcript: string) => {
    setIsVoiceProcessing(true);
    try {
      const firstRow = formRows[0];
      const formData = {
        article: firstRow.article,
        description: firstRow.description,
        reason: formReason,
        unit: firstRow.unit,
        quantity: firstRow.quantity,
        unit_price: firstRow.unit_price,
        rot_eligible: firstRow.rot_eligible,
        status: formStatus,
      };
      const { data, error } = await supabase.functions.invoke("apply-voice-edits", {
        body: {
          transcript,
          currentData: formData,
          documentType: "ata",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFormRows((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          article: data.article || updated[0].article,
          description: data.description || updated[0].description,
          unit: data.unit || updated[0].unit,
          quantity: data.quantity?.toString() || updated[0].quantity,
          unit_price: data.unit_price?.toString() || updated[0].unit_price,
          rot_eligible: data.rot_eligible ?? updated[0].rot_eligible,
        };
        return updated;
      });
      if (data.reason) setFormReason(data.reason);
      if (data.status) setFormStatus(data.status);

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

  const generateAtaNumber = (offset: number = 0) => {
    const year = new Date().getFullYear();
    const count = atas.length + 1 + offset;
    return `ÄTA-${year}-${String(count).padStart(3, "0")}`;
  };

  const handleSubmit = async () => {
    const validRows = formRows.filter((r) => r.description.trim());
    if (validRows.length === 0) {
      toast({ title: "Minst en rad med beskrivning krävs", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      setSaving(false);
      return;
    }

    const payloads = validRows.map((row, index) => {
      const quantity = row.quantity ? parseFloat(row.quantity) : 1;
      const unitPrice = row.unit_price ? parseFloat(row.unit_price) : 0;
      const subtotal = quantity * unitPrice;
      return {
        project_id: projectId,
        user_id: user.id,
        ata_number: generateAtaNumber(index),
        article: row.article,
        description: row.description,
        reason: formReason || null,
        unit: row.unit,
        quantity,
        unit_price: unitPrice,
        subtotal,
        rot_eligible: row.rot_eligible,
        status: formStatus,
        estimated_hours: row.unit === "tim" ? quantity : null,
        estimated_cost: subtotal > 0 ? subtotal : null,
        sort_order: atas.length + index,
      };
    });

    const { error } = await supabase.from("project_ata").insert(payloads);

    if (error) {
      toast({ title: "Kunde inte skapa ÄTA", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${payloads.length} ÄTA skapad${payloads.length > 1 ? "e" : ""}` });
      fetchAtas();
      closeDialog();
    }

    setSaving(false);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormRows([createEmptyRow()]);
    setFormReason("");
    setFormStatus("pending");
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ny ÄTA</DialogTitle>
              <DialogDescription>
                Lägg till ett eller flera ändrings- och tilläggsarbeten
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Voice input prompt */}
              <VoicePromptButton
                onTranscriptComplete={handleVoiceInput}
                isProcessing={isVoiceProcessing}
                agentName="Byggio AI"
                variant="compact"
              />

              {/* Dynamic rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Rader</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                    onClick={() => {
                      setFormRows([
                        {
                          id: crypto.randomUUID(),
                          article: "Arbete",
                          unit: "tim",
                          description: "Rivning av befintlig vägg",
                          quantity: "4",
                          unit_price: "450",
                          rot_eligible: false,
                        },
                        {
                          id: crypto.randomUUID(),
                          article: "Material",
                          unit: "st",
                          description: "Gipsskivor 13mm",
                          quantity: "12",
                          unit_price: "89",
                          rot_eligible: false,
                        },
                      ]);
                      setFormReason("Dolda rörledningar upptäcktes vid rivning, kräver omläggning");
                      setFormStatus("pending");
                    }}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Visa exempel
                  </Button>
                </div>
                {formRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr,1fr] md:grid-cols-[110px,70px,2fr,60px,80px,auto,32px] gap-2 p-3 bg-muted/30 rounded-lg items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Artikel</Label>
                      <Select
                        value={row.article}
                        onValueChange={(value) => updateRow(row.id, "article", value)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {articleCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Enhet</Label>
                      <Select
                        value={row.unit}
                        onValueChange={(value) => updateRow(row.id, "unit", value)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Beskrivning</Label>
                      <Input
                        value={row.description}
                        onChange={(e) => updateRow(row.id, "description", e.target.value)}
                        placeholder="Beskrivning *"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Antal</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                        className="h-9 text-sm text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">À-pris</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={row.unit_price}
                        onChange={(e) => updateRow(row.id, "unit_price", e.target.value)}
                        className="h-9 text-sm text-right"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={row.rot_eligible}
                        onCheckedChange={(checked) => updateRow(row.id, "rot_eligible", checked === true)}
                      />
                      <span className="text-xs text-muted-foreground ml-1">ROT</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                      disabled={formRows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRow} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till rad
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Anledning</Label>
                <Input
                  placeholder="Varför behövs detta?"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(value) => setFormStatus(value)}
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
                {saving ? "Sparar..." : `Skapa ${formRows.length > 1 ? formRows.length + " " : ""}ÄTA`}
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
          {/* Horizontal scroll wrapper for mobile */}
          <div className="border rounded-lg overflow-hidden overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[900px]">
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
