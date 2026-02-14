import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, X, FileText, ClipboardList, CalendarDays, FolderOpen, BookOpen } from "lucide-react";

interface UpdateProjectFormCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onAction: (projectId: string, category: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const categories = [
  { id: "ata", label: "ÄTA", icon: FileText, description: "Ändrings- och tilläggsarbeten" },
  { id: "work_order", label: "Arbetsorder", icon: ClipboardList, description: "Skapa ny arbetsorder" },
  { id: "files", label: "Filer och bilagor", icon: FolderOpen, description: "Hantera projektfiler" },
  { id: "planning", label: "Planering", icon: CalendarDays, description: "Skapa eller uppdatera plan" },
  { id: "diary", label: "Dagbok", icon: BookOpen, description: "Skapa ny dagrapport" },
];

export function UpdateProjectFormCard({
  projects,
  onAction,
  onCancel,
  disabled,
}: UpdateProjectFormCardProps) {
  const [projectId, setProjectId] = useState("");

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Pencil className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Uppdatera projekt</CardTitle>
              <p className="text-xs text-muted-foreground">Välj projekt och vad du vill göra</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project selector */}
        <div className="space-y-1.5">
          <Label htmlFor="upd-project" className="text-sm">Projekt *</Label>
          <Select value={projectId} onValueChange={setProjectId} disabled={disabled}>
            <SelectTrigger id="upd-project">
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

        {/* Category buttons - shown after project selection */}
        {projectId && (
          <div className="space-y-1.5">
            <Label className="text-sm">Vad vill du göra?</Label>
            <div className="grid grid-cols-1 gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  className="h-auto justify-start gap-3 px-3 py-3 text-left"
                  onClick={() => onAction(projectId, cat.id)}
                  disabled={disabled}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <cat.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
