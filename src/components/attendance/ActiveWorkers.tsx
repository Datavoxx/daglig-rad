import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface ActiveWorkersProps {
  projectId?: string;
}

interface AttendanceWithProfile {
  id: string;
  user_id: string;
  check_in: string;
  full_name: string | null;
  email: string | null;
}

export function ActiveWorkers({ projectId }: ActiveWorkersProps) {
  const { data: activeWorkers = [], isLoading } = useQuery({
    queryKey: ["active-workers", projectId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      let query = supabase
        .from("attendance_records")
        .select("id, user_id, check_in")
        .is("check_out", null)
        .eq("employer_id", userData.user.id)
        .order("check_in", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data: records, error } = await query;
      if (error) throw error;
      if (!records || records.length === 0) return [];

      // Fetch profiles for all user_ids
      const userIds = [...new Set(records.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return records.map(record => ({
        id: record.id,
        user_id: record.user_id,
        check_in: record.check_in,
        full_name: profileMap.get(record.user_id)?.full_name || null,
        email: profileMap.get(record.user_id)?.email || null,
      })) as AttendanceWithProfile[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "?";
  };

  const getDisplayName = (record: AttendanceWithProfile) => {
    if (record.full_name) return record.full_name;
    if (record.email) return record.email.split("@")[0];
    return "Okänd";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          På plats just nu
          {activeWorkers.length > 0 && (
            <span className="ml-auto rounded-full bg-green-500/10 px-2.5 py-0.5 text-sm font-medium text-green-600 dark:text-green-400">
              {activeWorkers.length} {activeWorkers.length === 1 ? "person" : "personer"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laddar...</div>
        ) : activeWorkers.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            {projectId
              ? "Ingen på plats på detta projekt"
              : "Ingen incheckad just nu"}
          </div>
        ) : (
          <div className="space-y-3">
            {activeWorkers.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(record.full_name, record.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getDisplayName(record)}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      sedan{" "}
                      {new Date(record.check_in).toLocaleTimeString("sv-SE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>
                      {formatDistanceToNow(new Date(record.check_in), {
                        locale: sv,
                        addSuffix: false,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
