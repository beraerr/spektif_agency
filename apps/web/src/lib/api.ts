import { getSession } from 'next-auth/react'

// Firebase Functions URL - deployed and ready!
const FIREBASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://us-central1-spektif-agency-final-prod.cloudfunctions.net'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Use Firebase Functions in production, local API in development
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return FIREBASE_FUNCTIONS_URL
  }
  return API_BASE_URL
}

class ApiClient {
  private async getAuthHeaders() {
    const session = await getSession()
    return {
      'Content-Type': 'application/json',
      ...((session?.user as any)?.backendToken && {
        Authorization: `Bearer ${(session?.user as any)?.backendToken}`
      })
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders()
    const apiUrl = getApiUrl()
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  // Organizations
  async getOrganizations() {
    return this.request('/organizations')
  }

  async createEmployee(organizationId: string, data: {
    email: string
    name: string
    surname: string
    position: string
    phone: string
    role: string
  }) {
    return this.request(`/organizations/${organizationId}/employees`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getEmployees(organizationId: string) {
    return this.request(`/organizations/${organizationId}/employees`)
  }

  // Boards
  async getBoards(organizationId: string) {
    return this.request(`/boards?organizationId=${organizationId}`)
  }

  async getEmployeeBoards(organizationId: string) {
    return this.request(`/boards/employee?organizationId=${organizationId}`)
  }

  async assignUserToBoard(boardId: string, userId: string) {
    return this.request(`/boards/${boardId}/assign-user`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async getBoard(boardId: string) {
    return this.request(`/boards/${boardId}`)
  }

  async createBoard(data: {
    organizationId: string
    title: string
    description?: string
    color?: string
  }) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBoard(boardId: string, data: Partial<{
    title: string
    description: string
    color: string
  }>) {
    return this.request(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteBoard(boardId: string) {
    return this.request(`/boards/${boardId}`, {
      method: 'DELETE',
    })
  }

  // Lists
  async createList(data: {
    boardId: string
    title: string
  }) {
    return this.request('/boards/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateList(listId: string, data: Partial<{
    title: string
    position: number
  }>) {
    return this.request(`/boards/lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteList(listId: string) {
    return this.request(`/boards/lists/${listId}`, {
      method: 'DELETE',
    })
  }

  async reorderLists(boardId: string, listOrders: { id: string; position: number }[]) {
    return this.request(`/boards/${boardId}/reorder-lists`, {
      method: 'POST',
      body: JSON.stringify({ listOrders }),
    })
  }

  // Cards
  async getCards(filters?: {
    listId?: string
    boardId?: string
    userId?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.listId) params.append('listId', filters.listId)
    if (filters?.boardId) params.append('boardId', filters.boardId)
    if (filters?.userId) params.append('userId', filters.userId)

    return this.request(`/cards?${params.toString()}`)
  }

  async createCard(data: {
    listId: string
    title: string
    description?: string
    dueDate?: string
  }) {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCard(cardId: string, data: Partial<{
    title: string
    description: string
    dueDate: string
    listId: string
    position: number
  }>) {
    return this.request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCard(cardId: string) {
    return this.request(`/cards/${cardId}`, {
      method: 'DELETE',
    })
  }

  async moveCard(cardId: string, data: {
    listId: string
    position: number
  }) {
    return this.request(`/cards/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAvailableMembers(cardId: string) {
    return this.request(`/cards/${cardId}/available-members`)
  }

  // Chat
  async getConversations() {
    return this.request('/conversations')
  }

  async createConversation(data: {
    type: 'DM' | 'GROUP' | 'CARD_THREAD'
    title?: string
    cardId?: string
    participantIds: string[]
  }) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMessages(conversationId: string, limit?: number, offset?: number) {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    return this.request(`/conversations/${conversationId}/messages?${params.toString()}`)
  }

  async sendMessage(data: {
    conversationId: string
    text: string
    replyToId?: string
  }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()

