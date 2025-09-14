'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

// WebSocket not implemented in Firebase Functions yet
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://europe-west4-spektif-agency-final-prod.cloudfunctions.net'

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
  const [isConnected, setIsConnected] = useState(false)

  // For now, disable WebSocket since it's not implemented
  // and use polling instead
  useEffect(() => {
    if (!session?.user || !boardId) return

    // Set connected to true for UI purposes
    setIsConnected(true)

    // Poll for updates every 30 seconds (reduced frequency)
    const pollInterval = setInterval(() => {
      // Emit a custom event to trigger data refresh
      window.dispatchEvent(new CustomEvent('poll-for-updates', {
        detail: { boardId }
      }))
    }, 30000)

    return () => {
      clearInterval(pollInterval)
      setIsConnected(false)
    }
  }, [session, boardId])

  // Emit events (for future WebSocket implementation)
  const emitCardMoved = useCallback((data: {
    cardId: string
    listId: string
    position: number
    previousListId?: string
  }) => {
    console.log('Card moved:', data)
    // For now, just log - WebSocket will be implemented later
  }, [boardId])

  const emitCardCreated = useCallback((data: {
    card: any
    listId: string
  }) => {
    console.log('Card created:', data)
  }, [boardId])

  const emitCardUpdated = useCallback((data: {
    cardId: string
    updates: any
  }) => {
    console.log('Card updated:', data)
  }, [boardId])

  const emitListCreated = useCallback((data: {
    list: any
  }) => {
    console.log('List created:', data)
  }, [boardId])

  return {
    isConnected,
    emitCardMoved,
    emitCardCreated,
    emitCardUpdated,
    emitListCreated
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
