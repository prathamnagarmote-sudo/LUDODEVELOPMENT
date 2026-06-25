import { Client, Session } from '@heroiclabs/nakama-js';
import type { Socket } from '@heroiclabs/nakama-js';

// Production Railway Nakama server — used as fallback when env var is absent.
// Never falls back to window.location.hostname since Vercel cannot run Nakama.
const PRODUCTION_NAKAMA_HOST = 'nakama-production-e5b8.up.railway.app';
const PRODUCTION_NAKAMA_PORT = '443';

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const isLocalNetwork = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('192.168.') ||
   window.location.hostname.startsWith('10.'));

// On localhost/LAN: ALWAYS connect to local Nakama (localhost:7350).
// The .env VITE_NAKAMA_HOST points to Railway (production) — using it on localhost
// routes all WebSocket traffic through the remote server, adding 50-200ms of real
// network latency per message (dice rolls, token moves, turn changes). This latency
// is the primary cause of visible lag when testing with two browsers locally.
// On production (Vercel/HTTPS): use env var → Railway Nakama.
const resolvedHost = isLocalNetwork
  ? (window.location.hostname)  // always local on localhost/LAN
  : (import.meta.env.VITE_NAKAMA_HOST || PRODUCTION_NAKAMA_HOST);

const resolvedPort = isLocalNetwork
  ? '7350'  // always local Nakama port on localhost/LAN
  : (import.meta.env.VITE_NAKAMA_PORT || PRODUCTION_NAKAMA_PORT);

const useSSL = isLocalNetwork
  ? false   // local Nakama never uses SSL
  : (import.meta.env.VITE_NAKAMA_SSL === 'true' ||
     import.meta.env.VITE_NAKAMA_USE_SSL === 'true' ||
     isHttps);

console.log('[Nakama] Connecting to', resolvedHost + ':' + resolvedPort, 'SSL:', useSSL);

const client = new Client(
  import.meta.env.VITE_NAKAMA_KEY || import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey",
  resolvedHost,
  resolvedPort,
  useSSL
);

let session: Session | null = null;
// We keep ONE socket reference. Never replace it with a new object on reconnect —
// replacing it drops all onmatchdata / onmatchmakermatched handlers that callers
// have already installed on the old reference.
let socket: Socket | null = null;

const isSocketOpen = (): boolean => {
  if (!socket) return false;
  const ws = (socket as any).socket as WebSocket | undefined;
  return ws?.readyState === WebSocket.OPEN;
};

export const authenticate = async (userId: string, username?: string): Promise<Session> => {
  const nakamaId = userId.length < 6 ? `usr_${userId}` : userId;
  session = await client.authenticateCustom(nakamaId, true, username);

  if (username) {
    try {
      await client.updateAccount(session, { username });
    } catch (err) {
      console.warn("Failed to update username in Nakama:", err);
    }
  }

  if (!socket) {
    socket = client.createSocket(useSSL, false);
    await socket.connect(session, true);
  } else if (!isSocketOpen()) {
    // Reconnect the SAME socket object so callers' handler references stay valid
    await socket.connect(session, true);
  }

  return session;
};

export const ensureSocketConnected = async (): Promise<Socket> => {
  if (!session) {
    throw new Error("Nakama session not initialized. Please authenticate first.");
  }
  if (!socket) {
    socket = client.createSocket(useSSL, false);
    await socket.connect(session, true);
  } else if (!isSocketOpen()) {
    // Reconnect on the same instance — preserves handler references
    await socket.connect(session, true);
  }
  return socket;
};

export const getNakamaSocket = (): Socket => {
  if (!socket) {
    throw new Error("Nakama socket not initialized. Please authenticate first.");
  }
  return socket;
};

export const getSession = (): Session | null => session;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect(false);
    socket = null;
  }
  session = null;
};
