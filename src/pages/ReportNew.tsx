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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchUser();
    
    // Cleanup on unmount
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
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

  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob, mimeType);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast({ title: "Inspelning startad", description: "Tala tydligt nära mikrofonen" });
    } catch (error) {
      console.error("Microphone error:", error);
      toast({
        title: "Kunde inte starta inspelning",
        description: "Kontrollera att du har tillåtit mikrofontillstånd",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);

    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:audio/... prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64, mimeType }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.text) {
        setTranscript(prev => prev ? prev + '\n\n' + data.text : data.text);
        toast({ title: "Transkribering klar!", description: "Texten har lagts till" });
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transkribering misslyckades",
        description: error instanceof Error ? error.message : "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Röstinspelning stöds ej",
          description: "Din webbläsare stöder inte röstinspelning",
          variant: "destructive",
        });
        return;
      }
      startRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <Textarea
              placeholder="Exempel: Idag var vi fem snickare på plats. Vi jobbade 8 timmar per person och fokuserade på att sätta gips i lägenheterna på plan 3. Det levererades virke från Byggmax. Vi hade en timmes väntetid på att el-materialet skulle komma..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                disabled={isTranscribing}
                className="flex-1"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transkriberar...
                  </>
                ) : isRecording ? (
                  <>
                    <span className="mr-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono">{formatDuration(recordingDuration)}</span>
                    <MicOff className="ml-2 h-4 w-4" />
                    Stoppa
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Spela in
                  </>
                )}
              </Button>
            </div>
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
