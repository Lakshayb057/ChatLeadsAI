'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const unmounted = useRef(false);   // guard against post-unmount reconnections

  const connect = useCallback(() => {
    if (unmounted.current) return;                           // don't reconnect after unmount
    if (ws.current?.readyState === WebSocket.OPEN) return;  // already open

    console.log(`Attempting WebSocket connection to ${url}...`);
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

      // Heartbeat — prevents Render from closing idle connections after 60 s
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      socket.addEventListener('close', () => clearInterval(pingInterval));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);

      if (unmounted.current) return;  // component gone — no reconnect

      // Exponential back-off, capped at 30 s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        connect();
      }, delay);
    };

    socket.onerror = (error) => {
      // NOTE: do NOT call socket.close() here.
      // The browser automatically closes the socket after an error, which
      // will fire onclose and trigger the reconnect logic above.
      // Calling close() manually before the connection is established causes
      // the "WebSocket is closed before the connection is established" warning.
      console.warn('WebSocket error (will auto-reconnect):', error);
    };

    ws.current = socket;
  }, [url]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;  // mark unmounted before any cleanup
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; // prevent onclose from scheduling another reconnect
        ws.current.close();
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
