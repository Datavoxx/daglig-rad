import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogIn, LogOut, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ActiveWorkers } from "@/components/attendance/ActiveWorkers";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { QRCodeGenerator } from "@/components/attendance/QRCodeGenerator";
import { AttendanceEmployeeView } from "@/components/attendance/AttendanceEmployeeView";
import { useUserPermissions } from "@/hooks/useUserPermissions";

export default function Attendance() {
  const { hasAccess, loading: permissionsLoading } = useUserPermissions();
  
  // Check if user is admin (has settings access) - if not, show simplified view
  const isAdmin = hasAccess("settings");
  
  // If employee (not admin), show simplified view
  if (!permissionsLoading && !isAdmin) {
    return <AttendanceEmployeeView />;
  }
  
  // Admin view with full functionality
  return <AttendanceAdminView />;
}

function AttendanceAdminView() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects-for-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address, city")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Check if user is currently checked in (any project)
  const { data: activeCheckIn, isLoading: checkInLoading } = useQuery({
    queryKey: ["active-check-in", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*, projects(name)")
        .eq("user_id", currentUser.id)
        .is("check_out", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
  });

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!currentUser) throw new Error("Ej inloggad");
      
      const { error } = await supabase.from("attendance_records").insert({
        user_id: currentUser.id,
        employer_id: currentUser.id, // Self-employed or admin
        project_id: projectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-check-in"] });
      queryClient.invalidateQueries({ queryKey: ["active-workers"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
      toast.success("Incheckad!");
    },
    onError: (error) => {
      toast.error("Kunde inte checka in: " + error.message);
    },
  });

  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("attendance_records")
        .update({ check_out: new Date().toISOString() })
        .eq("id", recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-check-in"] });
      queryClient.invalidateQueries({ queryKey: ["active-workers"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
      toast.success("Utcheckad!");
    },
    onError: (error) => {
      toast.error("Kunde inte checka ut: " + error.message);
    },
  });

  const handleCheckIn = () => {
    if (!selectedProjectId) {
      toast.error("Välj ett projekt först");
      return;
    }
    checkInMutation.mutate(selectedProjectId);
  };

  const handleCheckOut = () => {
    if (activeCheckIn) {
      checkOutMutation.mutate(activeCheckIn.id);
    }
  };

  const isLoading = projectsLoading || checkInLoading;
  const isCheckedIn = !!activeCheckIn;
  const isMutating = checkInMutation.isPending || checkOutMutation.isPending;

  // Get the project for display when checked in
  const checkedInProject = activeCheckIn?.projects as { name: string } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personalliggare</h1>
          <p className="text-sm text-muted-foreground">
            Elektronisk närvaro enligt svensk lag
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check In/Out Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isCheckedIn ? "Du är incheckad" : "Checka in"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isCheckedIn ? (
              <>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <p className="text-sm text-muted-foreground">Arbetsplats</p>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    {checkedInProject?.name || "Okänt projekt"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Incheckad sedan{" "}
                    <span className="font-medium text-foreground">
                      {new Date(activeCheckIn.check_in).toLocaleTimeString("sv-SE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full h-14 text-lg"
                  onClick={handleCheckOut}
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <LogOut className="h-5 w-5 mr-2" />
                  )}
                  Checka ut
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Välj arbetsplats</label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Välj projekt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex flex-col items-start">
                            <span>{project.name}</span>
                            {project.address && (
                              <span className="text-xs text-muted-foreground">
                                {project.address}
                                {project.city && `, ${project.city}`}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleCheckIn}
                  disabled={!selectedProjectId || isMutating}
                >
                  {isMutating ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" />
                  )}
                  Checka in
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Workers */}
        <ActiveWorkers projectId={selectedProjectId || activeCheckIn?.project_id} />
      </div>

      {/* QR Code Generator */}
      <QRCodeGenerator projects={projects} />

      {/* History */}
      <AttendanceHistory />
    </div>
  );
}
