'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  MessageSquare,
  Paperclip,
  Plus,
  X,
  User,
  Tag,
  Clock,
  CheckSquare,
  Archive,
  Copy,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  Loader2
} from 'lucide-react'
import { CardData } from './draggable-card'
import { DatePickerModal } from './date-picker-modal'
import { LabelsModal } from './labels-modal'
import { AttachmentModal } from './attachment-modal'
import { ChecklistManager } from './checklist-manager'
import { apiClient } from '@/lib/api'
import { cardService } from '@/lib/api/services/card.service'
import { Comment } from '@/types'
import { toast } from 'sonner'

interface CardModalProps {
  card: CardData | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (card: CardData) => void
  boardId?: string
}

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface AvailableMember {
  id: string
  name: string
  surname: string
  email: string
  position: string
  avatar: string
}

export function CardModal({ card, isOpen, onClose, onUpdate, boardId }: CardModalProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState(card?.title || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [description, setDescription] = useState(card?.description || '')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', text: 'Sample task', completed: false },
    { id: '2', text: 'Another task', completed: true }
  ])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [cardDueDate, setCardDueDate] = useState<Date | undefined>(
    card?.dueDate ? new Date(card.dueDate) : undefined
  )
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Fetch comments when card opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!card?.id || !boardId || !isOpen) return
      
      try {
        setIsLoadingComments(true)
        const fetchedComments = await cardService.getComments(card.id, boardId)
        setComments(fetchedComments || [])
      } catch (error) {
        console.error('Error fetching comments:', error)
        toast.error('Yorumlar yüklenirken hata oluştu')
        setComments([])
      } finally {
        setIsLoadingComments(false)
      }
    }

    if (isOpen && card?.id && boardId) {
      fetchComments()
    }
  }, [card?.id, boardId, isOpen])

  // Fetch available members when card changes
  useEffect(() => {
    const fetchAvailableMembers = async () => {
      if (!card?.id) return
      
      try {
        setIsLoadingMembers(true)
        // Get employees AND clients from the organization
        const [employees, clients] = await Promise.all([
          apiClient.getEmployees('spektif') as Promise<any[]>,
          apiClient.getClients('spektif') as Promise<any[]>
        ])
        
        const employeeMembers: AvailableMember[] = (employees || []).map(member => ({
          id: member.id,
          name: member.name,
          surname: member.surname || '',
          email: member.email,
          position: member.position || 'Calisan',
          avatar: member.avatar || ''
        }))
        
        const clientMembers: AvailableMember[] = (clients || []).map(client => ({
          id: client.id,
          name: client.name,
          surname: '',
          email: client.email,
          position: 'Musteri',
          avatar: ''
        }))
        
        setAvailableMembers([...employeeMembers, ...clientMembers])
      } catch (error) {
        console.error('Error fetching available members:', error)
        toast.error('Üyeler yüklenirken hata oluştu')
        setAvailableMembers([])
      } finally {
        setIsLoadingMembers(false)
      }
    }

    if (card?.id) {
      fetchAvailableMembers()
    }
  }, [card?.id])

  // Helper function to format time ago
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    
    return date.toLocaleDateString()
  }

  if (!card) return null

  const labelColors = {
    'Priority': 'bg-red-500',
    'Design': 'bg-purple-500',
    'Strategy': 'bg-blue-500',
    'Research': 'bg-green-500',
    'Review': 'bg-orange-500',
    'Important': 'bg-yellow-500'
  }

  const availableLabels = ['Priority', 'Design', 'Strategy', 'Research', 'Review', 'Important']

  const handleAddComment = async () => {
    if (!newComment.trim() || !card?.id || !boardId || !session?.user) {
      return
    }

    try {
      const userId = (session.user as any).id
      const userName = session.user.name || 'Unknown User'
      
      // Create comment in backend
      const createdComment = await cardService.createComment(
        card.id,
        boardId,
        newComment.trim(),
        userId,
        userName
      )

      // Add comment to local state
      setComments([...comments, createdComment])
      setNewComment('')
      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const handleChecklistItemToggle = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const handleAddChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: 'New task',
      completed: false
    }
    setChecklist([...checklist, newItem])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Card Details</DialogTitle>
        {/* Card Header with Cover */}
        <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg">
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Card Title */}
              <div className="flex items-start space-x-3">
                <CheckSquare className="w-5 h-5 mt-1 text-gray-600" />
                <div className="flex-1">
                  {isEditingTitle ? (
                    <div className="space-y-2">
                      <Textarea
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-semibold min-h-[60px] resize-none"
                        placeholder="Card title..."
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            setIsEditingTitle(false)
                            const updatedCard = { ...card, title }
                            onUpdate?.(updatedCard)
                          }}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setTitle(card.title)
                            setIsEditingTitle(false)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer group"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 group-hover:bg-white group-hover:border-gray-300 transition-all duration-200 min-h-[60px]">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {title || "Card title..."}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Click to edit title</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Labels and Due Date */}
              <div className="flex items-center space-x-4">
                {card.labels && card.labels.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Labels</span>
                    <div className="flex flex-wrap gap-1">
                      {card.labels.map((label) => (
                        <Badge
                          key={label}
                          className={`${labelColors[label as keyof typeof labelColors] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded hover:opacity-80 cursor-pointer`}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {cardDueDate && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Due date</span>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>{cardDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {cardDueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="bg-yellow-200 text-yellow-800 px-1 rounded text-xs">Due soon</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Description</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDescription(!isEditingDescription)}
                  >
                    Edit
                  </Button>
                </div>
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a more detailed description..."
                      className="min-h-[100px]"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => {
                        setIsEditingDescription(false)
                        const updatedCard = { ...card, description }
                        onUpdate?.(updatedCard)
                      }}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setDescription(card.description || '')
                        setIsEditingDescription(false)
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 min-h-[60px] flex items-center"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {description || (
                      <span className="text-gray-500">Add a more detailed description...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist */}
              {checklist.length > 0 && (
                <ChecklistManager
                  items={checklist}
                  onItemsChange={setChecklist}
                  onDelete={() => setChecklist([])}
                />
              )}

              {/* Attachments */}
              {card.attachments && card.attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Attachments ({card.attachments.length})</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAttachmentModal(true)}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {card.attachments.map((attachment, index) => (
                      <div key={attachment.id || index} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50">
                        <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                          <Paperclip className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{attachment.name}</p>
                          <p className="text-sm text-gray-500">
                            Added {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => window.open(attachment.url, '_blank')}>
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                              try {
                                if (!card || !boardId) return
                                
                                await apiClient.removeCardAttachment(card.id, boardId, attachment.id)
                                
                                const updatedCard = {
                                  ...card,
                                  attachments: card.attachments?.filter(att => att.id !== attachment.id) || []
                                }
                                
                                onUpdate?.(updatedCard)
                                toast.success('Attachment removed successfully!')
                              } catch (error) {
                                console.error('Failed to remove attachment:', error)
                                toast.error('Failed to remove attachment')
                              }
                            }}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Comments and activity</h3>
                  <Button variant="ghost" size="sm">
                    Hide details
                  </Button>
                </div>

                {/* Add Comment */}
                <div className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[80px]"
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      Save
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading comments...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const commentDate = new Date(comment.createdAt)
                      const timeAgo = getTimeAgo(commentDate)
                      
                      return (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {comment.author?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-white border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {comment.author?.name || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500">{timeAgo}</span>
                              </div>
                              <p className="text-sm">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Current members and Add to card */}
            <div className="space-y-4">
              {/* Current Members */}
              {card.members && card.members.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Members</h3>
                  <div className="space-y-2">
                    {card.members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {member.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={async () => {
                            try {
                              const newMembers = (card.members || []).filter((_, i) => i !== index)
                              const updatedCard = { ...card, members: newMembers }
                              
                              // Update UI immediately
                              onUpdate?.(updatedCard)
                              
                              // Save to backend
                              await apiClient.updateCard(card.id, {
                                members: newMembers
                              })
                              toast.success('Member removed successfully!')
                            } catch (error) {
                              console.error('Failed to remove member:', error)
                              toast.error('Failed to remove member')
                              // Revert UI change on error
                              onUpdate?.(card)
                            }
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Add to card</h3>
                <div className="space-y-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        Members
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <div className="p-2">
                        <Input placeholder="Search members" className="mb-2" />
                        <p className="text-xs font-medium text-gray-700 mb-2">Available members</p>
                        {isLoadingMembers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        ) : availableMembers.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No available members</p>
                          </div>
                        ) : (
                          availableMembers.map((member) => (
                            <DropdownMenuItem 
                              key={member.id} 
                              className="flex items-center space-x-2"
                              onClick={async () => {
                                try {
                                  const currentMembers = card.members || []
                                  const memberName = `${member.name} ${member.surname}`.trim()
                                  if (!currentMembers.includes(memberName)) {
                                    const newMembers = [...currentMembers, memberName]
                                    const updatedCard = { ...card, members: newMembers }
                                    
                                    // Update UI immediately
                                    onUpdate?.(updatedCard)
                                    
                                    // Save to backend
                                    await apiClient.updateCard(card.id, {
                                      members: newMembers
                                    })
                                    toast.success('Member added successfully!')
                                  }
                                } catch (error) {
                                  console.error('Failed to add member:', error)
                                  toast.error('Failed to add member')
                                  // Revert UI change on error
                                  onUpdate?.(card)
                                }
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-blue-500 text-white text-xs">
                                  {member.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {member.name} {member.surname}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.position || member.email}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setShowLabelPicker(true)}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Labels
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={handleAddChecklistItem}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Checklist
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setShowDatePicker(true)}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Dates
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setShowAttachmentModal(true)}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attachment
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move card to...
                  </Button>

                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy card to...
                  </Button>

                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>

                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <DatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSave={(date, reminder) => {
            setCardDueDate(date)
            // Update card with new due date
            const updatedCard = {
              ...card,
              dueDate: date.toISOString()
            }
            onUpdate?.(updatedCard)
          }}
          currentDate={cardDueDate}
        />

        <LabelsModal
          isOpen={showLabelPicker}
          onClose={() => setShowLabelPicker(false)}
          currentLabels={card?.labels || []}
          onSave={async (labels) => {
            try {
              const updatedCard = {
                ...card,
                labels: labels
              }
              
              // Update UI immediately
              onUpdate?.(updatedCard)
              
              // Save to backend
              await apiClient.updateCard(card.id, {
                labels: labels
              })
              
              toast.success('Labels updated successfully!')
            } catch (error) {
              console.error('Failed to update labels:', error)
              toast.error('Failed to update labels')
              // Revert UI change on error
              onUpdate?.(card)
            }
          }}
        />

        <AttachmentModal
          isOpen={showAttachmentModal}
          onClose={() => setShowAttachmentModal(false)}
          onUpload={async (file, displayText) => {
            try {
              if (!card || !boardId) return
              
              // Upload file to get attachment ID
              const uploadResult = await apiClient.uploadFile(boardId, card.id, file)
              
              // Create new attachment object
              const newAttachment = {
                id: uploadResult.id,
                name: uploadResult.fileName,
                url: uploadResult.url,
                size: uploadResult.size,
                mimeType: uploadResult.mimeType,
                uploadedAt: new Date().toISOString()
              }
              
              // Update card with new attachment
              const currentAttachments = card.attachments || []
              const updatedAttachments = [...currentAttachments, newAttachment]
              const updatedCard = {
                ...card,
                attachments: updatedAttachments
              }
              
              // Update UI immediately
              onUpdate?.(updatedCard)
              
              // Save to backend
              await apiClient.updateCard(card.id, {
                attachments: updatedAttachments
              })
              
              toast.success('File uploaded successfully!')
            } catch (error) {
              console.error('Failed to upload file:', error)
              toast.error('Failed to upload file')
              // Revert UI change on error
              onUpdate?.(card)
            }
          }}
          onAddLink={async (url, displayText) => {
            try {
              if (!card) return
              
              // Create new link attachment
              const newAttachment = {
                id: Date.now().toString(),
                name: displayText || url,
                url: url,
                size: 0,
                mimeType: 'link',
                uploadedAt: new Date().toISOString()
              }
              
              // Update card with new attachment
              const currentAttachments = card.attachments || []
              const updatedAttachments = [...currentAttachments, newAttachment]
              const updatedCard = {
                ...card,
                attachments: updatedAttachments
              }
              
              // Update UI immediately
              onUpdate?.(updatedCard)
              
              // Save to backend
              await apiClient.updateCard(card.id, {
                attachments: updatedAttachments
              })
              
              toast.success('Link added successfully!')
            } catch (error) {
              console.error('Failed to add link:', error)
              toast.error('Failed to add link')
              // Revert UI change on error
              onUpdate?.(card)
            }
          }}
          boardId={boardId}
          cardId={card?.id}
        />
      </DialogContent>
    </Dialog>
  )
}
