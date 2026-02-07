import { useState } from "react";
import { Clock, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface TimeFormData {
  projectId: string;
  hours: number;
  date: string;
  description: string;
}

interface TimeFormCardProps {
  projects: Project[];
  defaultDate?: string;
  onSubmit: (data: TimeFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function TimeFormCard({
  projects,
  defaultDate,
  onSubmit,
  onCancel,
  disabled,
}: TimeFormCardProps) {
  const today = defaultDate || new Date().toISOString().split("T")[0];
  
  const [projectId, setProjectId] = useState<string>("");
  const [hours, setHours] = useState<string>("8");
  const [date, setDate] = useState<string>(today);
  const [description, setDescription] = useState<string>("");

  const handleVoiceData = (data: Record<string, unknown>) => {
    if (data.hours != null) setHours(String(data.hours));
    if (typeof data.description === "string") setDescription(data.description);
    if (typeof data.date === "string" && data.date) setDate(data.date);
  };

  const handleSubmit = () => {
    if (!projectId || !hours) return;
    
    onSubmit({
      projectId,
      hours: parseFloat(hours),
      date,
      description,
    });
  };

  const isValid = projectId && hours && parseFloat(hours) > 0;

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Registrera tid</h3>
      </div>

      {/* Voice Form Section */}
      <div className="mb-4">
        <VoiceFormSection
          formType="time"
          projectId={projectId || undefined}
          onDataExtracted={handleVoiceData}
          disabled={disabled}
        />
      </div>

      {/* Form */}
      <div className="space-y-4">
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

        {/* Hours and Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="hours" className="text-xs text-muted-foreground">
              Timmar
            </Label>
            <div className="relative">
              <Input
                id="hours"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={disabled}
                className="pr-8"
              />
              <Clock className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs text-muted-foreground">
              Datum
            </Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs text-muted-foreground">
            Beskrivning (valfritt)
          </Label>
          <Textarea
            id="description"
            placeholder="Vad jobbade du med..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            className="min-h-[60px] resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
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
          <FileText className="h-3.5 w-3.5" />
          Registrera tid
        </Button>
      </div>
    </div>
  );
}
