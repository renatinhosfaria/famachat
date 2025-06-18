import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ConversionChartProps = {
  data: {
    appointmentsToClientes: number;
    visitsToAppointments: number;
    salesToVisits: number;
  };
};

export default function ConversionChart({ data }: ConversionChartProps) {
  const chartData = [
    {
      name: "Clientes → Agendamentos",
      value: data.appointmentsToClientes,
      fill: "#38bdf8",
    },
    {
      name: "Agendamentos → Visitas",
      value: data.visitsToAppointments,
      fill: "#4ade80",
    },
    {
      name: "Visitas → Vendas",
      value: data.salesToVisits,
      fill: "#f43f5e",
    },
  ];

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Taxas de Conversão</CardTitle>
        <CardDescription>
          Percentual de conversão entre cada etapa do funil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={150}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Taxa de Conversão"]}
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}