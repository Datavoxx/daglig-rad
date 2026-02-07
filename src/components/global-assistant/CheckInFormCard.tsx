import { useState } from "react";
import { ClipboardCheck, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckInFormCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onSubmit: (projectId: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function CheckInFormCard({
  projects,
  onSubmit,
  onCancel,
  disabled,
}: CheckInFormCardProps) {
  const [selectedProject, setSelectedProject] = useState<string>("");

  const handleSubmit = () => {
    if (selectedProject) {
      onSubmit(selectedProject);
    }
  };

  return (
    <Card className="w-full border-primary/20">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Personalliggare</h3>
            <p className="text-sm text-muted-foreground">
              Elektronisk närvaro enligt skattelagstiftning
            </p>
          </div>
        </div>

        {/* Section title */}
        <div>
          <h4 className="text-base font-medium text-foreground">
            Checka in (Personalliggare)
          </h4>
        </div>

        {/* Project selector */}
        <div className="space-y-2">
          <Label htmlFor="project-select">Välj arbetsplats</Label>
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject}
            disabled={disabled}
          >
            <SelectTrigger id="project-select" className="w-full">
              <SelectValue placeholder="Välj projekt..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    {project.address && (
                      <span className="text-xs text-muted-foreground">
                        {project.address}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!selectedProject || disabled}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Checka in
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
          >
            Avbryt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
