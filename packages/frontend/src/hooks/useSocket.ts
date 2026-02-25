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
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for bet updates (includes LMSR price changes from trades)
    socket.on('betUpdate', (data) => {
      const betId = data?.data?.bet?.betId || data?.betId;
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['bets', betId] });
        queryClient.invalidateQueries({ queryKey: ['trading', 'prices', betId] });
        queryClient.invalidateQueries({ queryKey: ['trading', 'chart', betId] });
      }
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });
    });

    // BET_UPDATE event type (emitted by SocketService via WSEvent)
    socket.on('BET_UPDATE', (event: any) => {
      const betId = event?.data?.bet?.betId;
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['trading', 'prices', betId] });
        queryClient.invalidateQueries({ queryKey: ['trading', 'chart', betId] });
        queryClient.invalidateQueries({ queryKey: ['bets', betId] });
      }
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });
    });

    // Listen for balance updates
    socket.on('USER_BALANCE_UPDATE', (event: any) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'portfolio'] });
    });

    // Listen for odds changes
    socket.on('oddsUpdate', (data) => {
      queryClient.invalidateQueries({ queryKey: ['bets', data.betId] });
    });

    // Listen for new notifications
    socket.on('notification', (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Listen for bet resolution
    socket.on('betResolved', (data) => {
      queryClient.invalidateQueries({ queryKey: ['bets', data.betId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'bets'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });      queryClient.invalidateQueries({ queryKey: ['trading', 'prices', data.betId] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'portfolio'] });
    });

    // BET_SETTLED event type
    socket.on('BET_SETTLED', (event: any) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });    });

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
