import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { CreateTemplateDialog } from "./CreateTemplateDialog";

interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
}

interface TemplateSelectorProps {
  templates: EstimateTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  onTemplateCreated: () => void;
  disabled?: boolean;
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onTemplateCreated,
  disabled = false,
}: TemplateSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleTemplateCreated = () => {
    setShowCreateDialog(false);
    onTemplateCreated();
  };

  if (templates.length === 0) {
    return (
      <>
        <div className="border rounded-lg p-6 bg-muted/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Du har inga kalkylmallar ännu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Skapa en mall med dina priser och moment så blir det enkelt att skapa kalkyler.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa mall
              </Button>
            </div>
          </div>
        </div>

        <CreateTemplateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreated={handleTemplateCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={selectedTemplateId || ""}
          onValueChange={(value) => onSelectTemplate(value || null)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Välj kalkylmall..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
          disabled={disabled}
          title="Skapa ny mall"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}
