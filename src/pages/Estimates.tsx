import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calculator, FolderOpen, PenLine, FileText, Calendar, User, ArrowLeft, Trash2 } from "lucide-react";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";
import { EstimateBuilder } from "@/components/estimates/EstimateBuilder";
import { AddressAutocomplete, AddressData } from "@/components/shared/AddressAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SavedEstimate {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  manual_project_name: string | null;
  project_id: string | null;
  offer_number: string | null;
  manual_client_name: string | null;
  projects: { name: string; client_name: string | null } | null;
}

export default function Estimates() {
  const [mode, setMode] = useState<"project" | "manual">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  // Manual mode state
  const [manualProjectName, setManualProjectName] = useState("");
  const [manualClientName, setManualClientName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualAddressData, setManualAddressData] = useState<AddressData | null>(null);
  const [manualStarted, setManualStarted] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch saved estimates
  const { data: savedEstimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ["saved-estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_estimates")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          manual_project_name,
          project_id,
          offer_number,
          manual_client_name,
          projects (name, client_name)
        `)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as SavedEstimate[];
    },
  });

  const drafts = savedEstimates?.filter((e) => e.status === "draft") || [];
  const completed = savedEstimates?.filter((e) => e.status === "completed") || [];

  const filteredEstimates = activeTab === "all" 
    ? savedEstimates 
    : activeTab === "draft" 
    ? drafts 
    : completed;

  if (projectsLoading || estimatesLoading) {
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
      setSelectedEstimateId(null);
    } else {
      setSelectedProjectId("");
      setSelectedEstimateId(null);
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
    setManualAddressData(null);
  };

  const handleBack = () => {
    setSelectedProjectId("");
    setManualStarted(false);
    setSelectedEstimateId(null);
    setManualProjectName("");
    setManualClientName("");
    setManualAddress("");
    setManualAddressData(null);
  };

  const handleSelectEstimate = (estimate: SavedEstimate) => {
    // If it's a project-based estimate, select the project
    if (estimate.project_id) {
      setMode("project");
      setSelectedProjectId(estimate.project_id);
      setSelectedEstimateId(estimate.id);
    } else {
      // It's a manual estimate - open it directly
      setMode("manual");
      setManualProjectName(estimate.manual_project_name || "");
      setManualClientName(estimate.manual_client_name || "");
      setManualAddress("");
      setManualStarted(true);
      setSelectedEstimateId(estimate.id);
    }
  };

  const getEstimateName = (estimate: SavedEstimate) => {
    if (estimate.projects?.name) return estimate.projects.name;
    if (estimate.manual_project_name) return estimate.manual_project_name;
    return "Namnlös offert";
  };

  const getClientName = (estimate: SavedEstimate) => {
    if (estimate.projects?.client_name) return estimate.projects.client_name;
    if (estimate.manual_client_name) return estimate.manual_client_name;
    return null;
  };

  const handleDeleteEstimate = async (estimateId: string) => {
    try {
      // Delete estimate (items and addons should cascade)
      const { error } = await supabase
        .from("project_estimates")
        .delete()
        .eq("id", estimateId);

      if (error) throw error;

      toast({ title: "Offert borttagen" });
      queryClient.invalidateQueries({ queryKey: ["saved-estimates"] });
    } catch (error) {
      console.error("Delete estimate error:", error);
      toast({
        title: "Kunde inte ta bort offert",
        description: "Något gick fel, försök igen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-transition p-6 max-w-6xl mx-auto space-y-6">
      {/* Back button - show when editing */}
      {(selectedProjectId || manualStarted) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground -ml-2 -mt-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Tillbaka
        </Button>
      )}

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
          Nytt från projekt
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleModeChange("manual")}
          className="gap-1.5"
        >
          <PenLine className="h-4 w-4" />
          Ny manuell
        </Button>
      </div>

      {/* Saved estimates list */}
      {!selectedProjectId && !manualStarted && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  Alla ({savedEstimates?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="draft">
                  Draft ({drafts.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Klara ({completed.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredEstimates && filteredEstimates.length > 0 ? (
                  <div className="space-y-2">
                    {filteredEstimates.map((estimate) => (
                      <div
                        key={estimate.id}
                        onClick={() => handleSelectEstimate(estimate)}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{getEstimateName(estimate)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {getClientName(estimate) && (
                                <>
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{getClientName(estimate)}</span>
                                </>
                              )}
                              <Calendar className="h-3 w-3 ml-1" />
                              <span>{format(new Date(estimate.updated_at), "d MMM yyyy", { locale: sv })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {estimate.offer_number && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {estimate.offer_number}
                            </span>
                          )}
                          <Badge 
                            variant={estimate.status === "draft" ? "secondary" : "default"}
                            className={estimate.status === "completed" ? "bg-green-600 hover:bg-green-600" : ""}
                          >
                            {estimate.status === "draft" ? "Draft" : "Klar"}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort offert?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Offerten "{getEstimateName(estimate)}" kommer att tas bort permanent. 
                                  Detta kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEstimate(estimate.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Inga offerter ännu</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Project mode: Project selector */}
      {mode === "project" && !selectedProjectId && (
        <div className="space-y-1.5">
          <Label>Välj projekt för ny offert</Label>
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
                <AddressAutocomplete
                  placeholder="Sök adress..."
                  value={manualAddress}
                  onChange={setManualAddress}
                  onStructuredChange={setManualAddressData}
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
            postalCode: manualAddressData?.postalCode,
            city: manualAddressData?.city,
            latitude: manualAddressData?.latitude,
            longitude: manualAddressData?.longitude,
          }}
          onDelete={handleManualDelete}
        />
      )}
    </div>
  );
}
