import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Pencil, X, Loader2, ChevronRight, XCircle,
  ClipboardList, FileText, CalendarDays, BookOpen, Receipt,
} from "lucide-react";

type EntityType = "work_order" | "ata" | "estimate" | "planning" | "diary";

interface EntityConfig {
  label: string;
  labelPlural: string;
  icon: React.ElementType;
  table: string;
}

const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  work_order: { label: "Arbetsorder", labelPlural: "arbetsordrar", icon: ClipboardList, table: "project_work_orders" },
  ata: { label: "ÄTA", labelPlural: "ÄTA", icon: FileText, table: "project_ata" },
  estimate: { label: "Offert", labelPlural: "offerter", icon: Receipt, table: "project_estimates" },
  planning: { label: "Planering", labelPlural: "planeringar", icon: CalendarDays, table: "project_plans" },
  diary: { label: "Dagbok", labelPlural: "dagböcker", icon: BookOpen, table: "daily_reports" },
};

interface UpdateEntityCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onSuccess: (entityType: string, entityName: string) => void;
  onCancel: () => void;
  onCreateNew: (entityType: string, projectId: string) => void;
  onNavigate: (path: string) => void;
  disabled?: boolean;
}

export function UpdateEntityCard({
  projects,
  onSuccess,
  onCancel,
  onCreateNew,
  onNavigate,
  disabled,
}: UpdateEntityCardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [entityType, setEntityType] = useState<EntityType>("work_order");
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const config = ENTITY_CONFIGS[entityType];

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query;
      if (entityType === "estimate") {
        const { data: userData } = await supabase.auth.getUser();
        query = supabase
          .from("project_estimates")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });
      } else {
        query = supabase
          .from(config.table as any)
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });
      }
      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error("Error fetching items:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!projectId) return;
    setStep(2);
    fetchItems();
  };

  const handleSelectItem = (item: any) => {
    // For estimate and diary, navigate instead of inline edit
    if (entityType === "estimate") {
      onNavigate(`/estimates?estimateId=${item.id}`);
      return;
    }
    if (entityType === "diary") {
      onNavigate(`/reports/${item.id}`);
      return;
    }
    setSelectedItem(item);
    // Pre-fill edit data
    if (entityType === "work_order") {
      setEditData({
        title: item.title || "",
        description: item.description || "",
        status: item.status || "pending",
        assigned_to: item.assigned_to || "",
        due_date: item.due_date || "",
      });
    } else if (entityType === "ata") {
      setEditData({
        description: item.description || "",
        reason: item.reason || "",
        estimated_cost: item.estimated_cost ?? "",
        estimated_hours: item.estimated_hours ?? "",
        status: item.status || "pending",
      });
    } else if (entityType === "planning") {
      setEditData({
        start_date: item.start_date || "",
        notes: item.notes || "",
        total_weeks: item.total_weeks ?? "",
      });
    }
    setStep(3);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {};
      if (entityType === "work_order") {
        updateData.title = editData.title;
        updateData.description = editData.description;
        updateData.status = editData.status;
        updateData.assigned_to = editData.assigned_to || null;
        updateData.due_date = editData.due_date || null;
      } else if (entityType === "ata") {
        updateData.description = editData.description;
        updateData.reason = editData.reason || null;
        updateData.estimated_cost = editData.estimated_cost ? Number(editData.estimated_cost) : null;
        updateData.estimated_hours = editData.estimated_hours ? Number(editData.estimated_hours) : null;
        updateData.status = editData.status;
      } else if (entityType === "planning") {
        updateData.start_date = editData.start_date || null;
        updateData.notes = editData.notes || null;
        if (editData.total_weeks) updateData.total_weeks = Number(editData.total_weeks);
      }

      const { error } = await supabase
        .from(config.table as any)
        .update(updateData)
        .eq("id", selectedItem.id);

      if (error) throw error;

      const entityName = entityType === "work_order"
        ? editData.title
        : entityType === "ata"
          ? editData.description?.slice(0, 30)
          : config.label;
      
      onSuccess(config.label, entityName);
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error("Kunde inte spara: " + (e.message || "Okänt fel"));
    } finally {
      setSaving(false);
    }
  };

  const getItemLabel = (item: any): { title: string; subtitle: string } => {
    switch (entityType) {
      case "work_order":
        return { title: item.title || "Utan titel", subtitle: `#${item.order_number || "-"} · ${item.status || "pending"}` };
      case "ata":
        return { title: item.description?.slice(0, 50) || "Utan beskrivning", subtitle: `#${item.ata_number || "-"} · ${item.status || "pending"}` };
      case "estimate":
        return { title: item.manual_project_name || item.offer_number || "Offert", subtitle: `${item.offer_number || ""} · ${item.status || "draft"}` };
      case "planning":
        return { title: `Plan ${item.start_date || ""}`, subtitle: `${item.total_weeks || 0} veckor` };
      case "diary":
        return { title: `Rapport ${item.report_date}`, subtitle: `${item.headcount || 0} pers · ${item.total_hours || 0} tim` };
      default:
        return { title: "Post", subtitle: "" };
    }
  };

  const projectName = projects.find(p => p.id === projectId)?.name || "";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Pencil className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                {step === 1 ? "Uppdatera" : `Uppdatera ${config.label.toLowerCase()}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {step === 1 ? "Välj typ och projekt" : step === 2 ? `Välj ${config.label.toLowerCase()} att redigera` : "Redigera och spara"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={disabled || saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Select type and project */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm">Vad vill du uppdatera?</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ENTITY_CONFIGS) as [EntityType, EntityConfig][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className="h-4 w-4" />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Projekt *</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj projekt..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.address && <span className="ml-2 text-muted-foreground">({p.address})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleNext} disabled={!projectId || disabled} className="w-full">
              Nästa <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        )}

        {/* Step 2: Select item */}
        {step === 2 && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Hämtar {config.labelPlural}...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Inga {config.labelPlural} hittades för {projectName}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateNew(entityType, projectId)}
                  className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                >
                  Skapa ny {config.label.toLowerCase()}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const { title, subtitle } = getItemLabel(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={disabled}>
              ← Tillbaka
            </Button>
          </>
        )}

        {/* Step 3: Edit form */}
        {step === 3 && selectedItem && (
          <>
            {entityType === "work_order" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Titel</Label>
                  <Input value={editData.title} onChange={(e) => setEditData(d => ({ ...d, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Beskrivning</Label>
                  <Textarea value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Status</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="in_progress">Pågående</SelectItem>
                      <SelectItem value="completed">Klar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tilldelad till</Label>
                  <Input value={editData.assigned_to} onChange={(e) => setEditData(d => ({ ...d, assigned_to: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Förfallodatum</Label>
                  <Input type="date" value={editData.due_date} onChange={(e) => setEditData(d => ({ ...d, due_date: e.target.value }))} />
                </div>
              </div>
            )}

            {entityType === "ata" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Beskrivning</Label>
                  <Textarea value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Orsak</Label>
                  <Input value={editData.reason} onChange={(e) => setEditData(d => ({ ...d, reason: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Uppskattad kostnad (kr)</Label>
                    <Input type="number" value={editData.estimated_cost} onChange={(e) => setEditData(d => ({ ...d, estimated_cost: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Uppskattade timmar</Label>
                    <Input type="number" value={editData.estimated_hours} onChange={(e) => setEditData(d => ({ ...d, estimated_hours: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Status</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="approved">Godkänd</SelectItem>
                      <SelectItem value="rejected">Avslagen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {entityType === "planning" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Startdatum</Label>
                  <Input type="date" value={editData.start_date} onChange={(e) => setEditData(d => ({ ...d, start_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Totalt antal veckor</Label>
                  <Input type="number" value={editData.total_weeks} onChange={(e) => setEditData(d => ({ ...d, total_weeks: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Anteckningar</Label>
                  <Textarea value={editData.notes} onChange={(e) => setEditData(d => ({ ...d, notes: e.target.value }))} rows={3} />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setStep(2); setSelectedItem(null); }} disabled={saving} className="flex-1">
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Spara
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
