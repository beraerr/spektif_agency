import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { Board, List, Card } from './use-boards'

export function useBoard(boardId: string) {
  const { data: session } = useSession()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearCache = useCallback(() => {
    const cacheKey = `board_${boardId}`
    localStorage.removeItem(cacheKey)
    localStorage.removeItem(`${cacheKey}_time`)
  }, [boardId])

  const fetchBoard = useCallback(async (forceRefresh = false) => {
    const backendToken = (session?.user as any)?.backendToken
    if (!backendToken || !boardId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
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
      }
      
      const data = await apiClient.getBoard(boardId) as Board
      setBoard(data)
      setError(null)
      
      // Cache the data
      const cacheKey = `board_${boardId}`
      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch board')
    } finally {
      setLoading(false)
    }
  }, [session, boardId])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

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
      
      // Ensure the card has listId
      const cardWithListId = { ...newCard, listId }
      
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => 
          list.id === listId 
            ? { ...list, cards: [...list.cards, cardWithListId] }
            : list
        )
      } : null)
      
      // Clear cache to force fresh fetch on next refresh
      clearCache()
      
      return cardWithListId
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
    members: string[]
    attachments: any[]
  }>) => {
    if (!board) return

    try {
      // Find the card first to preserve its listId
      let cardListId: string | undefined
      for (const list of board.lists) {
        const card = list.cards.find(c => c.id === cardId)
        if (card) {
          cardListId = card.listId || list.id
          break
        }
      }
      
      // Ensure listId is preserved if not explicitly updated
      const updateData = cardListId && !data.listId 
        ? { ...data, listId: cardListId }
        : data
      
      const updatedCard = await apiClient.updateCard(cardId, updateData) as any
      
      console.log('updateCard hook - API response:', updatedCard)
      console.log('updateCard hook - Input data:', updateData)
      
      // Ensure the updated card has listId
      const cardWithListId = { ...updatedCard, listId: updatedCard.listId || cardListId }
      
      setBoard(prev => {
        if (!prev) return null
        
        const newBoard = {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.map(card => 
              card.id === cardId ? { ...card, ...cardWithListId } : card
            )
          }))
        }
        
        console.log('updateCard hook - Updated board state:', newBoard)
        return newBoard
      })
      
      // Clear cache to force fresh fetch on next refresh
      clearCache()
      
      return cardWithListId
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

  const updateBoard = async (data: Partial<{
    title: string
    description: string
    color: string
    members: string[]
    pinned: boolean
    deleted: boolean
  }>) => {
    if (!board) return

    try {
      // Optimistically update the UI immediately
      // Note: members as string[] will be handled by server response
      const { members, ...restData } = data
      setBoard(prev => prev ? { ...prev, ...restData } : null)
      
      // Clear cache to ensure fresh data on next fetch
      clearCache()
      
      // Update in backend
      const updatedBoard = await apiClient.updateBoard(board.id, data) as any
      
      // Update with server response to ensure consistency
      setBoard(prev => prev ? { ...prev, ...(updatedBoard || {}) } : null)
      
      return updatedBoard
    } catch (err) {
      // Revert optimistic update on error
      fetchBoard(true)
      throw new Error(err instanceof Error ? err.message : 'Failed to update board')
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
    updateBoard,
    refetch: fetchBoard
  }
}

