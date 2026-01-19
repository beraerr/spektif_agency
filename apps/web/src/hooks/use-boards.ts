import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { Board, List, Card, BoardMember, CardMember, Attachment, Comment } from '@/types'

// Re-export types for backwards compatibility
export type { Board, List, Card, BoardMember, CardMember, Attachment, Comment }

export function useBoards(organizationId: string) {
  const { data: session } = useSession()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoards = async () => {
    const backendToken = (session?.user as any)?.backendToken
    if (!backendToken || !organizationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await apiClient.getBoards(organizationId) as Board[]
      setBoards(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoards()
  }, [session, organizationId])

  const createBoard = async (data: {
    title: string
    description?: string
    color?: string
  }) => {
    try {
      const newBoard = await apiClient.createBoard({
        ...data,
        organizationId
      }) as Board
      setBoards(prev => [...prev, newBoard])
      return newBoard
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create board')
    }
  }

  const updateBoard = async (boardId: string, data: Partial<{
    title: string
    description: string
    color: string
  }>) => {
    try {
      const updatedBoard = await apiClient.updateBoard(boardId, data) as any
      setBoards(prev => prev.map(board => 
        board.id === boardId ? { ...board, ...(updatedBoard || {}) } : board
      ))
      return updatedBoard
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update board')
    }
  }

  const deleteBoard = async (boardId: string) => {
    try {
      await apiClient.deleteBoard(boardId)
      setBoards(prev => prev.filter(board => board.id !== boardId))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete board')
    }
  }

  return {
    boards,
    loading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    refetch: fetchBoards
  }
}

