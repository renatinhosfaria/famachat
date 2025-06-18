import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useAuth } from "@/hooks/use-auth";
import PeriodFilter from "@/components/dashboard/period-filter";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import ConversionChart from "@/components/dashboard/conversion-chart";
import PerformanceChart from "@/components/dashboard/performance-chart";
import RecentClientes from "@/components/dashboard/recent-clientes";
import UpcomingAppointments from "@/components/dashboard/upcoming-appointments";
import { Redirect } from "wouter";

// Dashboard específico para Vendas com filtro oculto por usuário
export default function DashboardVendas() {
  const { currentUser } = useAuth();
  const {
    currentPeriod,
    setPeriod,
    metrics,
    setMetrics,
    isLoading,
    setIsLoading,
    recentClientes,
    setRecentClientes,
    upcomingAppointments,
    setUpcomingAppointments,
  } = useDashboardStore();

  // Se o usuário não estiver logado, redirecione para a página de login
  if (!currentUser) {
    return <Redirect to="/login" />;
  }

  // Buscar dados do dashboard filtrados para o usuário atual (filtro oculto)
  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", { period: currentPeriod }],
    enabled: !!currentUser,
  });

  // Carregar dados reais do dashboard
  useEffect(() => {
    setIsLoading(isQueryLoading);

    // Se temos dados da API, usá-los
    if (data) {
      setMetrics(data);
    }
  }, [data, isQueryLoading, setIsLoading, setMetrics]);
  
  // Buscar dados de clientes recentes filtrados para o usuário atual
  const { data: recentClientesData } = useQuery({
    queryKey: ["/api/dashboard/recent-clientes", { limit: 5, assignedTo: currentUser.id }],
    enabled: !!currentUser,
  });
  
  // Atualizar clientes recentes quando os dados chegarem
  useEffect(() => {
    if (recentClientesData) {
      const formattedClientes = recentClientesData.map(cliente => {
        // Extrair data formatada a partir de created_at
        const createdAt = new Date(cliente.createdAt);
        const formattedDate = `${createdAt.getDate().toString().padStart(2, '0')}/${(createdAt.getMonth() + 1).toString().padStart(2, '0')}/${createdAt.getFullYear()}`;
        
        return {
          id: cliente.id,
          fullName: cliente.fullName,
          phone: cliente.phone || "Não informado",
          interest: cliente.interest || "Não informado",
          interestType: cliente.interestType || "Não informado",
          location: cliente.location || "Não informado",
          date: formattedDate,
          status: cliente.status || "Novo cliente",
        };
      });
      
      setRecentClientes(formattedClientes);
    }
  }, [recentClientesData, setRecentClientes]);
  
  // Buscar dados de agendamentos próximos filtrados para o usuário atual
  const { data: upcomingAppointmentsData } = useQuery({
    queryKey: ["/api/dashboard/upcoming-appointments", { limit: 5, userId: currentUser.id }],
    enabled: !!currentUser,
  });
  
  // Atualizar agendamentos próximos quando os dados chegarem
  useEffect(() => {
    if (upcomingAppointmentsData) {
      const formattedAppointments = upcomingAppointmentsData.map(appointment => {
        const scheduledDate = new Date(appointment.scheduledAt);
        const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        
        // Extrair horas formatadas
        const startHour = scheduledDate.getHours().toString().padStart(2, '0');
        const startMinute = scheduledDate.getMinutes().toString().padStart(2, '0');
        
        // Adicionar 1 hora para o término (estimativa)
        const endDate = new Date(scheduledDate);
        endDate.setHours(endDate.getHours() + 1);
        const endHour = endDate.getHours().toString().padStart(2, '0');
        const endMinute = endDate.getMinutes().toString().padStart(2, '0');
        
        return {
          id: appointment.id,
          date: scheduledDate.toISOString().split('T')[0],
          monthAbbr: monthNames[scheduledDate.getMonth()],
          day: scheduledDate.getDate().toString(),
          title: `${appointment.type || 'Atendimento'} - ${appointment.location || 'Local não informado'}`,
          time: `${startHour}:${startMinute} - ${endHour}:${endMinute}`,
          clientName: appointment.clienteId?.toString() || "Cliente",
          location: appointment.address || appointment.location || "Local não informado",
        };
      });
      
      setUpcomingAppointments(formattedAppointments);
    }
  }, [upcomingAppointmentsData, setUpcomingAppointments]);

  return (
    <>
      <PeriodFilter currentPeriod={currentPeriod} onChange={setPeriod} />
      <div className="mt-6">
        <MetricsGrid metrics={metrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ConversionChart data={metrics.conversionRates} />
        <PerformanceChart
          monthlyConversionRates={metrics.monthlyConversionRates || {
            appointmentsToClientes: Array(12).fill(0),
            visitsToAppointments: Array(12).fill(0),
            salesToVisits: Array(12).fill(0)
          }}
        />
      </div>

      <RecentClientes clientes={recentClientes} />
      <UpcomingAppointments appointments={upcomingAppointments} />
    </>
  );
}
