import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ClipboardCheck, Eye, Calendar, Building2, Loader2, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function Inspections() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: inspections, isLoading: inspectionsLoading, isFetching } = useQuery({
    queryKey: ["inspections", selectedProject, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("inspections")
        .select("id, template_name, template_category, inspection_date, status, project_id, projects(name)")
        .order("inspection_date", { ascending: false });

      if (selectedProject !== "all") {
        query = query.eq("project_id", selectedProject);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inspections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Egenkontroll raderad");
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Kunde inte radera egenkontroll");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Utkast</Badge>;
      case "completed":
        return <Badge variant="default">Slutförd</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Godkänd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Only show skeleton on initial load, not when filtering
  const isInitialLoading = inspectionsLoading && !inspections;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Egenkontroller</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Hantera och skapa egenkontroller för dina byggprojekt
          </p>
        </div>
        <Button onClick={() => navigate("/inspections/new")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ny egenkontroll
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Egenkontroller
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Alla projekt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla projekt</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Alla status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla status</SelectItem>
                  <SelectItem value="draft">Utkast</SelectItem>
                  <SelectItem value="completed">Slutförd</SelectItem>
                  <SelectItem value="approved">Godkänd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isFetching && !isInitialLoading && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {isInitialLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : inspections && inspections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mall</TableHead>
                  <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                  <TableHead className="hidden md:table-cell">Projekt</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow
                    key={inspection.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/inspections/${inspection.id}`)}
                  >
                    <TableCell className="font-medium">
                      {inspection.template_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {inspection.template_category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {(inspection.projects as any)?.name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(inspection.inspection_date), "d MMM yyyy", {
                          locale: sv,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/inspections/${inspection.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(inspection.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Inga egenkontroller ännu</h3>
              <p className="text-muted-foreground mb-4">
                Skapa din första egenkontroll för att komma igång
              </p>
              <Button onClick={() => navigate("/inspections/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Ny egenkontroll
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera egenkontroll?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Egenkontrollen och alla tillhörande filer kommer att tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Radera"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
