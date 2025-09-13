import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

@Injectable()
@WSGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://spektif-agency-final.vercel.app',
      /\.vercel\.app$/
    ],
    credentials: true,
  },
  namespace: '/realtime',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, AuthenticatedSocket>(); // socketId -> socket

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.id;
      client.organizationId = payload.organizationId;

      // Store user connection
      this.connectedUsers.set(payload.id, client.id);
      this.userSockets.set(client.id, client);

      console.log(`✅ User ${payload.id} connected via WebSocket`);
      
      // Join organization room
      if (payload.organizationId) {
        client.join(`org-${payload.organizationId}`);
      }

    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.userSockets.delete(client.id);
      console.log(`👋 User ${client.userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('join-board')
  handleJoinBoard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { boardId: string }
  ) {
    if (!client.userId) return;
    
    client.join(`board-${data.boardId}`);
    console.log(`📋 User ${client.userId} joined board ${data.boardId}`);
    
    // Notify others in the board
    client.to(`board-${data.boardId}`).emit('user-joined', {
      userId: client.userId,
      boardId: data.boardId,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('leave-board')
  handleLeaveBoard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { boardId: string }
  ) {
    client.leave(`board-${data.boardId}`);
    console.log(`📋 User ${client.userId} left board ${data.boardId}`);
  }

  @SubscribeMessage('card-moved')
  handleCardMoved(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      cardId: string;
      boardId: string;
      listId: string;
      position: number;
      previousListId?: string;
    }
  ) {
    if (!client.userId) return;

    // Broadcast to all users in the board (except sender)
    client.to(`board-${data.boardId}`).emit('card-updated', {
      type: 'moved',
      cardId: data.cardId,
      boardId: data.boardId,
      listId: data.listId,
      position: data.position,
      previousListId: data.previousListId,
      userId: client.userId,
      timestamp: new Date().toISOString()
    });

    console.log(`🔄 Card ${data.cardId} moved by user ${client.userId}`);
  }

  @SubscribeMessage('card-created')
  handleCardCreated(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      card: any;
      boardId: string;
      listId: string;
    }
  ) {
    if (!client.userId) return;

    client.to(`board-${data.boardId}`).emit('card-updated', {
      type: 'created',
      card: data.card,
      boardId: data.boardId,
      listId: data.listId,
      userId: client.userId,
      timestamp: new Date().toISOString()
    });

    console.log(`➕ Card created by user ${client.userId}`);
  }

  @SubscribeMessage('card-updated')
  handleCardUpdated(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      cardId: string;
      boardId: string;
      updates: any;
    }
  ) {
    if (!client.userId) return;

    client.to(`board-${data.boardId}`).emit('card-updated', {
      type: 'updated',
      cardId: data.cardId,
      boardId: data.boardId,
      updates: data.updates,
      userId: client.userId,
      timestamp: new Date().toISOString()
    });

    console.log(`✏️ Card ${data.cardId} updated by user ${client.userId}`);
  }

  @SubscribeMessage('list-created')
  handleListCreated(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      list: any;
      boardId: string;
    }
  ) {
    if (!client.userId) return;

    client.to(`board-${data.boardId}`).emit('list-updated', {
      type: 'created',
      list: data.list,
      boardId: data.boardId,
      userId: client.userId,
      timestamp: new Date().toISOString()
    });

    console.log(`📝 List created by user ${client.userId}`);
  }

  @SubscribeMessage('list-reordered')
  handleListReordered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      boardId: string;
      listOrders: Array<{ id: string; position: number }>;
    }
  ) {
    if (!client.userId) return;

    client.to(`board-${data.boardId}`).emit('list-updated', {
      type: 'reordered',
      boardId: data.boardId,
      listOrders: data.listOrders,
      userId: client.userId,
      timestamp: new Date().toISOString()
    });

    console.log(`🔄 Lists reordered by user ${client.userId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      boardId: string;
      isTyping: boolean;
    }
  ) {
    if (!client.userId) return;

    client.to(`board-${data.boardId}`).emit('user-typing', {
      userId: client.userId,
      boardId: data.boardId,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString()
    });
  }

  // Utility methods for broadcasting from services
  broadcastToBoard(boardId: string, event: string, data: any) {
    this.server.to(`board-${boardId}`).emit(event, data);
  }

  broadcastToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org-${organizationId}`).emit(event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.userSockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
