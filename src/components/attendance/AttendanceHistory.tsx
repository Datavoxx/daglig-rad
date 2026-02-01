import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, FileSpreadsheet } from "lucide-react";
import { format, subDays } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";

interface AttendanceWithProfile {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  full_name: string | null;
  email: string | null;
  project_name: string | null;
}

export function AttendanceHistory() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance-history"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const { data: attendanceRecords, error } = await supabase
        .from("attendance_records")
        .select("id, user_id, check_in, check_out, project_id")
        .eq("employer_id", userData.user.id)
        .gte("check_in", sevenDaysAgo)
        .order("check_in", { ascending: false });

      if (error) throw error;
      if (!attendanceRecords || attendanceRecords.length === 0) return [];

      // Fetch profiles
      const userIds = [...new Set(attendanceRecords.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Fetch projects
      const projectIds = [...new Set(attendanceRecords.map(r => r.project_id).filter(Boolean))];
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

      return attendanceRecords.map(record => ({
        id: record.id,
        user_id: record.user_id,
        check_in: record.check_in,
        check_out: record.check_out,
        full_name: profileMap.get(record.user_id)?.full_name || null,
        email: profileMap.get(record.user_id)?.email || null,
        project_name: projectMap.get(record.project_id)?.name || null,
      })) as AttendanceWithProfile[];
    },
  });

  const getDisplayName = (record: AttendanceWithProfile) => {
    if (record.full_name) return record.full_name;
    if (record.email) return record.email.split("@")[0];
    return "Okänd";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd", { locale: sv });
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error("Ingen data att exportera");
      return;
    }

    // Create CSV content
    const headers = ["Datum", "Namn", "Projekt", "Incheckning", "Utcheckning"];
    const rows = records.map((record) => [
      formatDate(record.check_in),
      getDisplayName(record),
      record.project_name || "Okänt",
      formatTime(record.check_in),
      record.check_out ? formatTime(record.check_out) : "Aktiv",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    // Add BOM for Excel compatibility with Swedish characters
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `personalliggare_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Personalliggare exporterad");
  };

  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    const date = formatDate(record.check_in);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceWithProfile[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historik (senaste 7 dagar)
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportera
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laddar...</div>
        ) : records.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Ingen historik ännu
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRecords).map(([date, dateRecords]) => (
              <div key={date}>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {format(new Date(date), "EEEE d MMMM", { locale: sv })}
                </div>
                <div className="space-y-2">
                  {dateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-medium truncate">
                          {getDisplayName(record)}
                        </span>
                        <span className="text-muted-foreground truncate">
                          {record.project_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                        <span className="font-mono">
                          {formatTime(record.check_in)}
                        </span>
                        <span>–</span>
                        <span className="font-mono">
                          {record.check_out ? (
                            formatTime(record.check_out)
                          ) : (
                            <span className="text-green-600 dark:text-green-400">
                              Aktiv
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
