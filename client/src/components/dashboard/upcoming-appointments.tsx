import { Appointment } from "@/hooks/use-dashboard-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UpcomingAppointmentsProps = {
  appointments: Appointment[];
};

export default function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  // Se não houver agendamentos, não exiba nada
  if (!appointments.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Agendamentos</CardTitle>
        <CardDescription>
          Agendamentos previstos para os próximos dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-md"
            >
              <div className="flex-shrink-0 bg-primary/10 text-primary font-semibold py-2 px-3 rounded-md text-center min-w-[60px]">
                <div className="text-xs font-normal">{appointment.monthAbbr}</div>
                <div className="text-lg">{appointment.day}</div>
              </div>
              
              <div className="flex-grow">
                <h4 className="font-medium">{appointment.title}</h4>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-muted-foreground mt-1">
                  <div>{appointment.time}</div>
                  <div>{appointment.clientName}</div>
                  <div>{appointment.location}</div>
                </div>
                {appointment.address && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Endereço:</span> {appointment.address}
                  </div>
                )}
                {appointment.brokerName && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Corretor:</span> {appointment.brokerName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}