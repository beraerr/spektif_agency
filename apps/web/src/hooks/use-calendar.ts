import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function useCalendarEvents(boardId: string) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await apiClient.getCalendarEvents(boardId) as any[]
      setEvents(eventsData)
    } catch (error) {
      console.error('Error loading calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (boardId) {
      loadEvents()
    }
  }, [boardId])

  return { events, loading, refetch: loadEvents }
}
