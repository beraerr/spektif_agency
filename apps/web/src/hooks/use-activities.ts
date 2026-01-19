'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Activity {
  id: string
  type: 'project_created' | 'employee_added' | 'client_added' | 'card_moved' | 'payment_received' | 'payment_overdue'
  message: string
  userName?: string
  projectName?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export function useActivities(organizationId: string = 'spektif', maxItems: number = 10) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId) return

    try {
      // Query activities collection ordered by timestamp
      const activitiesRef = collection(db, 'organizations', organizationId, 'activities')
      const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(maxItems))

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activitiesList: Activity[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            activitiesList.push({
              id: doc.id,
              type: data.type,
              message: data.message,
              userName: data.userName,
              projectName: data.projectName,
              timestamp: data.timestamp?.toDate() || new Date(),
              metadata: data.metadata
            })
          })
          setActivities(activitiesList)
          setLoading(false)
        },
        (err) => {
          console.error('Error fetching activities:', err)
          setError(err as Error)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up activities listener:', err)
      setError(err as Error)
      setLoading(false)
    }
  }, [organizationId, maxItems])

  return { activities, loading, error }
}

// Helper function to create activity
export async function createActivity(
  organizationId: string,
  type: Activity['type'],
  message: string,
  metadata?: Record<string, any>
) {
  try {
    const activitiesRef = collection(db, 'organizations', organizationId, 'activities')
    await addDoc(activitiesRef, {
      type,
      message,
      userName: metadata?.userName,
      projectName: metadata?.projectName,
      timestamp: Timestamp.now(),
      metadata
    })
  } catch (error) {
    console.error('Error creating activity:', error)
    throw error
  }
}

// Format timestamp to Turkish relative time
export function formatActivityTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Az önce'
  if (diffMins < 60) return `${diffMins} dakika önce`
  if (diffHours < 24) return `${diffHours} saat önce`
  if (diffDays < 7) return `${diffDays} gün önce`
  return date.toLocaleDateString('tr-TR')
}
