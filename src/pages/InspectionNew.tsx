import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, ClipboardCheck, Building2, FileText, Mic, MicOff, Loader2, AlertCircle, Sparkles, Check, X, Minus } from "lucide-react";

type Step = "project" | "template" | "input" | "preview" | "creating";

interface AICheckpointResult {
  id: string;
  result: "ok" | "deviation" | "na" | null;
  comment: string;
  confidence: number;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description: string | null;
  checkpoints: any[];
}

export default function InspectionNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("project");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiResults, setAiResults] = useState<AICheckpointResult[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real-time speech recognition refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name")
        .eq("user_id", userData.user.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["inspection-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_templates")
        .select("*")
        .order("category, name");
      if (error) throw error;
      return data as Template[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const createInspection = useMutation({
    mutationFn: async () => {
      if (!selectedProject || !selectedTemplate) {
        throw new Error("Projekt och mall måste väljas");
      }

      const checkpoints = selectedTemplate.checkpoints.map((cp: any) => ({
        ...cp,
        result: null,
        comment: "",
      }));

      const { data, error } = await supabase
        .from("inspections")
        .insert({
          project_id: selectedProject,
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          template_category: selectedTemplate.category,
          checkpoints,
          original_transcript: textInput || null,
          status: "draft",
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Egenkontroll skapad",
        description: "Du kan nu fylla i kontrollpunkterna",
      });
      navigate(`/inspections/${data.id}`);
    },
    onError: (error) => {
      console.error("Failed to create inspection:", error);
      toast({
        title: "Fel vid skapande",
        description: error.message || "Kunde inte skapa egenkontrollen. Försök igen.",
        variant: "destructive",
      });
      setStep("input");
    },
  });

  // Real-time speech recognition (same as ReportNew.tsx)
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

      finalTranscriptRef.current = textInput;

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
          setTextInput(finalTranscriptRef.current);
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

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const analyzeWithAI = async () => {
    if (!selectedTemplate || !textInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('prefill-inspection', {
        body: {
          transcript: textInput,
          checkpoints: selectedTemplate.checkpoints.map((cp: any) => ({
            id: cp.id,
            text: cp.text,
            required: cp.required,
          })),
          template_name: selectedTemplate.name,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAiResults(data.checkpoints);
      setAiSummary(data.summary);
      setStep("preview");
      
      toast({
        title: "AI-analys klar",
        description: data.summary,
      });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast({
        title: "AI-analys misslyckades",
        description: error.message || "Kunde inte analysera. Försök igen eller skapa utan AI.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createWithAIResults = () => {
    if (!selectedProject || !selectedTemplate) return;
    
    const checkpoints = selectedTemplate.checkpoints.map((cp: any) => {
      const aiResult = aiResults?.find(r => r.id === cp.id);
      return {
        ...cp,
        result: aiResult?.result ?? null,
        comment: aiResult?.comment ?? "",
        aiPrefilled: aiResult?.result !== null,
        aiConfidence: aiResult?.confidence ?? 0,
      };
    });

    setStep("creating");
    
    supabase
      .from("inspections")
      .insert({
        project_id: selectedProject,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        template_category: selectedTemplate.category,
        checkpoints,
        original_transcript: textInput || null,
        status: "draft",
      })
      .select("id")
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast({
            title: "Fel vid skapande",
            description: error.message,
            variant: "destructive",
          });
          setStep("preview");
          return;
        }
        toast({
          title: "Egenkontroll skapad",
          description: "AI har förifylt kontrollpunkterna",
        });
        navigate(`/inspections/${data.id}`);
      });
  };

  const handleNext = () => {
    if (step === "project" && selectedProject) {
      setStep("template");
    } else if (step === "template" && selectedTemplate) {
      setStep("input");
    } else if (step === "input") {
      setStep("creating");
      createInspection.mutate();
    } else if (step === "preview") {
      createWithAIResults();
    }
  };

  const handleBack = () => {
    if (step === "template") {
      setStep("project");
    } else if (step === "input") {
      setStep("template");
    } else if (step === "preview") {
      setStep("input");
    }
  };

  const canProceed = () => {
    if (step === "project") return !!selectedProject;
    if (step === "template") return !!selectedTemplate;
    if (step === "input") return !isRecording && !isAnalyzing;
    if (step === "preview") return true;
    return false;
  };

  const getResultIcon = (result: "ok" | "deviation" | "na" | null) => {
    switch (result) {
      case "ok": return <Check className="h-4 w-4 text-green-600" />;
      case "deviation": return <X className="h-4 w-4 text-red-600" />;
      case "na": return <Minus className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getResultLabel = (result: "ok" | "deviation" | "na" | null) => {
    switch (result) {
      case "ok": return "OK";
      case "deviation": return "Avvikelse";
      case "na": return "Ej tillämpligt";
      default: return "Ej ifylld";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inspections")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Ny egenkontroll</h1>
          <p className="text-sm text-muted-foreground">
            Steg {step === "project" ? 1 : step === "template" ? 2 : step === "input" ? 3 : 3} av 3
          </p>
        </div>
      </div>

      {step === "project" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Välj projekt
            </CardTitle>
            <CardDescription>
              Välj vilket projekt egenkontrollern ska kopplas till
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {projects?.map((project) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProject === project.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          {project.client_name && (
                            <p className="text-sm text-muted-foreground">
                              {project.client_name}
                            </p>
                          )}
                        </div>
                        {selectedProject === project.id && (
                          <Badge>Vald</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {projects?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Inga projekt hittades. Skapa ett projekt först.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/projects")}
                    >
                      Gå till projekt
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "template" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Välj mall
            </CardTitle>
            <CardDescription>
              Välj vilken typ av egenkontroll du vill skapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedTemplates &&
                  Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                    <div key={category}>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="grid gap-2">
                        {categoryTemplates.map((template) => (
                          <Card
                            key={template.id}
                            className={`cursor-pointer transition-colors ${
                              selectedTemplate?.id === template.id
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{template.name}</h4>
                                  {template.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {template.description}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {template.checkpoints.length} punkter
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "input" && selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {selectedTemplate.name}
            </CardTitle>
            <CardDescription>
              {selectedTemplate.checkpoints.length} kontrollpunkter – referera till dem med nummer när du dikterar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Checkpoint list */}
            <div className="border rounded-lg divide-y max-h-[280px] overflow-y-auto">
              {selectedTemplate.checkpoints.map((cp: any, index: number) => (
                <div key={cp.id} className="p-3 flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center shrink-0 font-semibold">
                    {index + 1}
                  </Badge>
                  <span className="text-sm flex-1">{cp.text}</span>
                  {cp.required && (
                    <Badge variant="secondary" className="text-xs shrink-0">Obligatorisk</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Voice/text input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Diktera eller skriv</span>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="T.ex. 'Punkt ett OK, punkt två OK, punkt tre har avvikelse - skyddsutrustning saknas...'"
                  value={textInput + (interimTranscript ? (textInput ? ' ' : '') + interimTranscript : '')}
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    finalTranscriptRef.current = e.target.value;
                  }}
                  rows={4}
                  disabled={isRecording || isAnalyzing}
                />
                {interimTranscript && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    Lyssnar...
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={isRecording ? "destructive" : "secondary"}
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex-1"
                  disabled={!isSpeechRecognitionSupported || isAnalyzing}
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
              </div>
              
              {!isSpeechRecognitionSupported && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Din webbläsare stöder inte röstinspelning
                </p>
              )}

              {textInput.trim() && (
                <Button
                  onClick={analyzeWithAI}
                  disabled={isAnalyzing || isRecording}
                  className="w-full"
                  variant="default"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyserar med AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analysera med AI
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {textInput.trim() 
                ? "Klicka 'Analysera med AI' för att förifylla kontrollpunkter, eller 'Skapa egenkontroll' för att fylla i manuellt."
                : "Du kan lämna detta tomt och fylla i kontrollpunkterna manuellt."}
            </p>
          </CardContent>
        </Card>
      )}

      {step === "preview" && aiResults && selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-analys
            </CardTitle>
            <CardDescription>
              {aiSummary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {aiResults.filter(r => r.result === "ok").length}
                </div>
                <div className="text-xs text-muted-foreground">Godkända</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {aiResults.filter(r => r.result === "deviation").length}
                </div>
                <div className="text-xs text-muted-foreground">Avvikelser</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {aiResults.filter(r => r.result === null).length}
                </div>
                <div className="text-xs text-muted-foreground">Ej ifyllda</div>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {selectedTemplate.checkpoints.map((cp: any, index: number) => {
                const aiResult = aiResults.find(r => r.id === cp.id);
                return (
                  <div key={cp.id} className="p-3 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getResultIcon(aiResult?.result ?? null)}
                      {!aiResult?.result && <span className="h-4 w-4 block" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{cp.text}</span>
                        {cp.required && (
                          <Badge variant="secondary" className="text-xs">Obligatorisk</Badge>
                        )}
                        {aiResult?.result && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              aiResult.result === "ok" ? "border-green-500 text-green-600" :
                              aiResult.result === "deviation" ? "border-red-500 text-red-600" :
                              "border-muted-foreground"
                            }`}
                          >
                            {getResultLabel(aiResult.result)}
                          </Badge>
                        )}
                        {aiResult?.confidence && aiResult.confidence > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(aiResult.confidence * 100)}% säker)
                          </span>
                        )}
                      </div>
                      {aiResult?.comment && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{aiResult.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              Du kan redigera alla punkter efter att egenkontrollen skapats.
            </p>
          </CardContent>
        </Card>
      )}

      {step === "creating" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold">Skapar egenkontroll...</h3>
            <p className="text-muted-foreground">Vänligen vänta</p>
          </CardContent>
        </Card>
      )}

      {step !== "creating" && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === "project"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === "preview" ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Skapa med AI-resultat
              </>
            ) : step === "input" ? (
              "Skapa egenkontroll"
            ) : (
              "Nästa"
            )}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
