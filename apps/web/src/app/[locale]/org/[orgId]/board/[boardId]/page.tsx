'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Star,
  Users,
  Settings,
  Filter,
  Share,
  Loader2
} from 'lucide-react'
import { DragDropBoard } from '@/components/board/drag-drop-board'
import { ListData, CardData } from '@/components/board/droppable-list'
import { useBoard } from '@/hooks/use-board'
import { useRealtimeBoard } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { CardModal } from '@/components/board/card-modal'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'

// Default background for boards
const defaultBackgroundImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center'

export default function BoardPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const boardId = params.boardId as string
  const locale = params.locale as string
  const t = useTranslations()

  // Use real API hook instead of mock data
  const { 
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
  } = useBoard(boardId)

  // Real-time updates
  const { 
    isConnected, 
    emitCardUpdated, 
    emitCardMoved, 
    emitListCreated 
  } = useRealtimeBoard(boardId)

  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [boardBackground, setBoardBackground] = useState<string>('')

  // Load board background from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('boardBackgrounds')
    if (saved) {
      const backgrounds = JSON.parse(saved) as Record<string, string>
      const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId
      setBoardBackground(backgrounds[boardIdStr] || '')
    }
  }, [boardId])

  // Polling for updates
  useEffect(() => {
    const handlePollForUpdates = (event: CustomEvent) => {
      if (event.detail?.boardId === boardId) {
        // Refetch board data
        fetchBoard()
      }
    }

    window.addEventListener('poll-for-updates', handlePollForUpdates as EventListener)

    return () => {
      window.removeEventListener('poll-for-updates', handlePollForUpdates as EventListener)
    }
  }, [boardId])

  // Real-time event listeners
  useEffect(() => {
    const handleRealtimeCardUpdate = (event: CustomEvent) => {
      console.log('🔄 Real-time card update received:', event.detail)
      // Refresh board data when real-time updates are received
      fetchBoard() // Use proper state update instead of reload
    }

    const handleRealtimeListUpdate = (event: CustomEvent) => {
      console.log('📝 Real-time list update received:', event.detail)
      // Refresh board data when real-time updates are received
      fetchBoard() // Use proper state update instead of reload
    }

    window.addEventListener('realtime-card-updated', handleRealtimeCardUpdate as EventListener)
    window.addEventListener('realtime-list-updated', handleRealtimeListUpdate as EventListener)

    return () => {
      window.removeEventListener('realtime-card-updated', handleRealtimeCardUpdate as EventListener)
      window.removeEventListener('realtime-list-updated', handleRealtimeListUpdate as EventListener)
    }
  }, [])

  // Convert board data to ListData format for drag-drop component
  const lists: ListData[] = board?.lists?.map(list => ({
    id: list.id,
    title: list.title,
    cards: list.cards?.map(card => ({
      id: card.id,
      title: card.title,
      description: card.description || '',
      dueDate: card.dueDate,
      labels: (card as any).labels || [],
      members: card.members?.map(member => member.user?.name || member.user?.email || 'Unknown') || []
    })) || []
  })) || []

  const handleListsChange = async (newLists: ListData[]) => {
    try {
      // Convert back to List format and update positions
      const updatedLists = newLists.map((listData, index) => ({
        id: listData.id,
        title: listData.title,
        name: listData.title,
        position: index,
        cards: listData.cards || []
      }))
      
      await updateListsOrder(updatedLists as any)
    } catch (error) {
      console.error('Failed to update list positions:', error)
      toast.error('Failed to save list positions')
    }
  }

  const handleCardClick = (card: CardData) => {
    setSelectedCard(card)
    setIsCardModalOpen(true)
  }

  const handleCardModalClose = () => {
    setIsCardModalOpen(false)
    setSelectedCard(null)
  }

  const handleCardUpdate = async (updatedCard: CardData) => {
    try {
      await updateCard(updatedCard.id, {
        title: updatedCard.title,
        description: updatedCard.description,
        dueDate: updatedCard.dueDate
      })
      
      // Emit real-time update
      emitCardUpdated({
        cardId: updatedCard.id,
        updates: {
          title: updatedCard.title,
          description: updatedCard.description,
          dueDate: updatedCard.dueDate
        }
      })
      
      toast.success('Card updated successfully!')
    } catch (error) {
      console.error('Failed to update card:', error)
      toast.error('Failed to update card')
    }
  }

  const handleListUpdate = async (listId: string, title: string) => {
    try {
      await updateList(listId, { title })
      toast.success('List updated successfully!')
    } catch (error) {
      console.error('Failed to update list:', error)
      toast.error('Failed to update list')
    }
  }

  const handleAddList = async () => {
    try {
      await createList('New List')
      toast.success('List created successfully!')
    } catch (error) {
      console.error('Failed to create list:', error)
      toast.error('Failed to create list')
    }
  }

  const handleAddCard = async (listId: string) => {
    try {
      await createCard(listId, {
        title: 'New Card',
        description: ''
      })
      toast.success('Card created successfully!')
    } catch (error) {
      console.error('Failed to create card:', error)
      toast.error('Failed to create card')
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Board yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Board yüklenirken hata oluştu</p>
          <Button onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  // Show empty state if no board
  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <p className="text-gray-600">Board bulunamadı</p>
        </div>
      </div>
    )
  }

  // Get the background image (custom or default)
  const backgroundImage = boardBackground || defaultBackgroundImage

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Header */}
      <header className="relative z-10 bg-black/10 dark:bg-black/30 backdrop-blur-sm border-b border-white/10 dark:border-white/20">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/org/${orgId}/boards`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 border-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Boards
              </Button>
            </Link>

            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-white">{board.title || 'Board'}</h1>
              <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 w-8 h-8 p-0">
                <Star className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10 border border-white/20">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>

            <div className="flex items-center space-x-1">
              <Avatar className="w-8 h-8 border-2 border-white/30">
                <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">A</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-white/30">
                <AvatarFallback className="bg-green-500 text-white text-xs font-medium">E</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-white/30">
                <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">M</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10 border border-white/20 w-8 h-8 p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10 border border-white/20">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>

            <ThemeSwitcher />

            <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 w-8 h-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <main className="relative z-10 h-[calc(100vh-64px)] overflow-hidden">
        <div className="h-full pt-6">
          <DragDropBoard
            lists={lists}
            onListsChange={handleListsChange}
            onCardClick={handleCardClick}
            onAddList={handleAddList}
            onAddCard={handleAddCard}
            onUpdateList={handleListUpdate}
            boardId={boardId}
          />
        </div>
      </main>

      {/* Card Modal */}
      <CardModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onClose={handleCardModalClose}
        onUpdate={handleCardUpdate}
        boardId={boardId}
      />
    </div>
  )
}