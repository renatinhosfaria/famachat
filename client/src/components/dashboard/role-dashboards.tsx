import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useAuth } from "@/hooks/use-auth";
import PeriodFilter from "@/components/dashboard/period-filter";
import UserFilter from "@/components/dashboard/user-filter";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import ConversionChart from "@/components/dashboard/conversion-chart";
import PerformanceChart from "@/components/dashboard/performance-chart";
import RecentClientes from "@/components/dashboard/recent-clientes";
import UpcomingAppointments from "@/components/dashboard/upcoming-appointments";
import PerformanceRanking from "@/components/dashboard/performance-ranking";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Smartphone } from "lucide-react";

// Dashboard para o perfil de Gestor - Layout completo com todas as informações
export function ManagerDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

  // Buscar dados do dashboard da nova API com filtro de usuário opcional
  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", { period: currentPeriod, userId: selectedUserId }],
    enabled: true,
  });

  // Carregar dados reais do dashboard
  useEffect(() => {
    setIsLoading(isQueryLoading);

    // Se temos dados da API, usá-los
    if (data) {
      setMetrics(data);
    }
  }, [data, isQueryLoading, setIsLoading, setMetrics]);
  
  // Buscar dados de clientes recentes da API com filtro de usuário opcional
  const { data: recentClientesData } = useQuery({
    queryKey: ["/api/dashboard/recent-clientes", { limit: 5, assignedTo: selectedUserId }],
    enabled: true,
  });
  
  // Atualizar clientes recentes quando os dados chegarem
  useEffect(() => {
    if (recentClientesData) {
      const formattedClientes = recentClientesData.map((cliente: any) => {
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
  
  // Buscar dados de agendamentos próximos da API com filtro de usuário opcional
  const { data: upcomingAppointmentsData } = useQuery({
    queryKey: ["/api/dashboard/upcoming-appointments", { limit: 5, userId: selectedUserId }],
    enabled: true,
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
      <div className="flex justify-between items-center mb-6">
        <PeriodFilter currentPeriod={currentPeriod} onChange={setPeriod} />
        <UserFilter selectedUserId={selectedUserId} onUserChange={setSelectedUserId} />
      </div>
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

      <PerformanceRanking period={currentPeriod} />

      <RecentClientes clientes={recentClientes} />
      <UpcomingAppointments appointments={upcomingAppointments} />
    </>
  );
}

// Dashboard para o perfil de Marketing - Foco em clientes e conversões
export function MarketingDashboard() {
  const {
    currentPeriod,
    setPeriod,
    metrics,
    setMetrics,
    isLoading,
    setIsLoading,
    recentClientes,
    setRecentClientes,
  } = useDashboardStore();

  // Buscar dados do dashboard da nova API
  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", currentPeriod],
    enabled: true,
  });

  // Carregar dados reais do dashboard
  useEffect(() => {
    setIsLoading(isQueryLoading);

    // Se temos dados da API, usá-los
    if (data) {
      setMetrics(data);
    }
  }, [data, isQueryLoading, setIsLoading, setMetrics]);
  
  // Buscar dados de clientes recentes da API
  const { data: recentClientesData } = useQuery({
    queryKey: ["/api/dashboard/recent-clientes", { limit: 5 }],
    enabled: true,
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

  return (
    <>
      <PeriodFilter currentPeriod={currentPeriod} onChange={setPeriod} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newClientes}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.teamAverages.newClientes > 0 
                ? `+${Math.round((metrics.newClientes - metrics.teamAverages.newClientes) / metrics.teamAverages.newClientes * 100)}% em relação à média`
                : 'Primeiro registro do período'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Agendamento</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRates?.appointmentsToClientes || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Conversão de clientes para agendamentos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes por Fonte</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span>Site</span>
                <span>42%</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Facebook</span>
                <span>28%</span>
              </div>
              <div className="flex justify-between">
                <span>Instagram</span>
                <span>30%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <ConversionChart data={metrics.conversionRates} />
      </div>

      <RecentClientes clientes={recentClientes} />
    </>
  );
}

// Dashboard para o perfil de Consultor de Atendimento - Filtrado por usuário logado
export function ConsultantDashboard() {
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

  // Buscar dados do dashboard filtrados para o usuário atual
  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", { period: currentPeriod, userId: currentUser?.id }],
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
    queryKey: ["/api/dashboard/recent-clientes", { limit: 5, assignedTo: currentUser?.id }],
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
    queryKey: ["/api/dashboard/upcoming-appointments", { limit: 5, userId: currentUser?.id }],
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

// Dashboard para o perfil de Corretor - Foco em visitas, vendas e agendamentos
export function BrokerDashboard() {
  const { currentUser } = useAuth();
  const {
    currentPeriod,
    setPeriod,
    metrics,
    setMetrics,
    isLoading,
    setIsLoading,
    upcomingAppointments,
    setUpcomingAppointments,
  } = useDashboardStore();

  // Buscar dados do dashboard da nova API filtrados para o usuário atual
  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", { period: currentPeriod, userId: currentUser?.id }],
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
  
  // Buscar dados de agendamentos próximos da API filtrados para o usuário atual
  const { data: upcomingAppointmentsData } = useQuery({
    queryKey: ["/api/dashboard/upcoming-appointments", { limit: 5, userId: currentUser?.id }],
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.visits}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((metrics.visits - metrics.teamAverages.visits) / metrics.teamAverages.visits * 100)}% em relação à média
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sales}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((metrics.sales - metrics.teamAverages.sales) / metrics.teamAverages.sales * 100)}% em relação à média
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRates.salesToVisits}%</div>
            <p className="text-xs text-muted-foreground">
              Visitas convertidas em vendas
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <PerformanceChart
          performance={metrics.performance}
          teamPerformance={metrics.teamPerformance}
        />
      </div>

      <UpcomingAppointments appointments={upcomingAppointments} />
    </>
  );
}