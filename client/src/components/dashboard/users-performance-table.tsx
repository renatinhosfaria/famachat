import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpDown,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodType } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ColumnKey = "fullName" | "leads" | "appointments" | "visits" | "sales" | "conversion";

type UserMetric = {
  id: number;
  fullName: string;
  role: string;
  department: string;
  leads: number; // Mantido como leads para compatibilidade com API
  appointments: number;
  visits: number;
  sales: number;
  conversion: number;
};

interface UserPerformanceTableProps {
  period: PeriodType;
}

export default function UsersPerformanceTable({ period }: UserPerformanceTableProps) {
  const [sortColumn, setSortColumn] = useState<ColumnKey>("leads");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/users/performance", period],
  });

  const handleSort = (column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (column: ColumnKey) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  // Processar e ordenar os dados
  const processedData = data && Array.isArray(data)
    ? [...data]
        .sort((a, b) => {
          if (sortDirection === "asc") {
            return a[sortColumn] > b[sortColumn] ? 1 : -1;
          }
          return a[sortColumn] < b[sortColumn] ? 1 : -1;
        })
    : [];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Desempenho da Equipe</CardTitle>
        <CardDescription>
          Visão detalhada do desempenho de cada membro da equipe no período selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("fullName")}
                    className="font-medium"
                  >
                    Nome
                    {renderSortIcon("fullName")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("leads")}
                    className="font-medium"
                  >
                    Clientes
                    {renderSortIcon("leads")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("appointments")}
                    className="font-medium"
                  >
                    Agendamentos
                    {renderSortIcon("appointments")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("visits")}
                    className="font-medium"
                  >
                    Visitas
                    {renderSortIcon("visits")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("sales")}
                    className="font-medium"
                  >
                    Vendas
                    {renderSortIcon("sales")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("conversion")}
                    className="font-medium"
                  >
                    Taxa Conversão
                    {renderSortIcon("conversion")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[50px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[50px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[50px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[50px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[80px]" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : processedData && processedData.length > 0 ? (
                processedData.map((user: UserMetric) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.fullName}
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-2",
                          user.role === "Gestor"
                            ? "bg-blue-50 text-blue-700"
                            : user.role === "Corretor"
                            ? "bg-green-50 text-green-700"
                            : user.role === "Consultor de Atendimento"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-gray-50 text-gray-700"
                        )}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.leads}</TableCell>
                    <TableCell>{user.appointments}</TableCell>
                    <TableCell>{user.visits}</TableCell>
                    <TableCell>{user.sales}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          user.conversion > 50
                            ? "bg-green-50 text-green-700"
                            : user.conversion > 30
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        )}
                      >
                        {user.conversion}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhum dado encontrado para o período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}