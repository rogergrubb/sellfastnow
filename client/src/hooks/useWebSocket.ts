// WebSocket Hook for Real-time Messaging
// Manages WebSocket connection and message events

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/AuthContext';
import type { Message } from '@shared/schema';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (listingId: string, otherUserId: string) => void;
  leaveConversation: (listingId: string, otherUserId: string) => void;
  sendTypingIndicator: (listingId: string, receiverId: string, isTyping: boolean) => void;
  onNewMessage: (callback: (message: Message) => void) => void;
  onMessageRead: (callback: (data: { messageId: string; readBy: string; readAt: Date }) => void) => void;
  onUserTyping: (callback: (data: { listingId: string; userId: string; username: string; isTyping: boolean }) => void) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef<{
    onNewMessage: ((message: Message) => void)[];
    onMessageRead: ((data: any) => void)[];
    onUserTyping: ((data: any) => void)[];
  }>({
    onNewMessage: [],
    onMessageRead: [],
    onUserTyping: [],
  });

  useEffect(() => {
    if (!user) return;

    // Determine WebSocket URL based on environment
    const wsUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:5000';

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    // Create socket connection
    const socket = io(wsUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with user ID
      socket.emit('authenticate', { userId: user.id });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Message event handlers
    socket.on('new_message', (message: Message) => {
      console.log('📨 Received new message:', message);
      callbacksRef.current.onNewMessage.forEach(cb => cb(message));
    });

    socket.on('message_read', (data) => {
      console.log('✅ Message read:', data);
      callbacksRef.current.onMessageRead.forEach(cb => cb(data));
    });

    socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      callbacksRef.current.onUserTyping.forEach(cb => cb(data));
    });

    socket.on('message_notification', (data) => {
      console.log('🔔 Message notification:', data);
      // Could show browser notification here
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting WebSocket');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinConversation = useCallback((listingId: string, otherUserId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', { listingId, otherUserId });
      console.log('📥 Joined conversation:', { listingId, otherUserId });
    }
  }, []);

  const leaveConversation = useCallback((listingId: string, otherUserId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', { listingId, otherUserId });
      console.log('📤 Left conversation:', { listingId, otherUserId });
    }
  }, []);

  const sendTypingIndicator = useCallback((listingId: string, receiverId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { listingId, receiverId, isTyping });
    }
  }, []);

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    callbacksRef.current.onNewMessage.push(callback);
    
    // Return cleanup function
    return () => {
      callbacksRef.current.onNewMessage = callbacksRef.current.onNewMessage.filter(cb => cb !== callback);
    };
  }, []);

  const onMessageRead = useCallback((callback: (data: any) => void) => {
    callbacksRef.current.onMessageRead.push(callback);
    
    return () => {
      callbacksRef.current.onMessageRead = callbacksRef.current.onMessageRead.filter(cb => cb !== callback);
    };
  }, []);

  const onUserTyping = useCallback((callback: (data: any) => void) => {
    callbacksRef.current.onUserTyping.push(callback);
    
    return () => {
      callbacksRef.current.onUserTyping = callbacksRef.current.onUserTyping.filter(cb => cb !== callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    sendTypingIndicator,
    onNewMessage,
    onMessageRead,
    onUserTyping,
  };
}

