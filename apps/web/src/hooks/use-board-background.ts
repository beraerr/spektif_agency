import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export function useBoardBackground(boardId: string) {
  const [boardBackground, setBoardBackground] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBackground = async () => {
      try {
        setLoading(true)
        // Try to get from database first
        const boardData = await apiClient.getBoard(boardId) as any
        if (boardData?.backgroundUrl) {
          setBoardBackground(boardData.backgroundUrl)
          return
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('boardBackgrounds')
        if (saved) {
          const backgrounds = JSON.parse(saved)
          setBoardBackground(backgrounds[boardId] || '')
        }
      } catch (error) {
        console.error('Error loading background:', error)
        // Fallback to localStorage
        const saved = localStorage.getItem('boardBackgrounds')
        if (saved) {
          const backgrounds = JSON.parse(saved)
          setBoardBackground(backgrounds[boardId] || '')
        }
      } finally {
        setLoading(false)
      }
    }

    if (boardId) {
      loadBackground()
    }
  }, [boardId])

  const updateBackground = async (backgroundUrl: string) => {
    try {
      // Save to database
      await apiClient.updateBoardBackground(boardId, backgroundUrl)
      
      // Also save to localStorage for immediate UI update
      const saved = localStorage.getItem('boardBackgrounds')
      const backgrounds = saved ? JSON.parse(saved) : {}
      backgrounds[boardId] = backgroundUrl
      localStorage.setItem('boardBackgrounds', JSON.stringify(backgrounds))
      
      setBoardBackground(backgroundUrl)
    } catch (error) {
      console.error('Error updating background:', error)
      throw error
    }
  }

  return {
    boardBackground,
    loading,
    updateBackground
  }
}
