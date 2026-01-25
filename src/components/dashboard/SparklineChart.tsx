import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

const SparklineChart = ({ data, color = "hsl(var(--primary))", height = 40 }: SparklineChartProps) => {
  const chartData = data.map((value, index) => ({ value, index }));
  
  const gradientId = `sparkGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#${gradientId})`}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SparklineChart;
