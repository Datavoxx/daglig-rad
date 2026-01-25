import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface WeeklyActivityChartProps {
  data: { day: string; value: number }[];
  total: number;
}

const WeeklyActivityChart = ({ data, total }: WeeklyActivityChartProps) => {
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/5 animate-fade-in" style={{ animationDelay: "320ms" }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2 bg-violet-500/10 ring-1 ring-violet-500/20 text-violet-600 dark:text-violet-400">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Dagrapporter denna vecka</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{total}</span>
            <span className="text-sm text-muted-foreground">st</span>
          </div>
        </div>

        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                dy={8}
              />
              <Bar
                dataKey="value"
                fill="hsl(263, 70%, 50%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyActivityChart;
