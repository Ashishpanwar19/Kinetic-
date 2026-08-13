import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  aud: string;
  auth_time: number;
  iat: number;
  exp: number;
  sub: string;
  iss: string;
  firebase?: {
    identities?: Record<string, string[]>;
    sign_in_provider?: string;
  };
}

const FIREBASE_PROJECT_IDS: string[] = [
  'kinetic-arrow-451514-a8',
  'pulsenews-ai',
];

/**
 * Verify a Firebase ID token server-side.
 * Decodes and validates JWT claims without full signature verification.
 */
function decodeJwt(token: string): FirebaseTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson) as FirebaseTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    if (payload.iss && !FIREBASE_PROJECT_IDS.some(pid => payload.iss.includes(pid))) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = decodeJwt(token);

  if (!payload || !payload.uid) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = payload.uid;
  req.userEmail = payload.email;
  req.userRole = 'user';
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = decodeJwt(token);
    if (payload && payload.uid) {
      req.userId = payload.uid;
      req.userEmail = payload.email;
      req.userRole = 'user';
    }
  }
  next();
}
