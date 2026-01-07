import { useState, useEffect } from "react";
import { Plus, FolderKanban, MapPin, Building2, MoreHorizontal, Pencil, Trash2, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  created_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: "", client_name: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Kunde inte hämta projekt",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Projektnamn krävs", variant: "destructive" });
      return;
    }

    setSaving(true);

    if (editingProject) {
      const { error } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          client_name: formData.client_name || null,
          address: formData.address || null,
        })
        .eq("id", editingProject.id);

      if (error) {
        toast({ title: "Kunde inte uppdatera projekt", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Projekt uppdaterat" });
        fetchProjects();
        closeDialog();
      }
    } else {
      const { error } = await supabase.from("projects").insert({
        name: formData.name,
        client_name: formData.client_name || null,
        address: formData.address || null,
        user_id: "00000000-0000-0000-0000-000000000000",
      });

      if (error) {
        toast({ title: "Kunde inte skapa projekt", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Projekt skapat" });
        fetchProjects();
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
      fetchProjects();
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client_name: project.client_name || "",
      address: project.address || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setFormData({ name: "", client_name: "", address: "" });
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    {editingProject ? "Uppdatera projektinformationen" : "Fyll i uppgifter om projektet"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Projektnamn *</Label>
                    <Input
                      id="name"
                      placeholder="T.ex. Kvarteret Björken"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Beställare</Label>
                    <Input
                      id="client"
                      placeholder="T.ex. Stockholms Stad"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adress</Label>
                    <Input
                      id="address"
                      placeholder="T.ex. Storgatan 1, Stockholm"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={saving}>
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
              ? "Skapa ditt första projekt för att komma igång med dagrapporter"
              : "Prova att ändra din sökning"
            }
          </p>
          {projects.length === 0 && (
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Skapa projekt
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group relative cursor-pointer hover:shadow-elevated hover:-translate-y-0.5"
              onClick={() => navigate(`/reports/new?project=${project.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
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
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Redigera
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(project); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-0">
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
