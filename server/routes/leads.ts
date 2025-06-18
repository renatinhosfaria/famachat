import express from 'express';
import { storage } from '../storage';
import { insertLeadSchema, updateLeadSchema } from '../../shared/schema';
import { checkAuth, checkRole } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Inicializa o logger para o módulo de leads
const leadLogger = logger.createLogger('LeadsAPI');

// Middleware para verificar se é um gestor
const checkGestor = checkRole('Gestor');

// Rota para obter todos os leads da tabela sistema_leads
router.get('/all', async (req, res) => {
  try {
    // Buscar diretamente da tabela sistema_leads usando SQL
    const { executeSQL } = await import('../database');
    
    const query = `
      SELECT 
        id,
        full_name as "fullName",
        email,
        phone,
        source,
        source_details as "sourceDetails",
        status,
        assigned_to as "assignedTo",
        notes,
        is_recurring as "isRecurring",
        cliente_id as "clienteId",
        created_at as "createdAt",
        updated_at as "updatedAt",
        tags,
        last_activity_date as "lastActivityDate",
        score,
        interesse,
        budget,
        meta_data as "metaData"
      FROM sistema_leads 
      ORDER BY created_at DESC 
      LIMIT 1000
    `;
    
    const leads = await executeSQL(query);
    const totalQuery = 'SELECT COUNT(*) as count FROM sistema_leads';
    const totalResult = await executeSQL(totalQuery);
    const total = totalResult[0]?.count || 0;
    
    res.json({
      leads: leads || [],
      total: parseInt(total)
    });
  } catch (error) {
    leadLogger.error('Erro ao listar todos os leads da tabela sistema_leads:', error);
    res.status(500).json({ error: 'Erro ao listar todos os leads', leads: [] });
  }
});

// Listar leads com paginação e filtragem
router.get('/', checkAuth, checkGestor, async (req, res) => {
  try {
    const filter = {
      status: req.query.status as string | undefined,
      source: req.query.source as string | undefined,
      assignedTo: req.query.assignedTo ? Number(req.query.assignedTo) : undefined,
      searchTerm: req.query.searchTerm as string | undefined,
      period: req.query.period as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10,
      includeCount: req.query.includeCount === 'true'
    };

    const result = await storage.getLeads(filter);
    res.json(result);
  } catch (error) {
    leadLogger.error('Erro ao listar leads:', error);
    res.status(500).json({ error: 'Erro ao listar leads' });
  }
});

// Obter um lead específico
router.get('/:id', checkAuth, checkGestor, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const lead = await storage.getLead(id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(lead);
  } catch (error) {
    leadLogger.error(`Erro ao buscar lead ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
});

// Criar um novo lead
router.post('/', checkAuth, checkGestor, async (req, res) => {
  try {
    const parseResult = insertLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: parseResult.error.format() 
      });
    }

    const lead = await storage.createLead(parseResult.data);
    res.status(201).json(lead);
  } catch (error) {
    leadLogger.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

// Atualizar um lead existente
router.patch('/:id', checkAuth, checkGestor, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const parseResult = updateLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: parseResult.error.format() 
      });
    }

    const updatedLead = await storage.updateLead(id, parseResult.data);
    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(updatedLead);
  } catch (error) {
    leadLogger.error(`Erro ao atualizar lead ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

// Excluir um lead
router.delete('/:id', checkAuth, checkGestor, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const success = await storage.deleteLead(id);
    if (!success) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.status(204).end();
  } catch (error) {
    leadLogger.error(`Erro ao excluir lead ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao excluir lead' });
  }
});

// Converter lead para cliente
router.post('/:id/convert', checkAuth, checkGestor, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const result = await storage.convertLeadToCliente(id);
    
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    leadLogger.error(`Erro ao converter lead ${req.params.id} para cliente:`, error);
    leadLogger.error('Detalhes do erro:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Erro ao converter lead para cliente', details: String(error) });
  }
});

export default router;