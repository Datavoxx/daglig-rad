import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle,
  FolderKanban,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ReportEditor } from "@/components/reports/ReportEditor";

interface Project {
  id: string;
  name: string;
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
    items: Array<{
      reason: string;
      consequence: string;
      estimated_hours: number | null;
    }>;
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

export default function ReportNew() {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectIdParam || "");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    fetchProjects();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setProjects(data);
      if (projectIdParam && data.some((p) => p.id === projectIdParam)) {
        setSelectedProject(projectIdParam);
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedProject) {
      toast({ title: "Välj ett projekt först", variant: "destructive" });
      return;
    }
    if (!transcript.trim()) {
      toast({ title: "Skriv eller spela in ett transkript först", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke("generate-report", {
        body: {
          transcript,
          project_id: selectedProject,
          report_date: format(selectedDate, "yyyy-MM-dd"),
          user_id: userId || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const report = response.data as GeneratedReport;
      setGeneratedReport(report);

      toast({
        title: "Rapport genererad!",
        description: `Konfidens: ${Math.round((report.confidence?.overall || 0) * 100)}%`,
      });
    } catch (error) {
      console.error("Generate error:", error);
      toast({
        title: "Kunde inte generera rapport",
        description: error instanceof Error ? error.message : "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startRecording = () => {
    if (!isSpeechRecognitionSupported) {
      toast({
        title: "Röstinspelning stöds ej",
        description: "Din webbläsare stöder inte Web Speech API. Använd Chrome, Edge eller Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      recognition.lang = 'sv-SE';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      finalTranscriptRef.current = transcript;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        
        if (final) {
          finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final.trim();
          setTranscript(finalTranscriptRef.current);
        }
        
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          toast({
            title: "Inget tal upptäckt",
            description: "Försök tala tydligare och närmare mikrofonen",
            variant: "destructive",
          });
        } else if (event.error === 'audio-capture') {
          toast({
            title: "Mikrofon ej tillgänglig",
            description: "Kontrollera att mikrofonen är ansluten och tillåten",
            variant: "destructive",
          });
        } else if (event.error !== 'aborted') {
          toast({
            title: "Inspelningsfel",
            description: `Fel: ${event.error}`,
            variant: "destructive",
          });
        }
        
        setIsRecording(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        if (isRecording) {
          try {
            recognition.start();
          } catch {
            setIsRecording(false);
            setInterimTranscript("");
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      
      toast({ title: "Inspelning startad", description: "Tala tydligt - texten visas i realtid" });
    } catch (error) {
      console.error("Speech recognition start error:", error);
      toast({
        title: "Kunde inte starta inspelning",
        description: "Ett oväntat fel uppstod",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setInterimTranscript("");
      
      toast({ title: "Inspelning stoppad" });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (generatedReport) {
    return (
      <ReportEditor
        report={generatedReport}
        projectId={selectedProject}
        projectName={projects.find((p) => p.id === selectedProject)?.name || ""}
        reportDate={selectedDate}
        userId={userId}
        onBack={() => setGeneratedReport(null)}
        onSaved={(id) => navigate(`/reports/${id}`)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-title">Ny dagrapport</h1>
          <p className="page-subtitle">Generera en strukturerad rapport från transkript</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
            selectedProject ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"
          )}>
            1
          </div>
          <span className="text-sm font-medium">Välj projekt</span>
        </div>
        <div className="h-px w-6 bg-border" />
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
            transcript.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            2
          </div>
          <span className={cn("text-sm", transcript.trim() ? "font-medium" : "text-muted-foreground")}>Transkript</span>
        </div>
        <div className="h-px w-6 bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            3
          </div>
          <span className="text-sm text-muted-foreground">Granska</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Project & Date */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4 text-primary" />
              Projekt och datum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projekt</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Välj projekt..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Du har inga projekt ännu.{" "}
                  <Button variant="link" className="h-auto p-0 text-primary" onClick={() => navigate("/projects")}>
                    Skapa ett projekt
                  </Button>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start text-left font-normal"
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
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Transcript */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Transkript
            </CardTitle>
            <CardDescription>
              Klistra in eller diktera vad som hände på byggarbetsplatsen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Exempel: Idag var vi fem snickare på plats. Vi jobbade 8 timmar per person och fokuserade på att sätta gips i lägenheterna på plan 3..."
                value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  finalTranscriptRef.current = e.target.value;
                }}
                className="min-h-[180px] resize-none text-[0.9375rem] leading-relaxed"
                disabled={isRecording}
              />
              {interimTranscript && (
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  Lyssnar...
                </div>
              )}
            </div>
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              onClick={toggleRecording}
              className="w-full"
              disabled={!isSpeechRecognitionSupported}
            >
              {isRecording ? (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />
                  <MicOff className="mr-2 h-4 w-4" />
                  Stoppa inspelning
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Spela in (realtid)
                </>
              )}
            </Button>
            {!isSpeechRecognitionSupported && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Din webbläsare stöder inte röstinspelning
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate action */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-medium">Redo att generera?</h3>
            <p className="text-sm text-muted-foreground">
              AI:n tolkar ditt transkript och skapar en strukturerad dagrapport
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProject || !transcript.trim()}
            className="min-w-40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genererar...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generera rapport
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {(!selectedProject || !transcript.trim()) && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Välj projekt och skriv transkript för att fortsätta
        </p>
      )}
    </div>
  );
}
