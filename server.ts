import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Port 3000 obligatoire
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';
const DB_FILE = path.join(process.cwd(), 'data', 'library-database.json');

// Interface des comptes internes sécurisés sur le serveur (NON EXPOSÉS au frontend)
interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'manager';
  studentCardId?: string;
  avatar: string;
  passwordHash: string; // SHA-256 du mot de passe
}

// Comptes de test hébergés exclusivement côté serveur
const SERVER_INTERNAL_ACCOUNTS: ServerUserRecord[] = [
  {
    id: 'EST-2024-012',
    name: 'Yassine Benali',
    email: 'yassine.benali@usmba.ac.ma',
    role: 'student',
    studentCardId: 'CARD-EST-2024-012',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    passwordHash: '0a9b858a7ceba0d0c4a7c44de830fa72d6cc9b6ef8f582aa18d6baf2c5dc5a24', // 'etudiant2026'
  },
  {
    id: 'EST-2024-045',
    name: 'Salma El Amrani',
    email: 'salma.elamrani@usmba.ac.ma',
    role: 'student',
    studentCardId: 'CARD-EST-2024-045',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    passwordHash: '0a9b858a7ceba0d0c4a7c44de830fa72d6cc9b6ef8f582aa18d6baf2c5dc5a24', // 'etudiant2026'
  },
  {
    id: 'EST-2024-089',
    name: 'Mehdi Chraibi',
    email: 'mehdi.chraibi@usmba.ac.ma',
    role: 'student',
    studentCardId: 'CARD-EST-2024-089',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    passwordHash: '0a9b858a7ceba0d0c4a7c44de830fa72d6cc9b6ef8f582aa18d6baf2c5dc5a24', // 'etudiant2026'
  },
  {
    id: 'EST-2024-110',
    name: 'Alexandre Fontaine',
    email: 'alexandre.fontaine@usmba.ac.ma',
    role: 'student',
    studentCardId: 'CARD-EST-2024-110',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    passwordHash: '0a9b858a7ceba0d0c4a7c44de830fa72d6cc9b6ef8f582aa18d6baf2c5dc5a24', // 'etudiant2026'
  },
  {
    id: 'MGR-EST-01',
    name: 'Karim Tazi',
    email: 'rabohr417@gmail.com',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    passwordHash: '201e98dde9dfe48c9e32c2eb652eb1cbf87381164674233aa0e00014089078dd', // 'gerant2026'
  },
];

// Sessions actives stockées sur le serveur (Token -> User)
interface ActiveSession {
  token: string;
  userId: string;
  email: string;
  role: 'student' | 'manager';
  createdAt: number;
  expiresAt: number;
}

const activeSessions = new Map<string, ActiveSession>();

// Suivi des tentatives de connexion pour le rate-limiting (Anti-bruteforce)
interface AttemptTracker {
  count: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, AttemptTracker>();

function checkRateLimit(identifier: string): { allowed: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record) return { allowed: true };

  if (record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, remainingMinutes };
  }

  if (record.blockedUntil <= now && record.blockedUntil > 0) {
    loginAttempts.delete(identifier);
  }
  return { allowed: true };
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const current = loginAttempts.get(identifier) || { count: 0, blockedUntil: 0 };
  current.count += 1;
  if (current.count >= 5) {
    // Blocage pendant 15 minutes
    current.blockedUntil = now + 15 * 60 * 1000;
  }
  loginAttempts.set(identifier, current);
}

function resetFailedAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

// Initialisation de l'application Express
async function startServer() {
  const app = express();
  app.use(express.json());

  // Middleware d'extraction de session (Bearer token ou cookie HttpOnly)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/biblioest_session=([^;]+)/);
      if (match) token = match[1];
    }

    if (token && activeSessions.has(token)) {
      const session = activeSessions.get(token)!;
      if (session.expiresAt > Date.now()) {
        (req as any).user = session;
      } else {
        activeSessions.delete(token);
      }
    }
    next();
  });

  // -------------------------------------------------------------
  // API ROUTE : SANTÉ DU SERVEUR
  // -------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'biblioEST Backend Server',
      timestamp: new Date().toISOString(),
      security: {
        serverSideAuth: true,
        rateLimiterActive: true,
        sessionManagement: 'HttpOnly-compatible Bearer Tokens',
      },
    });
  });

  // -------------------------------------------------------------
  // API ROUTE : CONNEXION SÉCURISÉE CÔTÉ SERVEUR (AVEC RATE LIMITING)
  // -------------------------------------------------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const clientIp = req.ip || '127.0.0.1';
    const rateKey = `${clientIp}_${(email || '').toLowerCase()}`;

    const limitStatus = checkRateLimit(rateKey);
    if (!limitStatus.allowed) {
      return res.status(429).json({
        success: false,
        error: `Trop de tentatives de connexion échouées. Compte temporairement verrouillé pour ${limitStatus.remainingMinutes} minute(s) pour protéger votre compte.`,
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir votre adresse e-mail et votre mot de passe.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const providedHash = crypto.createHash('sha256').update(password).digest('hex');

    // Vérification stricte côté serveur
    const matchedAccount = SERVER_INTERNAL_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );

    if (!matchedAccount || matchedAccount.passwordHash !== providedHash) {
      recordFailedAttempt(rateKey);
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides. Vérifiez votre adresse et mot de passe.',
      });
    }

    // Réinitialisation des tentatives en cas de succès
    resetFailedAttempts(rateKey);

    // Génération d'un token de session cryptographique aléatoire de 256 bits
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 heures

    activeSessions.set(sessionToken, {
      token: sessionToken,
      userId: matchedAccount.id,
      email: matchedAccount.email,
      role: matchedAccount.role,
      createdAt: Date.now(),
      expiresAt,
    });

    // Définition d'un cookie HttpOnly sécurisé
    res.cookie('biblioest_session', sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    // Retourne le profil utilisateur SANS exposer de mot de passe ni de hash
    const publicUser = {
      id: matchedAccount.id,
      name: matchedAccount.name,
      email: matchedAccount.email,
      role: matchedAccount.role,
      studentCardId: matchedAccount.studentCardId,
      avatar: matchedAccount.avatar,
    };

    return res.json({
      success: true,
      token: sessionToken,
      user: publicUser,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  });

  // -------------------------------------------------------------
  // API ROUTE : RÉCUPÉRATION DU COMPTE CONNECTÉ (VÉRIFICATION SERVEUR)
  // -------------------------------------------------------------
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = (req as any).user as ActiveSession | undefined;
    if (!session) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    const matchedAccount = SERVER_INTERNAL_ACCOUNTS.find((a) => a.id === session.userId);
    if (!matchedAccount) {
      return res.status(401).json({ success: false, error: 'Compte introuvable' });
    }

    return res.json({
      success: true,
      user: {
        id: matchedAccount.id,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        studentCardId: matchedAccount.studentCardId,
        avatar: matchedAccount.avatar,
      },
    });
  });

  // -------------------------------------------------------------
  // API ROUTE : DÉCONNEXION SERVEUR
  // -------------------------------------------------------------
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const session = (req as any).user as ActiveSession | undefined;
    if (session) {
      activeSessions.delete(session.token);
    }
    res.clearCookie('biblioest_session');
    return res.json({ success: true, message: 'Session fermée proprement' });
  });

  // -------------------------------------------------------------
  // API ROUTE : COMPTES DE TEST INTERNES (VÉRIFIÉS CÔTÉ SERVEUR)
  // -------------------------------------------------------------
  app.get('/api/system/test-accounts-info', (_req: Request, res: Response) => {
    // Ne renvoie JAMAIS de mot de passe ni de hash
    const accounts = SERVER_INTERNAL_ACCOUNTS.map((a) => ({
      name: a.name,
      email: a.email,
      role: a.role === 'manager' ? 'Gérant de bibliothèque' : 'Étudiant',
      hasActiveLoans: a.id === 'EST-2024-110' ? '3 prêts (limite atteinte)' : '1 prêt',
    }));
    res.json({
      notice: "Comptes de test internes gérés par le serveur pour évaluation académique EST USMBA",
      accounts,
    });
  });

  // -------------------------------------------------------------
  // MONTAGE DU CLIENT REACT / VITE EN DEV ET STATIQUE EN PROD
  // -------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[biblioEST] Serveur Express + Vite démarré sur http://0.0.0.0:${PORT}`);
    console.log(`[biblioEST] Authentification serveur active, cookies HttpOnly et rate-limiting configurés.`);
  });
}

startServer().catch((err) => {
  console.error('[biblioEST] Erreur de démarrage serveur:', err);
  process.exit(1);
});
