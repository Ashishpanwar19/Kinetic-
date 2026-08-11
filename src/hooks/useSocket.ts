import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { KnowledgeObject } from '../types';

export interface StreamStatusPayload {
  id: string;
  is_live: boolean;
  viewers: string;
  publisher?: string;
  title?: string;
}

export interface NewsUpdatePayload {
  action: string;
  article?: KnowledgeObject;
  message?: string;
  timestamp: string;
}

interface UseSocketOptions {
  onNewsUpdate?: (data: NewsUpdatePayload) => void;
  onStreamStatus?: (data: { streams?: StreamStatusPayload[]; stream?: StreamStatusPayload }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestNews, setLatestNews] = useState<KnowledgeObject | null>(null);
  const [streamStatuses, setStreamStatuses] = useState<Record<string, StreamStatusPayload>>({});
  const [socketId, setSocketId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Store options in ref to avoid re-triggering effect on option reference changes
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Establish persistent connection to backend socket.io server
    const socket: Socket = io({
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Connected with ID:', socket.id);
      setIsConnected(true);
      setSocketId(socket.id || null);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ [Socket.io] Disconnected:', reason);
      setIsConnected(false);
      setSocketId(null);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚡ [Socket.io] Connection warning:', err.message);
    });

    // Handle incoming 'news_update' event
    socket.on('news_update', (data: NewsUpdatePayload) => {
      console.log('⚡ [Socket.io Event] news_update received:', data);
      if (data && data.article) {
        setLatestNews(data.article);
      }
      if (optionsRef.current.onNewsUpdate) {
        optionsRef.current.onNewsUpdate(data);
      }
    });

    // Handle incoming 'stream_status' event
    socket.on('stream_status', (data: { streams?: StreamStatusPayload[]; stream?: StreamStatusPayload }) => {
      console.log('⚡ [Socket.io Event] stream_status received:', data);
      if (data.streams && Array.isArray(data.streams)) {
        setStreamStatuses((prev) => {
          const next = { ...prev };
          data.streams!.forEach((s) => {
            next[s.id] = s;
          });
          return next;
        });
      } else if (data.stream) {
        setStreamStatuses((prev) => ({
          ...prev,
          [data.stream!.id]: data.stream!,
        }));
      }

      if (optionsRef.current.onStreamStatus) {
        optionsRef.current.onStreamStatus(data);
      }
    });

    return () => {
      console.log('⚡ [Socket.io] Cleaning up persistent connection');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('news_update');
      socket.off('stream_status');
      socket.disconnect();
    };
  }, []);

  const emitEvent = (eventName: string, payload: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(eventName, payload);
    } else {
      console.warn('⚡ Cannot emit event, socket not connected');
    }
  };

  return {
    isConnected,
    socketId,
    latestNews,
    streamStatuses,
    emitEvent,
  };
}
