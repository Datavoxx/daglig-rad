import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, X } from "lucide-react";
import { VoiceFormSection } from "./VoiceFormSection";

interface WorkOrderFormCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  employees?: Array<{ id: string; name: string }>;
  preselectedProjectId?: string;
  onSubmit: (data: {
    projectId: string;
    title: string;
    description: string;
    assignedTo?: string;
    dueDate?: string;
  }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function WorkOrderFormCard({
  projects,
  employees = [],
  preselectedProjectId,
  onSubmit,
  onCancel,
  disabled,
}: WorkOrderFormCardProps) {
  const [projectId, setProjectId] = useState(preselectedProjectId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleVoiceData = (data: Record<string, unknown>) => {
    if (typeof data.title === "string") setTitle(data.title);
    if (typeof data.description === "string") setDescription(data.description);
    if (typeof data.dueDate === "string") setDueDate(data.dueDate);
  };

  const handleSubmit = () => {
    if (!projectId || !title.trim()) return;
    onSubmit({
      projectId,
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
    });
  };

  const canSubmit = projectId && title.trim();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Skapa arbetsorder</CardTitle>
              <p className="text-xs text-muted-foreground">Fyll i uppgifterna nedan</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCancel}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Form Section */}
        <VoiceFormSection
          formType="work-order"
          projectId={projectId || undefined}
          onDataExtracted={handleVoiceData}
          disabled={disabled}
          requiredSelection={!preselectedProjectId ? "project" : undefined}
          selectionMade={!!projectId}
        />

        {/* Project selector - only show if no preselected project */}
        {!preselectedProjectId && (
          <div className="space-y-1.5">
            <Label htmlFor="wo-project" className="text-sm">Projekt *</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={disabled}>
              <SelectTrigger id="wo-project">
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
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="wo-title" className="text-sm">Titel *</Label>
          <Input
            id="wo-title"
            placeholder="T.ex. Byt ut fönster på andra våningen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="wo-description" className="text-sm">Beskrivning</Label>
          <Textarea
            id="wo-description"
            placeholder="Detaljerad beskrivning av arbetet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            rows={3}
          />
        </div>

        {/* Employee assignment (optional) */}
        {employees.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="wo-assigned" className="text-sm">Tilldela till</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={disabled}>
              <SelectTrigger id="wo-assigned">
                <SelectValue placeholder="Ingen tilldelning" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Due date (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="wo-due" className="text-sm">Förfallodatum</Label>
          <Input
            id="wo-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || !canSubmit}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Skapa arbetsorder
        </Button>
      </CardContent>
    </Card>
  );
}
