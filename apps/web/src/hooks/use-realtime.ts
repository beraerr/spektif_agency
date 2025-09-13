'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

interface RealtimeEvent {
  type: 'moved' | 'created' | 'updated' | 'deleted' | 'reordered'
  cardId?: string
  boardId: string
  listId?: string
  position?: number
  previousListId?: string
  card?: any
  list?: any
  listOrders?: Array<{ id: string; position: number }>
  updates?: any
  userId: string
  timestamp: string
}

interface TypingEvent {
  userId: string
  boardId: string
  isTyping: boolean
  timestamp: string
}

interface UserJoinedEvent {
  userId: string
  boardId: string
  timestamp: string
}

export function useRealtimeBoard(boardId: string) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user || !boardId) return

    const token = (session.user as any)?.backendToken
    if (!token) return

    const newSocket = io(`${WS_URL}/realtime`, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket')
      setIsConnected(true)
      setSocket(newSocket)
      
      // Join the board room
      newSocket.emit('join-board', { boardId })
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket')
      setIsConnected(false)
      setSocket(null)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      setIsConnected(false)
    })

    return () => {
      newSocket.close()
    }
  }, [session, boardId])

  // Handle real-time events
  useEffect(() => {
    if (!socket) return

    const handleCardUpdated = (event: RealtimeEvent) => {
      console.log('🔄 Card event received:', event)
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('realtime-card-updated', {
        detail: event
      }))
    }

    const handleListUpdated = (event: RealtimeEvent) => {
      console.log('📝 List event received:', event)
      
      window.dispatchEvent(new CustomEvent('realtime-list-updated', {
        detail: event
      }))
    }

    const handleUserTyping = (event: TypingEvent) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        if (event.isTyping) {
          newSet.add(event.userId)
        } else {
          newSet.delete(event.userId)
        }
        return newSet
      })
    }

    const handleUserJoined = (event: UserJoinedEvent) => {
      setOnlineUsers(prev => new Set(prev).add(event.userId))
    }

    socket.on('card-updated', handleCardUpdated)
    socket.on('list-updated', handleListUpdated)
    socket.on('user-typing', handleUserTyping)
    socket.on('user-joined', handleUserJoined)

    return () => {
      socket.off('card-updated', handleCardUpdated)
      socket.off('list-updated', handleListUpdated)
      socket.off('user-typing', handleUserTyping)
      socket.off('user-joined', handleUserJoined)
    }
  }, [socket])

  // Emit events
  const emitCardMoved = useCallback((data: {
    cardId: string
    listId: string
    position: number
    previousListId?: string
  }) => {
    if (socket && isConnected) {
      socket.emit('card-moved', {
        ...data,
        boardId
      })
    }
  }, [socket, isConnected, boardId])

  const emitCardCreated = useCallback((data: {
    card: any
    listId: string
  }) => {
    if (socket && isConnected) {
      socket.emit('card-created', {
        ...data,
        boardId
      })
    }
  }, [socket, isConnected, boardId])

  const emitCardUpdated = useCallback((data: {
    cardId: string
    updates: any
  }) => {
    if (socket && isConnected) {
      socket.emit('card-updated', {
        ...data,
        boardId
      })
    }
  }, [socket, isConnected, boardId])

  const emitListCreated = useCallback((data: {
    list: any
  }) => {
    if (socket && isConnected) {
      socket.emit('list-created', {
        ...data,
        boardId
      })
    }
  }, [socket, isConnected, boardId])

  const emitListReordered = useCallback((data: {
    listOrders: Array<{ id: string; position: number }>
  }) => {
    if (socket && isConnected) {
      socket.emit('list-reordered', {
        ...data,
        boardId
      })
    }
  }, [socket, isConnected, boardId])

  const emitTyping = useCallback((isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        boardId,
        isTyping
      })
    }
  }, [socket, isConnected, boardId])

  return {
    socket,
    isConnected,
    typingUsers: Array.from(typingUsers),
    onlineUsers: Array.from(onlineUsers),
    emitCardMoved,
    emitCardCreated,
    emitCardUpdated,
    emitListCreated,
    emitListReordered,
    emitTyping
  }
}

// Hook for listening to real-time events
export function useRealtimeEvents() {
  const [cardEvents, setCardEvents] = useState<RealtimeEvent[]>([])
  const [listEvents, setListEvents] = useState<RealtimeEvent[]>([])

  useEffect(() => {
    const handleCardEvent = (event: CustomEvent<RealtimeEvent>) => {
      setCardEvents(prev => [...prev.slice(-9), event.detail]) // Keep last 10 events
    }

    const handleListEvent = (event: CustomEvent<RealtimeEvent>) => {
      setListEvents(prev => [...prev.slice(-9), event.detail]) // Keep last 10 events
    }

    window.addEventListener('realtime-card-updated', handleCardEvent as EventListener)
    window.addEventListener('realtime-list-updated', handleListEvent as EventListener)

    return () => {
      window.removeEventListener('realtime-card-updated', handleCardEvent as EventListener)
      window.removeEventListener('realtime-list-updated', handleListEvent as EventListener)
    }
  }, [])

  return {
    cardEvents,
    listEvents
  }
}
