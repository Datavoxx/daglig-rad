import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, ClipboardCheck, Building2, FileText, Mic, Loader2 } from "lucide-react";

type Step = "project" | "template" | "input" | "creating";

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

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
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
  });

  const createInspection = useMutation({
    mutationFn: async () => {
      if (!selectedProject || !selectedTemplate) {
        throw new Error("Projekt och mall måste väljas");
      }

      // If we have text input, we could call an AI edge function here
      // For now, we just create with default checkpoints
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
        .select()
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
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
      setStep("input");
    },
  });

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const handleNext = () => {
    if (step === "project" && selectedProject) {
      setStep("template");
    } else if (step === "template" && selectedTemplate) {
      setStep("input");
    } else if (step === "input") {
      setStep("creating");
      createInspection.mutate();
    }
  };

  const handleBack = () => {
    if (step === "template") {
      setStep("project");
    } else if (step === "input") {
      setStep("template");
    }
  };

  const canProceed = () => {
    if (step === "project") return !!selectedProject;
    if (step === "template") return !!selectedTemplate;
    if (step === "input") return true;
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inspections")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ny egenkontroll</h1>
          <p className="text-muted-foreground">
            Steg {step === "project" ? 1 : step === "template" ? 2 : 3} av 3
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

      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Frivillig input (valfritt)
            </CardTitle>
            <CardDescription>
              Beskriv vad som ska kontrolleras eller lämna tomt för att fylla i manuellt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="T.ex. 'Kontrollerade våtrummet i lägenhet 302, allt ser bra ut förutom att fogarna vid golvbrunnen behöver ses över...'"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              Du kan också lämna detta tomt och fylla i kontrollpunkterna manuellt.
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
            {step === "input" ? "Skapa egenkontroll" : "Nästa"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
