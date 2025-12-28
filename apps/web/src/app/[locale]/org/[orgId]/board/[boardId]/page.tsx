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
  Star,
  Users,
  Settings,
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
import { apiClient } from '@/lib/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X } from 'lucide-react'

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
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  // Background is handled by the layout

  // Load available members (employees + clients)
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const [employees, clients] = await Promise.all([
          apiClient.getEmployees(orgId) as Promise<any[]>,
          apiClient.getClients(orgId) as Promise<any[]>
        ])
        
        const allMembers = [
          ...(employees || []).map(emp => ({
            id: emp.id,
            name: `${emp.name} ${emp.surname || ''}`.trim(),
            email: emp.email,
            type: 'employee',
            role: emp.role
          })),
          ...(clients || []).map(client => ({
            id: client.id,
            name: client.name || client.company,
            email: client.email,
            type: 'client',
            role: 'client'
          }))
        ]
        
        setAvailableMembers(allMembers)
      } catch (error) {
        console.error('Error loading members:', error)
      }
    }
    
    loadMembers()
  }, [orgId])

  // Handle member addition/removal
  const handleAddMember = async (memberId: string) => {
    try {
      const currentMembers = board?.members || []
      if (currentMembers.includes(memberId)) {
        toast.error('Bu uye zaten board\'a ekli')
        return
      }
      
      await apiClient.updateBoard(boardId, {
        members: [...currentMembers, memberId]
      })
      
      // Refresh board to get updated members
      fetchBoard()
      toast.success('Uye board\'a eklendi!')
      setShowMemberDropdown(false)
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Uye eklenirken hata olustu')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const currentMembers = board?.members || []
      const newMembers = currentMembers.filter((id: string) => id !== memberId)
      
      await apiClient.updateBoard(boardId, {
        members: newMembers
      })
      
      // Refresh board to get updated members
      fetchBoard()
      toast.success('Uye board\'dan cikarildi!')
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Uye cikarilirken hata olustu')
    }
  }

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
      members: card.members?.map(member => 
        typeof member === 'string' ? member : (member as any).name || (member as any).user?.name || 'Unknown'
      ) || [],
      attachments: (card.attachments || []) as any[]
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
      // Update local state immediately for real-time UI
      setSelectedCard(updatedCard)
      
      // Update card in database (all fields including members and attachments)
      // This also updates the board state automatically
      await updateCard(updatedCard.id, {
        title: updatedCard.title,
        description: updatedCard.description,
        dueDate: updatedCard.dueDate,
        members: updatedCard.members,
        attachments: updatedCard.attachments
      })
      
      // Emit real-time update
      emitCardUpdated({
        cardId: updatedCard.id,
        updates: {
          title: updatedCard.title,
          description: updatedCard.description,
          dueDate: updatedCard.dueDate,
          members: updatedCard.members,
          attachments: updatedCard.attachments
        }
      })
      
      // Refresh board to update all card displays
      await fetchBoard()
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Header */}
      <header className="relative z-10 bg-black/10 dark:bg-black/30 backdrop-blur-sm border-b border-white/10 dark:border-white/20">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-white">{board.title || 'Board'}</h1>
              <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 w-8 h-8 p-0">
                <Star className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {board?.members?.slice(0, 3).map((memberId: string) => {
                const member = availableMembers.find(m => m.id === memberId)
                if (!member) return null
                const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <Avatar 
                    key={memberId} 
                    className="w-8 h-8 border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => handleRemoveMember(memberId)}
                    title={`${member.name} - Kaldirmak icin tikla`}
                  >
                    <AvatarFallback className={`${member.type === 'employee' ? 'bg-blue-500' : 'bg-purple-500'} text-white text-xs font-medium`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )
              })}
              {board?.members && board.members.length > 3 && (
                <Avatar className="w-8 h-8 border-2 border-white/30">
                  <AvatarFallback className="bg-gray-500 text-white text-xs font-medium">
                    +{board.members.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
              <DropdownMenu open={showMemberDropdown} onOpenChange={setShowMemberDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10 border border-white/20 w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800">
                  {availableMembers
                    .filter(m => !board?.members?.includes(m.id))
                    .map(member => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => handleAddMember(member.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            member.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.type === 'employee' ? 'Calisan' : 'Musteri'}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  {availableMembers.filter(m => !board?.members?.includes(m.id)).length === 0 && (
                    <DropdownMenuItem disabled>
                      <p className="text-sm text-gray-500">Tum uyeler eklendi</p>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ThemeSwitcher />
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