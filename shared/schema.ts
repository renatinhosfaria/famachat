import { pgTable, text, serial, integer, boolean, timestamp, decimal, numeric, jsonb, time } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Definição do tipo Json para campos jsonb do PostgreSQL
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: any }
  | any[];

// User model
export const users = pgTable("sistema_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(), // "Gestor", "Marketing", "Consultor de Atendimento", "Corretor"
  department: text("department").notNull(), // "Gestão", "Marketing", "Atendimento", "Vendas"
  isActive: boolean("is_active").default(true),
});

// Definimos as relações após definir todas as tabelas
// As relações de usuário são definidas no final do arquivo

// Enum para fonte do cliente
export const ClienteSource = {
  FACEBOOK: "Facebook",
  FACEBOOK_ADS: "Facebook Ads",
  SITE: "Site",
  INDICACAO: "Indicação",
  WHATSAPP: "WhatsApp",
  LIGACAO: "Ligação",
  INSTAGRAM: "Instagram",
  PORTAIS: "Portais",
  GOOGLE: "Google",
  OUTRO: "Outro"
} as const;

// Enum para método de contato preferido
export const MeioContato = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  TELEFONE: "Telefone",
  PRESENCIAL: "Presencial"
} as const;

// Cliente model (antigo Lead)
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  source: text("source"), // "Facebook", "Site", "Indicação", etc.
  sourceDetails: jsonb("source_details").$type<Json>(), // Detalhes da origem (JSON)
  preferredContact: text("preferred_contact"), // Método de contato preferido
  cpf: text("cpf"), // CPF do cliente
  assignedTo: integer("assigned_to").references(() => users.id), // Consultor responsável
  brokerId: integer("broker_id").references(() => users.id), // Corretor responsável
  status: text("status").default("Sem Atendimento"), // Status do cliente no funil de vendas
  hasWhatsapp: boolean("haswhatsapp"), // Cliente tem WhatsApp ativo?
  whatsappJid: text("whatsapp_jid"), // JID do WhatsApp (ex: "553499999999@s.whatsapp.net")
  profilePicUrl: text("profile_pic_url"), // URL da foto de perfil do WhatsApp
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointment model
export const appointments = pgTable("clientes_agendamentos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  userId: integer("user_id").references(() => users.id),
  brokerId: integer("broker_id").references(() => users.id), // Corretor responsável pela visita
  assignedTo: integer("assigned_to").references(() => users.id), // Consultor responsável pelo atendimento
  title: text("title"), // Título do agendamento (ex: "Visita - 12/04/2025 14:30")
  type: text("type").notNull(), // "Visita", "Reunião", etc.
  status: text("status").notNull(), // "Agendado", "Cancelado", "Concluído"
  notes: text("notes"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  location: text("location"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visit model
export const visits = pgTable("clientes_visitas", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  userId: integer("user_id").references(() => users.id),
  brokerId: integer("broker_id").references(() => users.id), // Corretor responsável
  assignedTo: integer("assigned_to").references(() => users.id), // Consultor responsável
  propertyId: text("property_id").notNull(),
  visitedAt: timestamp("visited_at").notNull(),
  notes: text("notes"),
  // Novos campos para registrar detalhes da visita
  temperature: integer("temperature"), // Temperatura da visita (1-5)
  visitDescription: text("visit_description"), // Como foi a visita
  nextSteps: text("next_steps"), // Próximos passos
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sale model
export const sales = pgTable("clientes_vendas", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  userId: integer("user_id").references(() => users.id),
  // Novas colunas para Consultor e Corretor
  consultantId: integer("consultant_id").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id), // Consultor de atendimento responsável
  brokerId: integer("broker_id").references(() => users.id),
  // Campos de venda
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  soldAt: timestamp("sold_at").notNull(),
  notes: text("notes"),
  // Campos detalhados da venda
  cpf: text("cpf"), // CPF do cliente
  propertyType: text("property_type"), // Tipo do imóvel (Apto, Casa, Lote)
  builderName: text("builder_name"), // Nome da construtora/vendedor
  developmentName: text("development_name"), // Nome do empreendimento
  block: text("block"), // Bloco (para apartamentos)
  unit: text("unit"), // Unidade (para apartamentos)
  paymentMethod: text("payment_method"), // Forma de pagamento
  commission: numeric("commission", { precision: 12, scale: 2 }), // Comissão
  bonus: numeric("bonus", { precision: 12, scale: 2 }), // Bônus
  totalCommission: numeric("total_commission", { precision: 12, scale: 2 }), // Comissão total
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Metrics model (to store aggregated metrics)
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  period: text("period"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cliente Notes model (anotações do cliente)
export const clienteNotes = pgTable("clientes_id_anotacoes", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  userId: integer("user_id").references(() => users.id), // Usuário que criou a anotação
  text: text("text").notNull(), // Conteúdo da anotação
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sistema de SLA em Cascata - Múltiplos atendimentos por cliente
export const sistemaLeadsCascata = pgTable("sistema_leads_cascata", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id).notNull(),
  leadId: integer("lead_id").references(() => leads.id), // Referência ao lead original
  userId: integer("user_id").references(() => users.id).notNull(), // Usuário responsável por este atendimento
  sequencia: integer("sequencia").notNull(), // Ordem na cascata (1º, 2º, 3º atendimento)
  status: text("status").default("Ativo"), // "Ativo", "Expirado", "Finalizado"
  slaHoras: integer("sla_horas").default(24), // Horas de SLA para este atendimento
  iniciadoEm: timestamp("iniciado_em").defaultNow(),
  expiraEm: timestamp("expira_em").notNull(), // Data/hora de expiração do SLA
  finalizadoEm: timestamp("finalizado_em"), // Quando foi finalizado (agendamento ou expiração)
  motivo: text("motivo"), // "Agendamento", "SLA_Expirado", "Cancelado"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
// Schema para atualização de usuários (senha opcional)
export const updateUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    passwordHash: z.string().optional(),
  });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, createdAt: true, updatedAt: true });
// Schema específico para atualização parcial de clientes
export const updateClienteSchema = insertClienteSchema.partial();
// Primeiro criamos o schema básico de inserção
const baseInsertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });

// Depois modificamos para aceitar tanto Date quanto string para scheduledAt
export const insertAppointmentSchema = baseInsertAppointmentSchema.extend({
  scheduledAt: z.union([
    z.date(),
    z.string().refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date string",
    }).transform(value => new Date(value))
  ])
});
// Primeiro criamos o schema básico de inserção para visitas
const baseInsertVisitSchema = createInsertSchema(visits).omit({ id: true, createdAt: true });

// Depois modificamos para aceitar tanto Date quanto string para visitedAt, semelhante ao que fizemos para agendamentos
export const insertVisitSchema = baseInsertVisitSchema.extend({
  visitedAt: z.union([
    z.date(),
    z.string().refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date string",
    }).transform(value => new Date(value))
  ])
});

// Primeiro criamos o schema básico de inserção para vendas
const baseInsertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true, updatedAt: true });

// Depois modificamos para permitir entrada flexível de dados
export const insertSaleSchema = baseInsertSaleSchema.extend({
  // Permitindo tanto Date quanto string para soldAt
  soldAt: z.union([
    z.date(),
    z.string().refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid date string",
    }).transform(value => new Date(value))
  ]),
  // Permitindo tanto number quanto string para value
  value: z.union([
    z.number(),
    z.string().transform(val => {
      // Limpar a string e converter para número no formato brasileiro
      // 1. Remove todos os caracteres que não são dígitos, vírgulas ou pontos
      // 2. Remove todos os pontos (separadores de milhares)
      // 3. Substitui a vírgula por ponto (para o formato decimal padrão JavaScript)
      const cleaned = val
        .replace(/[^\d,.]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      return parseFloat(cleaned);
    })
  ]),
  // Converter valores monetários para número
  commission: z.union([
    z.number().optional(),
    z.string().transform(val => {
      if (!val) return null;
      const cleaned = val
        .replace(/[^\d,.]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || null;
    }).optional()
  ]),
  bonus: z.union([
    z.number().optional(),
    z.string().transform(val => {
      if (!val) return null;
      const cleaned = val
        .replace(/[^\d,.]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || null;
    }).optional()
  ]),
  totalCommission: z.union([
    z.number().optional(),
    z.string().transform(val => {
      if (!val) return null;
      const cleaned = val
        .replace(/[^\d,.]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || null;
    }).optional()
  ])
});
export const insertMetricSchema = createInsertSchema(metrics).omit({ id: true, createdAt: true });
export const insertClienteNoteSchema = createInsertSchema(clienteNotes).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type UpdateCliente = z.infer<typeof updateClienteSchema>;

export type ClienteFilter = {
  status?: string;
  assignedTo?: number;
  brokerId?: number;
  period?: string;
  search?: string;
  order?: string;
  _timestamp?: string; // Campo para evitar cache entre requisições
  page?: number;
  pageSize?: number;
  includeCount?: boolean;
};

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type ClienteNote = typeof clienteNotes.$inferSelect;
export type InsertClienteNote = z.infer<typeof insertClienteNoteSchema>;

export const insertSistemaLeadsCascataSchema = createInsertSchema(sistemaLeadsCascata).omit({ id: true, createdAt: true, updatedAt: true });

export type SistemaLeadsCascata = typeof sistemaLeadsCascata.$inferSelect;
export type InsertSistemaLeadsCascata = z.infer<typeof insertSistemaLeadsCascataSchema>;

// Enums
export const ClienteStatus = {
  SEM_ATENDIMENTO: "Sem Atendimento",
  NAO_RESPONDEU: "Não Respondeu",
  EM_ATENDIMENTO: "Em Atendimento",
  AGENDAMENTO: "Agendamento",
  VISITA: "Visita",
  VENDA: "Venda",
} as const;

// Mantendo LeadStatus como alias para compatibilidade com código existente
export const LeadStatus = ClienteStatus;

export const AppointmentType = {
  VISIT: "Visita",
  MEETING: "Reunião",
  CALL: "Ligação",
} as const;

export const AppointmentStatus = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
} as const;

export const Department = {
  MANAGEMENT: "Gestão",
  MARKETING: "Marketing",
  CUSTOMER_SERVICE: "Central de Atendimento",
  SALES: "Vendas",
} as const;

export const Role = {
  MANAGER: "Gestor",
  MARKETING: "Marketing",
  CONSULTANT: "Consultor de Atendimento",
  BROKER_SENIOR: "Corretor Senior",
  EXECUTIVE: "Executivo",
  BROKER_JUNIOR: "Corretor Junior", 
  BROKER_TRAINEE: "Corretor Trainee",
} as const;

// WhatsApp Instance Status Enum
export const WhatsAppInstanceStatus = {
  CONNECTED: "Conectado",
  DISCONNECTED: "Desconectado",
  CONNECTING: "Conectando",
  DISCONNECTING: "Desconectando",
  WAITING_QR_SCAN: "Aguardando Scan do QR Code",
  FAILED: "Falha",
  PENDING: "Pendente",
  ERROR: "Erro",
} as const;

// Mapeamento de status da Evolution API para nosso sistema
export const EvolutionAPIStatusMapping = {
  "open": WhatsAppInstanceStatus.CONNECTED,
  "connected": WhatsAppInstanceStatus.CONNECTED,
  "close": WhatsAppInstanceStatus.DISCONNECTED,
  "disconnected": WhatsAppInstanceStatus.DISCONNECTED,
  "connecting": WhatsAppInstanceStatus.CONNECTING,
} as const;

// WhatsApp Instance model
export const whatsappInstances = pgTable("sistema_whatsapp_instances", {
  instanciaId: text("instancia_id").primaryKey(), // Chave primária TEXT conforme estrutura real do banco
  instanceName: text("instance_name").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(), // Usuário associado à instância
  // Removidas colunas isActive e isPrimary que não existem no banco
  status: text("instance_status").default(WhatsAppInstanceStatus.DISCONNECTED),
  // Removida a coluna qr_code que não existe no banco de dados
  base64: text("base64"), // Campo base64 que existe no banco
  webhook: text("webhook"), // Campo webhook que existe no banco
  remoteJid: text("remote_jid"), // JID do WhatsApp (ex: "553499999999@s.whatsapp.net")
  lastConnection: timestamp("last_connection"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas para WhatsApp
// Agora instanciaId é opcional para permitir geração automática no backend
export const insertWhatsappInstanceSchema = createInsertSchema(whatsappInstances).omit({ 
  createdAt: true, 
  updatedAt: true 
}).extend({
  instanciaId: z.string().optional()
});

// Definição de interface para compatibilidade com código existente
// Atenção: A tabela whatsapp_logs foi removida do banco de dados
export interface WhatsappLog {
  id: number;
  instanceId?: string | null;
  type: string;
  message: string;
  data?: any;
  createdAt: Date;
}

// Schema para compatibilidade com código existente
export interface InsertWhatsappLog {
  instanceId?: string | null;
  type: string;
  message: string;
  data?: any;
}

// Facebook API Configuration model
export const facebookConfig = pgTable("sistema_facebook_config", {
  id: serial("id").primaryKey(),
  appId: text("app_id").notNull(),
  appSecret: text("app_secret").notNull(),
  accessToken: text("access_token").notNull(),
  userAccessToken: text("user_access_token"),
  verificationToken: text("verification_token"), // Token para validação de webhook
  pageId: text("page_id"),
  adAccountId: text("ad_account_id"),
  webhookEnabled: boolean("webhook_enabled").default(false),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela do sistema de metas
export const sistemaMetas = pgTable("sistema_metas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  periodo: text("periodo").default("mensal").notNull(), // mensal, trimestral, semestral, anual
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(), // 1-12
  // Metas de valores absolutos
  agendamentos: integer("agendamentos").default(0),
  visitas: integer("visitas").default(0),
  vendas: integer("vendas").default(0),
  // Metas de conversão em porcentagem (colunas existentes no banco)
  conversaoAgendamentos: integer("conversao_agendamentos").default(0), // % de conversão de agendamentos em visitas
  conversaoVisitas: integer("conversao_visitas").default(0), // % de conversão de visitas em vendas  
  conversaoVendas: integer("conversao_vendas").default(0), // % de conversão de vendas
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema de inserção para SistemaMeta
export const insertSistemaMetaSchema = createInsertSchema(sistemaMetas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema de atualização para SistemaMeta (permite campos parciais)
export const updateSistemaMetaSchema = insertSistemaMetaSchema.partial();

// Tipos para SistemaMeta
export type SistemaMeta = typeof sistemaMetas.$inferSelect;
export type InsertSistemaMeta = z.infer<typeof insertSistemaMetaSchema>;
export type UpdateSistemaMeta = z.infer<typeof updateSistemaMetaSchema>;

// Insert Schema para Facebook Config
export const insertFacebookConfigSchema = createInsertSchema(facebookConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastUpdated: true
});

// Update Schema para Facebook Config
export const updateFacebookConfigSchema = insertFacebookConfigSchema.partial();

// Tipos para WhatsApp
export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = z.infer<typeof insertWhatsappInstanceSchema>;

// Tipos para Facebook
export type FacebookConfig = typeof facebookConfig.$inferSelect;
export type InsertFacebookConfig = z.infer<typeof insertFacebookConfigSchema>;
export type UpdateFacebookConfig = z.infer<typeof updateFacebookConfigSchema>;

// Comentário: Estas definições foram movidas para mais perto da definição da tabela sistemaMetas
// e já estão declaradas nas linhas 434-446

// Moved to after the leadAutomationConfig table definition to avoid reference errors

// Enums para status e fonte dos leads
export const LeadSourceEnum = {
  FACEBOOK_ADS: "Facebook Ads",
  SITE: "Site",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  INDICACAO: "Indicação",
  LIGACAO: "Ligação",
  OUTRO: "Outro"
} as const;

export const LeadStatusEnum = {
  SEM_ATENDIMENTO: "Sem Atendimento",
  EM_ATENDIMENTO: "Em Atendimento",
  QUALIFICADO: "Qualificado",
  CONVERTIDO: "Convertido",
  NAO_CONVERTIDO: "Não Convertido"
} as const;

// Enum para métodos de distribuição de leads
export const DistributionMethodEnum = {
  VOLUME: "volume",
  PERFORMANCE: "performance",
  ROUND_ROBIN: "round-robin"
} as const;

// Tabela de Leads
export const leads = pgTable("sistema_leads", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  source: text("source").notNull(), // Fonte do lead (Facebook Ads, Site, WhatsApp, etc.)
  sourceDetails: jsonb("source_details").$type<Json>(), // Detalhes da origem (JSON)
  status: text("status").default(LeadStatusEnum.SEM_ATENDIMENTO), // Status do lead no funil
  assignedTo: integer("assigned_to").references(() => users.id), // Consultor responsável
  notes: text("notes"), // Observações sobre o lead
  tags: jsonb("tags").$type<string[]>(), // Tags associadas ao lead
  lastActivityDate: timestamp("last_activity_date"), // Data da última atividade
  isRecurring: boolean("is_recurring").default(false), // Lead recorrente
  score: integer("score"), // Pontuação do lead (qualificação)
  interesse: text("interesse"), // Interesse principal do lead
  budget: numeric("budget", { precision: 12, scale: 2 }), // Orçamento disponível
  clienteId: integer("cliente_id").references(() => clientes.id), // Referência ao cliente (se convertido)
  metaData: jsonb("meta_data").$type<Json>(), // Metadados adicionais
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relações serão definidas no final do arquivo

// Insert Schema para Lead
export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Update Schema para Lead
export const updateLeadSchema = insertLeadSchema.partial();

// Tipos para Lead
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;

// Definindo todas as relações no final do arquivo para evitar problemas de referência circular
// Relações do usuário
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads, { relationName: "lead_user" }),
  assignedClientes: many(clientes, { relationName: "cliente_user" })
}));

// Relações do lead
export const leadsRelations = relations(leads, ({ one }) => ({
  user: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: "lead_user"
  }),
  cliente: one(clientes, {
    fields: [leads.clienteId],
    references: [clientes.id],
    relationName: "lead_cliente"
  })
}));

// Tabela de configuração de automação de leads
export const leadAutomationConfig = pgTable("sistema_config_automacao_leads", {
  id: serial("id").primaryKey(),
  active: boolean("active").default(true),
  name: text("name").notNull(),
  distributionMethod: text("distribution_method").default(DistributionMethodEnum.VOLUME),
  // Colunas removidas em migrations anteriores:
  // useSpecialty, notifyVisual, notifySystem, notifyManager,
  // escalateToManager, identifyByDocument, basedOnTime, basedOnOutcome, centralizedComm, customRules
  
  // Colunas removidas na última migração:
  // useAvailability, useRegion, workingHoursStart, workingHoursEnd, workingHoursWeekend,
  // identifyByEmail, identifyByPhone, inactivityPeriod, contactAttempts, createdBy
  
  // Colunas adicionadas para identificação de lead recorrente
  byName: boolean("by_name").default(true), // Identificar lead recorrente por nome
  byPhone: boolean("by_phone").default(true), // Identificar lead recorrente por telefone
  byEmail: boolean("by_email").default(true), // Identificar lead recorrente por e-mail
  
  // Colunas adicionadas para ações com leads recorrentes
  keepSameConsultant: boolean("keep_same_consultant").default(true), // Manter com o mesmo consultor
  assignNewConsultant: boolean("assign_new_consultant").default(false), // Atribuir a um novo consultor
  
  firstContactSLA: integer("first_contact_sla").default(30), // Tempo em minutos
  warningPercentage: integer("warning_percentage").default(75), // % do SLA para alerta
  criticalPercentage: integer("critical_percentage").default(90), // % do SLA para crítico
  autoRedistribute: boolean("auto_redistribute").default(false),
  rotationUsers: jsonb("rotation_users").$type<number[]>().default([]),
  
  // Configurações SLA em Cascata
  cascadeSLAHours: integer("cascade_sla_hours").default(24), // Tempo em horas para cada usuário na cascata
  cascadeUserOrder: jsonb("cascade_user_order").$type<number[]>().default([]), // Ordem dos usuários na fila de cascata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relações do cliente
export const clientesRelations = relations(clientes, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [clientes.assignedTo],
    references: [users.id],
    relationName: "cliente_user"
  }),
  broker: one(users, {
    fields: [clientes.brokerId],
    references: [users.id]
  }),
  lead: many(leads, { relationName: "lead_cliente" })
}));

// Schema de inserção para LeadAutomationConfig
export const insertLeadAutomationConfigSchema = createInsertSchema(leadAutomationConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Schema de atualização para LeadAutomationConfig
export const updateLeadAutomationConfigSchema = insertLeadAutomationConfigSchema.partial();

// Tipos para LeadAutomationConfig
export type LeadAutomationConfig = typeof leadAutomationConfig.$inferSelect;
export type InsertLeadAutomationConfig = z.infer<typeof insertLeadAutomationConfigSchema>;
export type UpdateLeadAutomationConfig = z.infer<typeof updateLeadAutomationConfigSchema>;

// Sistema Users Horarios - Tabela para horários de uso do sistema por usuário
export const sistemaUsersHorarios = pgTable("sistema_users_horarios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  diaSemana: text("dia_semana").notNull(), // 'SEG', 'TER', etc.
  horarioInicio: time("horario_inicio").notNull(),
  horarioFim: time("horario_fim").notNull(),
  diaTodo: boolean("dia_todo").default(false),
});

// Schema para inserção de horários
export const insertUserHorarioSchema = createInsertSchema(sistemaUsersHorarios).omit({ id: true });
export type UserHorario = typeof sistemaUsersHorarios.$inferSelect;
export type InsertUserHorario = z.infer<typeof insertUserHorarioSchema>;

// Sistema Daily Content - Tabela para conteúdo diário gerado pelo OpenAI
export const dailyContent = pgTable("sistema_daily_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(), // "mercado_imobiliario", "investimentos", "dicas_vendas", etc.
  tags: jsonb("tags").$type<string[]>().default([]),
  rating: integer("rating").default(0), // 0-5 para avaliar a qualidade do conteúdo
  isActive: boolean("is_active").default(true),
  generatedDate: timestamp("generated_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema para inserção de conteúdo diário
export const insertDailyContentSchema = createInsertSchema(dailyContent).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
  generatedDate: true
});

// Schema para atualização de conteúdo diário
export const updateDailyContentSchema = insertDailyContentSchema.partial();

// Tipos para Daily Content
export type DailyContent = typeof dailyContent.$inferSelect;
export type InsertDailyContent = z.infer<typeof insertDailyContentSchema>;
export type UpdateDailyContent = z.infer<typeof updateDailyContentSchema>;

// A definição da tabela sistemaMetas já existe na linha 414
// Esta segunda definição foi removida para evitar conflitos
