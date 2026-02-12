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
import { BarChart3, Users, Zap, TrendingUp, Clock, Hash } from "lucide-react";
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
  tokens_in: number | null;
  tokens_out: number | null;
  cost_estimate: number | null;
  response_time_ms: number | null;
  input_size: number | null;
  output_size: number | null;
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
  const userStats = new Map<string, { count: number; lastUsed: string; totalTokensIn: number; totalTokensOut: number; totalResponseTime: number; callsWithTime: number }>();
  logs?.forEach((log) => {
    const existing = userStats.get(log.user_id);
    if (existing) {
      existing.count++;
      existing.totalTokensIn += log.tokens_in || 0;
      existing.totalTokensOut += log.tokens_out || 0;
      if (log.response_time_ms) { existing.totalResponseTime += log.response_time_ms; existing.callsWithTime++; }
    } else {
      userStats.set(log.user_id, {
        count: 1,
        lastUsed: log.created_at,
        totalTokensIn: log.tokens_in || 0,
        totalTokensOut: log.tokens_out || 0,
        totalResponseTime: log.response_time_ms || 0,
        callsWithTime: log.response_time_ms ? 1 : 0,
      });
    }
  });

  const sortedUsers = Array.from(userStats.entries())
    .sort((a, b) => b[1].count - a[1].count);

  // Aggregate by function
  const functionStats = new Map<string, { count: number; totalTokensIn: number; totalTokensOut: number; avgResponseTime: number; callsWithTime: number }>();
  logs?.forEach((log) => {
    const existing = functionStats.get(log.function_name);
    if (existing) {
      existing.count++;
      existing.totalTokensIn += log.tokens_in || 0;
      existing.totalTokensOut += log.tokens_out || 0;
      if (log.response_time_ms) { existing.avgResponseTime += log.response_time_ms; existing.callsWithTime++; }
    } else {
      functionStats.set(log.function_name, {
        count: 1,
        totalTokensIn: log.tokens_in || 0,
        totalTokensOut: log.tokens_out || 0,
        avgResponseTime: log.response_time_ms || 0,
        callsWithTime: log.response_time_ms ? 1 : 0,
      });
    }
  });

  const sortedFunctions = Array.from(functionStats.entries())
    .sort((a, b) => b[1].count - a[1].count);

  // Aggregate by model
  const modelStats = new Map<string, { count: number; totalTokensIn: number; totalTokensOut: number }>();
  logs?.forEach((log) => {
    const model = log.model || "unknown";
    const existing = modelStats.get(model);
    if (existing) {
      existing.count++;
      existing.totalTokensIn += log.tokens_in || 0;
      existing.totalTokensOut += log.tokens_out || 0;
    } else {
      modelStats.set(model, { count: 1, totalTokensIn: log.tokens_in || 0, totalTokensOut: log.tokens_out || 0 });
    }
  });

  const sortedModels = Array.from(modelStats.entries())
    .sort((a, b) => b[1].count - a[1].count);

  const totalCalls = logs?.length || 0;
  const totalTokensIn = logs?.reduce((sum, l) => sum + (l.tokens_in || 0), 0) || 0;
  const totalTokensOut = logs?.reduce((sum, l) => sum + (l.tokens_out || 0), 0) || 0;
  const avgResponseTime = (() => {
    const withTime = logs?.filter(l => l.response_time_ms) || [];
    if (withTime.length === 0) return 0;
    return Math.round(withTime.reduce((s, l) => s + (l.response_time_ms || 0), 0) / withTime.length);
  })();

  const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  const formatMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  const formatBytes = (b: number) => b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border p-3 text-center">
                <Zap className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                <p className="text-xl font-bold">{totalCalls}</p>
                <p className="text-xs text-muted-foreground">Anrop</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Hash className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                <p className="text-xl font-bold">{formatTokens(totalTokensIn + totalTokensOut)}</p>
                <p className="text-xs text-muted-foreground">Tokens totalt</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <p className="text-xl font-bold">{formatMs(avgResponseTime)}</p>
                <p className="text-xs text-muted-foreground">Snitt svarstid</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                <p className="text-xl font-bold">{userStats.size}</p>
                <p className="text-xs text-muted-foreground">Användare</p>
              </div>
            </div>

            <Tabs defaultValue="users">
              <TabsList className="w-full">
                <TabsTrigger value="users" className="flex-1">Per användare</TabsTrigger>
                <TabsTrigger value="functions" className="flex-1">Per funktion</TabsTrigger>
                <TabsTrigger value="models" className="flex-1">Per modell</TabsTrigger>
                <TabsTrigger value="recent" className="flex-1">Senaste</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-3">
                <div className="rounded-lg border divide-y overflow-x-auto">
                  <div className="grid grid-cols-5 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50 min-w-[500px]">
                    <span>Användare</span>
                    <span className="text-center">Anrop</span>
                    <span className="text-center">Tokens (in/ut)</span>
                    <span className="text-center">Snitt svarstid</span>
                    <span className="text-right">Senast</span>
                  </div>
                  {sortedUsers.map(([userId, stats]) => (
                    <div key={userId} className="grid grid-cols-5 gap-2 p-2 text-sm items-center min-w-[500px]">
                      <span className="truncate">{profileMap.get(userId) || userId.slice(0, 8)}</span>
                      <span className="text-center">
                        <Badge variant="secondary">{stats.count}</Badge>
                      </span>
                      <span className="text-center text-xs font-mono">
                        {formatTokens(stats.totalTokensIn)} / {formatTokens(stats.totalTokensOut)}
                      </span>
                      <span className="text-center text-xs">
                        {stats.callsWithTime > 0 ? formatMs(Math.round(stats.totalResponseTime / stats.callsWithTime)) : "–"}
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
                <div className="rounded-lg border divide-y overflow-x-auto">
                  <div className="grid grid-cols-4 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50 min-w-[450px]">
                    <span>Funktion</span>
                    <span className="text-center">Anrop</span>
                    <span className="text-center">Tokens (in/ut)</span>
                    <span className="text-right">Snitt svarstid</span>
                  </div>
                  {sortedFunctions.map(([fn, stats]) => (
                    <div key={fn} className="grid grid-cols-4 gap-2 p-2 text-sm items-center min-w-[450px]">
                      <span className="font-mono text-xs">{fn}</span>
                      <span className="text-center">
                        <Badge variant="secondary">{stats.count}</Badge>
                      </span>
                      <span className="text-center text-xs font-mono">
                        {formatTokens(stats.totalTokensIn)} / {formatTokens(stats.totalTokensOut)}
                      </span>
                      <span className="text-right text-xs">
                        {stats.callsWithTime > 0 ? formatMs(Math.round(stats.avgResponseTime / stats.callsWithTime)) : "–"}
                      </span>
                    </div>
                  ))}
                  {sortedFunctions.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">Ingen data ännu</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="models" className="mt-3">
                <div className="rounded-lg border divide-y overflow-x-auto">
                  <div className="grid grid-cols-3 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    <span>Modell</span>
                    <span className="text-center">Anrop</span>
                    <span className="text-right">Tokens (in/ut)</span>
                  </div>
                  {sortedModels.map(([model, stats]) => (
                    <div key={model} className="grid grid-cols-3 gap-2 p-2 text-sm items-center">
                      <span className="font-mono text-xs">{model}</span>
                      <span className="text-center">
                        <Badge variant="secondary">{stats.count}</Badge>
                      </span>
                      <span className="text-right text-xs font-mono">
                        {formatTokens(stats.totalTokensIn)} / {formatTokens(stats.totalTokensOut)}
                      </span>
                    </div>
                  ))}
                  {sortedModels.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">Ingen data ännu</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="mt-3">
                <div className="rounded-lg border divide-y overflow-x-auto">
                  <div className="grid grid-cols-6 gap-2 p-2 text-xs font-medium text-muted-foreground bg-muted/50 min-w-[600px]">
                    <span>Tid</span>
                    <span>Användare</span>
                    <span>Funktion</span>
                    <span className="text-center">Tokens</span>
                    <span className="text-center">Svarstid</span>
                    <span className="text-right">Storlek</span>
                  </div>
                  {logs?.slice(0, 50).map((log) => (
                    <div key={log.id} className="grid grid-cols-6 gap-2 p-2 text-xs items-center min-w-[600px]">
                      <span className="text-muted-foreground">
                        {format(new Date(log.created_at), "d MMM HH:mm", { locale: sv })}
                      </span>
                      <span className="truncate">{profileMap.get(log.user_id) || log.user_id.slice(0, 8)}</span>
                      <span className="font-mono truncate">{log.function_name}</span>
                      <span className="text-center font-mono">
                        {log.tokens_in || log.tokens_out
                          ? `${log.tokens_in || '?'}→${log.tokens_out || '?'}`
                          : "–"}
                      </span>
                      <span className="text-center">
                        {log.response_time_ms ? formatMs(log.response_time_ms) : "–"}
                      </span>
                      <span className="text-right font-mono">
                        {log.input_size || log.output_size
                          ? `${log.input_size ? formatBytes(log.input_size) : '?'}→${log.output_size ? formatBytes(log.output_size) : '?'}`
                          : "–"}
                      </span>
                    </div>
                  ))}
                  {(!logs || logs.length === 0) && (
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
