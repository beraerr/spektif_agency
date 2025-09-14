import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { Board, List, Card } from './use-boards'

export function useBoard(boardId: string) {
  const { data: session } = useSession()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoard = async () => {
    const backendToken = (session?.user as any)?.backendToken
    if (!backendToken || !boardId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Check cache first
      const cacheKey = `board_${boardId}`
      const cached = localStorage.getItem(cacheKey)
      const cacheTime = localStorage.getItem(`${cacheKey}_time`)
      
      // Use cache if less than 30 seconds old
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
        setBoard(JSON.parse(cached))
        setError(null)
        setLoading(false)
        return
      }
      
      const data = await apiClient.getBoard(boardId) as Board
      setBoard(data)
      setError(null)
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch board')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoard()
  }, [session, boardId])

  const createList = async (title: string) => {
    if (!board) return

    try {
      const newList = await apiClient.createList({
        boardId: board.id,
        title
      }) as any
      
      setBoard(prev => prev ? {
        ...prev,
        lists: [...(prev.lists || []), { ...(newList || {}), cards: [] }]
      } : null)
      
      return newList
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create list')
    }
  }

  const updateList = async (listId: string, data: Partial<{ title: string; position: number }>) => {
    if (!board) return

    try {
      const updatedList = await apiClient.updateList(listId, data) as any
      
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => 
          list.id === listId ? { ...list, ...(updatedList || {}) } : list
        )
      } : null)
      
      return updatedList
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update list')
    }
  }

  const deleteList = async (listId: string) => {
    if (!board) return

    try {
      await apiClient.deleteList(listId)
      
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.filter(list => list.id !== listId)
      } : null)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete list')
    }
  }

  const createCard = async (listId: string, data: {
    title: string
    description?: string
    dueDate?: string
  }) => {
    if (!board) return

    try {
      const newCard = await apiClient.createCard({
        boardId: board.id,
        listId,
        ...data
      }) as any
      
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => 
          list.id === listId 
            ? { ...list, cards: [...list.cards, newCard || {}] }
            : list
        )
      } : null)
      
      return newCard
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create card')
    }
  }

  const updateCard = async (cardId: string, data: Partial<{
    title: string
    description: string
    dueDate: string
    listId: string
    position: number
  }>) => {
    if (!board) return

    try {
      const updatedCard = await apiClient.updateCard(cardId, data) as any
      
      setBoard(prev => {
        if (!prev) return null
        
        return {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.map(card => 
              card.id === cardId ? { ...card, ...(updatedCard || {}) } : card
            )
          }))
        }
      })
      
      return updatedCard
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update card')
    }
  }

  const moveCard = async (cardId: string, targetListId: string, newOrder: number) => {
    if (!board) return

    try {
      await apiClient.moveCard(cardId, {
        listId: targetListId,
        position: newOrder,
        boardId: board.id
      })
      
      // Optimistically update the UI
      setBoard(prev => {
        if (!prev) return null
        
        // Find the card and remove it from its current list
        let cardToMove: Card | null = null
        const updatedLists = prev.lists.map(list => ({
          ...list,
          cards: list.cards.filter(card => {
            if (card.id === cardId) {
              cardToMove = { ...card, listId: targetListId, position: newOrder }
              return false
            }
            return true
          })
        }))
        
        // Add the card to the target list
        if (cardToMove) {
          const targetList = updatedLists.find(list => list.id === targetListId)
          if (targetList) {
            // Insert at the correct position
            targetList.cards.splice(newOrder, 0, cardToMove)
            // Reorder cards in the target list
            targetList.cards.forEach((card, index) => {
              card.position = index
            })
          }
        }
        
        return { ...prev, lists: updatedLists }
      })
    } catch (err) {
      // Revert optimistic update on error
      fetchBoard()
      throw new Error(err instanceof Error ? err.message : 'Failed to move card')
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!board) return

    try {
      await apiClient.deleteCard(cardId)
      
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => ({
          ...list,
          cards: list.cards.filter(card => card.id !== cardId)
        }))
      } : null)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete card')
    }
  }

  const updateListsOrder = async (newLists: List[]) => {
    if (!board) return

    try {
      // Update the UI optimistically
      setBoard(prev => prev ? { ...prev, lists: newLists } : null)
      
      // Send the reorder request to backend
      const listOrders = newLists.map((list, index) => ({
        id: list.id,
        position: index + 1
      }))
      
      await apiClient.reorderLists(board.id, listOrders)
    } catch (err) {
      // Revert optimistic update on error
      fetchBoard()
      throw new Error(err instanceof Error ? err.message : 'Failed to reorder lists')
    }
  }

  return {
    board,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    updateListsOrder,
    refetch: fetchBoard
  }
}

