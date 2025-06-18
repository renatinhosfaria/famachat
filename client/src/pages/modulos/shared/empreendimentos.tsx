import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Componente modal para o formulário de cadastro
import { NovoEmpreendimentoForm } from '@/components/NovoEmpreendimentoForm';

interface Empreendimento {
  id: string;
  nome: string;
  proprietario: string;
  endereco: string;
}

export default function EmpreendimentosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [empreendimentoParaEditar, setEmpreendimentoParaEditar] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const [proprietarioIdParam, setProprietarioIdParam] = useState<string | null>(null);
  
  // Verificar parâmetros da URL para abrir modal automaticamente
  useEffect(() => {
    // Extrair parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const novoParam = params.get('novo');
    
    // Se tiver o parâmetro 'novo=true', abrir o modal automaticamente
    if (novoParam === 'true') {
      abrirModal();
      // Limpar a URL para não manter o parâmetro
      navigate('/empreendimentos', { replace: true });
    }
  }, [location]);

  // Buscar lista de empreendimentos
  const { data: empreendimentos, isLoading, error } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: async () => {
      const response = await axios.get('/api/empreendimentos-page');
      return response.data as Empreendimento[];
    }
  });

  // Função para abrir o modal de cadastro
  const abrirModal = (id?: string) => {
    if (id) {
      setEmpreendimentoParaEditar(id);
    } else {
      setEmpreendimentoParaEditar(null);
    }
    setModalAberto(true);
  };

  // Função para fechar o modal de cadastro
  const fecharModal = () => {
    setModalAberto(false);
    setEmpreendimentoParaEditar(null);
    setProprietarioIdParam(null);
  };
  
  // Efeito para verificar se há um proprietarioId na URL e abrir o modal
  useEffect(() => {
    if (location) {
      const url = new URL(window.location.href);
      const proprietarioId = url.searchParams.get('proprietarioId');
      
      if (proprietarioId) {
        setProprietarioIdParam(proprietarioId);
        setModalAberto(true);
      }
    }
  }, [location]);

  // Função para excluir um empreendimento
  const excluirEmpreendimento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este empreendimento?')) {
      return;
    }

    try {
      await axios.delete(`/api/empreendimentos-page/${id}`);
      
      toast({
        title: 'Empreendimento excluído',
        description: 'O empreendimento foi excluído com sucesso.',
        variant: 'default',
      });
      
      // Atualizar a lista após excluir
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
    } catch (error) {
      
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o empreendimento.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/imoveis')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Empreendimentos</h1>
        <button
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => abrirModal()}
        >
          <Plus className="mr-2" size={18} />
          Novo Empreendimento
        </button>
      </div>

      {isLoading && <div className="text-center py-4">Carregando empreendimentos...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Erro ao carregar empreendimentos. Por favor, tente novamente.
        </div>
      )}

      {empreendimentos && empreendimentos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum empreendimento cadastrado ainda.
        </div>
      )}

      {empreendimentos && empreendimentos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">NOME</th>
                <th className="py-2 px-4 border-b text-left">PROPRIETÁRIO</th>
                <th className="py-2 px-4 border-b text-left">ENDEREÇO</th>
                <th className="py-2 px-4 border-b text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {empreendimentos.map((empreendimento) => (
                <tr key={empreendimento.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    <Link 
                      to={`/empreendimento/${empreendimento.id}`}
                      className="text-blue-500 hover:text-blue-700 font-medium"
                    >
                      {empreendimento.nome}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b">{empreendimento.proprietario}</td>
                  <td className="py-2 px-4 border-b">{empreendimento.endereco}</td>
                  <td className="py-2 px-4 border-b text-center">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => navigate(`/imoveis/${empreendimento.id}/apartamento`)}
                        className="text-green-500 hover:text-green-700"
                        title="Adicionar apartamento"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => abrirModal(empreendimento.id)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar empreendimento"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => excluirEmpreendimento(empreendimento.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Excluir empreendimento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <NovoEmpreendimentoForm
              empreendimentoId={empreendimentoParaEditar}
              proprietarioId={proprietarioIdParam}
              onClose={fecharModal}
              onSuccess={() => {
                fecharModal();
                queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}