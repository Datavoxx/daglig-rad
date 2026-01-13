import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";
import { EstimateBuilder } from "@/components/estimates/EstimateBuilder";

export default function Estimates() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

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

  return (
    <div className="page-transition p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offert</h1>
        <p className="text-muted-foreground">Skapa och hantera projektofferter</p>
      </div>

      {/* Project selector */}
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

      {/* Empty state - no project selected */}
      {!selectedProjectId && (
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
      {selectedProjectId && selectedProject && (
        <EstimateBuilder
          project={selectedProject}
          onDelete={() => setSelectedProjectId("")}
        />
      )}
    </div>
  );
}
