import { Cliente } from "@/hooks/use-dashboard-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";

type RecentClientesProps = {
  clientes: Cliente[];
};

export default function RecentClientes({ clientes }: RecentClientesProps) {
  // Se não houver clientes, não exiba nada
  if (!clientes.length) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Clientes Recentes</CardTitle>
        <CardDescription>
          Últimos clientes capturados no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.fullName}</TableCell>
                <TableCell>{cliente.phone}</TableCell>
                <TableCell>{cliente.date}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusColor(cliente.status).bg}
                  >
                    {cliente.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}