/**
 * Unified API Client - Exports all services in one place
 * 
 * Usage:
 *   import { apiClient } from '@/lib/api'
 *   const boards = await apiClient.boards.getBoards(userId)
 *   const card = await apiClient.cards.createCard(data)
 */

import { authService } from './services/auth.service'
import { boardService } from './services/board.service'
import { listService } from './services/list.service'
import { cardService } from './services/card.service'
import { userService } from './services/user.service'

// Unified API client with grouped services
// Also includes legacy methods for backwards compatibility
export const apiClient = {
  auth: authService,
  boards: boardService,
  lists: listService,
  cards: cardService,
  users: userService,
  
  // Calendar
  async getCalendarEvents(boardId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ boardId })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    return boardService['request'](`/getCalendarEvents?${params.toString()}`)
  },
  
  // Legacy methods for backwards compatibility
  async login(email: string, password: string) {
    return authService.login(email, password)
  },

  async getOrganizations(userId?: string) {
    return userService.getOrganizations(userId)
  },

  async getBoards(userId: string, role?: string, clientId?: string) {
    return boardService.getBoards(userId, role, clientId)
  },

  async getBoard(boardId: string) {
    return boardService.getBoard(boardId)
  },

  async createBoard(data: any) {
    return boardService.createBoard(data)
  },

  async updateBoard(boardId: string, data: any) {
    return boardService.updateBoard(boardId, data)
  },

  async deleteBoard(boardId: string) {
    return boardService.deleteBoard(boardId)
  },

  async createList(data: any) {
    return listService.createList(data)
  },

  async updateList(listId: string, data: any) {
    return listService.updateList(listId, data)
  },

  async deleteList(listId: string) {
    return listService.deleteList(listId)
  },

  async reorderLists(boardId: string, listOrders: any[]) {
    return listService.reorderLists(boardId, listOrders)
  },

  async createCard(data: any) {
    return cardService.createCard(data)
  },

  async updateCard(cardId: string, data: any) {
    return cardService.updateCard(cardId, data)
  },

  async deleteCard(cardId: string) {
    return cardService.deleteCard(cardId)
  },

  async moveCard(cardId: string, data: any) {
    return cardService.moveCard(cardId, data)
  },

  async getCards(filters?: any) {
    return cardService.getCards(filters)
  },

  async updateBoardBackground(boardId: string, backgroundUrl: string) {
    return boardService.updateBoardBackground(boardId, backgroundUrl)
  },

  async createEmployee(organizationId: string, data: any) {
    return userService.createEmployee({ ...data, organizationId })
  },

  async getEmployees(organizationId: string) {
    return userService.getEmployees(organizationId)
  },

  async updateEmployee(organizationId: string, employeeId: string, data: any) {
    return userService.updateEmployee(organizationId, employeeId, data)
  },

  async deleteEmployee(organizationId: string, employeeId: string) {
    return userService.deleteEmployee(organizationId, employeeId)
  },

  async getClients(organizationId: string) {
    return userService.getClients(organizationId)
  },

  async createClient(organizationId: string, data: any) {
    return userService.createClient({ ...data, organizationId })
  },

  async updateClient(organizationId: string, clientId: string, data: any) {
    return userService.updateClient(organizationId, clientId, data)
  },

  async deleteClient(organizationId: string, clientId: string) {
    return userService.deleteClient(organizationId, clientId)
  },

  async addCardMember(cardId: string, boardId: string, memberName: string, memberEmail?: string) {
    return cardService.addCardMember(cardId, boardId, memberName, memberEmail)
  },

  async removeCardMember(cardId: string, boardId: string, memberName: string) {
    return cardService.removeCardMember(cardId, boardId, memberName)
  },

  async getCardAttachments(cardId: string, boardId: string) {
    return cardService.getCardAttachments(cardId, boardId)
  },

  async removeCardAttachment(cardId: string, boardId: string, attachmentId: string) {
    return cardService.removeCardAttachment(cardId, boardId, attachmentId)
  },

  async uploadFile(boardId: string, cardId: string, file: File) {
    return cardService.uploadFile(boardId, cardId, file)
  },

  async getEmployeeBoards(organizationId: string) {
    return boardService.getBoards(organizationId)
  },
}

// Legacy compatibility - Keep old ApiClient class for gradual migration
// TODO: Remove after all components are migrated
import { BaseApiService } from './services/base-api'
import { cache, cacheKeys, cacheTTL } from '../cache'

class LegacyApiClient extends BaseApiService {
  // Keep methods for backwards compatibility
  async login(email: string, password: string) {
    return authService.login(email, password)
  }

  async getOrganizations(userId?: string) {
    return userService.getOrganizations(userId)
  }

  async getBoards(userId: string, role?: string, clientId?: string) {
    return boardService.getBoards(userId, role, clientId)
  }

  async getBoard(boardId: string) {
    return boardService.getBoard(boardId)
  }

  async createBoard(data: any) {
    return boardService.createBoard(data)
  }

  async updateBoard(boardId: string, data: any) {
    return boardService.updateBoard(boardId, data)
  }

  async deleteBoard(boardId: string) {
    return boardService.deleteBoard(boardId)
  }

  async createList(data: any) {
    return listService.createList(data)
  }

  async updateList(listId: string, data: any) {
    return listService.updateList(listId, data)
  }

  async deleteList(listId: string) {
    return listService.deleteList(listId)
  }

  async reorderLists(boardId: string, listOrders: any[]) {
    return listService.reorderLists(boardId, listOrders)
  }

  async createCard(data: any) {
    return cardService.createCard(data)
  }

  async updateCard(cardId: string, data: any) {
    return cardService.updateCard(cardId, data)
  }

  async deleteCard(cardId: string) {
    return cardService.deleteCard(cardId)
  }

  async moveCard(cardId: string, data: any) {
    return cardService.moveCard(cardId, data)
  }

  async getCards(filters?: any) {
    return cardService.getCards(filters)
  }

  async updateBoardBackground(boardId: string, backgroundUrl: string) {
    return boardService.updateBoardBackground(boardId, backgroundUrl)
  }

  async getCalendarEvents(boardId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ boardId })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    return this.request(`/getCalendarEvents?${params.toString()}`)
  }

  async createEmployee(organizationId: string, data: any) {
    return userService.createEmployee({ ...data, organizationId })
  }

  async getEmployees(organizationId: string) {
    return userService.getEmployees(organizationId)
  }

  async updateEmployee(organizationId: string, employeeId: string, data: any) {
    return userService.updateEmployee(organizationId, employeeId, data)
  }

  async deleteEmployee(organizationId: string, employeeId: string) {
    return userService.deleteEmployee(organizationId, employeeId)
  }

  async getClients(organizationId: string) {
    return userService.getClients(organizationId)
  }

  async createClient(organizationId: string, data: any) {
    return userService.createClient({ ...data, organizationId })
  }

  async updateClient(organizationId: string, clientId: string, data: any) {
    return userService.updateClient(organizationId, clientId, data)
  }

  async deleteClient(organizationId: string, clientId: string) {
    return userService.deleteClient(organizationId, clientId)
  }

  async addCardMember(cardId: string, boardId: string, memberName: string, memberEmail?: string) {
    return cardService.addCardMember(cardId, boardId, memberName, memberEmail)
  }

  async removeCardMember(cardId: string, boardId: string, memberName: string) {
    return cardService.removeCardMember(cardId, boardId, memberName)
  }

  async getCardAttachments(cardId: string, boardId: string) {
    return cardService.getCardAttachments(cardId, boardId)
  }

  async updateCardAttachments(cardId: string, boardId: string, attachmentId: string) {
    return this.request('/updateCardAttachments', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        attachmentId
      }),
    })
  }

  async removeCardAttachment(cardId: string, boardId: string, attachmentId: string) {
    return cardService.removeCardAttachment(cardId, boardId, attachmentId)
  }

  async uploadFile(boardId: string, cardId: string, file: File) {
    return cardService.uploadFile(boardId, cardId, file)
  }

  async assignUserToBoard(boardId: string, userId: string) {
    return this.updateBoard(boardId, { members: [userId] })
  }

  async pinBoard(boardId: string, pinned: boolean) {
    return this.updateBoard(boardId, { pinned })
  }

  async getEmployeeBoards(organizationId: string) {
    return this.getBoards(organizationId)
  }
}

// Export both for gradual migration
export { LegacyApiClient }
// Keep old export name for backwards compatibility
export const apiClientLegacy = new LegacyApiClient()
