import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, X } from "lucide-react";

interface AtaFormCardProps {
  projectId: string;
  projectName?: string;
  onSubmit: (data: { projectId: string; description: string; reason: string; estimatedCost: number | null; estimatedHours: number | null }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function AtaFormCard({ projectId, projectName, onSubmit, onCancel, disabled }: AtaFormCardProps) {
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectId,
      description,
      reason,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Ny ÄTA</CardTitle>
              <p className="text-xs text-muted-foreground">{projectName || "Projekt"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ata-desc" className="text-sm">Beskrivning *</Label>
            <Textarea
              id="ata-desc"
              placeholder="Beskriv ändringen eller tilläggsarbetet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={disabled}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ata-reason" className="text-sm">Orsak</Label>
            <Input
              id="ata-reason"
              placeholder="Anledning till ÄTA..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ata-cost" className="text-sm">Uppskattad kostnad (kr)</Label>
              <Input
                id="ata-cost"
                type="number"
                placeholder="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ata-hours" className="text-sm">Uppskattade timmar</Label>
              <Input
                id="ata-hours"
                type="number"
                step="0.5"
                placeholder="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={disabled}>
              Avbryt
            </Button>
            <Button type="submit" className="flex-1" disabled={disabled || !description.trim()}>
              Skapa ÄTA
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
