import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { normalizeInstanceName } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Schema de validação para criar instância do WhatsApp
const createInstanceSchema = z.object({
  userId: z.number().positive("Selecione um usuário"),
  instanceName: z.string().min(3, "Nome da instância deve ter pelo menos 3 caracteres"),
  phone: z.string().optional(),
  instanciaId: z.string().optional(), // Campo opcional para o ID da instância (será gerado no backend)
});

type CreateInstanceFormValues = z.infer<typeof createInstanceSchema>;

interface WhatsappCreateInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WhatsappCreateInstanceDialog({
  open,
  onOpenChange,
  onSuccess,
}: WhatsappCreateInstanceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([
    // Dados iniciais para teste
    { id: 1, fullName: "Renato Faria", username: "Renato", phone: "5511999999999" }
  ]);

  // Configurar o formulário com validação zod
  const form = useForm<CreateInstanceFormValues>({
    resolver: zodResolver(createInstanceSchema),
    defaultValues: {
      instanceName: "",
      phone: "",
      // Removido campo isPrimary que não existe mais na tabela
    },
  });
  
  // Formatar número de telefone para o formato internacional (ex: 5534999772714)
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";
    
    // Remove todos os caracteres não numéricos
    let digitsOnly = phone.replace(/\D/g, '');
    
    // Remove o 0 inicial se existir (formato brasileiro)
    if (digitsOnly.startsWith('0')) {
      digitsOnly = digitsOnly.substring(1);
    }
    
    // Se já começar com 55, mantém como está
    if (digitsOnly.startsWith('55')) {
      return digitsOnly;
    }
    
    // Caso contrário, adiciona o código do Brasil (55)
    return `55${digitsOnly}`;
  };

  // Atualizar campos quando um usuário é selecionado
  const updateFieldsForUser = (userId: number) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      // Atualizar o número de telefone
      if (selectedUser.phone) {
        const formattedPhone = formatPhoneNumber(selectedUser.phone);
        form.setValue("phone", formattedPhone);
      }
      
      // Gerar nome da instância a partir do primeiro nome do usuário
      const instanceName = normalizeInstanceName(selectedUser.fullName);
      if (instanceName) {
        form.setValue("instanceName", instanceName);
      }
    }
  };

  // Carregar usuários quando o diálogo é aberto
  const loadUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const response = await fetch("/api/users");
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          toast({
            title: "Formato de dados inválido",
            description: "Os dados dos usuários não estão no formato esperado.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro ao buscar usuários",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingUsers(false);
    }
  };

  // Efeito para carregar usuários quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  // Mutação para criar instância
  const createInstanceMutation = useMutation({
    mutationFn: (values: CreateInstanceFormValues) => {
      return apiRequest({
        url: "/api/whatsapp/instances",
        method: "POST",
        body: values
      });
    },
    onSuccess: () => {
      toast({
        title: "Instância criada",
        description: "A instância de WhatsApp foi criada com sucesso.",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      // Mostrar mensagem de erro mais detalhada quando disponível
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          "Ocorreu um erro ao criar a instância de WhatsApp.";
      
      toast({
        title: "Erro ao criar instância",
        description: errorMessage,
        variant: "destructive",
      });
      
      
    },
  });

  // Enviar formulário
  function onSubmit(values: CreateInstanceFormValues) {
    createInstanceMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Instância de WhatsApp</DialogTitle>
          <DialogDescription>
            Configure uma nova instância do WhatsApp para um usuário.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <Select
                    disabled={isFetchingUsers || createInstanceMutation.isPending}
                    onValueChange={(value) => {
                      const userId = parseInt(value);
                      field.onChange(userId);
                      updateFieldsForUser(userId);
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o usuário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName} ({user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o usuário para quem esta instância será criada.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="5534999772714"
                      {...field}
                      disabled={createInstanceMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Número de telefone completo com código do país (ex: 5534999772714).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instanceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Instância</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="nome_da_instancia"
                      {...field}
                      disabled={createInstanceMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Um nome único para identificar esta instância. Use apenas letras, números e sublinhados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Removido campo isPrimary que não existe mais na tabela */}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={createInstanceMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createInstanceMutation.isPending}>
                {createInstanceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Instância
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}