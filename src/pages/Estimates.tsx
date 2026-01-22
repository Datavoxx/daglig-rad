import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, FolderOpen, PenLine } from "lucide-react";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";
import { EstimateBuilder } from "@/components/estimates/EstimateBuilder";

export default function Estimates() {
  const [mode, setMode] = useState<"project" | "manual">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  // Manual mode state
  const [manualProjectName, setManualProjectName] = useState("");
  const [manualClientName, setManualClientName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualStarted, setManualStarted] = useState(false);

  // Fetch projects with client info
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name, address")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (projectsLoading) {
    return (
      <div className="page-transition p-6 max-w-6xl mx-auto">
        <EstimateSkeleton />
      </div>
    );
  }

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  // Reset manual form when switching modes
  const handleModeChange = (newMode: "project" | "manual") => {
    setMode(newMode);
    if (newMode === "project") {
      setManualProjectName("");
      setManualClientName("");
      setManualAddress("");
      setManualStarted(false);
    } else {
      setSelectedProjectId("");
    }
  };

  const handleStartManual = () => {
    if (manualProjectName.trim()) {
      setManualStarted(true);
    }
  };

  const handleManualDelete = () => {
    setManualStarted(false);
    setManualProjectName("");
    setManualClientName("");
    setManualAddress("");
  };

  return (
    <div className="page-transition p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offert</h1>
        <p className="text-muted-foreground">Skapa och hantera projektofferter</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 bg-muted rounded-lg p-1 w-fit">
        <Button
          variant={mode === "project" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleModeChange("project")}
          className="gap-1.5"
        >
          <FolderOpen className="h-4 w-4" />
          Välj projekt
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleModeChange("manual")}
          className="gap-1.5"
        >
          <PenLine className="h-4 w-4" />
          Skapa manuellt
        </Button>
      </div>

      {/* Project mode: Project selector */}
      {mode === "project" && (
        <div className="space-y-1.5">
          <Label>Välj projekt</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Välj ett projekt" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Manual mode: Form */}
      {mode === "manual" && !manualStarted && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Offertnamn / Referens *</Label>
                <Input
                  placeholder="T.ex. Badrumsrenovering Andersson"
                  value={manualProjectName}
                  onChange={(e) => setManualProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kundnamn</Label>
                <Input
                  placeholder="Namn på kund"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Adress</Label>
                <Input
                  placeholder="Gatuadress, postnummer, ort"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  onClick={handleStartManual}
                  disabled={!manualProjectName.trim()}
                >
                  Skapa offert
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state - project mode, no project selected */}
      {mode === "project" && !selectedProjectId && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Välj ett projekt</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Välj ett projekt ovan för att se eller skapa en offert.
            </p>
          </CardContent>
        </Card>
      )}

      {/* EstimateBuilder when project is selected */}
      {mode === "project" && selectedProjectId && selectedProject && (
        <EstimateBuilder
          project={selectedProject}
          onDelete={() => setSelectedProjectId("")}
        />
      )}

      {/* EstimateBuilder for manual mode */}
      {mode === "manual" && manualStarted && (
        <EstimateBuilder
          manualData={{
            projectName: manualProjectName,
            clientName: manualClientName,
            address: manualAddress,
          }}
          onDelete={handleManualDelete}
        />
      )}
    </div>
  );
}
