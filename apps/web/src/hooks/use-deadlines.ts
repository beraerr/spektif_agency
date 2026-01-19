'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Deadline {
  id: string
  cardId: string
  boardId: string
  listId: string
  title: string
  dueDate: Date
  projectType?: string
  labels?: string[]
  isProject: boolean
}

export function useDeadlines(organizationId: string = 'spektif') {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId) return

    try {
      // Get all boards for the organization
      const boardsRef = collection(db, 'boards')
      const q = query(boardsRef, where('organizationId', '==', organizationId))

      const unsubscribe = onSnapshot(
        q,
        async (boardsSnapshot) => {
          const allDeadlines: Deadline[] = []

          // Process each board
          for (const boardDoc of boardsSnapshot.docs) {
            const boardId = boardDoc.id
            const boardData = boardDoc.data()

            // Get all lists in this board
            const listsRef = collection(db, 'boards', boardId, 'lists')
            const listsSnapshot = await getDocs(listsRef)

            // Process each list
            for (const listDoc of listsSnapshot.docs) {
              const listId = listDoc.id
              const listData = listDoc.data()

              // Get all cards in this list
              const cardsRef = collection(db, 'boards', boardId, 'lists', listId, 'cards')
              const cardsSnapshot = await getDocs(cardsRef)

              // Process each card
              cardsSnapshot.forEach((cardDoc) => {
                const cardData = cardDoc.data()
                
                // Check if card has "proje" label and has a due date
                const labels = cardData.labels || []
                const isProject = labels.some((label: string) => 
                  label.toLowerCase().includes('proje') || label.toLowerCase() === 'project'
                )

                if (isProject && cardData.dueDate) {
                  const dueDate = cardData.dueDate?.toDate() || new Date(cardData.dueDate)
                  
                  allDeadlines.push({
                    id: cardDoc.id,
                    cardId: cardDoc.id,
                    boardId,
                    listId,
                    title: cardData.title || 'Untitled',
                    dueDate,
                    projectType: cardData.projectType || labels[0],
                    labels,
                    isProject
                  })
                }
              })
            }
          }

          // Sort by due date (soonest first)
          allDeadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

          setDeadlines(allDeadlines)
          setLoading(false)
        },
        (err) => {
          console.error('Error fetching deadlines:', err)
          setError(err as Error)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up deadlines listener:', err)
      setError(err as Error)
      setLoading(false)
    }
  }, [organizationId])

  return { deadlines, loading, error }
}

// Format deadline to Turkish relative time
export function formatDeadline(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMs < 0) return 'Gecikmiş'
  if (diffHours < 24) return 'Bugün'
  if (diffDays === 1) return 'Yarın'
  if (diffDays < 7) return `${diffDays} gün`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta`
  return date.toLocaleDateString('tr-TR')
}

// Get urgency color based on deadline
export function getDeadlineUrgency(date: Date): 'red' | 'orange' | 'yellow' | 'green' {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMs < 0 || diffDays === 0) return 'red' // Overdue or today
  if (diffDays <= 3) return 'orange' // Within 3 days
  if (diffDays <= 7) return 'yellow' // Within a week
  return 'green' // More than a week
}
