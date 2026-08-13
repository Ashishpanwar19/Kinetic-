import { Request, Response, NextFunction } from 'express';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string;
  ip: string;
  userAgent?: string;
  error?: string;
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    entry.level.padEnd(5),
    `${entry.method} ${entry.path}`,
    `${entry.status}`,
    `${entry.durationMs}ms`,
    `ip=${entry.ip}`,
  ];
  if (entry.userId) parts.push(`user=${entry.userId}`);
  if (entry.error) parts.push(`error="${entry.error}"`);
  return parts.join(' ');
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.substring(7, 20) : undefined;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level: LogLevel = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      userId,
      ip,
      userAgent: req.headers['user-agent']?.substring(0, 50),
    };

    if (res.statusCode >= 400) {
      entry.error = res.statusMessage;
    }

    const logLine = formatLog(entry);
    if (level === 'ERROR') {
      console.error(logLine);
    } else if (level === 'WARN') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
}

export function logAIUsage(agent: string, koId: string | undefined, success: boolean, latencyMs: number, model: string, inputTokens?: number, outputTokens?: number): void {
  const entry = [
    `[${new Date().toISOString()}]`,
    'AI    ',
    `agent=${agent}`,
    `ko=${koId || 'N/A'}`,
    `success=${success}`,
    `${latencyMs}ms`,
    `model=${model}`,
  ];
  if (inputTokens) entry.push(`in_tokens=${inputTokens}`);
  if (outputTokens) entry.push(`out_tokens=${outputTokens}`);
  console.log(entry.join(' '));
}
