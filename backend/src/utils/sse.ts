/**
 * A tiny in-process Server-Sent Events hub.
 *
 * Real-time delivery for notifications: when the CAO dashboard or a
 * farmer's app opens GET /api/notifications/stream, its response is
 * held open here and any notification created for that user is
 * pushed down the same connection immediately - no polling.
 *
 * "In-process" means this works for a single backend instance,
 * which is the whole deployment for this system. If it is ever run
 * behind more than one Node process, swap this for Redis pub/sub;
 * every call site already goes through publish()/subscribe().
 */

import { Response } from 'express';

interface Client {
  userId: number;
  res: Response;
}

const clients = new Set<Client>();

/** Registers an open SSE response for a user. Returns an unsubscribe fn. */
export function subscribe(userId: number, res: Response): () => void {
  const client: Client = { userId, res };
  clients.add(client);

  // Standard SSE headers. flushHeaders sends them before the first
  // event so the browser's EventSource fires `onopen` right away.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');
  res.write(': connected\n\n');

  // A comment line every 25s keeps proxies and mobile radios from
  // dropping an idle connection.
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* the close handler below will clean this up */
    }
  }, 25_000);

  const cleanup = (): void => {
    clearInterval(heartbeat);
    clients.delete(client);
  };

  res.on('close', cleanup);

  return cleanup;
}

/** Pushes one JSON payload to every open connection for these users. */
export function publish(userIds: number[], event: string, data: unknown): void {
  if (userIds.length === 0) return;
  const targets = new Set(userIds);
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of clients) {
    if (!targets.has(client.userId)) continue;
    try {
      client.res.write(frame);
    } catch {
      clients.delete(client);
    }
  }
}
