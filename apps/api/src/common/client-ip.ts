import type { Request } from 'express';

/** Client IP behind the reverse proxy (`trust proxy` is enabled in bootstrap). */
export function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}
