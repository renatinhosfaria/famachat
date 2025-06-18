import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "neutral";
  percent: number;
  teamAverage: number;
  difference: number;
};

export default function MetricCard({
  title,
  value,
  unit,
  trend,
  percent,
  teamAverage,
  difference,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend === "up" && (
          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
        )}
        {trend === "down" && (
          <ArrowDownRight className="h-4 w-4 text-rose-500" />
        )}
        {trend === "neutral" && <Minus className="h-4 w-4 text-gray-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend === "up" && (
            <span className="text-emerald-500">+{percent}%</span>
          )}
          {trend === "down" && (
            <span className="text-rose-500">-{percent}%</span>
          )}
          {trend === "neutral" && (
            <span className="text-gray-500">0%</span>
          )}{" "}
          em relação à média ({teamAverage} {unit})
        </p>
      </CardContent>
    </Card>
  );
}