import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Mic,
  MicOff,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ReportEditor } from "@/components/reports/ReportEditor";
import { AtaFollowUpDialog } from "./AtaFollowUpDialog";

import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface AtaItem {
  reason: string;
  consequence: string;
  estimated_hours: number | null;
}

interface GeneratedReport {
  report_date: string;
  project_id: string;
  reporter_user_id: string;
  crew: {
    headcount: number | null;
    roles: string[];
    hours_per_person: number | null;
    total_hours: number | null;
  };
  work_items: string[];
  deviations: Array<{
    type: string;
    description: string;
    hours: number | null;
  }>;
  ata: {
    has_ata: boolean;
    items: AtaItem[];
  } | null;
  extra_work: string[];
  materials: {
    delivered: string[];
    missing: string[];
  };
  notes: string | null;
  original_transcript: string;
  confidence: {
    overall: number;
    low_confidence_fields: string[];
  };
}

interface InlineDiaryCreatorProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSaved: (reportId: string) => void;
}

export function InlineDiaryCreator({
  projectId,
  projectName,
  onClose,
  onSaved,
}: InlineDiaryCreatorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [pendingAtaItems, setPendingAtaItems] = useState<AtaItem[]>([]);
  const [showAtaDialog, setShowAtaDialog] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const {
    isRecording,
    isTranscribing,
    interimTranscript,
    finalTranscript,
    startRecording,
    stopRecording,
    isSupported,
    isIOSDevice,
  } = useVoiceRecorder({
    agentName: "Byggio AI",
    onTranscriptUpdate: (newTranscript) => {
      setTranscript(newTranscript);
    },
    onTranscriptComplete: (completedTranscript) => {
      setTranscript(completedTranscript);
    },
  });

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      toast.error("Skriv eller spela in ett transkript först");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke("generate-report", {
        body: {
          transcript,
          project_id: projectId,
          report_date: format(selectedDate, "yyyy-MM-dd"),
          user_id: null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const report = response.data as GeneratedReport;
      setGeneratedReport(report);

      toast.success("Rapport genererad!", {
        description: `Konfidens: ${Math.round((report.confidence?.overall || 0) * 100)}%`,
      });
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Kunde inte generera rapport", {
        description: error instanceof Error ? error.message : "Okänt fel",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleReportSaved = (reportId: string) => {
    // Check if report has ÄTA items that need processing
    if (generatedReport?.ata?.has_ata && generatedReport.ata.items.length > 0) {
      setPendingAtaItems(generatedReport.ata.items);
      setSavedReportId(reportId);
      setShowAtaDialog(true);
    } else {
      onSaved(reportId);
    }
  };

  const handleAtaComplete = () => {
    if (savedReportId) {
      onSaved(savedReportId);
    }
    setPendingAtaItems([]);
    setShowAtaDialog(false);
    setSavedReportId(null);
  };

  // Construct displayed transcript (for Web Speech API showing interim results)
  const displayedTranscript = isIOSDevice 
    ? transcript 
    : transcript + (interimTranscript ? (transcript ? " " : "") + interimTranscript : "");

  // Show the report editor for review after generation
  if (generatedReport) {
    return (
      <>
        <ReportEditor
          report={generatedReport}
          projectId={projectId}
          projectName={projectName}
          reportDate={selectedDate}
          userId=""
          onBack={() => setGeneratedReport(null)}
          onSaved={handleReportSaved}
        />
        <AtaFollowUpDialog
          open={showAtaDialog}
          onOpenChange={setShowAtaDialog}
          projectId={projectId}
          ataItems={pendingAtaItems}
          onComplete={handleAtaComplete}
        />
      </>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm animate-in fade-in-0 slide-in-from-top-2 duration-300 md:max-w-none">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Ny arbetsdagbok
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 touch-target">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {projectName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date picker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Datum
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {format(selectedDate, "d MMMM yyyy", { locale: sv })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Transcript */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Transkript
          </Label>
          <div className="relative">
            <Textarea
              placeholder="Beskriv vad som hände idag... Exempel: Idag var vi fem snickare på plats. Vi jobbade 8 timmar per person..."
              value={displayedTranscript}
              onChange={(e) => {
                setTranscript(e.target.value);
              }}
              className="min-h-[140px] resize-none text-[0.9375rem] leading-relaxed"
              disabled={isRecording || isTranscribing}
            />
            {(isRecording || isTranscribing) && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {isTranscribing ? "Transkriberar..." : "Lyssnar..."}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              onClick={toggleRecording}
              className="w-full sm:w-auto touch-target"
              disabled={!isSupported || isTranscribing}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Transkriberar...</span>
                </>
              ) : isRecording ? (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />
                  <MicOff className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Stoppa inspelning</span>
                  <span className="sm:hidden">Stopp</span>
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Spela in {isIOSDevice ? "" : "(realtid)"}</span>
                  <span className="sm:hidden">Spela in</span>
                </>
              )}
            </Button>
            {!isRecording && !isTranscribing && isSupported && (
              <div className="flex items-center gap-3 p-3 mt-2 border border-dashed border-border rounded-lg">
                <Mic className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Spara tid genom att prata</span>
                  <span className="text-xs text-muted-foreground">
                    Spela in vad som hände idag
                    {isIOSDevice && " (transkribering efter inspelning)"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!isSupported && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Din webbläsare stöder inte röstinspelning
            </p>
          )}
        </div>

        {/* Generate button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !transcript.trim() || isRecording || isTranscribing}
            className="flex-1 sm:flex-none touch-target"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genererar...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Generera arbetsdagbok</span>
                <span className="sm:hidden">Generera</span>
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} className="touch-target">
            Avbryt
          </Button>
        </div>

        {!transcript.trim() && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Skriv eller spela in ett transkript för att fortsätta
          </p>
        )}
      </CardContent>
    </Card>
  );
}
