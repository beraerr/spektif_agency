'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface BoardBackgroundContextType {
  background: string
  loading: boolean
  updateBackground: (backgroundUrl: string) => Promise<void>
  refetch: () => Promise<void>
}

const BoardBackgroundContext = createContext<BoardBackgroundContextType | null>(null)

interface BoardBackgroundProviderProps {
  children: React.ReactNode
  boardId: string
}

export function BoardBackgroundProvider({ children, boardId }: BoardBackgroundProviderProps) {
  const [background, setBackground] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchBackground = useCallback(async () => {
    if (!boardId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const boardData = await apiClient.getBoard(boardId) as any
      if (boardData?.backgroundUrl) {
        setBackground(boardData.backgroundUrl)
      }
    } catch (error) {
      console.error('Error loading background:', error)
    } finally {
      setLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    fetchBackground()
  }, [fetchBackground])

  const updateBackground = async (backgroundUrl: string) => {
    try {
      // Update UI immediately
      setBackground(backgroundUrl)
      
      // Save to database
      await apiClient.updateBoardBackground(boardId, backgroundUrl)
    } catch (error) {
      console.error('Error updating background:', error)
      throw error
    }
  }

  return (
    <BoardBackgroundContext.Provider value={{
      background,
      loading,
      updateBackground,
      refetch: fetchBackground
    }}>
      {children}
    </BoardBackgroundContext.Provider>
  )
}

export function useBoardBackgroundContext() {
  const context = useContext(BoardBackgroundContext)
  if (!context) {
    throw new Error('useBoardBackgroundContext must be used within BoardBackgroundProvider')
  }
  return context
}

// Optional hook that doesn't throw if not in context
export function useBoardBackgroundOptional() {
  return useContext(BoardBackgroundContext)
}

