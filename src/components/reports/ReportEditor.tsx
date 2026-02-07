import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  Save,
  Users,
  Clock,
  Hammer,
  AlertTriangle,
  Plus,
  Package,
  FileText,
  Sparkles,
  X,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { VoiceInputOverlay } from "@/components/shared/VoiceInputOverlay";
import { AI_AGENTS } from "@/config/aiAgents";

// Note: VoiceInputOverlay will need to be updated to use Byggio AI branding

interface Deviation {
  type: string;
  description: string;
  hours: number | null;
}

interface AtaItem {
  reason: string;
  consequence: string;
  estimated_hours: number | null;
}

interface Ata {
  has_ata: boolean;
  items: AtaItem[];
}

interface ReportData {
  crew: {
    headcount: number | null;
    roles: string[];
    hours_per_person: number | null;
    total_hours: number | null;
  };
  work_items: string[];
  deviations: Deviation[];
  ata: Ata | null;
  extra_work: string[];
  materials: {
    delivered: string[];
    missing: string[];
  };
  notes: string | null;
  original_transcript: string;
  confidence: {
    overall: number;
    low_confidence_fields: string[];
  };
}

interface ReportEditorProps {
  report: ReportData;
  projectId: string;
  projectName: string;
  reportDate: Date;
  userId: string;
  existingReportId?: string;
  onBack: () => void;
  onSaved: (id: string) => void;
}

const deviationTypes: Record<string, string> = {
  waiting_time: "Väntetid",
  material_delay: "Materialförsening",
  weather: "Väder",
  coordination: "Samordning",
  equipment: "Utrustning",
  safety: "Säkerhet",
  quality: "Kvalitet",
  other: "Övrigt",
};

export function ReportEditor({
  report,
  projectId,
  projectName,
  reportDate,
  userId,
  existingReportId,
  onBack,
  onSaved,
}: ReportEditorProps) {
  const [data, setData] = useState<ReportData>(report);
  const [saving, setSaving] = useState(false);
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);
  const { toast } = useToast();

  const updateCrew = (field: keyof ReportData["crew"], value: any) => {
    setData((prev) => ({
      ...prev,
      crew: { ...prev.crew, [field]: value },
    }));
  };

  const addWorkItem = () => {
    setData((prev) => ({
      ...prev,
      work_items: [...prev.work_items, ""],
    }));
  };

  const updateWorkItem = (index: number, value: string) => {
    setData((prev) => ({
      ...prev,
      work_items: prev.work_items.map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeWorkItem = (index: number) => {
    setData((prev) => ({
      ...prev,
      work_items: prev.work_items.filter((_, i) => i !== index),
    }));
  };

  const addDeviation = () => {
    setData((prev) => ({
      ...prev,
      deviations: [...prev.deviations, { type: "other", description: "", hours: null }],
    }));
  };

  const updateDeviation = (index: number, field: keyof Deviation, value: any) => {
    setData((prev) => ({
      ...prev,
      deviations: prev.deviations.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      ),
    }));
  };

  const removeDeviation = (index: number) => {
    setData((prev) => ({
      ...prev,
      deviations: prev.deviations.filter((_, i) => i !== index),
    }));
  };

  const addAtaItem = () => {
    setData((prev) => ({
      ...prev,
      ata: {
        has_ata: true,
        items: [...(prev.ata?.items || []), { reason: "", consequence: "", estimated_hours: null }],
      },
    }));
  };

  const updateAtaItem = (index: number, field: keyof AtaItem, value: any) => {
    setData((prev) => ({
      ...prev,
      ata: {
        has_ata: true,
        items: (prev.ata?.items || []).map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const removeAtaItem = (index: number) => {
    setData((prev) => {
      const newItems = (prev.ata?.items || []).filter((_, i) => i !== index);
      return {
        ...prev,
        ata: newItems.length > 0 ? { has_ata: true, items: newItems } : null,
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Fetch current user ID to ensure RLS policy passes
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Du måste vara inloggad",
          description: "Logga in för att spara rapporter",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Check if user is an employee and get employer ID
      const { data: employee } = await supabase
        .from("employees")
        .select("user_id")
        .eq("linked_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      // Use employer ID if employee, otherwise use own ID
      const effectiveUserId = employee?.user_id || user.id;

      const reportData = {
        project_id: projectId,
        user_id: effectiveUserId,
        report_date: format(reportDate, "yyyy-MM-dd"),
        headcount: data.crew.headcount,
        roles: data.crew.roles,
        hours_per_person: data.crew.hours_per_person,
        total_hours: data.crew.total_hours,
        work_items: data.work_items.filter((w) => w.trim()),
        deviations: data.deviations as any,
        ata: data.ata as any,
        extra_work: data.extra_work.filter((w) => w.trim()),
        materials_delivered: data.materials.delivered,
        materials_missing: data.materials.missing,
        notes: data.notes,
        original_transcript: data.original_transcript,
        confidence_overall: data.confidence.overall,
        low_confidence_fields: data.confidence.low_confidence_fields,
      };

      let savedReport;
      let error;

      if (existingReportId) {
        // Update existing report
        const result = await supabase
          .from("daily_reports")
          .update(reportData)
          .eq("id", existingReportId)
          .select()
          .single();
        savedReport = result.data;
        error = result.error;
      } else {
        // Create new report
        const result = await supabase
          .from("daily_reports")
          .upsert(reportData, { onConflict: "project_id,report_date" })
          .select()
          .single();
        savedReport = result.data;
        error = result.error;
      }

      if (error) throw error;

      toast({ title: existingReportId ? "Rapport uppdaterad!" : "Rapport sparad!" });
      onSaved(savedReport.id);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Kunde inte spara rapport",
        description: error instanceof Error ? error.message : "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confidencePercent = Math.round((data.confidence?.overall || 0) * 100);

  const handleVoiceEdit = async (transcript: string) => {
    setIsApplyingVoice(true);
    try {
      const { data: updatedData, error } = await supabase.functions.invoke("apply-voice-edits", {
        body: {
          transcript,
          currentData: data,
          documentType: "report",
        },
      });

      if (error) throw error;

      if (updatedData) {
        setData(updatedData);
        toast({ title: "Ändringar applicerade", description: "Rapporten har uppdaterats" });
      }
    } catch (error: any) {
      console.error("Voice edit error:", error);
      toast({
        title: "Kunde inte applicera ändringar",
        description: error.message || "Försök igen",
        variant: "destructive",
      });
    } finally {
      setIsApplyingVoice(false);
    }
  };

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              Granska & redigera
            </h1>
            <p className="text-muted-foreground">
              {projectName} • {format(reportDate, "d MMMM yyyy", { locale: sv })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5",
              confidencePercent >= 80
                ? "border-success/30 bg-success/10 text-success"
                : confidencePercent >= 60
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            <Sparkles className="h-3 w-3" />
            {confidencePercent}% konfidens
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Sparar..." : "Spara rapport"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crew section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Bemanning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Antal personer</Label>
                <Input
                  type="number"
                  value={data.crew.headcount ?? ""}
                  onChange={(e) =>
                    updateCrew("headcount", e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="—"
                />
              </div>
              <div className="space-y-2">
                <Label>Timmar/person</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={data.crew.hours_per_person ?? ""}
                  onChange={(e) =>
                    updateCrew(
                      "hours_per_person",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="—"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Roller</Label>
              <Input
                value={data.crew.roles.join(", ")}
                onChange={(e) =>
                  updateCrew(
                    "roles",
                    e.target.value.split(",").map((r) => r.trim()).filter(Boolean)
                  )
                }
                placeholder="T.ex. snickare, elektriker, gipsmontör"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Totala timmar:</span>
              <span className="font-medium">
                {data.crew.headcount && data.crew.hours_per_person
                  ? `${data.crew.headcount * data.crew.hours_per_person}h`
                  : data.crew.total_hours
                  ? `${data.crew.total_hours}h`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Work items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-primary" />
                Utfört arbete
              </span>
              <Button variant="ghost" size="sm" onClick={addWorkItem}>
                <Plus className="mr-1 h-4 w-4" />
                Lägg till
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.work_items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateWorkItem(index, e.target.value)}
                  placeholder="Beskriv arbetsmoment..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWorkItem(index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {data.work_items.length === 0 && (
              <p className="text-sm text-muted-foreground">Inga arbetsmoment extraherade</p>
            )}
          </CardContent>
        </Card>

        {/* Deviations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Avvikelser
              </span>
              <Button variant="ghost" size="sm" onClick={addDeviation}>
                <Plus className="mr-1 h-4 w-4" />
                Lägg till
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.deviations.map((deviation, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Select
                    value={deviation.type}
                    onValueChange={(value) => updateDeviation(index, "type", value)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(deviationTypes).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      className="w-24"
                      placeholder="Timmar"
                      value={deviation.hours ?? ""}
                      onChange={(e) =>
                        updateDeviation(
                          index,
                          "hours",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeviation(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={deviation.description}
                  onChange={(e) => updateDeviation(index, "description", e.target.value)}
                  placeholder="Beskrivning..."
                />
              </div>
            ))}
            {data.deviations.length === 0 && (
              <p className="text-sm text-muted-foreground">Inga avvikelser registrerade</p>
            )}
          </CardContent>
        </Card>

        {/* ÄTA (Ändrings- och Tilläggsarbeten) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-info" />
                ÄTA
                {data.ata?.has_ata && data.ata.items.length > 0 && (
                  <Badge variant="outline" className="ml-2 border-info/30 bg-info/10 text-info">
                    {data.ata.items.length}
                  </Badge>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={addAtaItem}>
                <Plus className="mr-1 h-4 w-4" />
                Lägg till
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ändrings- och tilläggsarbeten utöver ursprunglig plan
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.ata?.items || []).map((item, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-info/20 bg-info/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-info">ÄTA #{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAtaItem(index)}
                    className="h-6 w-6 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    value={item.reason}
                    onChange={(e) => updateAtaItem(index, "reason", e.target.value)}
                    placeholder="Anledning: Varför kunde arbetet inte utföras?"
                  />
                  <Input
                    value={item.consequence}
                    onChange={(e) => updateAtaItem(index, "consequence", e.target.value)}
                    placeholder="Konsekvens: Vad leder detta till?"
                  />
                  <Input
                    type="number"
                    step="0.5"
                    value={item.estimated_hours ?? ""}
                    onChange={(e) =>
                      updateAtaItem(
                        index,
                        "estimated_hours",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="Uppskattade timmar (valfritt)"
                    className="w-48"
                  />
                </div>
              </div>
            ))}
            {(!data.ata?.items || data.ata.items.length === 0) && (
              <p className="text-sm text-muted-foreground">Inga ÄTA registrerade</p>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-success">Levererat</Label>
              <Input
                value={data.materials.delivered.join(", ")}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    materials: {
                      ...prev.materials,
                      delivered: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  }))
                }
                placeholder="T.ex. virke, gipsskivor, isolering"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive">Saknas</Label>
              <Input
                value={data.materials.missing.join(", ")}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    materials: {
                      ...prev.materials,
                      missing: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  }))
                }
                placeholder="T.ex. beslag, el-material"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Övrigt / Anteckningar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.notes || ""}
              onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Övriga kommentarer..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      <VoiceInputOverlay
        onTranscriptComplete={handleVoiceEdit}
        isProcessing={isApplyingVoice}
        agentName="Ulla AI"
        agentAvatar={AI_AGENTS.diary.avatar}
      />
    </div>
  );
}
