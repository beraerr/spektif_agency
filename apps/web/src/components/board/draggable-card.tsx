'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, MessageSquare, Paperclip, Clock, X, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  uploadedAt: string
}

export interface CardData {
  id: string
  title: string
  description?: string
  dueDate?: string
  labels?: string[]
  members?: string[] // Array of member names for display
  attachments?: Attachment[] // Changed from number to array
  comments?: number
}

interface DraggableCardProps {
  card: CardData
  onClick?: () => void
}

const labelColors: Record<string, string> = {
  'Tasarım': 'bg-purple-500',
  'Öncelik': 'bg-red-500',
  'Copywriting': 'bg-blue-500',
  'Analiz': 'bg-green-500',
  'Rapor': 'bg-yellow-500',
  'Video': 'bg-pink-500',
  'Reklam': 'bg-orange-500',
  'Tamamlandı': 'bg-emerald-500'
}

export function DraggableCard({ card, onClick }: DraggableCardProps) {
  const [showMemberPopup, setShowMemberPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowMemberPopup(false)
      }
    }

    if (showMemberPopup) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMemberPopup])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getDueDateColor = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-red-500' // Overdue
    if (diffDays <= 2) return 'text-orange-500' // Due soon
    return 'text-muted-foreground' // Normal
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-700 border-0 shadow-sm ${
        isDragging ? 'opacity-50 shadow-lg rotate-1' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label) => (
              <span
                key={label}
                className={`px-2 py-1 rounded text-xs text-white font-medium ${
                  labelColors[label] || 'bg-gray-500'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Card Title */}
        <h4 className="font-normal text-sm leading-snug text-gray-800 dark:text-gray-200 mb-2">
          {card.title}
        </h4>

        {/* Card Description */}
        {card.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Due Date */}
        {card.dueDate && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="w-3 h-3 mr-1" />
            <span className={getDueDateColor(card.dueDate)}>
              {new Date(card.dueDate).toLocaleDateString('tr-TR')}
            </span>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">

            {/* Attachments */}
            {card.attachments && card.attachments.length > 0 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Paperclip className="w-3 h-3 mr-1" />
                {card.attachments.length}
              </div>
            )}

            {/* Comments */}
            {card.comments && card.comments > 0 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <MessageSquare className="w-3 h-3 mr-1" />
                {card.comments}
              </div>
            )}
          </div>

          {/* Members */}
          {card.members && card.members.length > 0 && (
            <div className="flex -space-x-1 relative items-center">
              {card.members.slice(0, 3).map((member, index) => {
                // Parse member name to get proper initials (First + Last name)
                const nameParts = member.trim().split(' ')
                const initials = nameParts.length >= 2 
                  ? `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`
                  : member.charAt(0).toUpperCase()
                
                return (
                  <Avatar 
                    key={index} 
                    className="w-6 h-6 border-2 border-white dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMemberPopup(!showMemberPopup)
                    }}
                    title={member}
                  >
                    <AvatarFallback className="text-xs bg-blue-500 text-white font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )
              })}
              {card.members.length > 3 && (
                <div 
                  className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMemberPopup(!showMemberPopup)
                  }}
                  title={`${card.members.length - 3} more members`}
                >
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">+{card.members.length - 3}</span>
                </div>
              )}
              
              {/* Show total member count */}
              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {card.members.length} member{card.members.length !== 1 ? 's' : ''}
              </div>
              
              {/* Member Management Popup */}
              {showMemberPopup && (
                <div ref={popupRef} className="absolute top-8 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Members ({card.members.length})
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowMemberPopup(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {card.members.map((member, index) => {
                      const nameParts = member.trim().split(' ')
                      const initials = nameParts.length >= 2 
                        ? `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`
                        : member.charAt(0).toUpperCase()
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-blue-500 text-white font-medium">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{member}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Remove member logic would go here
                              console.log('Remove member:', member)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    })}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Add member logic would go here
                          console.log('Add member')
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
