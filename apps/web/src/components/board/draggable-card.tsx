'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, MessageSquare, Paperclip, Clock } from 'lucide-react'

export interface CardData {
  id: string
  title: string
  description?: string
  dueDate?: string
  labels?: string[]
  members?: string[]
  attachments?: number
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

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
            {card.attachments && card.attachments > 0 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Paperclip className="w-3 h-3 mr-1" />
                {card.attachments}
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
            <div className="flex -space-x-1">
              {card.members.slice(0, 3).map((member, index) => (
                <Avatar key={index} className="w-6 h-6 border-2 border-white dark:border-gray-700">
                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                    {member}
                  </AvatarFallback>
                </Avatar>
              ))}
              {card.members.length > 3 && (
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">+{card.members.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
