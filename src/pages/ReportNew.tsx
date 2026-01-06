import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Wand2,
  Calendar,
  Loader2,
  AlertCircle,
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

  // Check for Web Speech API support
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    fetchProjects();
    // Set fixed user_id since auth is disabled
    setUserId("00000000-0000-0000-0000-000000000000");
    
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
          user_id: userId,
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

      // Store starting transcript
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
        // Only update state if we're still supposed to be recording
        // (handles automatic stop vs manual stop)
        if (isRecording) {
          // Restart if it stopped unexpectedly (silence, etc)
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
    <div className="animate-in space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Ny dagrapport</h1>
          <p className="text-muted-foreground">Generera en strukturerad rapport från transkript</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Välj projekt och datum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Projekt</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
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
                  <Button variant="link" className="h-auto p-0" onClick={() => navigate("/projects")}>
                    Skapa ett projekt
                  </Button>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
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

        {/* Transcript input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Transkript</CardTitle>
            <CardDescription>
              Klistra in eller diktera vad som hände på byggarbetsplatsen idag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Exempel: Idag var vi fem snickare på plats. Vi jobbade 8 timmar per person och fokuserade på att sätta gips i lägenheterna på plan 3. Det levererades virke från Byggmax. Vi hade en timmes väntetid på att el-materialet skulle komma..."
                value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  finalTranscriptRef.current = e.target.value;
                }}
                className="min-h-[200px] resize-none"
                disabled={isRecording}
              />
              {interimTranscript && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Lyssnar...
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                className="flex-1"
                disabled={!isSpeechRecognitionSupported}
              >
                {isRecording ? (
                  <>
                    <span className="mr-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <MicOff className="ml-2 h-4 w-4" />
                    Stoppa inspelning
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Spela in (realtid)
                  </>
                )}
              </Button>
            </div>
            {!isSpeechRecognitionSupported && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Din webbläsare stöder inte röstinspelning. Använd Chrome, Edge eller Safari.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate button */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <Wand2 className="h-10 w-10 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Redo att generera?</h3>
            <p className="text-sm text-muted-foreground">
              AI:n tolkar ditt transkript och skapar en strukturerad dagrapport
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProject || !transcript.trim()}
            className="min-w-48"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genererar...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generera dagrapport
              </>
            )}
          </Button>
          {(!selectedProject || !transcript.trim()) && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Välj projekt och skriv transkript för att fortsätta
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
