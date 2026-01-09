import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertTriangle, CheckCircle2, X, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VoiceInputOverlay } from "@/components/shared/VoiceInputOverlay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EstimateSummaryProps {
  scope: string;
  assumptions: string[];
  uncertainties: string[];
  onScopeChange: (scope: string) => void;
  onAssumptionsChange: (assumptions: string[]) => void;
  onUncertaintiesChange: (uncertainties: string[]) => void;
  onProceed: () => void;
  isLoading?: boolean;
}

export function EstimateSummary({
  scope,
  assumptions,
  uncertainties,
  onScopeChange,
  onAssumptionsChange,
  onUncertaintiesChange,
  onProceed,
  isLoading,
}: EstimateSummaryProps) {
  const [newAssumption, setNewAssumption] = useState("");
  const [newUncertainty, setNewUncertainty] = useState("");
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);

  const addAssumption = () => {
    if (newAssumption.trim()) {
      onAssumptionsChange([...assumptions, newAssumption.trim()]);
      setNewAssumption("");
    }
  };

  const removeAssumption = (index: number) => {
    onAssumptionsChange(assumptions.filter((_, i) => i !== index));
  };

  const addUncertainty = () => {
    if (newUncertainty.trim()) {
      onUncertaintiesChange([...uncertainties, newUncertainty.trim()]);
      setNewUncertainty("");
    }
  };

  const removeUncertainty = (index: number) => {
    onUncertaintiesChange(uncertainties.filter((_, i) => i !== index));
  };

  const handleVoiceEdit = async (transcript: string) => {
    if (!transcript.trim()) return;

    try {
      setIsApplyingVoice(true);
      const { data, error } = await supabase.functions.invoke("apply-summary-voice-edits", {
        body: {
          transcript,
          currentData: { scope, assumptions, uncertainties },
        },
      });

      if (error) throw error;

      if (data.scope !== undefined) onScopeChange(data.scope);
      if (data.assumptions) onAssumptionsChange(data.assumptions);
      if (data.uncertainties) onUncertaintiesChange(data.uncertainties);

      toast.success("Ändring genomförd", {
        description: data.changes_made || "Sammanfattningen uppdaterades",
      });
    } catch (error) {
      console.error("Voice edit failed:", error);
      toast.error("Kunde inte tillämpa ändringen");
    } finally {
      setIsApplyingVoice(false);
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Så här tolkar jag din beskrivning
        </CardTitle>
        <CardDescription>
          Granska och justera tolkningen innan du går vidare till kalkylen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scope */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Projektets omfattning</label>
          <Textarea
            value={scope}
            onChange={(e) => onScopeChange(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Assumptions */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Antaganden
          </label>
          <div className="flex flex-wrap gap-2">
            {assumptions.map((assumption, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="py-1.5 px-3 text-sm flex items-center gap-1.5"
              >
                {assumption}
                <button
                  onClick={() => removeAssumption(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAssumption}
              onChange={(e) => setNewAssumption(e.target.value)}
              placeholder="Lägg till antagande..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addAssumption()}
            />
            <Button variant="outline" size="icon" onClick={addAssumption}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Uncertainties */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Osäkerheter
          </label>
          <div className="flex flex-wrap gap-2">
            {uncertainties.map((uncertainty, index) => (
              <Badge
                key={index}
                variant="outline"
                className="py-1.5 px-3 text-sm flex items-center gap-1.5 border-amber-300 text-amber-700 bg-amber-50"
              >
                {uncertainty}
                <button
                  onClick={() => removeUncertainty(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newUncertainty}
              onChange={(e) => setNewUncertainty(e.target.value)}
              placeholder="Lägg till osäkerhet..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addUncertainty()}
            />
            <Button variant="outline" size="icon" onClick={addUncertainty}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Proceed button */}
        <div className="pt-4 border-t">
          <Button onClick={onProceed} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Gå vidare till kalkyl
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>

      {/* Voice input overlay */}
      <VoiceInputOverlay
        onTranscriptComplete={handleVoiceEdit}
        isProcessing={isApplyingVoice}
        className="absolute bottom-4 right-4"
      />
    </Card>
  );
}
