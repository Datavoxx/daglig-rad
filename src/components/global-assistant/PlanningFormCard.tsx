import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Trash2, X } from "lucide-react";
import { VoiceFormSection } from "./VoiceFormSection";

interface Phase {
  name: string;
  weeks: number;
}

interface PlanningFormCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onSubmit: (data: {
    projectId: string;
    startDate: string;
    phases: Phase[];
  }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function PlanningFormCard({
  projects,
  onSubmit,
  onCancel,
  disabled,
}: PlanningFormCardProps) {
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [phases, setPhases] = useState<Phase[]>([{ name: "", weeks: 1 }]);

  const handleVoiceData = (data: Record<string, unknown>) => {
    if (typeof data.startDate === "string") setStartDate(data.startDate);
    if (Array.isArray(data.phases)) {
      const voicePhases = data.phases
        .filter((p: unknown) => typeof p === "object" && p !== null)
        .map((p: unknown) => {
          const phase = p as Record<string, unknown>;
          return {
            name: typeof phase.name === "string" ? phase.name : "",
            weeks: typeof phase.weeks === "number" ? phase.weeks : 1,
          };
        });
      if (voicePhases.length > 0) setPhases(voicePhases);
    }
  };

  const addPhase = () => {
    setPhases([...phases, { name: "", weeks: 1 }]);
  };

  const removePhase = (index: number) => {
    if (phases.length <= 1) return;
    setPhases(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: keyof Phase, value: string | number) => {
    setPhases(phases.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = () => {
    if (!projectId || !startDate) return;
    const validPhases = phases.filter((p) => p.name.trim());
    if (validPhases.length === 0) return;
    onSubmit({ projectId, startDate, phases: validPhases });
  };

  const canSubmit = projectId && startDate && phases.some((p) => p.name.trim());
  const totalWeeks = phases.reduce((sum, p) => sum + (p.weeks || 0), 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Skapa planering</CardTitle>
              <p className="text-xs text-muted-foreground">Lägg till faser och tidsplan</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <VoiceFormSection
          formType="planning"
          projectId={projectId || undefined}
          onDataExtracted={handleVoiceData}
          disabled={disabled}
          requiredSelection="project"
          selectionMade={!!projectId}
        />

        {/* Project selector */}
        <div className="space-y-1.5">
          <Label htmlFor="plan-project" className="text-sm">Projekt *</Label>
          <Select value={projectId} onValueChange={setProjectId} disabled={disabled}>
            <SelectTrigger id="plan-project">
              <SelectValue placeholder="Välj projekt..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                  {project.address && (
                    <span className="ml-2 text-muted-foreground">({project.address})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start date */}
        <div className="space-y-1.5">
          <Label htmlFor="plan-start" className="text-sm">Startdatum *</Label>
          <Input
            id="plan-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Phases */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Faser *</Label>
            {totalWeeks > 0 && (
              <span className="text-xs text-muted-foreground">Totalt: {totalWeeks} veckor</span>
            )}
          </div>
          {phases.map((phase, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`Fas ${index + 1}, t.ex. Rivning`}
                value={phase.name}
                onChange={(e) => updatePhase(index, "name", e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={phase.weeks}
                  onChange={(e) => updatePhase(index, "weeks", parseInt(e.target.value) || 1)}
                  disabled={disabled}
                  className="w-16 text-center"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">v</span>
              </div>
              {phases.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => removePhase(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addPhase}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Lägg till fas
          </Button>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || !canSubmit}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Skapa planering
        </Button>
      </CardContent>
    </Card>
  );
}
