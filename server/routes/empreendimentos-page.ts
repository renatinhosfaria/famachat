import { Router } from 'express';
import { db } from '../database';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { empreendimentosTable } from '../models/empreendimentos-schema';
import { logger } from "../utils/logger";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Inicializa o logger para o módulo de Empreendimentos
const empreendimentosLogger = logger.createLogger("EmpreendimentosAPI");

// Definindo __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB para permitir vídeos grandes
  }
});

// GET: Listar todos os empreendimentos
router.get('/', async (req, res) => {
  try {
    const empreendimentos = await db.select().from(empreendimentosTable);
    
    // Formatar os dados para retornar no formato esperado pelo frontend
    const empreendimentosFormatados = empreendimentos.map(emp => {
      // Construa o endereço com verificação para campos nulos
      const parteRua = emp.ruaAvenidaEmpreendimento || '';
      const parteNumero = emp.numeroEmpreendimento ? `, ${emp.numeroEmpreendimento}` : '';
      const parteBairro = emp.bairroEmpreendimento ? ` - ${emp.bairroEmpreendimento}` : '';
      const parteCidade = emp.cidadeEmpreendimento || '';
      const parteEstado = emp.estadoEmpreendimento ? `/${emp.estadoEmpreendimento}` : '';
      
      const endereco = `${parteRua}${parteNumero}${parteBairro}, ${parteCidade}${parteEstado}`;
      
      return {
        id: emp.id,
        nome: emp.nomeEmpreendimento,
        tipo: emp.tipoImovel || 'Apartamento',
        proprietario: emp.nomeProprietario || 'Não informado',
        endereco: endereco,
        status: emp.statusEmpreendimento || 'Não informado'
      };
    });
    
    res.json(empreendimentosFormatados);
  } catch (error) {
    logger.error(`Erro ao buscar empreendimentos:`, error);
    res.status(500).json({ 
      error: 'Erro ao buscar empreendimentos',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET: Buscar empreendimento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [empreendimento] = await db.select().from(empreendimentosTable)
      .where(eq(empreendimentosTable.id, parseInt(id)));
    
    if (!empreendimento) {
      return res.status(404).json({ error: 'Empreendimento não encontrado' });
    }
    
    res.json(empreendimento);
  } catch (error) {
    logger.error(`Erro ao buscar empreendimento com ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Erro ao buscar empreendimento',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST: Criar novo empreendimento
router.post('/', upload.fields([
  { name: 'fotos', maxCount: 20 },
  { name: 'videos', maxCount: 10 }
]), async (req, res) => {
  try {
    logger.debug('Iniciando cadastro de empreendimento');
    
    let dadosEmpreendimento;
    try {
      if (typeof req.body.dadosEmpreendimento === 'string') {
        dadosEmpreendimento = JSON.parse(req.body.dadosEmpreendimento);
      } else {
        dadosEmpreendimento = req.body.dadosEmpreendimento || req.body;
      }
      
      logger.debug(`Dados do empreendimento recebidos: ${JSON.stringify(dadosEmpreendimento)}`);
      logger.debug(`Valor do prazo de entrega: ${dadosEmpreendimento.prazoEntregaEmpreendimento}`);
    } catch (error) {
      logger.error(`Erro ao processar dados do empreendimento:`, error);
      return res.status(400).json({ 
        error: 'Erro ao processar dados do empreendimento',
        details: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Validação básica
    if (!dadosEmpreendimento.nomeEmpreendimento) {
      return res.status(400).json({ error: 'Nome do empreendimento é obrigatório' });
    }
    
    // Criar referência temporária para organização de arquivos
    const referenciaTemp = `EMPR-${new Date().getTime()}`;
    
    // Processar arquivos (fotos e vídeos)
    const files = req.files as { 
      fotos?: Express.Multer.File[], 
      videos?: Express.Multer.File[] 
    } | undefined;
    
    let urlFotos = null;
    let urlVideos = null;
    
    try {
      // Usar uma referência única para organização do diretório de arquivos
      const referencia = referenciaTemp;
      const uploadDir = path.join(__dirname, '../uploads/empreendimentos', referencia);
      const fotosDir = path.join(uploadDir, 'fotos');
      const videosDir = path.join(uploadDir, 'videos');
      
      // Criar diretórios se não existirem
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Processar fotos se houver
      if (files?.fotos && files.fotos.length > 0) {
        // Criar diretório de fotos
        if (!fs.existsSync(fotosDir)) {
          fs.mkdirSync(fotosDir, { recursive: true });
        }
        
        // Mover arquivos e coletar URLs
        const fotosUrls = [];
        for (const file of files.fotos) {
          const destPath = path.join(fotosDir, file.filename);
          fs.renameSync(file.path, destPath);
          fotosUrls.push(`/uploads/empreendimentos/${referencia}/fotos/${file.filename}`);
        }
        
        // Verificar se foi definida uma foto de capa
        const fotoCapaIndex = req.body.fotoCapaIndex ? parseInt(req.body.fotoCapaIndex) : 0;
        
        // Armazenar a URL da foto de capa (ou primeira foto) se houver fotos
        if (fotosUrls.length > 0) {
          const capaUrl = fotosUrls[fotoCapaIndex] || fotosUrls[0];
          dadosEmpreendimento.urlFotoCapaEmpreendimento = capaUrl;
          // Em vez de armazenar apenas a foto de capa, armazenar todas as fotos
          dadosEmpreendimento.urlFotoEmpreendimento = JSON.stringify(fotosUrls);
        }
        
        urlFotos = fotosUrls;
        dadosEmpreendimento.urlFotosEmpreendimento = JSON.stringify(fotosUrls);
      }
      
      // Processar vídeos se houver
      if (files?.videos && files.videos.length > 0) {
        // Criar diretório de vídeos
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
        }
        
        // Mover arquivos e coletar URLs
        const videosUrls = [];
        for (const file of files.videos) {
          const destPath = path.join(videosDir, file.filename);
          fs.renameSync(file.path, destPath);
          videosUrls.push(`/uploads/empreendimentos/${referencia}/videos/${file.filename}`);
        }
        
        urlVideos = videosUrls;
        dadosEmpreendimento.urlVideosEmpreendimento = JSON.stringify(videosUrls);
        
        // Se houver ao menos um vídeo, salvar o primeiro como o vídeo principal
        if (videosUrls.length > 0) {
          dadosEmpreendimento.urlVideoEmpreendimento = videosUrls[0];
        }
      }
      
      // Inserir no banco de dados
      const [novoEmpreendimento] = await db.insert(empreendimentosTable)
        .values(dadosEmpreendimento)
        .returning();
      
      logger.debug(`Empreendimento cadastrado com sucesso: ${JSON.stringify(novoEmpreendimento)}`);
      
      res.status(201).json({
        ...novoEmpreendimento,
        urlFotos,
        urlVideos
      });
    } catch (fileError) {
      logger.error(`Erro ao processar arquivos:`, fileError);
      throw fileError;
    }
  } catch (error) {
    logger.error(`Erro ao cadastrar empreendimento:`, error);
    res.status(500).json({ 
      error: 'Erro ao cadastrar empreendimento',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// PUT: Atualizar empreendimento
router.put('/:id', upload.fields([
  { name: 'fotos', maxCount: 20 },
  { name: 'videos', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Extrair dados do empreendimento
    let dadosAtualizados;
    try {
      if (typeof req.body.dadosEmpreendimento === 'string') {
        dadosAtualizados = JSON.parse(req.body.dadosEmpreendimento);
      } else {
        dadosAtualizados = req.body.dadosEmpreendimento || req.body;
      }
      
      logger.debug(`Dados atualizados do empreendimento: ${JSON.stringify(dadosAtualizados)}`);
      logger.debug(`Valor do prazo de entrega atualizado: ${dadosAtualizados.prazoEntregaEmpreendimento}`);
    } catch (error) {
      logger.error(`Erro ao processar dados do empreendimento:`, error);
      return res.status(400).json({ 
        error: 'Erro ao processar dados do empreendimento',
        details: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Não permitir atualizar ID ou datas de criação
    delete dadosAtualizados.id;
    delete dadosAtualizados.dataCadastro;
    
    // Atualizar data de última atualização
    dadosAtualizados.ultimaAtualizacao = new Date();
    
    // Verificar se o empreendimento existe
    const [empreendimentoExistente] = await db.select().from(empreendimentosTable)
      .where(eq(empreendimentosTable.id, parseInt(id)));
    
    if (!empreendimentoExistente) {
      return res.status(404).json({ error: 'Empreendimento não encontrado' });
    }
    
    // Criar uma referência única para gerenciar uploads
    const referencia = `EMPR-${empreendimentoExistente.id}-${new Date().getTime()}`;
    
    // Processar arquivos (fotos e vídeos) se houver
    const files = req.files as { 
      fotos?: Express.Multer.File[], 
      videos?: Express.Multer.File[] 
    } | undefined;
    
    // Se houver novas fotos ou vídeos, processar
    if ((files?.fotos && files.fotos.length > 0) || (files?.videos && files.videos.length > 0)) {
      // Criar pasta para o empreendimento
      const uploadDir = path.join(__dirname, '../uploads/empreendimentos', referencia);
      const fotosDir = path.join(uploadDir, 'fotos');
      const videosDir = path.join(uploadDir, 'videos');
      
      // Criar diretórios se não existirem
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Processar fotos se houver
      if (files?.fotos && files.fotos.length > 0) {
        // Criar diretório de fotos
        if (!fs.existsSync(fotosDir)) {
          fs.mkdirSync(fotosDir, { recursive: true });
        }
        
        // Mover arquivos e coletar URLs
        const fotosUrls = [];
        for (const file of files.fotos) {
          const destPath = path.join(fotosDir, file.filename);
          fs.renameSync(file.path, destPath);
          fotosUrls.push(`/uploads/empreendimentos/${referencia}/fotos/${file.filename}`);
        }
        
        // Verificar se foi definida uma foto de capa
        const fotoCapaIndex = req.body.fotoCapaIndex ? parseInt(req.body.fotoCapaIndex) : 0;
        
        // Verificar se já existem fotos no empreendimento
        let fotosAtuais = [];
        if (empreendimentoExistente.urlFotoEmpreendimento) {
          try {
            // Verificar o tipo antes de fazer parse
            if (typeof empreendimentoExistente.urlFotoEmpreendimento === 'string') {
              fotosAtuais = JSON.parse(empreendimentoExistente.urlFotoEmpreendimento);
            } else if (Array.isArray(empreendimentoExistente.urlFotoEmpreendimento)) {
              fotosAtuais = empreendimentoExistente.urlFotoEmpreendimento;
            }
          } catch (e) {
            fotosAtuais = [];
          }
        }
        
        // Adicionar novas fotos às existentes
        const todasFotos = [...fotosAtuais, ...fotosUrls];
        
        // Atualizar a URL da foto de capa se necessário
        if (fotosUrls.length > 0 && req.body.atualizarCapa === 'true') {
          const capaUrl = fotosUrls[fotoCapaIndex] || fotosUrls[0];
          dadosAtualizados.urlFotoCapaEmpreendimento = capaUrl;
        }
        
        // Armazenar todas as fotos no campo urlFotoEmpreendimento
        dadosAtualizados.urlFotoEmpreendimento = JSON.stringify(todasFotos);
        
        dadosAtualizados.urlFotosEmpreendimento = JSON.stringify(todasFotos);
      }
      
      // Processar vídeos se houver
      if (files?.videos && files.videos.length > 0) {
        // Criar diretório de vídeos
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
        }
        
        // Mover arquivos e coletar URLs
        const videosUrls = [];
        for (const file of files.videos) {
          const destPath = path.join(videosDir, file.filename);
          fs.renameSync(file.path, destPath);
          videosUrls.push(`/uploads/empreendimentos/${referencia}/videos/${file.filename}`);
        }
        
        // Verificar se já existem vídeos no empreendimento
        let videosAtuais = [];
        if (empreendimentoExistente.urlVideoEmpreendimento) {
          // Se houver apenas um vídeo, colocá-lo em um array
          if (typeof empreendimentoExistente.urlVideoEmpreendimento === 'string') {
            videosAtuais = [empreendimentoExistente.urlVideoEmpreendimento];
          } else if (Array.isArray(empreendimentoExistente.urlVideoEmpreendimento)) {
            videosAtuais = empreendimentoExistente.urlVideoEmpreendimento;
          } else if (empreendimentoExistente.urlVideoEmpreendimento) {
            try {
              // Tentar fazer parse se for uma string JSON
              videosAtuais = JSON.parse(String(empreendimentoExistente.urlVideoEmpreendimento));
            } catch (e) {
              videosAtuais = [];
            }
          }
        }
        
        // Adicionar novos vídeos aos existentes
        const todosVideos = [...videosAtuais, ...videosUrls];
        dadosAtualizados.urlVideosEmpreendimento = JSON.stringify(todosVideos);
        
        // Se não houver vídeo principal definido, definir o primeiro vídeo novo
        if (!empreendimentoExistente.urlVideoEmpreendimento && videosUrls.length > 0) {
          dadosAtualizados.urlVideoEmpreendimento = videosUrls[0];
        }
      }
    }
    
    // Atualizar empreendimento no banco de dados
    const [empreendimentoAtualizado] = await db.update(empreendimentosTable)
      .set(dadosAtualizados)
      .where(eq(empreendimentosTable.id, parseInt(id)))
      .returning();
    
    res.json(empreendimentoAtualizado);
  } catch (error) {
    logger.error(`Erro ao atualizar empreendimento com ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Erro ao atualizar empreendimento',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// DELETE: Excluir empreendimento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o empreendimento existe
    // Tenta primeiro pela coluna id, mas se for UUID, busca alternativa
    let empreendimento;
    try {
      // Tenta primeiro convertendo para número
      const [result] = await db.select().from(empreendimentosTable)
        .where(eq(empreendimentosTable.id, parseInt(id)));
      
      empreendimento = result;
    } catch (error) {
      // Se falhar, tenta buscar pelo id como texto (pode ser um UUID)
      logger.debug(`Erro ao buscar empreendimento por ID numérico, tentando como UUID: ${error}`);
      const [resultByUUID] = await db.select().from(empreendimentosTable)
        .where(sql`${empreendimentosTable.id}::text = ${id}`);
      
      empreendimento = resultByUUID;
    }
    
    if (!empreendimento) {
      return res.status(404).json({ error: 'Empreendimento não encontrado' });
    }
    
    // Tentar remover os arquivos associados
    try {
      const referencia = `EMPR-${empreendimento.id}`;
      const uploadDir = path.join(__dirname, '../uploads/empreendimentos', referencia);
      
      if (fs.existsSync(uploadDir)) {
        // Função auxiliar para remover diretório recursivamente
        const removeDir = (dirPath: string) => {
          if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach((file) => {
              const curPath = path.join(dirPath, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                // Se for um diretório, chama recursivamente
                removeDir(curPath);
              } else {
                // Se for um arquivo, remove
                fs.unlinkSync(curPath);
              }
            });
            // Remove o diretório vazio
            fs.rmdirSync(dirPath);
          }
        };
        
        // Remover o diretório e todo seu conteúdo
        removeDir(uploadDir);
        logger.info(`Arquivos do empreendimento removidos em: ${uploadDir}`);
      }
    } catch (fileError) {
      logger.error(`Erro ao remover arquivos do empreendimento:`, fileError);
      // Continua mesmo em caso de erro de remoção de arquivos
    }
    
    // Remover o empreendimento do banco de dados
    try {
      // Tenta excluir usando ID como número
      await db.delete(empreendimentosTable)
        .where(eq(empreendimentosTable.id, parseInt(id)));
    } catch (deleteError) {
      // Se falhar, tenta excluir usando ID como string (UUID)
      logger.debug(`Erro ao excluir por ID numérico, tentando como UUID: ${deleteError}`);
      await db.delete(empreendimentosTable)
        .where(sql`${empreendimentosTable.id}::text = ${id}`);
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Erro ao excluir empreendimento com ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Erro ao excluir empreendimento',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;