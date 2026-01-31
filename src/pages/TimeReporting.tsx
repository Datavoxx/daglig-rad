import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Clock, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function TimeReporting() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get employer_id from user metadata
  const employerId = user?.user_metadata?.employer_id;

  // Fetch projects - either own projects or employer's projects
  const { data: projects = [] } = useQuery({
    queryKey: ["time-reporting-projects", employerId],
    queryFn: async () => {
      // If user has an employer_id, they're an employee - fetch employer's projects
      if (employerId) {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, client_name, status")
          .eq("user_id", employerId)
          .order("name");
        if (error) throw error;
        return data || [];
      }
      // Otherwise fetch own projects
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name, status")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch time entries
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ["time-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          projects:project_id(name, client_name)
        `)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Create time entry mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Ej inloggad");
      if (!selectedProject) throw new Error("Välj ett projekt");
      if (!hours || parseFloat(hours) <= 0) throw new Error("Ange antal timmar");

      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        employer_id: employerId || user.id,
        project_id: selectedProject,
        date,
        hours: parseFloat(hours),
        description: description || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Tid registrerad!");
      setIsDialogOpen(false);
      setSelectedProject("");
      setHours("");
      setDescription("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete time entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Tidpost borttagen");
    },
    onError: () => {
      toast.error("Kunde inte ta bort tidpost");
    },
  });

  // Calculate total hours this week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const weeklyHours = timeEntries
    .filter((entry: any) => new Date(entry.date) >= startOfWeek)
    .reduce((sum: number, entry: any) => sum + Number(entry.hours), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tidsrapportering</h1>
          <p className="text-muted-foreground">Rapportera arbetade timmar per projekt</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrera tid
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrera arbetad tid</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Projekt</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj projekt" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} {project.client_name && `- ${project.client_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timmar</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="8"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beskrivning (valfritt)</Label>
                <Textarea
                  placeholder="Beskriv vad du arbetade med..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Sparar..." : "Spara"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denna vecka</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyHours.toFixed(1)} timmar</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Antal poster</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeEntries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Time entries list */}
      <Card>
        <CardHeader>
          <CardTitle>Senaste registreringar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Laddar...</p>
          ) : timeEntries.length === 0 ? (
            <p className="text-muted-foreground">Inga tidsregistreringar ännu</p>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {entry.projects?.name || "Okänt projekt"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), "d MMMM yyyy", { locale: sv })}
                      {entry.description && ` • ${entry.description}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold">{Number(entry.hours).toFixed(1)}h</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
