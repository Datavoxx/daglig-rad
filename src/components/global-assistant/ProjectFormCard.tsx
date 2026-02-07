import { useState } from "react";
import { FolderKanban, X, FileText, MapPin, User, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Estimate {
  id: string;
  offer_number: string | null;
  manual_project_name: string | null;
  manual_client_name: string | null;
  manual_address: string | null;
  status: string;
}

interface ProjectFormCardProps {
  estimates: Estimate[];
  onSubmit: (data: { estimateId: string }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function ProjectFormCard({
  estimates,
  onSubmit,
  onCancel,
  disabled,
}: ProjectFormCardProps) {
  const navigate = useNavigate();
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>("");

  const selectedEstimate = estimates.find((e) => e.id === selectedEstimateId);

  const handleSubmit = () => {
    if (!selectedEstimateId) return;
    onSubmit({ estimateId: selectedEstimateId });
  };

  const isValid = selectedEstimateId.length > 0;

  // Empty state - no estimates available
  if (estimates.length === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border border-border/60 bg-card p-4 shadow-sm",
          "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        )}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">Skapa projekt</h3>
        </div>

        <div className="text-center py-6">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Du har inga tillgängliga offerter att skapa projekt från.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/estimates")}
            className="gap-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Skapa offert först
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-end">
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
        </div>
      </div>
    );
  }

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
          <FolderKanban className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Skapa projekt från offert</h3>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Estimate selector */}
        <div className="space-y-1.5">
          <Label htmlFor="estimate" className="text-xs text-muted-foreground">
            Välj offert <span className="text-destructive">*</span>
          </Label>
          <Select value={selectedEstimateId} onValueChange={setSelectedEstimateId} disabled={disabled}>
            <SelectTrigger id="estimate" className="w-full">
              <SelectValue placeholder="Välj en offert..." />
            </SelectTrigger>
            <SelectContent>
              {estimates.map((estimate) => (
                <SelectItem key={estimate.id} value={estimate.id}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">
                      {estimate.offer_number || "Utan nummer"}
                    </span>
                    {estimate.manual_project_name && (
                      <span className="text-muted-foreground">
                        - {estimate.manual_project_name}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview of selected estimate */}
        {selectedEstimate && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Data från offerten
            </p>
            
            <div className="space-y-1.5">
              {selectedEstimate.manual_project_name && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{selectedEstimate.manual_project_name}</span>
                </div>
              )}
              
              {selectedEstimate.manual_client_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedEstimate.manual_client_name}</span>
                </div>
              )}
              
              {selectedEstimate.manual_address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedEstimate.manual_address}</span>
                </div>
              )}

              {!selectedEstimate.manual_project_name && 
               !selectedEstimate.manual_client_name && 
               !selectedEstimate.manual_address && (
                <p className="text-sm text-muted-foreground italic">
                  Ingen extra data finns i offerten
                </p>
              )}
            </div>
          </div>
        )}
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
          <FolderKanban className="h-3.5 w-3.5" />
          Skapa projekt
        </Button>
      </div>
    </div>
  );
}
