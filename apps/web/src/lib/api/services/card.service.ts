/**
 * Card API Service - Handles card operations
 */
import { BaseApiService } from './base-api'
import type { Card, CreateCardDto, UpdateCardDto } from '@/types'

export class CardService extends BaseApiService {
  async getCards(filters?: {
    listId?: string
    boardId?: string
    userId?: string
  }): Promise<Card[]> {
    const params = new URLSearchParams()
    if (filters?.listId) params.append('listId', filters.listId)
    if (filters?.boardId) params.append('boardId', filters.boardId)
    if (filters?.userId) params.append('userId', filters.userId)

    return this.request<Card[]>(`/getCards?${params.toString()}`)
  }

  async createCard(data: CreateCardDto): Promise<Card> {
    return this.request<Card>('/createCard', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCard(cardId: string, data: UpdateCardDto): Promise<Card> {
    return this.request<Card>('/updateCard', {
      method: 'POST',
      body: JSON.stringify({
        id: cardId,
        ...data
      }),
    })
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.request('/updateCard', {
      method: 'POST',
      body: JSON.stringify({
        id: cardId,
        deleted: true
      }),
    })
  }

  async moveCard(cardId: string, data: {
    listId: string
    position: number
    boardId: string
  }): Promise<Card> {
    return this.request<Card>('/moveCard', {
      method: 'POST',
      body: JSON.stringify({
        cardId: cardId,
        ...data
      }),
    })
  }

  async addCardMember(cardId: string, boardId: string, memberName: string, memberEmail?: string): Promise<void> {
    return this.request('/addCardMember', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        memberName,
        memberEmail
      }),
    })
  }

  async removeCardMember(cardId: string, boardId: string, memberName: string): Promise<void> {
    return this.request('/removeCardMember', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        memberName
      }),
    })
  }

  async uploadFile(boardId: string, cardId: string, file: File): Promise<{
    id: string
    fileName: string
    url: string
    size: number
    mimeType: string
  }> {
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string
        const base64Content = result.split(',')[1]
        resolve(base64Content)
      }
      reader.onerror = reject
    })
    
    reader.readAsDataURL(file)
    const base64Content = await base64Promise

    return this.request('/uploadFile', {
      method: 'POST',
      body: JSON.stringify({
        boardId,
        cardId,
        fileName: file.name,
        fileType: file.type,
        fileData: base64Content
      }),
    })
  }

  async getCardAttachments(cardId: string, boardId: string) {
    return this.request(`/getCardAttachments?cardId=${cardId}&boardId=${boardId}`)
  }

  async removeCardAttachment(cardId: string, boardId: string, attachmentId: string): Promise<void> {
    return this.request('/removeCardAttachment', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        attachmentId
      }),
    })
  }

  async createComment(cardId: string, boardId: string, text: string, authorId: string, authorName: string) {
    return this.request<Comment>('/createComment', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        text,
        authorId,
        authorName
      }),
    })
  }

  async getComments(cardId: string, boardId: string) {
    return this.request<Comment[]>(`/getComments?cardId=${cardId}&boardId=${boardId}`)
  }

  async deleteComment(commentId: string, cardId: string, boardId: string): Promise<void> {
    return this.request('/deleteComment', {
      method: 'POST',
      body: JSON.stringify({
        commentId,
        cardId,
        boardId
      }),
    })
  }
}

export const cardService = new CardService()
