import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Zap, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { sv } from "date-fns/locale";

interface AIUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UsageLog {
  id: string;
  user_id: string;
  function_name: string;
  model: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function AIUsageDialog({ open, onOpenChange }: AIUsageDialogProps) {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["ai-usage-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UsageLog[];
    },
    enabled: open,
  });

  const { data: profiles } = useQuery({
    queryKey: ["ai-usage-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: open,
  });

  const profileMap = new Map(
    profiles?.map((p) => [p.id, p.full_name || p.email || p.id]) || []
  );

  // Aggregate by user
  const userStats = new Map<string, { count: number; lastUsed: string }>();
  logs?.forEach((log) => {
    const existing = userStats.get(log.user_id);
    if (existing) {
      existing.count++;
    } else {
      userStats.set(log.user_id, { count: 1, lastUsed: log.created_at });
    }
  });

  const sortedUsers = Array.from(userStats.entries())
    .sort((a, b) => b[1].count - a[1].count);

  // Aggregate by function
  const functionStats = new Map<string, number>();
  logs?.forEach((log) => {
    functionStats.set(log.function_name, (functionStats.get(log.function_name) || 0) + 1);
  });

  const sortedFunctions = Array.from(functionStats.entries())
    .sort((a, b) => b[1] - a[1]);

  // Aggregate by model
  const modelStats = new Map<string, number>();
  logs?.forEach((log) => {
    const model = log.model || "unknown";
    modelStats.set(model, (modelStats.get(model) || 0) + 1);
  });

  const sortedModels = Array.from(modelStats.entries())
    .sort((a, b) => b[1] - a[1]);

  const totalCalls = logs?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            AI-användning (senaste 30 dagarna)
          </DialogTitle>
        </DialogHeader>

        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border p-3 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold">{totalCalls}</p>
                <p className="text-xs text-muted-foreground">Totalt anrop</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{userStats.size}</p>
                <p className="text-xs text-muted-foreground">Användare</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-2xl font-bold">{functionStats.size}</p>
                <p className="text-xs text-muted-foreground">Funktioner</p>
              </div>
            </div>

            <Tabs defaultValue="users">
              <TabsList className="w-full">
                <TabsTrigger value="users" className="flex-1">Per användare</TabsTrigger>
                <TabsTrigger value="functions" className="flex-1">Per funktion</TabsTrigger>
                <TabsTrigger value="models" className="flex-1">Per modell</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-3">
                <div className="rounded-lg border divide-y">
                  <div className="grid grid-cols-3 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    <span>Användare</span>
                    <span className="text-center">Anrop</span>
                    <span className="text-right">Senast</span>
                  </div>
                  {sortedUsers.map(([userId, stats]) => (
                    <div key={userId} className="grid grid-cols-3 gap-2 p-2 text-sm items-center">
                      <span className="truncate">{profileMap.get(userId) || userId.slice(0, 8)}</span>
                      <span className="text-center">
                        <Badge variant="secondary">{stats.count}</Badge>
                      </span>
                      <span className="text-right text-xs text-muted-foreground">
                        {format(new Date(stats.lastUsed), "d MMM HH:mm", { locale: sv })}
                      </span>
                    </div>
                  ))}
                  {sortedUsers.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">Ingen data ännu</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="functions" className="mt-3">
                <div className="rounded-lg border divide-y">
                  <div className="grid grid-cols-2 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    <span>Funktion</span>
                    <span className="text-right">Anrop</span>
                  </div>
                  {sortedFunctions.map(([fn, count]) => (
                    <div key={fn} className="grid grid-cols-2 gap-2 p-2 text-sm items-center">
                      <span className="font-mono text-xs">{fn}</span>
                      <span className="text-right">
                        <Badge variant="secondary">{count}</Badge>
                      </span>
                    </div>
                  ))}
                  {sortedFunctions.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">Ingen data ännu</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="models" className="mt-3">
                <div className="rounded-lg border divide-y">
                  <div className="grid grid-cols-2 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    <span>Modell</span>
                    <span className="text-right">Anrop</span>
                  </div>
                  {sortedModels.map(([model, count]) => (
                    <div key={model} className="grid grid-cols-2 gap-2 p-2 text-sm items-center">
                      <span className="font-mono text-xs">{model}</span>
                      <span className="text-right">
                        <Badge variant="secondary">{count}</Badge>
                      </span>
                    </div>
                  ))}
                  {sortedModels.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">Ingen data ännu</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
