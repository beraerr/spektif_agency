/**
 * Board-related types - Single source of truth for board domain
 */

// Core Board Entity
export interface Board {
  id: string
  title: string
  description?: string
  color?: string
  organizationId: string
  createdAt: string
  updatedAt: string
  lists: List[]
  members: BoardMember[]
  _count?: {
    lists: number
  }
}

// List Entity
export interface List {
  id: string
  boardId: string
  title: string
  position: number
  cards: Card[]
}

// Card Entity
export interface Card {
  id: string
  listId: string
  title: string
  description?: string
  dueDate?: string
  position: number
  archived: boolean
  createdBy: string
  members: CardMember[]
  attachments: Attachment[]
  labels?: string[]
  _count?: {
    comments: number
  }
  comments?: Comment[]
}

// Member Types
export interface BoardMember {
  id: string
  boardId: string
  userId: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'CLIENT_VIEW'
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export interface CardMember {
  id: string
  cardId: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

// Attachment Type
export interface Attachment {
  id: string
  cardId?: string
  url: string
  name: string
  size: number
  mimeType?: string
  createdAt: string
}

// Comment Type
export interface Comment {
  id: string
  cardId: string
  authorId: string
  text: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
  }
}

// Label Type
export interface Label {
  id: string
  name: string
  color: string
}

// Checklist Types
export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

// Calendar Event (derived from Card)
export interface CalendarEvent {
  id: string
  title: string
  dueDate: string
  cardId: string
  listId: string
  boardId: string
  completed?: boolean
}
