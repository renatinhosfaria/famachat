import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se o usuário está autenticado
export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = req.session?.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  next();
};

// Middleware para verificar se o usuário tem função específica
export const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session?.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (user.role !== role) {
      return res.status(403).json({ error: `Acesso negado. É necessário ter a função de ${role}` });
    }
    
    next();
  };
};