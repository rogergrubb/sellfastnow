// WebSocket Service for Real-time Messaging
// Handles WebSocket connections and message broadcasting

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socket IDs

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/socket.io/",
    });

    this.userSockets = new Map();
    this.setupSocketHandlers();
    console.log("✅ WebSocket service initialized");
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log("🔌 Client connected:", socket.id);

      // Handle authentication
      socket.on("authenticate", async (data: { userId: string }) => {
        try {
          const { userId } = data;
          
          if (!userId) {
            socket.emit("error", { message: "User ID required" });
            return;
          }

          // Verify user exists
          const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });

          if (!user) {
            socket.emit("error", { message: "User not found" });
            return;
          }

          // Associate socket with user
          socket.userId = userId;
          socket.username = user.username || user.email || "Unknown";

          // Track user's sockets
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          this.userSockets.get(userId)!.add(socket.id);

          // Join user's personal room
          socket.join(`user:${userId}`);

          socket.emit("authenticated", { 
            userId, 
            username: socket.username 
          });

          console.log(`✅ User ${socket.username} (${userId}) authenticated`);
        } catch (error) {
          console.error("Error authenticating socket:", error);
          socket.emit("error", { message: "Authentication failed" });
        }
      });

      // Handle joining conversation rooms
      socket.on("join_conversation", (data: { listingId: string; otherUserId: string }) => {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const { listingId, otherUserId } = data;
        const roomName = this.getConversationRoom(listingId, socket.userId, otherUserId);
        
        socket.join(roomName);
        console.log(`📨 User ${socket.username} joined conversation room: ${roomName}`);
      });

      // Handle leaving conversation rooms
      socket.on("leave_conversation", (data: { listingId: string; otherUserId: string }) => {
        if (!socket.userId) return;

        const { listingId, otherUserId } = data;
        const roomName = this.getConversationRoom(listingId, socket.userId, otherUserId);
        
        socket.leave(roomName);
        console.log(`📭 User ${socket.username} left conversation room: ${roomName}`);
      });

      // Handle joining meetup session rooms
      socket.on("join_meetup", (data: { sessionId: string }) => {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const { sessionId } = data;
        const roomName = `meetup:${sessionId}`;
        
        socket.join(roomName);
        console.log(`📍 User ${socket.username} joined meetup room: ${roomName}`);
      });

      // Handle leaving meetup session rooms
      socket.on("leave_meetup", (data: { sessionId: string }) => {
        if (!socket.userId) return;

        const { sessionId } = data;
        const roomName = `meetup:${sessionId}`;
        
        socket.leave(roomName);
        console.log(`📍 User ${socket.username} left meetup room: ${roomName}`);
      });

      // Handle location updates in meetup sessions
      socket.on("meetup_location_update", (data: { 
        sessionId: string; 
        latitude: number; 
        longitude: number; 
        accuracy?: number;
      }) => {
        if (!socket.userId) return;

        const { sessionId, latitude, longitude, accuracy } = data;
        const roomName = `meetup:${sessionId}`;
        
        // Broadcast location update to all participants in the room
        this.io.to(roomName).emit("location_updated", {
          sessionId,
          userId: socket.userId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
        });
      });

      // Handle meetup status updates
      socket.on("meetup_status_update", (data: { 
        sessionId: string; 
        status: string;
      }) => {
        if (!socket.userId) return;

        const { sessionId, status } = data;
        const roomName = `meetup:${sessionId}`;
        
        // Broadcast status update to all participants
        this.io.to(roomName).emit("status_updated", {
          sessionId,
          userId: socket.userId,
          status,
          timestamp: new Date(),
        });
      });

      // Handle typing indicators
      socket.on("typing", (data: { listingId: string; receiverId: string; isTyping: boolean }) => {
        if (!socket.userId) return;

        const { listingId, receiverId, isTyping } = data;
        
        // Send typing indicator to receiver
        this.io.to(`user:${receiverId}`).emit("user_typing", {
          listingId,
          userId: socket.userId,
          username: socket.username,
          isTyping,
        });
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);

        if (socket.userId) {
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  // Get conversation room name (consistent for both users)
  private getConversationRoom(listingId: string, userId1: string, userId2: string): string {
    const sortedUsers = [userId1, userId2].sort();
    return `conversation:${listingId}:${sortedUsers[0]}:${sortedUsers[1]}`;
  }

  // Broadcast new message to conversation participants
  public broadcastMessage(message: {
    id: string;
    listingId: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
  }) {
    const roomName = this.getConversationRoom(
      message.listingId,
      message.senderId,
      message.receiverId
    );

    console.log(`📤 Broadcasting message to room: ${roomName}`);

    // Emit to conversation room
    this.io.to(roomName).emit("new_message", message);

    // Also emit to receiver's personal room (for notifications)
    this.io.to(`user:${message.receiverId}`).emit("message_notification", {
      messageId: message.id,
      listingId: message.listingId,
      senderId: message.senderId,
      preview: message.content.substring(0, 100),
      createdAt: message.createdAt,
    });
  }

  // Broadcast message read status update
  public broadcastMessageRead(messageId: string, userId: string, senderId: string) {
    this.io.to(`user:${senderId}`).emit("message_read", {
      messageId,
      readBy: userId,
      readAt: new Date(),
    });
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Get Socket.IO instance (for external use if needed)
  public getIO(): SocketIOServer {
    return this.io;
  }

  // Broadcast meetup session update to participants
  public broadcastMeetupUpdate(sessionId: string, data: any) {
    const roomName = `meetup:${sessionId}`;
    console.log(`📍 Broadcasting meetup update to room: ${roomName}`);
    this.io.to(roomName).emit("meetup_updated", data);
  }

  // Broadcast location update to meetup participants
  public broadcastLocationUpdate(sessionId: string, userId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) {
    const roomName = `meetup:${sessionId}`;
    this.io.to(roomName).emit("location_updated", {
      sessionId,
      userId,
      ...location,
      timestamp: new Date(),
    });
  }

  // Broadcast meetup message to participants
  public broadcastMeetupMessage(sessionId: string, message: any) {
    const roomName = `meetup:${sessionId}`;
    this.io.to(roomName).emit("meetup_message", message);
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

export function initializeWebSocketService(httpServer: HTTPServer): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
  }
  return websocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return websocketService;
}

