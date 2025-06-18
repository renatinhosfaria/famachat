import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock appointments data
const mockAppointments = [
  {
    id: 1,
    title: "Visita - Apartamento Jardins",
    date: new Date(2023, 4, 15, 10, 30),
    endTime: new Date(2023, 4, 15, 11, 30),
    client: "Marcos Costa",
    location: "Condomínio Reserva Jardins",
    address: "Av. Brasil, 1500, Apto 302, Jardins, São Paulo/SP",
    type: "Visita",
    broker: "Humberto Santos",
  },
  {
    id: 2,
    title: "Reunião - Proposta de Venda",
    date: new Date(2023, 4, 16, 14, 0),
    endTime: new Date(2023, 4, 16, 15, 0),
    client: "Ricardo Almeida",
    location: "Escritório Fama Negócios Imobiliários",
    address: "Rua Coronel Melo Oliveira, 745, Perdizes, São Paulo/SP",
    type: "Reunião",
    broker: "Michel Silva",
  },
  {
    id: 3,
    title: "Visita - Casa Vila Verde",
    date: new Date(2023, 4, 17, 9, 0),
    endTime: new Date(2023, 4, 17, 10, 30),
    client: "Luciana Silva",
    location: "Condomínio Villagio Verde",
    address: "Rua das Palmeiras, 230, Casa 15, Vila Verde, São Paulo/SP",
    type: "Visita",
    broker: "Humberto Santos",
  },
  {
    id: 4,
    title: "Ligação - Acompanhamento",
    date: new Date(2023, 4, 18, 11, 0),
    endTime: new Date(2023, 4, 18, 11, 30),
    client: "João Pereira",
    location: "Telefone",
    type: "Ligação",
  },
  {
    id: 5,
    title: "Visita - Apartamento Centro",
    date: new Date(2023, 4, 19, 15, 0),
    endTime: new Date(2023, 4, 19, 16, 0),
    client: "Amanda Costa",
    location: "Edifício Central Park",
    address: "Rua XV de Novembro, 500, Apto 1202, Centro, São Paulo/SP",
    type: "Visita",
    broker: "Michel Silva",
  },
];

// Time slots for the weekly view
const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  
  // Calculate the current week's start and end
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // Generate the days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Filter appointments for the selected week
  const weekAppointments = mockAppointments.filter((appointment) =>
    isWithinInterval(appointment.date, {
      start: weekStart,
      end: weekEnd,
    })
  );
  
  // Previous week
  const goToPreviousWeek = () => {
    setSelectedDate(addDays(selectedDate, -7));
  };
  
  // Next week
  const goToNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };
  
  // Format date for the week header
  const formatWeekHeader = () => {
    const start = format(weekStart, "d 'de' MMMM", { locale: ptBR });
    const end = format(weekEnd, "d 'de' MMMM", { locale: ptBR });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-semibold text-dark">Agenda</h2>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-sm font-medium">
                {formatWeekHeader()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoje
            </Button>
            
            <div className="ml-2">
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Semana
              </Button>
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
                className="ml-1"
              >
                Mês
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {view === "week" ? (
        <Card className="overflow-hidden">
          {/* Week view header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-center font-medium text-gray-500 border-r"></div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-2 text-center ${
                  isSameDay(day, new Date()) ? "bg-primary text-white" : ""
                }`}
              >
                <div className="text-xs font-medium">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className="text-sm">{format(day, "dd")}</div>
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="relative">
            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b">
                <div className="p-2 text-xs text-center text-gray-500 border-r">
                  {hour}:00
                </div>
                {weekDays.map((day, dayIndex) => {
                  // Find appointments for this time slot and day
                  const slotAppointments = weekAppointments.filter((appointment) => {
                    const appointmentHour = appointment.date.getHours();
                    return (
                      isSameDay(appointment.date, day) && appointmentHour === hour
                    );
                  });
                  
                  return (
                    <div
                      key={dayIndex}
                      className="p-1 min-h-[60px] border-r relative"
                    >
                      {slotAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="absolute bg-primary text-white rounded p-1 text-xs"
                          style={{
                            top: `${(appointment.date.getMinutes() / 60) * 100}%`,
                            height: `${
                              ((appointment.endTime.getTime() - appointment.date.getTime()) /
                                (1000 * 60 * 60)) *
                              100
                            }%`,
                            left: "5%",
                            right: "5%",
                            overflow: "hidden",
                          }}
                        >
                          <div className="font-medium">{appointment.title}</div>
                          <div>
                            {format(appointment.date, "HH:mm")} -{" "}
                            {format(appointment.endTime, "HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            locale={ptBR}
            modifiers={{
              appointment: weekAppointments.map((apt) => apt.date),
            }}
            modifiersStyles={{
              appointment: {
                backgroundColor: "#0099CC",
                color: "white",
                fontWeight: "bold",
              },
            }}
          />
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">
              Agendamentos em {format(selectedDate, "dd/MM/yyyy")}
            </h3>
            <div className="space-y-4">
              {mockAppointments
                .filter((apt) => isSameDay(apt.date, selectedDate))
                .map((appointment) => (
                  <Card key={appointment.id} className="p-4">
                    <div className="flex items-start">
                      <div className="bg-primary text-white p-2 rounded-md text-center min-w-[60px]">
                        <div className="text-xs">{format(appointment.date, "HH:mm")}</div>
                        <div className="text-xs">{format(appointment.endTime, "HH:mm")}</div>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">{appointment.title}</h4>
                        <p className="text-sm text-gray-600">Cliente: {appointment.client}</p>
                        <p className="text-sm text-gray-600">Local: {appointment.location}</p>
                        {appointment.address && (
                          <p className="text-sm text-gray-600">Endereço: {appointment.address}</p>
                        )}
                        {appointment.broker && (
                          <p className="text-sm text-gray-600">Corretor: {appointment.broker}</p>
                        )}
                        <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {appointment.type}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              
              {mockAppointments.filter((apt) => isSameDay(apt.date, selectedDate)).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  Nenhum agendamento para esta data.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
