'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Only connect WebSocket for logged-in users
    if (!user) {
      setIsConnected(false);
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Listen for bet updates
    socket.on('betUpdate', (data) => {
      console.log('Bet update received:', data);
      queryClient.invalidateQueries({ queryKey: ['bets', data.betId] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });
    });

    // Listen for odds changes
    socket.on('oddsUpdate', (data) => {
      console.log('Odds update received:', data);
      queryClient.invalidateQueries({ queryKey: ['bets', data.betId] });
    });

    // Listen for new notifications
    socket.on('notification', (data) => {
      console.log('New notification:', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Listen for bet resolution
    socket.on('betResolved', (data) => {
      console.log('Bet resolved:', data);
      queryClient.invalidateQueries({ queryKey: ['bets', data.betId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'bets'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [queryClient, user]); // Add user as dependency

  return {
    socket: socketRef.current,
    isConnected,
  };
}
