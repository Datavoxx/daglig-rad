import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, X } from "lucide-react";

interface BudgetOverviewFormCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onSubmit: (projectId: string, projectName: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function BudgetOverviewFormCard({
  projects,
  onSubmit,
  onCancel,
  disabled,
}: BudgetOverviewFormCardProps) {
  const [projectId, setProjectId] = useState("");

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Budget översikt</CardTitle>
              <p className="text-xs text-muted-foreground">Välj projekt för att visa ekonomi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget-project" className="text-sm">Projekt *</Label>
          <Select value={projectId} onValueChange={setProjectId} disabled={disabled}>
            <SelectTrigger id="budget-project">
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

        {projectId && (
          <Button
            className="w-full"
            onClick={() => onSubmit(projectId, selectedProject?.name || "")}
            disabled={disabled}
          >
            Visa budget
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
