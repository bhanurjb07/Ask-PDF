import { Response } from 'express';

// Initialize Server-Sent Events response.
export const initSse = (res: Response) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
};

// Send an event through the SSE connection.
export const sendSseEvent = (res: Response, event: string, data: any) => {
  if (res.writableEnded) {
    return;
  }

  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Close the SSE connection.
export const closeSse = (res: Response) => {
  if (!res.writableEnded) {
    res.end();
  }
};

export default {
  initSse,
  sendSseEvent,
  closeSse,
};