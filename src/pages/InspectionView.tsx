import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  FileDown,
  Check,
  X,
  Minus,
  Building2,
  Calendar,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { generateInspectionPdf } from "@/lib/generateInspectionPdf";
import { VoiceInputOverlay } from "@/components/shared/VoiceInputOverlay";

interface Checkpoint {
  id: string;
  text: string;
  required: boolean;
  result: "ok" | "deviation" | "na" | null;
  comment: string;
  aiPrefilled?: boolean;
  aiConfidence?: number;
}

export default function InspectionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);

  const { data: inspection, isLoading } = useQuery({
    queryKey: ["inspection", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select("*, projects(name, client_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorCompany, setInspectorCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("draft");

  // Update form when inspection data changes
  if (inspection && checkpoints.length === 0 && Array.isArray(inspection.checkpoints) && inspection.checkpoints.length > 0) {
    setCheckpoints(inspection.checkpoints as unknown as Checkpoint[]);
    setInspectorName(inspection.inspector_name || "");
    setInspectorCompany(inspection.inspector_company || "");
    setNotes(inspection.notes || "");
    setStatus(inspection.status);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("inspections")
        .update({
          checkpoints: checkpoints as unknown as any,
          inspector_name: inspectorName,
          inspector_company: inspectorCompany,
          notes,
          status,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection", id] });
      toast({ title: "Sparad", description: "Egenkontrollen har sparats" });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCheckpoint = (index: number, field: keyof Checkpoint, value: any) => {
    setCheckpoints((prev) =>
      prev.map((cp, i) => (i === index ? { ...cp, [field]: value } : cp))
    );
  };

  const getResultIcon = (result: Checkpoint["result"]) => {
    switch (result) {
      case "ok":
        return <Check className="h-4 w-4 text-green-600" />;
      case "deviation":
        return <X className="h-4 w-4 text-red-600" />;
      case "na":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const completedCount = checkpoints.filter((cp) => cp.result !== null).length;
  const deviationCount = checkpoints.filter((cp) => cp.result === "deviation").length;

  const handleVoiceEdit = async (transcript: string) => {
    setIsApplyingVoice(true);
    try {
      const { data: updatedData, error } = await supabase.functions.invoke("apply-voice-edits", {
        body: {
          transcript,
          currentData: { checkpoints, inspectorName, inspectorCompany, notes, status },
          documentType: "inspection",
        },
      });

      if (error) throw error;

      if (updatedData) {
        if (updatedData.checkpoints) setCheckpoints(updatedData.checkpoints);
        if (updatedData.inspectorName !== undefined) setInspectorName(updatedData.inspectorName);
        if (updatedData.inspectorCompany !== undefined) setInspectorCompany(updatedData.inspectorCompany);
        if (updatedData.notes !== undefined) setNotes(updatedData.notes);
        if (updatedData.status !== undefined) setStatus(updatedData.status);
        toast({ title: "Ändringar applicerade", description: "Egenkontrollen har uppdaterats" });
      }
    } catch (error: any) {
      console.error("Voice edit error:", error);
      toast({
        title: "Kunde inte applicera ändringar",
        description: error.message || "Försök igen",
        variant: "destructive",
      });
    } finally {
      setIsApplyingVoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Egenkontroll hittades inte</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/inspections")}>
          Tillbaka till egenkontroller
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/inspections")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{inspection.template_name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {(inspection.projects as any)?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(inspection.inspection_date), "d MMM yyyy", { locale: sv })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pl-10 sm:pl-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              if (!inspection) return;
              setIsExporting(true);
              try {
                await generateInspectionPdf({
                  id: inspection.id,
                  template_name: inspection.template_name,
                  template_category: inspection.template_category,
                  inspection_date: inspection.inspection_date,
                  inspector_name: inspectorName,
                  inspector_company: inspectorCompany,
                  notes,
                  status,
                  checkpoints,
                  project: inspection.projects as any,
                });
                toast({ title: "PDF exporterad", description: "Filen har laddats ner" });
              } catch (error: any) {
                toast({
                  title: "Exportfel",
                  description: error.message || "Kunde inte exportera PDF",
                  variant: "destructive",
                });
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Spara
          </Button>
        </div>
      </div>


      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kontrollpunkter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedCount} / {checkpoints.length}
            </div>
            <p className="text-xs text-muted-foreground">ifyllda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avvikelser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{deviationCount}</div>
            <p className="text-xs text-muted-foreground">funna</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Utkast</SelectItem>
                <SelectItem value="completed">Slutförd</SelectItem>
                <SelectItem value="approved">Godkänd</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kontrollinformation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kontrollant</Label>
              <Input
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="Namn på kontrollant"
              />
            </div>
            <div className="space-y-2">
              <Label>Företag</Label>
              <Input
                value={inspectorCompany}
                onChange={(e) => setInspectorCompany(e.target.value)}
                placeholder="Företagsnamn"
              />
            </div>
            <div className="space-y-2">
              <Label>Anteckningar</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Övriga anteckningar..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mallinfo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Kategori:</span>
              <Badge variant="outline" className="ml-2">
                {inspection.template_category}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Mall:</span>
              <span className="ml-2 font-medium">{inspection.template_name}</span>
            </div>
            {inspection.original_transcript && (
              <div>
                <span className="text-sm text-muted-foreground">Original input:</span>
                <p className="mt-1 text-sm bg-muted p-2 rounded">
                  {inspection.original_transcript}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontrollpunkter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checkpoints.map((checkpoint, index) => (
              <div
                key={checkpoint.id}
                className={`p-4 rounded-lg border ${
                  checkpoint.result === "deviation"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                    : checkpoint.result === "ok"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className={checkpoint.required ? "font-medium" : ""}>
                        {checkpoint.text}
                      </span>
                      {checkpoint.required && (
                        <Badge variant="secondary" className="text-xs">
                          Obligatorisk
                        </Badge>
                      )}
                      {checkpoint.aiPrefilled && (
                        <Badge variant="outline" className="text-xs gap-1 border-primary/50 text-primary">
                          <Sparkles className="h-3 w-3" />
                          AI-ifylld
                          {checkpoint.aiConfidence && checkpoint.aiConfidence > 0 && (
                            <span className="opacity-70">
                              ({Math.round(checkpoint.aiConfidence * 100)}%)
                            </span>
                          )}
                        </Badge>
                      )}
                    </div>
                    {checkpoint.result === "deviation" && (
                      <Textarea
                        className="mt-2"
                        placeholder="Beskriv avvikelsen..."
                        value={checkpoint.comment}
                        onChange={(e) =>
                          updateCheckpoint(index, "comment", e.target.value)
                        }
                      />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={checkpoint.result === "ok" ? "default" : "outline"}
                      size="sm"
                      className={
                        checkpoint.result === "ok"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                      onClick={() => updateCheckpoint(index, "result", "ok")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={checkpoint.result === "deviation" ? "default" : "outline"}
                      size="sm"
                      className={
                        checkpoint.result === "deviation"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                      onClick={() => updateCheckpoint(index, "result", "deviation")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={checkpoint.result === "na" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateCheckpoint(index, "result", "na")}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <VoiceInputOverlay
        onTranscriptComplete={handleVoiceEdit}
        isProcessing={isApplyingVoice}
        agentName="Erik AI"
      />
    </div>
  );
}
