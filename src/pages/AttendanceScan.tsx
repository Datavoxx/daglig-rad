import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, LogOut, Loader2, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

export default function AttendanceScan() {
  const { projectId, token } = useParams<{ projectId: string; token: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [activeCheckIn, setActiveCheckIn] = useState<{ id: string; check_in: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validate token and fetch project
  useEffect(() => {
    const validateAndFetch = async () => {
      if (!projectId || !token) {
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }

      try {
        // Validate token
        const { data: tokenData, error: tokenError } = await supabase
          .from("attendance_qr_tokens")
          .select("project_id")
          .eq("project_id", projectId)
          .eq("token", token)
          .maybeSingle();

        if (tokenError || !tokenData) {
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        setIsValidToken(true);

        // Fetch project details
        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name, address, city")
          .eq("id", projectId)
          .single();

        if (projectData) {
          setProject(projectData);
        }

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser({ id: user.id, email: user.email || "" });
          
          // Check for active check-in
          const { data: activeData } = await supabase
            .from("attendance_records")
            .select("id, check_in")
            .eq("user_id", user.id)
            .eq("project_id", projectId)
            .is("check_out", null)
            .maybeSingle();

          if (activeData) {
            setActiveCheckIn(activeData);
          }
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAndFetch();
  }, [projectId, token]);

  const handleCheckIn = async (asGuest: boolean = false) => {
    if (!project) return;
    
    if (asGuest && !guestName.trim()) {
      toast.error("Ange ditt namn för att checka in");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get project owner for employer_id
      const { data: projectData } = await supabase
        .from("projects")
        .select("user_id")
        .eq("id", project.id)
        .single();

      if (!projectData) {
        toast.error("Kunde inte hitta projektägare");
        return;
      }

      const insertData: {
        user_id: string;
        employer_id: string;
        project_id: string;
        guest_name?: string;
      } = {
        user_id: currentUser?.id || projectData.user_id,
        employer_id: projectData.user_id,
        project_id: project.id,
      };

      if (asGuest) {
        insertData.guest_name = guestName.trim();
      }

      const { error } = await supabase
        .from("attendance_records")
        .insert(insertData);

      if (error) throw error;

      setSuccessMessage(`Incheckad på ${project.name}!`);
      toast.success("Incheckad!");
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error("Kunde inte checka in: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckIn) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({ check_out: new Date().toISOString() })
        .eq("id", activeCheckIn.id);

      if (error) throw error;

      setSuccessMessage(`Utcheckad från ${project?.name}!`);
      setActiveCheckIn(null);
      toast.success("Utcheckad!");
    } catch (error: any) {
      console.error("Check-out error:", error);
      toast.error("Kunde inte checka ut: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Ogiltig QR-kod</h1>
            <p className="text-muted-foreground">
              Denna QR-kod är inte längre giltig eller har aldrig existerat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">{successMessage}</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleString("sv-SE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-lg">PERSONALLIGGARE</CardTitle>
          {project && (
            <div className="mt-2">
              <p className="font-semibold text-lg">{project.name}</p>
              {(project.address || project.city) && (
                <p className="text-sm text-muted-foreground">
                  {[project.address, project.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* If user is logged in and has active check-in */}
          {currentUser && activeCheckIn ? (
            <>
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
                <p className="text-sm text-muted-foreground">Du är incheckad sedan</p>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  {new Date(activeCheckIn.check_in).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Button
                size="lg"
                variant="destructive"
                className="w-full h-16 text-lg"
                onClick={handleCheckOut}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-6 w-6 mr-2" />
                )}
                CHECKA UT
              </Button>
            </>
          ) : currentUser ? (
            /* Logged in, not checked in */
            <Button
              size="lg"
              className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
              onClick={() => handleCheckIn(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
              ) : (
                <LogIn className="h-6 w-6 mr-2" />
              )}
              CHECKA IN
            </Button>
          ) : (
            /* Not logged in - guest mode */
            <>
              <div className="text-center text-sm text-muted-foreground">
                Ange ditt namn för att checka in
              </div>
              <Input
                placeholder="Ditt namn (t.ex. Erik Svensson)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="h-14 text-lg text-center"
              />
              <Button
                size="lg"
                className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                onClick={() => handleCheckIn(true)}
                disabled={isSubmitting || !guestName.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-6 w-6 mr-2" />
                )}
                CHECKA IN
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
