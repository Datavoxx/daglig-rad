import { useState } from "react";
import {
  ClipboardList,
  X,
  Users,
  Clock,
  Hammer,
  AlertTriangle,
  Plus,
  Package,
  FileText,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { VoiceFormSection } from "./VoiceFormSection";

interface Project {
  id: string;
  name: string;
}

interface Deviation {
  type: string;
  description: string;
  hours: number | null;
}

interface AtaItem {
  reason: string;
  consequence: string;
  estimatedHours: number | null;
}

export interface DailyReportFormData {
  projectId: string;
  headcount: number;
  hoursPerPerson: number;
  roles: string[];
  totalHours: number;
  workItems: string[];
  deviations: Deviation[];
  ata: AtaItem[];
  materialsDelivered: string;
  materialsMissing: string;
  notes: string;
}

interface DailyReportFormCardProps {
  projects: Project[];
  onSubmit: (data: DailyReportFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
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

export function DailyReportFormCard({
  projects,
  onSubmit,
  onCancel,
  disabled,
}: DailyReportFormCardProps) {
  const [projectId, setProjectId] = useState<string>("");
  const [headcount, setHeadcount] = useState<string>("1");
  const [hoursPerPerson, setHoursPerPerson] = useState<string>("8");
  const [roles, setRoles] = useState<string>("");
  const [workItems, setWorkItems] = useState<string[]>([""]);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [ata, setAta] = useState<AtaItem[]>([]);
  const [materialsDelivered, setMaterialsDelivered] = useState<string>("");
  const [materialsMissing, setMaterialsMissing] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Calculated total hours
  const totalHours = (parseInt(headcount) || 0) * (parseFloat(hoursPerPerson) || 0);

  const handleVoiceData = (data: Record<string, unknown>) => {
    if (data.headcount != null) setHeadcount(String(data.headcount));
    if (data.hoursPerPerson != null) setHoursPerPerson(String(data.hoursPerPerson));
    if (Array.isArray(data.roles) && data.roles.length > 0) {
      setRoles(data.roles.join(", "));
    }
    if (Array.isArray(data.workItems) && data.workItems.length > 0) {
      setWorkItems(data.workItems as string[]);
    }
    if (typeof data.materialsDelivered === "string") {
      setMaterialsDelivered(data.materialsDelivered);
    }
    if (typeof data.materialsMissing === "string") {
      setMaterialsMissing(data.materialsMissing);
    }
    if (typeof data.notes === "string") {
      setNotes(data.notes);
    }
    if (Array.isArray(data.deviations) && data.deviations.length > 0) {
      setDeviations(data.deviations as Deviation[]);
    }
    if (Array.isArray(data.ata) && data.ata.length > 0) {
      setAta(data.ata as AtaItem[]);
    }
  };

  const handleSubmit = () => {
    if (!projectId) return;

    const filteredWorkItems = workItems.filter((item) => item.trim() !== "");
    if (filteredWorkItems.length === 0) return;

    onSubmit({
      projectId,
      headcount: parseInt(headcount) || 1,
      hoursPerPerson: parseFloat(hoursPerPerson) || 8,
      roles: roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      totalHours,
      workItems: filteredWorkItems,
      deviations,
      ata,
      materialsDelivered,
      materialsMissing,
      notes,
    });
  };

  // Work items
  const addWorkItem = () => setWorkItems([...workItems, ""]);
  const updateWorkItem = (index: number, value: string) => {
    setWorkItems(workItems.map((item, i) => (i === index ? value : item)));
  };
  const removeWorkItem = (index: number) => {
    if (workItems.length > 1) {
      setWorkItems(workItems.filter((_, i) => i !== index));
    }
  };

  // Deviations
  const addDeviation = () => {
    setDeviations([...deviations, { type: "other", description: "", hours: null }]);
  };
  const updateDeviation = (index: number, field: keyof Deviation, value: any) => {
    setDeviations(deviations.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };
  const removeDeviation = (index: number) => {
    setDeviations(deviations.filter((_, i) => i !== index));
  };

  // ÄTA
  const addAta = () => {
    setAta([...ata, { reason: "", consequence: "", estimatedHours: null }]);
  };
  const updateAta = (index: number, field: keyof AtaItem, value: any) => {
    setAta(ata.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };
  const removeAta = (index: number) => {
    setAta(ata.filter((_, i) => i !== index));
  };

  const isValid =
    projectId && workItems.some((item) => item.trim() !== "");

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Ny dagrapport</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Voice Form Section */}
        <VoiceFormSection
          formType="daily-report"
          projectId={projectId || undefined}
          onDataExtracted={handleVoiceData}
          disabled={disabled}
        />

        {/* Project selector */}
        <div className="space-y-1.5">
          <Label htmlFor="project" className="text-xs text-muted-foreground">
            Projekt
          </Label>
          <Select value={projectId} onValueChange={setProjectId} disabled={disabled}>
            <SelectTrigger id="project" className="w-full">
              <SelectValue placeholder="Välj projekt..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Crew section */}
          <Card className="border-border/40">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-primary" />
                Bemanning
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Antal personer</Label>
                  <Input
                    type="number"
                    min="1"
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    disabled={disabled}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tim/person</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={hoursPerPerson}
                    onChange={(e) => setHoursPerPerson(e.target.value)}
                    disabled={disabled}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Roller</Label>
                <Input
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="T.ex. snickare, elektriker"
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Totalt:</span>
                <span className="text-sm font-medium">{totalHours}h</span>
              </div>
            </CardContent>
          </Card>

          {/* Work items section */}
          <Card className="border-border/40">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Hammer className="h-4 w-4 text-primary" />
                  Utfört arbete
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addWorkItem}
                  disabled={disabled}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Lägg till
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {workItems.map((item, index) => (
                <div key={index} className="flex gap-1.5">
                  <Input
                    value={item}
                    onChange={(e) => updateWorkItem(index, e.target.value)}
                    placeholder="Beskriv arbetsmoment..."
                    disabled={disabled}
                    className="h-9 text-sm"
                  />
                  {workItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWorkItem(index)}
                      disabled={disabled}
                      className="h-9 w-9 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Deviations section */}
          <Card className="border-border/40">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Avvikelser
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addDeviation}
                  disabled={disabled}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Lägg till
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {deviations.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Inga avvikelser registrerade
                </p>
              ) : (
                deviations.map((deviation, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-md border border-border/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Select
                        value={deviation.type}
                        onValueChange={(value) => updateDeviation(index, "type", value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(deviationTypes).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Tim"
                        value={deviation.hours ?? ""}
                        onChange={(e) =>
                          updateDeviation(
                            index,
                            "hours",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        disabled={disabled}
                        className="h-8 w-16 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDeviation(index)}
                        disabled={disabled}
                        className="h-8 w-8 shrink-0 ml-auto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={deviation.description}
                      onChange={(e) =>
                        updateDeviation(index, "description", e.target.value)
                      }
                      placeholder="Beskrivning..."
                      disabled={disabled}
                      className="h-8 text-xs"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* ÄTA section */}
          <Card className="border-border/40">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-orange-500" />
                  ÄTA
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAta}
                  disabled={disabled}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Lägg till
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {ata.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Inga ÄTA registrerade
                </p>
              ) : (
                ata.map((item, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-md border border-border/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.reason}
                        onChange={(e) => updateAta(index, "reason", e.target.value)}
                        placeholder="Anledning..."
                        disabled={disabled}
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Tim"
                        value={item.estimatedHours ?? ""}
                        onChange={(e) =>
                          updateAta(
                            index,
                            "estimatedHours",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        disabled={disabled}
                        className="h-8 w-16 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAta(index)}
                        disabled={disabled}
                        className="h-8 w-8 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={item.consequence}
                      onChange={(e) => updateAta(index, "consequence", e.target.value)}
                      placeholder="Konsekvens..."
                      disabled={disabled}
                      className="h-8 text-xs"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Materials section */}
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              Material
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Levererat</Label>
                <Textarea
                  value={materialsDelivered}
                  onChange={(e) => setMaterialsDelivered(e.target.value)}
                  placeholder="T.ex. virke, gipsskivor..."
                  disabled={disabled}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Saknas</Label>
                <Textarea
                  value={materialsMissing}
                  onChange={(e) => setMaterialsMissing(e.target.value)}
                  placeholder="T.ex. beslag, el-material..."
                  disabled={disabled}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes section */}
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Övriga anteckningar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuella kommentarer eller noteringar..."
              disabled={disabled}
              className="min-h-[60px] resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
            className="text-muted-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Avbryt
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || !isValid}
            className="gap-1.5"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Skapa dagrapport
          </Button>
        </div>
      </div>
    </div>
  );
}
