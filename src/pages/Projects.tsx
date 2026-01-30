import { useState, useEffect } from "react";
import { Plus, FolderKanban, MapPin, Building2, MoreHorizontal, Pencil, Trash2, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectPipeline from "@/components/projects/ProjectPipeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  created_at: string;
  estimate_id: string | null;
  status: string | null;
}

interface Estimate {
  id: string;
  offer_number: string | null;
  manual_project_name: string | null;
  manual_client_name: string | null;
  manual_address: string | null;
  manual_postal_code: string | null;
  manual_city: string | null;
  manual_latitude: number | null;
  manual_longitude: number | null;
  status: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchData();
  }, []);

  // Handle createFrom query param for auto-opening dialog
  useEffect(() => {
    const createFromId = searchParams.get("createFrom");
    if (createFromId && !loading && estimates.length > 0) {
      const estimateExists = estimates.find(e => e.id === createFromId);
      if (estimateExists) {
        setSelectedEstimateId(createFromId);
        setDialogOpen(true);
        // Clear the query param
        searchParams.delete("createFrom");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, loading, estimates]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, client_name, address, created_at, estimate_id, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (projectsError) {
      toast({
        title: "Kunde inte hämta projekt",
        description: projectsError.message,
        variant: "destructive",
      });
    } else {
      setProjects(projectsData || []);
    }

    // Fetch estimates that are not yet linked to a project
    const { data: estimatesData, error: estimatesError } = await supabase
      .from("project_estimates")
      .select("id, offer_number, manual_project_name, manual_client_name, manual_address, manual_postal_code, manual_city, manual_latitude, manual_longitude, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!estimatesError && estimatesData) {
      // Filter out estimates that are already linked to a project
      const linkedEstimateIds = (projectsData || []).map(p => p.estimate_id).filter(Boolean);
      const availableEstimates = estimatesData.filter(e => !linkedEstimateIds.includes(e.id));
      setEstimates(availableEstimates);
    }

    setLoading(false);
  };

  const getEstimateDisplayName = (estimate: Estimate) => {
    if (estimate.manual_project_name) return estimate.manual_project_name;
    if (estimate.offer_number) return estimate.offer_number;
    return "Namnlös offert";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEstimateId && !editingProject) {
      toast({ title: "Välj en offert att koppla till projektet", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Du måste vara inloggad",
        description: "Logga in för att skapa projekt",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    if (editingProject) {
      // When editing, just update the estimate link if changed
      const { error } = await supabase
        .from("projects")
        .update({
          estimate_id: selectedEstimateId || editingProject.estimate_id,
        })
        .eq("id", editingProject.id);

      if (error) {
        toast({ title: "Kunde inte uppdatera projekt", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Projekt uppdaterat" });
        fetchData();
        closeDialog();
      }
    } else {
      // Creating new project from estimate
      const selectedEstimate = estimates.find(e => e.id === selectedEstimateId);
      if (!selectedEstimate) {
        toast({ title: "Offerten hittades inte", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("projects").insert({
        name: selectedEstimate.manual_project_name || selectedEstimate.offer_number || "Nytt projekt",
        client_name: selectedEstimate.manual_client_name || null,
        address: selectedEstimate.manual_address || null,
        postal_code: selectedEstimate.manual_postal_code || null,
        city: selectedEstimate.manual_city || null,
        latitude: selectedEstimate.manual_latitude || null,
        longitude: selectedEstimate.manual_longitude || null,
        estimate_id: selectedEstimateId,
        user_id: user.id,
      });

      if (error) {
        toast({ title: "Kunde inte skapa projekt", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Projekt skapat från offert" });
        fetchData();
        closeDialog();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (project: Project) => {
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      toast({ title: "Kunde inte ta bort projekt", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projekt borttaget" });
      fetchData();
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setSelectedEstimateId(project.estimate_id || "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setSelectedEstimateId("");
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Projekt</h1>
          <p className="page-subtitle">Hantera dina byggprojekt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Input
              placeholder="Sök projekt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-64"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nytt projekt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Redigera projekt" : "Skapa nytt projekt"}</DialogTitle>
                  <DialogDescription>
                    {editingProject 
                      ? "Uppdatera projektets offert-koppling" 
                      : "Välj en offert att skapa projekt från. Projektinformationen hämtas automatiskt."
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimate">Välj offert *</Label>
                    <Select value={selectedEstimateId} onValueChange={setSelectedEstimateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj en offert..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {estimates.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Inga tillgängliga offerter</p>
                            <p className="text-xs mt-1">Skapa en offert först</p>
                          </div>
                        ) : (
                          estimates.map((estimate) => (
                            <SelectItem key={estimate.id} value={estimate.id}>
                              <div className="flex items-center gap-2">
                                <span>{getEstimateDisplayName(estimate)}</span>
                                {estimate.offer_number && estimate.manual_project_name && (
                                  <span className="text-xs text-muted-foreground">
                                    ({estimate.offer_number})
                                  </span>
                                )}
                                <Badge 
                                  variant={estimate.status === "draft" ? "secondary" : "default"}
                                  className={`ml-auto text-xs ${estimate.status === "completed" ? "bg-green-600" : ""}`}
                                >
                                  {estimate.status === "draft" ? "Draft" : "Klar"}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {!editingProject && estimates.length === 0 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => navigate("/estimates")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Gå till Offerter
                      </Button>
                    )}
                  </div>

                  {/* Preview selected estimate info */}
                  {selectedEstimateId && (
                    <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                      <p className="text-sm font-medium">Förhandsvisning:</p>
                      {(() => {
                        const est = estimates.find(e => e.id === selectedEstimateId);
                        if (!est) return null;
                        return (
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p><span className="font-medium">Namn:</span> {est.manual_project_name || est.offer_number || "Ej angivet"}</p>
                            <p><span className="font-medium">Kund:</span> {est.manual_client_name || "Ej angivet"}</p>
                            <p><span className="font-medium">Adress:</span> {est.manual_address || "Ej angivet"}</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Avbryt
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving || (!selectedEstimateId && !editingProject)}
                  >
                    {saving ? "Sparar..." : editingProject ? "Spara ändringar" : "Skapa projekt"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden">
        <Input
          placeholder="Sök projekt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Project Pipeline */}
      {!loading && projects.length > 0 && (
        <ProjectPipeline
          projects={projects}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-medium">
            {projects.length === 0 ? "Inga projekt ännu" : "Inga projekt hittades"}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            {projects.length === 0 
              ? "Skapa en offert först, sedan kan du skapa ett projekt från den"
              : "Prova att ändra din sökning"
            }
          </p>
          {projects.length === 0 && (
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => navigate("/estimates")}>
                <FileText className="mr-2 h-4 w-4" />
                Skapa offert
              </Button>
              {estimates.length > 0 && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Skapa projekt
                </Button>
              )}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <Card
              key={project.id}
              className="group relative cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 stagger-item overflow-hidden"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Clickable overlay for entire card */}
              <div 
                className="absolute inset-0 z-0 cursor-pointer" 
                onClick={() => navigate(`/projects/${project.id}`)}
                aria-label={`Öppna ${project.name}`}
              />
              <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0 pb-3 pointer-events-none">
                <div className="space-y-1 pr-8">
                  <CardTitle className="text-base font-medium leading-snug">{project.name}</CardTitle>
                  {project.client_name && (
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <Building2 className="h-3 w-3" />
                      {project.client_name}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 pointer-events-auto z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg">
                    <DropdownMenuItem onClick={() => openEdit(project)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Redigera
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="relative z-10 pt-0 pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {project.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">{project.address}</span>
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
