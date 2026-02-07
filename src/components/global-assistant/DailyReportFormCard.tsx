import { useState } from "react";
import { ClipboardList, X, Users, Clock } from "lucide-react";
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

interface Project {
  id: string;
  name: string;
}

interface DailyReportFormData {
  projectId: string;
  workDescription: string;
  headcount: number;
  totalHours: number;
}

interface DailyReportFormCardProps {
  projects: Project[];
  onSubmit: (data: DailyReportFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function DailyReportFormCard({
  projects,
  onSubmit,
  onCancel,
  disabled,
}: DailyReportFormCardProps) {
  const [projectId, setProjectId] = useState<string>("");
  const [workDescription, setWorkDescription] = useState<string>("");
  const [headcount, setHeadcount] = useState<string>("1");
  const [totalHours, setTotalHours] = useState<string>("8");

  const handleSubmit = () => {
    if (!projectId || !workDescription) return;
    
    onSubmit({
      projectId,
      workDescription,
      headcount: parseInt(headcount) || 1,
      totalHours: parseFloat(totalHours) || 8,
    });
  };

  const isValid = projectId && workDescription.trim();

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
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Ny dagrapport</h3>
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

        {/* Work description */}
        <div className="space-y-1.5">
          <Label htmlFor="work" className="text-xs text-muted-foreground">
            Arbete utfört
          </Label>
          <Textarea
            id="work"
            placeholder="Beskriv vad som gjordes idag..."
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            disabled={disabled}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Headcount and Hours row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="headcount" className="text-xs text-muted-foreground">
              Personal
            </Label>
            <div className="relative">
              <Input
                id="headcount"
                type="number"
                min="1"
                max="100"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                disabled={disabled}
                className="pr-8"
              />
              <Users className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hours" className="text-xs text-muted-foreground">
              Totalt timmar
            </Label>
            <div className="relative">
              <Input
                id="hours"
                type="number"
                min="0.5"
                max="200"
                step="0.5"
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value)}
                disabled={disabled}
                className="pr-8"
              />
              <Clock className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            </div>
          </div>
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
          <ClipboardList className="h-3.5 w-3.5" />
          Spara dagrapport
        </Button>
      </div>
    </div>
  );
}
