import React, { useState, useEffect } from 'react';
import { useProprietarios, Proprietario, ProprietarioPF, Construtora } from '@/hooks/use-proprietarios';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2, Building2, User, Building, PlusSquare, Search, Filter, ArrowLeft } from 'lucide-react';
import { NovoProprietarioModal } from '@/components/NovoProprietarioModal';
import { ConfirmarExclusaoModal } from '@/components/ConfirmarExclusaoModal';
import { DetalhesConstrutoraModal } from '@/components/DetalhesConstrutoraModal';
import { useLocation } from 'wouter';
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Proprietarios: React.FC = () => {
  const { proprietarios, isLoading, isError, createProprietario, updateProprietario, deleteProprietario } = useProprietarios();
  const [openNovo, setOpenNovo] = useState(false);
  const [editData, setEditData] = useState<Proprietario | null>(null);
  const [excluirId, setExcluirId] = useState<number | null>(null);
  const [detalhesConstrutora, setDetalhesConstrutora] = useState<Construtora | null>(null);
  const [, navigate] = useLocation();
  
  // Estados para busca e filtro
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'Pessoa Física' | 'Construtora'>('todos');
  const [proprietariosFiltrados, setProprietariosFiltrados] = useState<Proprietario[]>([]);

  // Efeito para verificar se deve abrir o modal automaticamente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const abrirModal = params.get('abrirModal');
    if (abrirModal === 'true') {
      setOpenNovo(true);
      // Limpar o parâmetro da URL sem recarregar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleSave = async (data: Omit<Proprietario, 'id'>) => {
    if (editData) {
      if (data.tipo === 'Pessoa Física') {
        const updatedData: ProprietarioPF = {
          ...data,
          id: editData.id,
          tipo: 'Pessoa Física',
          nome: data.nome || '',
          celular: (data as ProprietarioPF).celular,
          email: (data as ProprietarioPF).email,
          cpf: (data as ProprietarioPF).cpf
        };
        await updateProprietario.mutateAsync(updatedData);
      } else {
        const updatedData: Construtora = {
          ...data,
          id: editData.id,
          tipo: 'Construtora',
          nome: data.nome || '',
          cpfCnpj: (data as Construtora).cpfCnpj,
          razaoSocial: (data as Construtora).razaoSocial,
          contatos: (data as Construtora).contatos
        };
        await updateProprietario.mutateAsync(updatedData);
      }
    } else {
      await createProprietario.mutateAsync(data);
    }
    setOpenNovo(false);
    setEditData(null);
  };

  const handleExcluir = async () => {
    if (excluirId) {
      await deleteProprietario.mutateAsync(excluirId);
      setExcluirId(null);
    }
  };
  
  // Efeito para filtrar proprietários quando a busca ou filtro mudar
  useEffect(() => {
    if (!proprietarios) {
      setProprietariosFiltrados([]);
      return;
    }
    
    let resultado = [...proprietarios];
    
    // Filtrar por tipo
    if (tipoFiltro !== 'todos') {
      resultado = resultado.filter(p => p.tipo === tipoFiltro);
    }
    
    // Filtrar pela busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim();
      resultado = resultado.filter(p => {
        const nome = p.tipo === 'Construtora' 
          ? ((p as Construtora).nomeConstrutora || p.nome || '').toLowerCase() 
          : (p.nome || '').toLowerCase();
        
        return nome.includes(termoBusca);
      });
    }
    
    setProprietariosFiltrados(resultado);
  }, [proprietarios, busca, tipoFiltro]);
  
  // Função para normalizar texto para comparação (remover acentos e converter para minúsculas)
  const normalizar = (texto: string) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
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
        <h1 className="text-3xl font-bold">Proprietários</h1>
        <Button variant="default" onClick={() => setOpenNovo(true)}>+ Novo Proprietário</Button>
      </div>
      
      {/* Área de busca e filtros */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Campo de busca */}
          <div className="flex-1 relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar proprietário..."
              className="pl-10 w-full"
            />
          </div>
          
          {/* Botão de Filtro */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {tipoFiltro === 'todos' ? 'Todos' : tipoFiltro}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTipoFiltro('todos')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoFiltro('Pessoa Física')}>
                  Pessoa Física
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoFiltro('Construtora')}>
                  Construtora
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <NovoProprietarioModal open={openNovo || !!editData} onOpenChange={v => { setOpenNovo(false); if (!v) setEditData(null); }} onSave={handleSave} initialData={editData} />
      <ConfirmarExclusaoModal open={!!excluirId} onConfirm={handleExcluir} onCancel={() => setExcluirId(null)} />
      {detalhesConstrutora && (
        <DetalhesConstrutoraModal
          open={!!detalhesConstrutora}
          onClose={() => setDetalhesConstrutora(null)}
          cnpj={detalhesConstrutora.cpfCnpj || ''}
          razaoSocial={detalhesConstrutora.razaoSocial || ''}
          nome={detalhesConstrutora.nome || ''}
        />
      )}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando proprietários...</span>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center p-12 text-red-500">
            Erro ao carregar dados. Por favor, tente novamente mais tarde.
          </div>
        ) : proprietarios && proprietariosFiltrados.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Celular</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proprietariosFiltrados.map((proprietario) => (
                <tr key={proprietario.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {proprietario.tipo === 'Construtora' ? (
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <div className="text-sm font-medium text-gray-900">{proprietario.tipo === 'Construtora' ? (proprietario as any).nomeConstrutora || proprietario.nome : proprietario.nome}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{proprietario.tipo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {proprietario.tipo === 'Construtora' ? proprietario.contatoNome || '-' : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {proprietario.tipo === 'Construtora' 
                        ? proprietario.contatoCelular || '-'
                        : proprietario.celular || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {proprietario.tipo === 'Construtora'
                        ? proprietario.contatoEmail || '-'
                        : proprietario.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {proprietario.tipo === 'Construtora' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetalhesConstrutora(proprietario)}
                        >
                          Detalhes
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditData(proprietario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {proprietario.tipo === 'Construtora' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/empreendimentos?proprietarioId=' + proprietario.id)}
                          title="Novo Empreendimento"
                        >
                          <Building className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExcluirId(proprietario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex justify-center items-center p-12 text-gray-500">
            {proprietarios && proprietarios.length > 0 ? 'Nenhum proprietário encontrado com os filtros atuais' : 'Nenhum proprietário cadastrado'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Proprietarios;