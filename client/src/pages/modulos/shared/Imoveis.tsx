import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Ruler, Plus, Home, Building, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useRoute } from 'wouter';
import { NovoImovelModal } from '@/components/NovoImovelModal';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { atualizarZonasImoveisEmLote } from '@/services/geocoding';

// Interface para apartamentos vindos da API
interface Apartamento {
  id_apartamento: number;
  id_empreendimento: number;
  titulo_descritivo_apartamento?: string;
  descricao_apartamento?: string;
  valor_venda_apartamento: number;
  quartos_apartamento: number;
  suites_apartamento: number;
  banheiros_apartamento: number;
  vagas_garagem_apartamento: number;
  area_privativa_apartamento: number;
  sacada_varanda_apartamento: boolean;
  tipo_garagem_apartamento?: string;
  zona_empreendimento?: string;
  bairro_empreendimento?: string;
  cidade_empreendimento?: string;
  url_foto_capa_empreendimento?: string;
  nome_empreendimento?: string;
  prazo_entrega_empreendimento?: string;
}

// Interface para o componente de cards de imóveis
interface Imovel {
  id: number;
  tipo: string;
  titulo: string;
  preco: number;
  localizacao: string;
  zona: string;
  imagem: string;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaPrivativa: number;
  sacada: boolean;
  descricao: string;
  empreendimentoId: number;
  tipoGaragem: string;
  status: string;
  prazoEntrega: string;
}

function NovoApartamentoForm({ onCancel }: { onCancel: () => void }) {
  const form = useForm({
    defaultValues: {
      id: uuidv4(),
      referencia: '',
      dataCadastro: new Date().toISOString().slice(0, 10),
      ultimaAtualizacao: new Date().toISOString().slice(0, 10),
      proprietarioTipo: '',
      proprietarioNome: '',
      proprietarioTelefone: '',
      construtoraNome: '',
      construtoraContato: '',
      construtoraTelefone: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      blocos: '',
      andares: '',
      aptosPorAndar: '',
      caracteristicasEmpreendimento: '',
      valorCondominio: '',
      status: '',
      areaPrivativa: '',
      quartos: '',
      suites: '',
      banheiros: '',
      vagas: '',
      tipoVaga: '',
      sacada: '',
      caracteristicasApartamento: '',
      valorVenda: '',
      titulo: '',
      descricao: '',
      statusPublicacao: '',
    },
  });

  const onSubmit = (data: any) => {
    // Aqui você pode enviar os dados para o backend
    alert('Imóvel cadastrado! (simulação)');
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="referencia" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Referência interna</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="dataCadastro" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Data de cadastro</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="ultimaAtualizacao" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Última atualização</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="space-y-2">
          <FormLabel>Proprietário</FormLabel>
          <div className="flex gap-2">
            <Button type="button" variant={form.watch('proprietarioTipo') === 'vendedor' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'vendedor')}>Vendedor (Pessoa Física)</Button>
            <Button type="button" variant={form.watch('proprietarioTipo') === 'construtora' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'construtora')}>Construtora</Button>
          </div>
          {form.watch('proprietarioTipo') === 'vendedor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="proprietarioNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="proprietarioTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {form.watch('proprietarioTipo') === 'construtora' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="construtoraNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Construtora</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraContato" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <FormLabel>Dados do Empreendimento</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="endereco" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="numero" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="complemento" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="bairro" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="cidade" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="estado" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="cep" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="blocos" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Blocos/Torres</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="andares" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Andares</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="aptosPorAndar" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Aptos por Andar</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="caracteristicasEmpreendimento" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Características do Empreendimento</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="valorCondominio" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Condomínio</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel>Dados do Apartamento</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="status" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="areaPrivativa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Área Privativa (m²)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="quartos" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Quartos</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="suites" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Suítes</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="banheiros" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Banheiros</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="vagas" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Vagas Garagem</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="tipoVaga" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Vaga</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="sacada" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Sacada/Varanda</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="caracteristicasApartamento" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Características do Apartamento</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel>Informações Comerciais</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="valorVenda" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor de Venda</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="titulo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Título Descritivo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="descricao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Completa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="statusPublicacao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status da Publicação</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="bg-primary text-white">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}

function NovaCasaForm({ onCancel }: { onCancel: () => void }) {
  const form = useForm({
    defaultValues: {
      id: uuidv4(),
      referencia: '',
      dataCadastro: new Date().toISOString().slice(0, 10),
      ultimaAtualizacao: new Date().toISOString().slice(0, 10),
      tipoCasa: '',
      proprietarioTipo: '',
      proprietarioNome: '',
      proprietarioTelefone: '',
      construtoraNome: '',
      construtoraContato: '',
      construtoraTelefone: '',
      status: '',
      areaPrivativa: '',
      quartos: '',
      suites: '',
      banheiros: '',
      vagas: '',
      tipoVaga: '',
      caracteristicasCasa: '',
      valorVenda: '',
      titulo: '',
      descricao: '',
      statusPublicacao: '',
    },
  });
  const onSubmit = (data: any) => {
    alert('Casa cadastrada! (simulação)');
    onCancel();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="referencia" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Referência interna</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="dataCadastro" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Data de cadastro</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="ultimaAtualizacao" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Última atualização</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="tipoCasa" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Casa</FormLabel>
              <FormControl><Input {...field} placeholder="Térrea, Sobrado, Geminada Térrea, Geminada Sobrado" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="space-y-2">
          <FormLabel>Proprietário</FormLabel>
          <div className="flex gap-2">
            <Button type="button" variant={form.watch('proprietarioTipo') === 'vendedor' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'vendedor')}>Vendedor (Pessoa Física)</Button>
            <Button type="button" variant={form.watch('proprietarioTipo') === 'construtora' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'construtora')}>Construtora</Button>
          </div>
          {form.watch('proprietarioTipo') === 'vendedor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="proprietarioNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="proprietarioTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {form.watch('proprietarioTipo') === 'construtora' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="construtoraNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Construtora</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraContato" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <FormLabel>Dados da Casa</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="status" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="areaPrivativa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Área Privativa (m²)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="quartos" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Quartos</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="suites" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Suítes</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="banheiros" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Banheiros</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="vagas" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Vagas Garagem</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="tipoVaga" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Vaga</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="caracteristicasCasa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Características da Casa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel>Informações Comerciais</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="valorVenda" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor de Venda</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="titulo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Título Descritivo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="descricao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Completa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="statusPublicacao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status da Publicação</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="bg-primary text-white">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}

function NovaCasaCondominioForm({ onCancel }: { onCancel: () => void }) {
  const form = useForm({
    defaultValues: {
      id: uuidv4(),
      referencia: '',
      dataCadastro: new Date().toISOString().slice(0, 10),
      ultimaAtualizacao: new Date().toISOString().slice(0, 10),
      proprietarioTipo: '',
      proprietarioNome: '',
      proprietarioTelefone: '',
      construtoraNome: '',
      construtoraContato: '',
      construtoraTelefone: '',
      enderecoCondominio: '',
      enderecoCasa: '',
      caracteristicasCondominio: '',
      valorCondominio: '',
      tipoCasa: '',
      status: '',
      areaPrivativa: '',
      quartos: '',
      suites: '',
      banheiros: '',
      vagas: '',
      tipoVaga: '',
      caracteristicasCasa: '',
      valorVenda: '',
      titulo: '',
      descricao: '',
      statusPublicacao: '',
    },
  });
  const onSubmit = (data: any) => {
    alert('Casa em Condomínio cadastrada! (simulação)');
    onCancel();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="referencia" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Referência interna</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="dataCadastro" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Data de cadastro</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="ultimaAtualizacao" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Última atualização</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="space-y-2">
          <FormLabel>Proprietário</FormLabel>
          <div className="flex gap-2">
            <Button type="button" variant={form.watch('proprietarioTipo') === 'vendedor' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'vendedor')}>Vendedor (Pessoa Física)</Button>
            <Button type="button" variant={form.watch('proprietarioTipo') === 'construtora' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'construtora')}>Construtora</Button>
          </div>
          {form.watch('proprietarioTipo') === 'vendedor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="proprietarioNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="proprietarioTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {form.watch('proprietarioTipo') === 'construtora' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="construtoraNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Construtora</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraContato" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <FormLabel>Dados do Empreendimento</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="enderecoCondominio" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço do Condomínio</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="enderecoCasa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço da Casa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="caracteristicasCondominio" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Características do Condomínio</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="valorCondominio" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Condomínio</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel>Dados da Casa</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="tipoCasa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Casa</FormLabel>
                <FormControl><Input {...field} placeholder="Térrea, Sobrado" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="status" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="areaPrivativa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Área Privativa (m²)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="quartos" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Quartos</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="suites" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Suítes</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="banheiros" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Banheiros</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="vagas" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Vagas Garagem</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="tipoVaga" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Vaga</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="caracteristicasCasa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Características da Casa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel>Informações Comerciais</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="valorVenda" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor de Venda</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="titulo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Título Descritivo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="descricao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Completa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="statusPublicacao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status da Publicação</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="bg-primary text-white">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}

function NovoLoteForm({ onCancel }: { onCancel: () => void }) {
  const form = useForm({
    defaultValues: {
      id: uuidv4(),
      referencia: '',
      dataCadastro: new Date().toISOString().slice(0, 10),
      ultimaAtualizacao: new Date().toISOString().slice(0, 10),
      proprietarioTipo: '',
      proprietarioNome: '',
      proprietarioTelefone: '',
      construtoraNome: '',
      construtoraContato: '',
      construtoraTelefone: '',
      status: '',
      area: '',
      quartos: '',
      suites: '',
      caracteristicasCasa: '',
      valorVenda: '',
      titulo: '',
      descricao: '',
      statusPublicacao: '',
    },
  });
  const onSubmit = (data: any) => {
    alert('Lote cadastrado! (simulação)');
    onCancel();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="referencia" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Referência interna</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="dataCadastro" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Data de cadastro</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="ultimaAtualizacao" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Última atualização</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="space-y-2">
          <FormLabel>Proprietário</FormLabel>
          <div className="flex gap-2">
            <Button type="button" variant={form.watch('proprietarioTipo') === 'vendedor' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'vendedor')}>Vendedor (Pessoa Física)</Button>
            <Button type="button" variant={form.watch('proprietarioTipo') === 'construtora' ? 'default' : 'outline'} onClick={() => form.setValue('proprietarioTipo', 'construtora')}>Construtora</Button>
          </div>
          {form.watch('proprietarioTipo') === 'vendedor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="proprietarioNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="proprietarioTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {form.watch('proprietarioTipo') === 'construtora' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="construtoraNome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Construtora</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraContato" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="construtoraTelefone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Contato</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <FormLabel>Dados do Lote</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="status" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="area" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Área (m²)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="quartos" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Quartos</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="suites" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Suítes</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="caracteristicasCasa" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Características do Lote</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel>Informações Comerciais</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="valorVenda" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor de Venda</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="titulo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Título Descritivo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="descricao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Completa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="statusPublicacao" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Status da Publicação</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="bg-primary text-white">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}

const Imoveis: React.FC = () => {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState({
    tipo: '',
    localizacao: '',
    zona: '',
    status: '',
    prazoEntregaMes: '',
    prazoEntregaAno: '',
    precoMin: '',
    precoMax: '',
    areaPrivativaMin: '',
    areaPrivativaMax: '',
    quartos: '',
    suites: '',
    banheiros: '',
    vagas: '',
    sacada: false
  });

  const [openNovoImovel, setOpenNovoImovel] = useState(false);
  const [tipoNovoImovel, setTipoNovoImovel] = useState<string | null>(null);
  const [empreendimentoId, setEmpreendimentoId] = useState<string | undefined>(undefined);
  const [apartamentoId, setApartamentoId] = useState<number | null>(null);
  const [openEditarApartamento, setOpenEditarApartamento] = useState(false);
  const [openConfirmarExclusao, setOpenConfirmarExclusao] = useState(false);
  const [, navigate] = useLocation();
  
  // Nova rota formatada para capturar tanto o empreendimentoId quanto o tipoImovel
  const [matchDetalhado, paramsDetalhado] = useRoute('/imoveis/:empreendimentoId/:tipoImovel');
  
  // Estado para armazenar os apartamentos
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Função para buscar os apartamentos do banco de dados
  const buscarApartamentos = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      const [respostaApartamentos, respostaEmpreendimentos] = await Promise.all([
        axios.get('/api/apartamentos'),
        axios.get('/api/empreendimentos-page')
      ]);
      
      // Atualizar as zonas dos imóveis usando o mapeamento local
      const apartamentosComZonas = atualizarZonasImoveisEmLote(respostaApartamentos.data);
      setApartamentos(apartamentosComZonas);
      setEmpreendimentos(respostaEmpreendimentos.data);
    } catch (error) {
      
      setErro('Falha ao carregar os apartamentos. Por favor, tente novamente.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Efeito para buscar os apartamentos quando o componente for montado
  useEffect(() => {
    buscarApartamentos();
  }, []);
  
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const converterParaImoveis = (apartamentos: Apartamento[]): Imovel[] => {
    return apartamentos.map((apt) => {
      // Buscar o empreendimento correspondente para obter o status
      const empreendimento = empreendimentos.find(emp => emp.id === apt.id_empreendimento);
      
      return {
        id: apt.id_apartamento,
        tipo: 'Apartamento',
        titulo: apt.titulo_descritivo_apartamento || 
          `Apartamento ${apt.quartos_apartamento} quartos no ${apt.bairro_empreendimento || ''}`,
        preco: apt.valor_venda_apartamento || 0,
        localizacao: [
          apt.bairro_empreendimento, 
          apt.cidade_empreendimento
        ].filter(Boolean).join(', '),
        // Utiliza o valor da zona do banco de dados
        zona: apt.zona_empreendimento || '',
        imagem: apt.url_foto_capa_empreendimento || '/assets/img/apartamento-placeholder.jpg',
        quartos: apt.quartos_apartamento || 0,
        suites: apt.suites_apartamento || 0,
        banheiros: apt.banheiros_apartamento || 0,
        vagas: apt.vagas_garagem_apartamento || 0,
        areaPrivativa: apt.area_privativa_apartamento || 0,
        sacada: apt.sacada_varanda_apartamento || false,
        descricao: apt.descricao_apartamento || '',
        empreendimentoId: apt.id_empreendimento || 0,
        tipoGaragem: apt.tipo_garagem_apartamento || 'Não informado',
        status: empreendimento?.status || 'Não informado',
        prazoEntrega: apt.prazo_entrega_empreendimento || 'Não informado'
      };
    });
  };
  
  // Filtra os imóveis com base nos filtros aplicados
  const imoveis: Imovel[] = converterParaImoveis(apartamentos);
  
  const imoveisFiltrados = imoveis.filter((imovel: Imovel) => {
    // Filtrar por tipo de imóvel
    if (filtros.tipo && imovel.tipo !== filtros.tipo) {
      return false;
    }
    
    // Filtrar por zona
    if (filtros.zona && imovel.zona !== filtros.zona) {
      return false;
    }
    
    // Filtrar por status
    if (filtros.status && imovel.status !== filtros.status) {
      return false;
    }
    
    // Filtrar por prazo de entrega (até a data selecionada)
    if (filtros.prazoEntregaMes && filtros.prazoEntregaMes !== 'todos' && filtros.prazoEntregaAno) {
      // Extrair mês e ano do prazo de entrega do imóvel
      const prazoEntregaText = imovel.prazoEntrega.toLowerCase();
      
      // Mapeamento de meses para números
      const mesesMap: { [key: string]: number } = {
        'jan': 1, 'janeiro': 1,
        'fev': 2, 'fevereiro': 2,
        'mar': 3, 'março': 3,
        'abr': 4, 'abril': 4,
        'mai': 5, 'maio': 5,
        'jun': 6, 'junho': 6,
        'jul': 7, 'julho': 7,
        'ago': 8, 'agosto': 8,
        'set': 9, 'setembro': 9,
        'out': 10, 'outubro': 10,
        'nov': 11, 'novembro': 11,
        'dez': 12, 'dezembro': 12
      };
      
      // Encontrar mês no texto
      let mesImovel = 0;
      for (const [nomeMs, numeroMs] of Object.entries(mesesMap)) {
        if (prazoEntregaText.includes(nomeMs)) {
          mesImovel = numeroMs;
          break;
        }
      }
      
      // Encontrar ano no texto
      const anoMatch = prazoEntregaText.match(/20\d{2}/);
      const anoImovel = anoMatch ? parseInt(anoMatch[0]) : 0;
      
      // Se conseguiu extrair mês e ano, fazer a comparação
      if (mesImovel > 0 && anoImovel > 0) {
        const mesFilter = mesesMap[filtros.prazoEntregaMes];
        const anoFilter = parseInt(filtros.prazoEntregaAno);
        
        // Comparar ano primeiro, depois mês
        if (anoImovel > anoFilter || (anoImovel === anoFilter && mesImovel > mesFilter)) {
          return false; // Filtrar imóvel que entrega após a data limite
        }
      }
    }
    
    // Filtrar apenas por ano se apenas o ano estiver selecionado
    if ((!filtros.prazoEntregaMes || filtros.prazoEntregaMes === 'todos') && filtros.prazoEntregaAno) {
      const anoFilterNumber = parseInt(filtros.prazoEntregaAno);
      const prazoEntregaText = imovel.prazoEntrega.toLowerCase();
      
      // Identificar o ano no texto
      const anoMatch = prazoEntregaText.match(/20\d{2}/);
      if (anoMatch) {
        const anoImovel = parseInt(anoMatch[0]);
        
        // Mostrar apenas imóveis que entregam até o ano selecionado
        if (anoImovel > anoFilterNumber) {
          return false;
        }
      }
    }
    
    // Filtrar por preço mínimo
    if (filtros.precoMin && imovel.preco < Number(filtros.precoMin)) {
      return false;
    }
    
    // Filtrar por preço máximo
    if (filtros.precoMax && imovel.preco > Number(filtros.precoMax)) {
      return false;
    }
    
    // Filtrar por área privativa mínima
    if (filtros.areaPrivativaMin && imovel.areaPrivativa < Number(filtros.areaPrivativaMin)) {
      return false;
    }
    
    // Filtrar por área privativa máxima
    if (filtros.areaPrivativaMax && imovel.areaPrivativa > Number(filtros.areaPrivativaMax)) {
      return false;
    }
    
    // Filtrar por localização
    if (filtros.localizacao && !imovel.localizacao.toLowerCase().includes(filtros.localizacao.toLowerCase())) {
      return false;
    }
    
    // Filtrar por número de quartos
    if (filtros.quartos) {
      if (filtros.quartos === '4+' && imovel.quartos < 4) {
        return false;
      } else if (Number(filtros.quartos) !== imovel.quartos) {
        return false;
      }
    }
    
    // Filtrar por número de suítes
    if (filtros.suites) {
      if (filtros.suites === '4+' && imovel.suites < 4) {
        return false;
      } else if (Number(filtros.suites) !== imovel.suites) {
        return false;
      }
    }
    

    
    // Filtrar por número de vagas
    if (filtros.vagas) {
      if (filtros.vagas === '4+' && imovel.vagas < 4) {
        return false;
      } else if (Number(filtros.vagas) !== imovel.vagas) {
        return false;
      }
    }
    
    // Filtrar por sacada/varanda
    if (filtros.sacada && !imovel.sacada) {
      return false;
    }
    
    return true;
  });
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const empreendimentoIdParam = urlParams.get('empreendimentoId');
    
    if (empreendimentoIdParam) {
      setEmpreendimentoId(empreendimentoIdParam);
      setOpenNovoImovel(true);
      return;
    }
  }, []);
  
  // Verificar nova rota com parâmetros na URL
  useEffect(() => {
    
    // Verifica a nova rota estruturada
    if (matchDetalhado && paramsDetalhado?.empreendimentoId && paramsDetalhado?.tipoImovel) {
      
      setEmpreendimentoId(paramsDetalhado.empreendimentoId);
      setTipoNovoImovel(paramsDetalhado.tipoImovel);
      setOpenNovoImovel(true);
    }
  }, [matchDetalhado, paramsDetalhado]);

  const tiposImovel = [
    { label: 'Apartamentos', value: 'apartamento' },
    { label: 'Casas', value: 'casa' },
    { label: 'Casas em Condomínio', value: 'casa-condominio' },
    { label: 'Lotes', value: 'lote' },
  ];

  const statusImovel = {
    apartamento: ['Lançamento', 'Em construção', 'Novo', 'Usado'],
    casa: ['Lançamento', 'Em construção', 'Nova', 'Usada'],
    'casa-condominio': ['Lançamento', 'Em construção', 'Nova', 'Usada'],
    lote: ['Lançamento', 'Em construção', 'Novo'],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Imóveis</h1>
        <div className="flex gap-2 w-full md:w-auto">
          {/* Barra de busca */}
          <div className="relative flex-1 md:flex-none md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar imóveis..."
              className="pl-10"
            />
          </div>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => navigate('/proprietarios')}
          >
            Proprietários
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => navigate('/empreendimentos')}
          >
            Empreendimentos
          </Button>
          <Dialog open={openNovoImovel} onOpenChange={setOpenNovoImovel}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-primary text-white" onClick={() => setTipoNovoImovel(null)}>
                <Plus className="h-4 w-4" />
                Novo Imóvel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Novo Imóvel</DialogTitle>
              </DialogHeader>
              <NovoImovelModal empreendimentoId={empreendimentoId} tipoImovel={tipoNovoImovel || undefined} />
            </DialogContent>
          </Dialog>
          
          {/* Modal de Edição de Apartamento */}
          <Dialog open={openEditarApartamento} onOpenChange={setOpenEditarApartamento}>
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Editar Apartamento</DialogTitle>
              </DialogHeader>
              {apartamentoId && (
                <NovoImovelModal 
                  empreendimentoId={imoveis.find(i => i.id === apartamentoId)?.empreendimentoId?.toString()}
                  tipoImovel="apartamento" 
                  modo="editar"
                  apartamentoId={apartamentoId}
                  onSaveComplete={() => {
                    setOpenEditarApartamento(false);
                    buscarApartamentos();
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          
          {/* Modal de Confirmação de Exclusão */}
          <AlertDialog open={openConfirmarExclusao} onOpenChange={setOpenConfirmarExclusao}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Apartamento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este apartamento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    if (apartamentoId) {
                      try {
                        await axios.delete(`/api/apartamentos/${apartamentoId}`);
                        toast({
                          title: "Apartamento excluído com sucesso",
                          variant: "default",
                        });
                        buscarApartamentos();
                      } catch (error) {
                        
                        toast({
                          title: "Erro ao excluir apartamento",
                          description: "Ocorreu um erro ao tentar excluir o apartamento. Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Menu Lateral de Filtros */}
        <div className="w-full lg:w-1/4 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Filtros</h2>
          
          <div className="space-y-6">
            {/* Localização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Bairro, cidade..."
                  className="pl-10"
                  value={filtros.localizacao}
                  onChange={(e) => setFiltros({ ...filtros, localizacao: e.target.value })}
                />
              </div>
            </div>

            {/* Zona da Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona da Cidade
              </label>
              <Select
                value={filtros.zona}
                onValueChange={(value) => setFiltros({ ...filtros, zona: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="norte">Zona Norte</SelectItem>
                  <SelectItem value="sul">Zona Sul</SelectItem>
                  <SelectItem value="leste">Zona Leste</SelectItem>
                  <SelectItem value="oeste">Zona Oeste</SelectItem>
                  <SelectItem value="centro">Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Imóvel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Imóvel
              </label>
              <Select
                value={filtros.tipo}
                onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposImovel.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={filtros.status}
                onValueChange={(value) => setFiltros({ ...filtros, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pronto">Pronto</SelectItem>
                  <SelectItem value="Lançamento">Lançamento</SelectItem>
                  <SelectItem value="Em Construção">Em Construção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prazo de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo de Entrega
              </label>
              <div className="flex gap-2">
                <Select
                  value={filtros.prazoEntregaMes}
                  onValueChange={(value) => setFiltros({ ...filtros, prazoEntregaMes: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="janeiro">Janeiro</SelectItem>
                    <SelectItem value="fevereiro">Fevereiro</SelectItem>
                    <SelectItem value="março">Março</SelectItem>
                    <SelectItem value="abril">Abril</SelectItem>
                    <SelectItem value="maio">Maio</SelectItem>
                    <SelectItem value="junho">Junho</SelectItem>
                    <SelectItem value="julho">Julho</SelectItem>
                    <SelectItem value="agosto">Agosto</SelectItem>
                    <SelectItem value="setembro">Setembro</SelectItem>
                    <SelectItem value="outubro">Outubro</SelectItem>
                    <SelectItem value="novembro">Novembro</SelectItem>
                    <SelectItem value="dezembro">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filtros.prazoEntregaAno}
                  onValueChange={(value) => setFiltros({ ...filtros, prazoEntregaAno: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                    <SelectItem value="2029">2029</SelectItem>
                    <SelectItem value="2030">2030</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Faixa de Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faixa de Preço
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={filtros.precoMin}
                  onChange={(e) => setFiltros({ ...filtros, precoMin: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={filtros.precoMax}
                  onChange={(e) => setFiltros({ ...filtros, precoMax: e.target.value })}
                />
              </div>
            </div>

            {/* Área Privativa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área Privativa (m²)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={filtros.areaPrivativaMin}
                  onChange={(e) => setFiltros({ ...filtros, areaPrivativaMin: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={filtros.areaPrivativaMax}
                  onChange={(e) => setFiltros({ ...filtros, areaPrivativaMax: e.target.value })}
                />
              </div>
            </div>

            {/* Quartos e Suítes na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quartos e Suítes
              </label>
              <div className="flex gap-2">
                <Select
                  value={filtros.quartos}
                  onValueChange={(value) => setFiltros({ ...filtros, quartos: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Quartos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 quarto</SelectItem>
                    <SelectItem value="2">2 quartos</SelectItem>
                    <SelectItem value="3">3 quartos</SelectItem>
                    <SelectItem value="4">4 quartos</SelectItem>
                    <SelectItem value="5+">5+ quartos</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filtros.suites}
                  onValueChange={(value) => setFiltros({ ...filtros, suites: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Suítes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 suíte</SelectItem>
                    <SelectItem value="2">2 suítes</SelectItem>
                    <SelectItem value="3">3 suítes</SelectItem>
                    <SelectItem value="4+">4+ suítes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vagas de Garagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vagas de Garagem
              </label>
              <Select
                value={filtros.vagas}
                onValueChange={(value) => setFiltros({ ...filtros, vagas: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Número de vagas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 vaga</SelectItem>
                  <SelectItem value="2">2 vagas</SelectItem>
                  <SelectItem value="3">3 vagas</SelectItem>
                  <SelectItem value="4+">4+ vagas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sacada/Varanda */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sacada"
                checked={filtros.sacada}
                onCheckedChange={(checked) => setFiltros({ ...filtros, sacada: checked as boolean })}
              />
              <label
                htmlFor="sacada"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Sacada/Varanda
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Imóveis */}
        <div className="w-full lg:w-3/4">
          {carregando ? (
            <div className="flex justify-center items-center h-40">
              <p>Carregando imóveis...</p>
            </div>
          ) : erro ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600">{erro}</p>
              <Button variant="outline" className="mt-2" onClick={buscarApartamentos}>
                Tentar novamente
              </Button>
            </div>
          ) : imoveisFiltrados.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-gray-500">Não foram encontrados imóveis com os critérios selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imoveisFiltrados.map((imovel: Imovel) => (
                <Card key={imovel.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="relative">
                    <img
                      src={imovel.imagem}
                      alt={imovel.titulo}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-sm font-medium">
                      {imovel.tipo}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{imovel.titulo}</h3>
                    <p className="text-gray-600 mb-4 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {imovel.localizacao}
                      {imovel.zona && <span className="text-sm text-gray-500">({imovel.zona})</span>}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1" title="Quartos">
                        <Bed className="h-4 w-4 text-gray-500" />
                        <span>{imovel.quartos} quartos</span>
                      </div>
                      {imovel.suites > 0 && (
                        <div className="flex items-center gap-1" title="Suítes">
                          <Bath className="h-4 w-4 text-gray-500" />
                          <span>{imovel.suites} suíte{imovel.suites > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1" title="Banheiros">
                        <Bath className="h-4 w-4 text-gray-500" />
                        <span>{imovel.banheiros} banheiro{imovel.banheiros > 1 ? 's' : ''}</span>
                      </div>
                      {imovel.vagas > 0 && (
                        <div className="flex items-center gap-1" title="Vagas">
                          <Car className="h-4 w-4 text-gray-500" />
                          <span>{imovel.vagas} vaga{imovel.vagas > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1" title="Área Privativa">
                        <Ruler className="h-4 w-4 text-gray-500" />
                        <span>{imovel.areaPrivativa}m²</span>
                      </div>
                      {imovel.sacada && (
                        <div className="flex items-center gap-1" title="Sacada/Varanda">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span>Sacada</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        {formatarMoeda(imovel.preco)}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/empreendimento/${imovel.empreendimentoId}`)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Imoveis; 