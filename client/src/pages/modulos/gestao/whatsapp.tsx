import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ProfileTab from "./profile-tab";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhatsappCreateInstanceDialog } from "@/components/whatsapp/create-instance-dialog";
import { WhatsappSendMessageDialog } from "@/components/whatsapp/send-message-dialog";
import { QrCodeDialog } from "@/components/whatsapp/qrcode-dialog";
// Importação removida: ValidateNumbersDialog
import { SequentialProfilePicturesDialog } from "@/components/whatsapp/sequential-profile-pictures-dialog";
import { SequentialValidationDialog } from "@/components/whatsapp/sequential-validation-dialog";
import { InstanceButtons } from "@/components/whatsapp/instance-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Plus, QrCode, PowerOff, Power, RefreshCw, Settings, Save, Eye, EyeOff, Trash2, MoreVertical, ArrowLeft, Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Interfaces para tipagem
interface ApiStatus {
  status: {
    apiUrl: string;
    apiKey: string;
    ready: boolean;
  };
  validation?: {
    apiUrlValid: boolean;
  };
  info?: {
    apiUrlTip: string;
    apiKeyTip: string;
  };
}

interface WhatsAppLog {
  id: number;
  instanceId: number;
  type: string;
  message: string;
  data?: any;
  createdAt: string;
  instanceName?: string;
}

// Schema para validação do formulário de configuração
const configFormSchema = z.object({
  apiUrl: z.string().url("Informe uma URL válida").min(1, "A URL da API é obrigatória"),
  apiKey: z.string().min(1, "A chave da API é obrigatória"),
  // Campos para Webhook
  webhookUrl: z.string().url("Informe uma URL válida").optional(),
  webhookInstance: z.string().optional(),
  // Campos para Settings
  settingsInstance: z.string().optional(),
  // Campos para Profile Settings
  profileInstance: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

export default function WhatsappPage() {
  const { user, currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createInstanceDialogOpen, setCreateInstanceDialogOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  // A aba de instâncias agora é a única, mas mantemos a variável para compatibilidade
  const [activeTab, setActiveTab] = useState("instances");
  const [showApiKey, setShowApiKey] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isLoadingProfilePicture, setIsLoadingProfilePicture] = useState(false);
  // Variável fetchProfileDialogOpen removida
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [sequentialValidationDialogOpen, setSequentialValidationDialogOpen] = useState(false);
  const [apiConfig, setApiConfig] = useLocalStorage<ConfigFormValues>("evolution_api_config", {
    apiUrl: import.meta.env.VITE_EVOLUTION_API_URL || "",
    apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || ""
  });

  // Estado para armazenar o intervalo de atualização
  const [statusInterval, setStatusInterval] = useState<number | null>(null);

  // Estado para controlar se as informações do perfil já foram carregadas
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Consulta para verificar configuração da API
  const {
    data: apiStatus,
    isLoading: isLoadingApiStatus,
    isError: apiStatusError,
    refetch: refetchApiStatus,
  } = useQuery<ApiStatus>({
    queryKey: ['/api/whatsapp/check-env'],
    retry: 1,
  });

  // Configuração do formulário de API
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: apiConfig
  });

  // Salvar configurações de API
  const saveApiConfigMutation = useMutation({
    mutationFn: (values: ConfigFormValues) => apiRequest({
      url: "/api/whatsapp/config",
      method: "POST",
      body: values
    }),
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações da API foram salvas com sucesso."
      });
      refetchApiStatus();
      refetchInstances();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações da API. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Interface para as instâncias do WhatsApp
  interface WhatsAppInstance {
    instanciaId: number;
    instanceName: string;
    userId: number;
    userName?: string;
    status: string;
    description: string | null;
    isActive: boolean;
    lastConnection: string | null;
    createdAt: string;
    updatedAt: string;
    qrCode?: string;
  }


  // Consulta para buscar instâncias do WhatsApp - reformulada para usar padrão Query v5
  const {
    data: instances = [] as WhatsAppInstance[],
    isLoading: isLoadingInstances,
    error: instancesError,
    refetch: refetchInstances,
  } = useQuery<WhatsAppInstance[]>({
    queryKey: ["/api/whatsapp/instances"],
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    // Não fazer refetch automático em intervalo - apenas quando solicitar
    // refetchInterval: 30000, 
    staleTime: 60000, // Aumentado para 1 minuto para reduzir consultas
  });

  // Consulta para buscar logs do WhatsApp
  const {
    data: logs = [] as WhatsAppLog[],
    isLoading: isLoadingLogs,
    isError: logsError,
    refetch: refetchLogs,
  } = useQuery<WhatsAppLog[]>({
    queryKey: ["/api/whatsapp/logs"],
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Aumentado para 30 segundos para reduzir consultas
    staleTime: 15000, // Aumentado para 15 segundos para reduzir consultas
  });
  
  // As instâncias serão carregadas automaticamente pelos hooks useQuery

  // Conectar instância do WhatsApp
  const connectInstanceMutation = useMutation({
    mutationFn: (instanceId: number) => apiRequest({
      url: `/api/whatsapp/connect/${instanceId}`,
      method: "POST"
    }),
    onSuccess: async (data, variables) => {
      toast({
        title: "Conectando...",
        description: "Preparando QR code para conexão."
      });

      // Primeiro atualize as instâncias
      await refetchInstances();

      // Tentar obter a instância pelo ID
      if (instances && Array.isArray(instances)) {
        // Encontrar a instância com o ID correspondente
        const instance = instances.find(inst => inst.instanciaId === variables);

        if (instance) {
          // Aguardar um momento para garantir que a instância esteja pronta
          setTimeout(() => {
            // Chamar automaticamente o QR code
            getQRCodeMutation.mutate(instance);
          }, 1000);
        } else {
          
        }
      } else {
        
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao conectar instância",
        description: "Não foi possível conectar a instância. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Desconectar instância do WhatsApp
  const disconnectInstanceMutation = useMutation({
    mutationFn: (instanceId: number) => apiRequest({
      url: `/api/whatsapp/disconnect/${instanceId}`,
      method: "POST"
    }),
    onSuccess: (data) => {
      toast({
        title: "Instância desconectada",
        description: "A instância foi desconectada com sucesso."
      });
      refetchInstances();
    },
    onError: (error) => {
      toast({
        title: "Erro ao desconectar instância",
        description: "Não foi possível desconectar a instância. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Verificar status real da instância diretamente na API Evolution
  const verifyActualStatusMutation = useMutation({
    mutationFn: (instanceId: number) => apiRequest({
      url: `/api/whatsapp/verify-actual-status/${instanceId}`,
      method: "POST"
    }),
    onSuccess: (data) => {
      // Verificar se o status foi atualizado
      if (data.updated) {
        toast({
          title: "Status atualizado",
          description: `Status verificado: ${data.actualStatus}. O status da instância foi atualizado.`,
        });
      } else {
        toast({
          title: "Status verificado",
          description: `Status atual: ${data.actualStatus}. Não foi necessário atualizar o status no sistema.`,
        });
      }
      refetchInstances();
    },
    onError: (error) => {
      toast({
        title: "Erro ao verificar status",
        description: "Não foi possível verificar o status real da instância. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Mutação para buscar instâncias diretamente da Evolution API
  const fetchExternalInstancesMutation = useMutation({
    mutationFn: () => apiRequest({
      url: `/api/whatsapp/evolution-instances`,
      method: "GET"
    }),
    onSuccess: (data) => {
      // Lógica para avaliar o número de instâncias em diferentes formatos
      let instanceCount = 0;
      let instancesData = [];
      
      // Formato 1: Array de instâncias
      if (Array.isArray(data)) {
        instanceCount = data.length;
        instancesData = data;
      } 
      // Formato 2: Objeto com array 'instances'
      else if (data && data.instances && Array.isArray(data.instances)) {
        instanceCount = data.instances.length;
        instancesData = data.instances;
      }
      // Formato 3: Propriedades diretas representando instâncias
      else if (data && typeof data === 'object') {
        // Filtramos para encontrar propriedades que parecem ser instâncias
        const possibleInstances = Object.entries(data)
          .filter(([key, value]) => 
            typeof value === 'object' && 
            value !== null && 
            !['status', 'error', 'response', 'message'].includes(key)
          );
        
        instanceCount = possibleInstances.length;
        instancesData = possibleInstances.map(([key, value]) => value);
      }
      
      if (instanceCount > 0) {
        // Formatamos uma mensagem mais informativa
        const instanceNames = instancesData
          .map((instance: any) => 
            instance.name || 
            instance.instanceName || 
            (instance.instance && instance.instance.instanceName) || 
            'sem nome'
          )
          .slice(0, 3)  // Limitar para evitar mensagens muito longas
          .join(', ');
          
        const moreInstances = instanceCount > 3 ? ` e mais ${instanceCount - 3}...` : '';
          
        toast({
          title: "Instâncias encontradas",
          description: `${instanceCount} instância(s) encontrada(s) no servidor Evolution API: ${instanceNames}${moreInstances}`
        });
      } else {
        toast({
          title: "Instâncias buscadas",
          description: "Nenhuma instância encontrada no servidor Evolution API."
        });
      }
      
      // Atualizar a lista local
      refetchInstances();
    },
    onError: (error: any) => {
      // Verificar o tipo específico de erro para feedback detalhado
      let errorMessage = "Não foi possível buscar instâncias do servidor externo.";
      
      // Erro de autenticação
      if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        errorMessage = "Falha de autenticação na API Evolution. Verifique suas credenciais de API.";
      } 
      // Erro de conexão
      else if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('timeout'))) {
        errorMessage = "Não foi possível conectar ao servidor Evolution API. Verifique se o servidor está online.";
      }
      
      toast({
        title: "Erro ao buscar instâncias",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Obter QR Code para a instância
  const getQRCodeMutation = useMutation({
    mutationFn: async (instance: WhatsAppInstance) => {
      
      const result = await apiRequest({
        url: `/api/whatsapp/qrcode/${instance.instanceName}`,
        method: "GET"
      });
      
      return result;
    },
    onSuccess: (data: any) => {
      // Imprimir a estrutura completa para depuração
      
      // Adicionar mais logging para depuração

      if (data && typeof data === 'object') {
        // Tentar várias formas de encontrar o QR code na resposta
        if (data.qrCode && typeof data.qrCode === 'string') {
          
          setQrCodeData(data.qrCode);
          setQrCodeDialogOpen(true);
          return;
        } 

        if (data.base64 && typeof data.base64 === 'string') {
          
          setQrCodeData(data.base64);
          setQrCodeDialogOpen(true);
          return;
        }

        // Também verificar dentro de campos aninhados como response.data
        if (data.response && data.response.data) {
          const responseData = data.response.data;

          if (responseData.qrCode && typeof responseData.qrCode === 'string') {
            
            setQrCodeData(responseData.qrCode);
            setQrCodeDialogOpen(true);
            return;
          }

          if (responseData.base64 && typeof responseData.base64 === 'string') {
            
            setQrCodeData(responseData.base64);
            setQrCodeDialogOpen(true);
            return;
          }
        }
      }

      // Se chegou aqui, não encontrou o QR code
      
      toast({
        title: "Erro ao obter QR Code",
        description: "O QR Code recebido não é válido ou está em formato incorreto.",
        variant: "destructive"
      });
    },
    onError: (error) => {
      
      toast({
        title: "Erro ao obter QR Code",
        description: "Não foi possível obter o QR Code para esta instância. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Verificar status da instância
  const checkStatusMutation = useMutation({
    mutationFn: (instanceId: number) => apiRequest({
      url: `/api/whatsapp/check-status/${instanceId}`,
      method: "GET"
    }),
    onSuccess: (data: any) => {
      if (data.error) {
        toast({
          title: "Aviso de status",
          description: data.error,
          variant: "default"
        });
      } else {
        toast({
          title: "Status verificado",
          description: `A instância está ${translateStatus(String(data.status))}.`
        });
        refetchInstances();
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao verificar status",
        description: "Não foi possível verificar o status da instância. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Excluir instância
  const deleteInstanceMutation = useMutation({
    mutationFn: (instanceId: number) => apiRequest({
      url: `/api/whatsapp/instances/${instanceId}`,
      method: "DELETE"
    }),
    onSuccess: (data, variables) => {
      // Atualizamos o cache de instâncias removendo a instância excluída
      // Isso faz com que a UI seja atualizada imediatamente sem precisar esperar o refetch
      queryClient.setQueryData(["/api/whatsapp/instances"], (oldData: WhatsAppInstance[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(instance => instance.instanciaId !== variables);
      });
      
      toast({
        title: "Instância excluída",
        description: "A instância foi excluída com sucesso."
      });
      
      // Ainda refetchamos para garantir que o cache esteja sincronizado com o servidor
      refetchInstances();
      refetchLogs();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir instância",
        description: "Não foi possível excluir a instância. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Manipulador para controle de status da instância
  const handleInstanceStatus = (instance: any, action: 'connect' | 'disconnect' | 'qrcode' | 'check' | 'verify-status') => {
    switch (action) {
      case 'connect':
        // Conectar instância - o QR code será exibido através do onSuccess declarado na definição
        // do connectInstanceMutation, eliminando a duplicação de chamadas
        connectInstanceMutation.mutate(instance.instanciaId);
        break;
      case 'disconnect':
        disconnectInstanceMutation.mutate(instance.instanciaId);
        break;
      // Mantemos o case 'qrcode' para evitar erros de tipo, mesmo com o botão removido
      case 'qrcode':
        getQRCodeMutation.mutate(instance as WhatsAppInstance);
        break;
      case 'check':
        checkStatusMutation.mutate(instance.instanciaId);
        break;
      case 'verify-status':
        // Verificar o status real da instância diretamente na API Evolution
        verifyActualStatusMutation.mutate(instance.instanciaId);
        break;
      default:
        toast({
          title: "Operação não suportada",
          description: "Esta operação não é suportada."
        });
    }
  };

  // Esta função era usada para o botão "Enviar" que foi removido
  // const handleSendMessage = (instance: any) => {
  //   setSelectedInstance(instance);
  //   setSendMessageDialogOpen(true);
  // };

  // Função para formatar a data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    // Normalizando o status para lidar com diferentes formatos
    const normalizedStatus = status && typeof status === 'string' 
      ? status.toLowerCase() 
      : 'unknown';

    switch (normalizedStatus) {
      case 'connected':
      case 'conectado':
        return 'bg-green-500 hover:bg-green-600';
      case 'disconnected':
      case 'desconectado':
        return 'bg-red-500 hover:bg-red-600';
      case 'connecting':
      case 'conectando':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'qrcode':
      case 'aguardando scan do qr code':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Função para atualizar o status de todas as instâncias
  const checkAllInstancesStatus = () => {
    if (instances && instances.length > 0) {
      // Obtém a primeira instância para verificar seu status via API
      const firstInstance = instances[0];
      if (firstInstance && firstInstance.instanciaId) {
        // Verificar o status mas sem exibir toast
        apiRequest({
          url: `/api/whatsapp/check-status/${firstInstance.instanciaId}`,
          method: "GET"
        }).then(() => {
          // Após verificar o status, atualizar a lista de instâncias
          refetchInstances();
        }).catch(err => {
          
        });
      }
    }
  };

  // Função segura para verificação de status - movida para fora do useEffect para evitar "Invalid hook call"
  const checkStatusSafely = React.useCallback(async (instanceId: number) => {
    try {
      await apiRequest({
        url: `/api/whatsapp/check-status/${instanceId}`,
        method: "GET"
      });
      
      // Quebrar o ciclo de atualização usando setTimeout
      setTimeout(() => {
        refetchInstances();
      }, 100);
    } catch (err) {
      
    }
  }, [refetchInstances]);

  // Configurar o intervalo de verificação automática quando as instâncias forem carregadas - otimizado para evitar loops
  useEffect(() => {
    // Limpar qualquer intervalo existente
    if (statusInterval) {
      window.clearInterval(statusInterval);
      setStatusInterval(null);
    }

    // Variável para armazenar o timeout inicial
    let initialCheck: NodeJS.Timeout | null = null;
    
    // Só configura o intervalo se:
    // 1. Tiver instâncias para verificar
    // 2. O diálogo de QR Code não estiver aberto (para evitar loops)
    if (instances && instances.length > 0 && !qrCodeDialogOpen) {
      // Verificação inicial com leve atraso para evitar reações em cadeia
      initialCheck = setTimeout(() => {
        // Só verificar se o diálogo de QR Code ainda estiver fechado
        if (!qrCodeDialogOpen) {
          const firstInstance = instances[0];
          if (firstInstance && firstInstance.instanciaId) {
            checkStatusSafely(firstInstance.instanciaId);
          }
        }
      }, 2000);
      
      // Intervalo de verificação periódica mais longo
      const intervalId = window.setInterval(() => {
        // Só verificar se o diálogo de QR Code estiver fechado
        if (!qrCodeDialogOpen && instances.length > 0) {
          const firstInstance = instances[0];
          if (firstInstance && firstInstance.instanciaId) {
            checkStatusSafely(firstInstance.instanciaId);
          }
        }
      }, 60000); // Intervalo aumentado para 60 segundos para reduzir frequência de atualizações

      setStatusInterval(intervalId);
    }

    // Limpar todos os timers quando o componente for desmontado
    return () => {
      // Limpar o intervalo principal
      if (statusInterval) {
        window.clearInterval(statusInterval);
      }
      
      // Limpar o timeout inicial se existir
      if (initialCheck) {
        clearTimeout(initialCheck);
      }
    };
  }, [instances, checkStatusSafely, qrCodeDialogOpen]); // Adicionar qrCodeDialogOpen para interromper a verificação quando o QR code estiver sendo exibido

  // Função para traduzir o status
  const translateStatus = (status: string) => {
    if (!status) return 'Desconhecido';

    // Normalizar o status (lowercase) para facilitar a comparação
    const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : String(status);

    const statusMap: Record<string, string> = {
      'connected': 'Conectado',
      'conectado': 'Conectado',
      'disconnected': 'Desconectado',
      'desconectado': 'Desconectado',
      'connecting': 'Conectando',
      'conectando': 'Conectando',
      'qrcode': 'QR Code pendente',
      'aguardando scan do qr code': 'QR Code pendente',
      'error': 'Erro',
      'erro': 'Erro',
      'initializing': 'Inicializando',
      'inicializando': 'Inicializando',
    };

    return statusMap[normalizedStatus] || status;
  };

  // Efeito para tratar a mudança para aba de perfil
  useEffect(() => {
    // Se a aba selecionada for "profileSettings", iniciar carregamento de dados de perfil
    if (activeTab === "profileSettings" && instances && instances.length > 0 && !profileLoaded) {
      // Buscar uma instância conectada
      const connectedInstance = instances.find(instance => 
        instance.status === 'connected' || 
        instance.status === 'open' || 
        instance.status === 'Conectado' || 
        instance.status.toLowerCase() === 'connected'
      );

      // Se encontrar instância conectada, usa-a
      if (connectedInstance) {
        form.setValue("profileInstance", connectedInstance.instanceName);
        
        // Apenas marcar como carregado pois o componente ProfileTab vai carregar os dados
        setProfileLoaded(true);
      } 
      // Se não encontrar instância conectada, usar a primeira disponível
      else if (instances.length > 0) {
        form.setValue("profileInstance", instances[0].instanceName);
        
        // Apenas marcar como carregado pois o componente ProfileTab vai carregar os dados
        setProfileLoaded(true);
      }
    }
  }, [activeTab, instances, profileLoaded, form]);

  // Verificação periódica das instâncias e logs - otimizada para evitar loops
  useEffect(() => {
    if (instancesError || logsError || apiStatusError) {
      return; // Não continuar se há erros
    }

    // Funções de refetch em memória para evitar recreação
    const refetchLogsIfNeeded = () => {
      if (activeTab === "logs") {
        refetchLogs();
      }
    };

    const refetchApiStatusIfNeeded = () => {
      if (activeTab === "config") {
        refetchApiStatus();
      }
    };

    // Definir intervalo único - melhor para performance
    const interval = setInterval(() => {
      // Usando funções estáveis em memória
      refetchLogsIfNeeded();
      refetchApiStatusIfNeeded();
      // Para as instâncias, temos um timer separado para atualizar o status
    }, 10000); // A cada 10 segundos para logs e configuração

    // Limpar intervalo ao desmontar componente
    return () => { 
      clearInterval(interval);
    };
  }, [activeTab, refetchLogs, refetchApiStatus, instancesError, logsError, apiStatusError]);

  function onSubmitApiConfig(values: ConfigFormValues) {
    saveApiConfigMutation.mutate(values);
  }

  if (instancesError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Integração WhatsApp</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> Ocorreu um erro ao carregar as instâncias de WhatsApp.</span>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => refetchInstances()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Diálogos */}
      <WhatsappCreateInstanceDialog
        open={createInstanceDialogOpen}
        onOpenChange={setCreateInstanceDialogOpen}
        onSuccess={() => {
          refetchInstances();
          refetchLogs();
        }}
      />

      {selectedInstance && (
        <WhatsappSendMessageDialog
          open={sendMessageDialogOpen}
          onOpenChange={setSendMessageDialogOpen}
          instanceId={selectedInstance.instanciaId}
          instanceName={selectedInstance.instanceName}
          onSuccess={() => {
            refetchLogs();
          }}
        />
      )}

      <QrCodeDialog 
        open={qrCodeDialogOpen}
        onOpenChange={setQrCodeDialogOpen}
        qrCodeData={qrCodeData}
      />
      
      <SequentialValidationDialog
        open={sequentialValidationDialogOpen}
        onOpenChange={setSequentialValidationDialogOpen}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Integração WhatsApp</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setSequentialValidationDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Validação Sequencial
          </Button>
          <SequentialProfilePicturesDialog />
          <Button onClick={() => setCreateInstanceDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Instância
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fetchExternalInstancesMutation.mutate()}
            disabled={fetchExternalInstancesMutation.isPending}
          >
            {fetchExternalInstancesMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Listar Instâncias
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
        </TabsList>



        <TabsContent value="instances">
          {/* Aviso de configuração da API */}
          {apiStatus && !apiStatus.status?.ready && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Configuração da API Incompleta</AlertTitle>
              <AlertDescription>
                A API Evolution não está configurada corretamente. 
                Acesse a aba "Configuração" para adicionar as informações necessárias.
                <Button 
                  variant="outline" 
                  className="mt-2 ml-auto block" 
                  onClick={() => setActiveTab("config")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ir para configuração
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!instances || instances.length === 0 ? (
            <div className="text-center p-12 border rounded-lg bg-gray-50">
              <p className="text-gray-500">Nenhuma instância de WhatsApp encontrada.</p>
              <p className="mt-2 text-gray-400">Clique em "Nova Instância" para criar uma.</p>
            </div>
          ) : (
            <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((instance: any) => (
                <Card key={instance.instanciaId} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center justify-between">
                      {instance.instanceName}
                      <div className="flex gap-2 items-center">
                        <Badge 
                          className={`${getStatusColor(instance.status)} text-white`}
                        >
                          {translateStatus(instance.status)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Configurações"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                // Use onSelect em vez de onClick para melhor compatibilidade com o componente Radix UI
                                setActiveTab("webhook");
                                // Adicionar um pequeno atraso para evitar loops de renderização
                                setTimeout(() => {
                                  form.setValue("webhookInstance", instance.instanceName);
                                  toast({
                                    title: "Configurando webhook",
                                    description: `Configuração para ${instance.instanceName}`,
                                  });
                                }, 0);
                              }}
                            >
                              Webhook
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                setActiveTab("settings");
                                setTimeout(() => {
                                  form.setValue("settingsInstance", instance.instanceName);
                                  toast({
                                    title: "Configurando settings",
                                    description: `Configuração para ${instance.instanceName}`,
                                  });
                                }, 0);
                              }}
                            >
                              Settings
                            </DropdownMenuItem>
                            {/* Profile Settings option removed */}
                            <DropdownMenuItem
                              onSelect={(e) => {
                                setActiveTab("config");
                                setTimeout(() => {
                                  toast({
                                    title: "Configuração API",
                                    description: `Configuração para ${instance.instanceName}`,
                                  });
                                }, 0);
                              }}
                            >
                              Configuração
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            // Evitar propagação para prevenir loops de renderização
                            e.stopPropagation();
                            e.preventDefault(); 
                            
                            // Usar setTimeout para separar da renderização atual
                            setTimeout(() => {
                              if (confirm(`Tem certeza que deseja excluir a instância "${instance.instanceName}"?`)) {
                                deleteInstanceMutation.mutate(instance.instanciaId);
                              }
                            }, 0);
                          }}
                          title="Excluir instância"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {instance.description && instance.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Telefone:</span>
                      <span>{instance.whatsappPhone || (instance.remoteJid ? instance.remoteJid.split('@')[0] : "N/A")}</span>
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="pt-4 flex flex-wrap gap-2 justify-between">
                    {instance.status === 'Conectado' ? (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Usar setTimeout para quebrar a cadeia de atualização
                          setTimeout(() => {
                            handleInstanceStatus(instance, 'disconnect');
                          }, 0);
                        }}
                        disabled={disconnectInstanceMutation.isPending}
                      >
                        {disconnectInstanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <PowerOff className="h-4 w-4 mr-1" />
                        Desconectar
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Usar setTimeout para quebrar a cadeia de atualização
                          setTimeout(() => {
                            handleInstanceStatus(instance, 'connect');
                          }, 0);
                        }}
                        disabled={connectInstanceMutation.isPending}
                      >
                        {connectInstanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Power className="h-4 w-4 mr-1" />
                        Conectar
                      </Button>
                    )}

                    <div className="flex gap-2">
                      {/* Botão Verificar Status na API Evolution */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                // Verificar status real na API Evolution
                                setTimeout(() => {
                                  handleInstanceStatus(instance, 'verify-status');
                                }, 0);
                              }}
                              disabled={verifyActualStatusMutation.isPending}
                            >
                              {verifyActualStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <Globe className="h-4 w-4 mr-1" />
                              Verificar Status
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Verificar o status real diretamente na API Evolution</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure o webhook para receber notificações em tempo real da API Evolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <Alert className="mb-4">
                  <AlertTitle>Nenhuma instância disponível</AlertTitle>
                  <AlertDescription>
                    Crie uma instância primeiro para configurar o webhook.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="webhookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Webhook</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://seu-servidor.com/webhook"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              URL para onde os eventos serão enviados
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Eventos</h3>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded">
                          {[
                            'APPLICATION_STARTUP',
                            'CALL',
                            'CHATS_DELETE',
                            'CHATS_SET',
                            'CHATS_UPDATE',
                            'CHATS_UPSERT',
                            'CONNECTION_UPDATE',
                            'CONTACTS_SET',
                            'CONTACTS_UPDATE',
                            'CONTACTS_UPSERT',
                            'GROUP_PARTICIPANTS_UPDATE',
                            'GROUP_UPDATE',
                            'GROUPS_UPSERT',
                            'LABELS_ASSOCIATION',
                            'LABELS_EDIT',
                            'LOGOUT_INSTANCE',
                            'MESSAGES_DELETE',
                            'MESSAGES_SET',
                            'MESSAGES_UPDATE',
                            'MESSAGES_UPSERT',
                            'PRESENCE_UPDATE',
                            'QRCODE_UPDATED',
                            'REMOVE_INSTANCE',
                            'SEND_MESSAGE',
                            'TYPEBOT_CHANGE_STATUS',
                            'TYPEBOT_START'
                          ].map((event) => (
                            <div key={event} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`event-${event}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <label htmlFor={`event-${event}`} className="text-sm">{event}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Opções</h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="option-base64"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="option-base64" className="text-sm">Codificar mensagens em Base64</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="option-onlyevents"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="option-onlyevents" className="text-sm">Enviar apenas eventos (sem dados)</label>
                          </div>
                        </div>
                      </div>

                      {/* Informação sobre a instância atual */}
                      <div className="p-4 bg-gray-50 border rounded-md text-center mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          Configurando webhook para a instância: 
                          <span className="font-bold text-primary ml-1">
                            {form.watch("webhookInstance") || "Nenhuma instância selecionada"}
                          </span>
                        </p>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("instances")}
                className="mr-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Instâncias
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Implementação para obter configuração atual
                    if (!form.watch("webhookInstance")) {
                      toast({
                        title: "Selecione uma instância",
                        description: "É necessário selecionar uma instância para obter a configuração.",
                        variant: "destructive",
                      });
                      return;
                    }

                    toast({
                      title: "Obtendo configuração",
                      description: `Buscando configuração atual para ${form.watch("webhookInstance")}`,
                    });

                    apiRequest({
                      url: `/api/whatsapp/webhook/config/${form.watch("webhookInstance")}`,
                      method: "GET",
                    })
                    .then((data) => {
                      toast({
                        title: "Configuração carregada",
                        description: "Configuração atual obtida com sucesso.",
                      });
                      // Aqui você pode preencher o formulário com os dados recebidos
                    })
                    .catch((error) => {
                      toast({
                        title: "Erro ao obter configuração",
                        description: "Não foi possível obter a configuração atual.",
                        variant: "destructive",
                      });
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Obter Configuração Atual
                </Button>
                <Button
                  onClick={() => {
                    // Validar se a instância está selecionada
                    if (!form.watch("webhookInstance")) {
                      toast({
                        title: "Selecione uma instância",
                        description: "É necessário selecionar uma instância para salvar a configuração.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Implementação para salvar configuração
                    toast({
                      title: "Salvando configuração",
                      description: `Salvando configuração para ${form.watch("webhookInstance")}`,
                    });

                    // Obter todos os eventos selecionados
                    const selectedEvents = [
                      'APPLICATION_STARTUP',
                      'CALL',
                      'CHATS_DELETE',
                      'CHATS_SET',
                      'CHATS_UPDATE',
                      'CHATS_UPSERT',
                      'CONNECTION_UPDATE',
                      'CONTACTS_SET',
                      'CONTACTS_UPDATE',
                      'CONTACTS_UPSERT',
                      'GROUP_PARTICIPANTS_UPDATE',
                      'GROUP_UPDATE',
                      'GROUPS_UPSERT',
                      'LABELS_ASSOCIATION',
                      'LABELS_EDIT',
                      'LOGOUT_INSTANCE',
                      'MESSAGES_DELETE',
                      'MESSAGES_SET',
                      'MESSAGES_UPDATE',
                      'MESSAGES_UPSERT',
                      'PRESENCE_UPDATE',
                      'QRCODE_UPDATED',
                      'REMOVE_INSTANCE',
                      'SEND_MESSAGE',
                      'TYPEBOT_CHANGE_STATUS',
                      'TYPEBOT_START'
                    ].filter(event => 
                      (document.getElementById(`event-${event}`) as HTMLInputElement)?.checked
                    );

                    apiRequest({
                      url: `/api/whatsapp/webhook/config`,
                      method: "POST",
                      body: {
                        instance: form.watch("webhookInstance"),
                        url: form.watch("webhookUrl"),
                        events: selectedEvents,
                        options: {
                          base64: (document.getElementById("option-base64") as HTMLInputElement)?.checked || false,
                          onlyEvents: (document.getElementById("option-onlyevents") as HTMLInputElement)?.checked || false
                        }
                      }
                    })
                    .then((data) => {
                      toast({
                        title: "Configuração salva",
                        description: "Configuração do webhook salva com sucesso.",
                      });
                    })
                    .catch((error) => {
                      toast({
                        title: "Erro ao salvar configuração",
                        description: "Não foi possível salvar a configuração.",
                        variant: "destructive",
                      });
                    });
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure o comportamento das instâncias de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <Alert className="mb-4">
                  <AlertTitle>Nenhuma instância disponível</AlertTitle>
                  <AlertDescription>
                    Crie uma instância primeiro para configurar settings.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Informação sobre a instância atual */}
                  <div className="p-4 bg-gray-50 border rounded-md text-center mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Configurando settings para a instância: 
                      <span className="font-bold text-primary ml-1">
                        {form.watch("settingsInstance") || "Nenhuma instância selecionada"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-medium">Comportamento Geral</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium" htmlFor="rejectCalls">Rejeitar Chamadas</label>
                          <p className="text-xs text-gray-500">Rejeita automaticamente chamadas recebidas</p>
                        </div>
                        <input
                          type="checkbox"
                          id="rejectCalls"
                          name="rejectCalls"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium" htmlFor="groupsIgnore">Ignorar Grupos</label>
                          <p className="text-xs text-gray-500">Ignora mensagens de grupos</p>
                        </div>
                        <input
                          type="checkbox"
                          id="groupsIgnore"
                          name="groupsIgnore"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium" htmlFor="alwaysOnline">Manter Online</label>
                          <p className="text-xs text-gray-500">Mantém o status "online" persistente</p>
                        </div>
                        <input
                          type="checkbox"
                          id="alwaysOnline"
                          name="alwaysOnline"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium" htmlFor="readMessages">Marcar como Lido</label>
                          <p className="text-xs text-gray-500">Marca mensagens recebidas como lidas</p>
                        </div>
                        <input
                          type="checkbox"
                          id="readMessages"
                          name="readMessages"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium" htmlFor="syncFullHistory">Sincronizar Histórico</label>
                          <p className="text-xs text-gray-500">Sincroniza histórico completo de mensagens</p>
                        </div>
                        <input
                          type="checkbox"
                          id="syncFullHistory"
                          name="syncFullHistory"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <h3 className="text-sm font-medium">Mensagem de Recusa de Chamada</h3>
                    <Input
                      id="rejectCallMessage"
                      name="rejectCallMessage"
                      placeholder="Não posso atender agora, por favor envie uma mensagem."
                    />
                    <p className="text-xs text-gray-500">Mensagem enviada ao rejeitar chamadas</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("instances")}
                className="mr-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Instâncias
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Validar se a instância está selecionada
                    if (!form.watch("settingsInstance")) {
                      toast({
                        title: "Selecione uma instância",
                        description: "É necessário selecionar uma instância para obter a configuração.",
                        variant: "destructive",
                      });
                      return;
                    }

                    toast({
                      title: "Obtendo configuração",
                      description: `Buscando configuração atual para ${form.watch("settingsInstance")}`,
                    });

                    apiRequest({
                      url: `/api/whatsapp/settings/${form.watch("settingsInstance")}`,
                      method: "GET",
                    })
                    .then((data) => {
                      // Preencher formulário com dados recebidos
                      if (data && data.settings) {
                        const settings = data.settings;

                        // Definir estado dos checkboxes
                        if (document.getElementById('rejectCalls')) {
                          (document.getElementById('rejectCalls') as HTMLInputElement).checked = settings.rejectCall || false;
                        }

                        if (document.getElementById('groupsIgnore')) {
                          (document.getElementById('groupsIgnore') as HTMLInputElement).checked = settings.groupsIgnore || false;
                        }

                        if (document.getElementById('alwaysOnline')) {
                          (document.getElementById('alwaysOnline') as HTMLInputElement).checked = settings.alwaysOnline || false;
                        }

                        if (document.getElementById('readMessages')) {
                          (document.getElementById('readMessages') as HTMLInputElement).checked = settings.readMessages || false;
                        }

                        if (document.getElementById('syncFullHistory')) {
                          (document.getElementById('syncFullHistory') as HTMLInputElement).checked = settings.syncFullHistory || false;
                        }

                        // Preencher mensagem de recusa de chamada
                        const msgInput = document.getElementById('rejectCallMessage') as HTMLInputElement;
                        if (msgInput && settings.msgCall) {
                          msgInput.value = settings.msgCall;
                        }
                      }

                      toast({
                        title: "Configuração carregada",
                        description: "Configuração atual obtida com sucesso.",
                      });
                    })
                    .catch((error) => {
                      toast({
                        title: "Erro ao obter configuração",
                        description: "Não foi possível obter a configuração atual.",
                        variant: "destructive",
                      });
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Obter Configuração Atual
                </Button>
                <Button
                  onClick={() => {
                    // Validar se a instância está selecionada
                    if (!form.watch("settingsInstance")) {
                      toast({
                        title: "Selecione uma instância",
                        description: "É necessário selecionar uma instância para salvar a configuração.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Implementação para salvar configuração
                    toast({
                      title: "Salvando configuração",
                      description: `Salvando configuração para ${form.watch("settingsInstance")}`,
                    });

                    // Obter valores dos campos de configuração
                    const settings = {
                      instance: form.watch("settingsInstance"),
                      // Configurações de comportamento
                      rejectCalls: (document.getElementById('rejectCalls') as HTMLInputElement)?.checked || false,
                      groupsIgnore: (document.getElementById('groupsIgnore') as HTMLInputElement)?.checked || false,
                      alwaysOnline: (document.getElementById('alwaysOnline') as HTMLInputElement)?.checked || false,
                      readMessages: (document.getElementById('readMessages') as HTMLInputElement)?.checked || false,
                      readStatus: (document.getElementById('readStatus') as HTMLInputElement)?.checked || false,
                      syncFullHistory: (document.getElementById('syncFullHistory') as HTMLInputElement)?.checked || false,
                      // Mensagem de recusa de chamada
                      rejectCallMessage: (document.getElementById('rejectCallMessage') as HTMLInputElement)?.value || ""
                    };

                    apiRequest({
                      url: `/api/whatsapp/settings`,
                      method: "POST",
                      body: settings
                    })
                    .then((data) => {
                      toast({
                        title: "Configuração salva",
                        description: "Configuração salva com sucesso.",
                      });
                    })
                    .catch((error) => {
                      toast({
                        title: "Erro ao salvar configuração",
                        description: "Não foi possível salvar a configuração.",
                        variant: "destructive",
                      });
                    });
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="profileSettings">
          {instances && instances.length > 0 && (
            <ProfileTab 
              instances={instances}
              form={{
                setValue: form.setValue as (field: string, value: any) => void,
                getValues: form.getValues as (field?: string) => any,
                watch: form.watch as (field?: string) => any
              }}
              setActiveTab={setActiveTab}
              profilePictureUrl={profilePictureUrl}
              setProfilePictureUrl={setProfilePictureUrl}
              isLoadingProfilePicture={isLoadingProfilePicture}
              setIsLoadingProfilePicture={setIsLoadingProfilePicture}
              profileInfo={profileInfo}
              setProfileInfo={setProfileInfo}
            />
          )}
        </TabsContent>



        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do WhatsApp</CardTitle>
              <CardDescription>
                Registro de atividades das instâncias do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {isLoadingLogs ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Carregando logs...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Nenhum log encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="border-b pb-3 last:border-b-0"
                      >
                        <div className="flex justify-between">
                          <Badge variant={log.type === 'error' ? 'destructive' : log.type === 'warning' ? 'outline' : 'default'}>
                            {log.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">
                          <span className="font-semibold">
                            {log.instanceName ? `[${log.instanceName}] ` : ''}
                          </span>
                          {log.message}
                        </p>
                        {log.data && (
                          <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("instances")}
                className="mr-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Instâncias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchLogs()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da API WhatsApp</CardTitle>
              <CardDescription>
                Configure as credenciais para a API Evolution WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status da configuração da API */}
              {isLoadingApiStatus ? (
                <div className="flex items-center justify-center p-4 mb-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Verificando configuração...</span>
                </div>
              ) : apiStatus ? (
                <div className="mb-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Status da Configuração</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>URL da API:</span>
                      <Badge 
                        variant={apiStatus.status.apiUrl === 'Configurado' ? 'default' : 'destructive'}
                        className={apiStatus.status.apiUrl === 'Configurado' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                      >
                        {apiStatus.status.apiUrl}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Chave da API:</span>
                      <Badge 
                        variant={apiStatus.status.apiKey === 'Configurado' ? 'default' : 'destructive'}
                        className={apiStatus.status.apiKey === 'Configurado' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                      >
                        {apiStatus.status.apiKey}
                      </Badge>
                    </div>
                    {apiStatus.validation && apiStatus.validation.apiUrlValid === false && (
                      <div className="mt-2 text-red-500 text-sm">
                        <p className="font-medium">Problema com URL:</p>
                        <p>{apiStatus.info?.apiUrlTip}</p>
                      </div>
                    )}
                    {!apiStatus.status.ready && (
                      <div className="mt-4">
                        <Alert variant="destructive">
                          <AlertTitle>Configuração Incompleta</AlertTitle>
                          <AlertDescription>
                            Para usar a integração com WhatsApp, complete a configuração abaixo.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    {apiStatus.status.ready && (
                      <div className="mt-4">
                        <Alert>
                          <AlertTitle className="text-green-700">Configuração Completa</AlertTitle>
                          <AlertDescription className="text-green-600">
                            A API está corretamente configurada e pronta para uso.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchApiStatus()}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verificar novamente
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitApiConfig)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="apiUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da API Evolution</FormLabel>
                        <FormControl>
                          <Input placeholder="https://evolution-api.exemplo.com.br" {...field} />
                        </FormControl>
                        <FormDescription>
                          Insira a URL completa da API Evolution WhatsApp
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave da API</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showApiKey ? "text" : "password"} 
                              placeholder="Sua chave secreta da API" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Insira a chave de autenticação para a API Evolution
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab("instances")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para Instâncias
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar configurações
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Componente FetchProfileDialog removido */}
    </div>
  );
}