/**
 * database.ts
 * Arquivo consolidado para configuração e conexão com o banco de dados
 * Unifica a conexão via Drizzle ORM e consultas SQL diretas
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from './utils/logger';

// Inicializa logger com contexto específico do banco de dados
const dbLogger = logger.createLogger('Database');

// Configuração para o Neon Database
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuração de pool de conexões compartilhada
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Configuração Drizzle ORM
export const db = drizzle(pool, { schema });

/**
 * Testa a conexão com o banco de dados
 */
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    dbLogger.info(`Conexão com o banco de dados testada com sucesso: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    dbLogger.error(`Erro ao testar conexão com banco de dados: ${error}`);
    throw error;
  }
}

/**
 * Função para executar uma query SQL diretamente
 * Útil para casos onde o ORM não é adequado ou para consultas complexas específicas
 */
export async function executeSQL(sql: string, params: any[] = []): Promise<any> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    dbLogger.error(`Erro ao executar SQL: ${error}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verificar se uma tabela existe
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    
    const result = await executeSQL(sql, [tableName]);
    return result[0].exists;
  } catch (error) {
    dbLogger.error(`Erro ao verificar existência da tabela ${tableName}: ${error}`);
    return false;
  }
}

dbLogger.info("Database connection initialized");
