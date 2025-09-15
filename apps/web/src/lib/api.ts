import { getSession } from 'next-auth/react'

// Firebase Functions URL - deployed in europe-west4 for Turkey optimization
const FIREBASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://europe-west4-spektif-agency-final-prod.cloudfunctions.net'
// Always use Firebase Functions - no more dual API system
const getApiUrl = () => {
  return FIREBASE_FUNCTIONS_URL
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
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  // Organizations
  async getOrganizations(userId?: string) {
    if (userId) {
      return this.request(`/getOrganizations?userId=${userId}`)
    }
    return this.request('/getOrganizations')
  }

  async createEmployee(organizationId: string, data: {
    email: string
    name: string
    surname: string
    position: string
    phone: string
    role: string
  }) {
    return this.request('/createEmployee', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        ...data
      }),
    })
  }

  async getEmployees(organizationId: string) {
    return this.request(`/getEmployees?organizationId=${organizationId}`)
  }

  // Clients
  async getClients(organizationId: string) {
    return this.request(`/getClients?organizationId=${organizationId}`)
  }

  async createClient(organizationId: string, data: {
    name: string
    email: string
    phone?: string
    company?: string
    address?: string
    notes?: string
  }) {
    return this.request('/createClient', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        ...data
      }),
    })
  }

  async updateClient(organizationId: string, clientId: string, data: Partial<{
    name: string
    email: string
    phone: string
    company: string
    address: string
    notes: string
    status: string
  }>) {
    return this.request('/updateClient', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: clientId,
        ...data
      }),
    })
  }

  async deleteClient(organizationId: string, clientId: string) {
    return this.request('/deleteClient', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: clientId
      }),
    })
  }

  async updateEmployee(organizationId: string, employeeId: string, data: Partial<{
    name: string
    surname: string
    email: string
    position: string
    role: string
  }>) {
    return this.request('/updateEmployee', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: employeeId,
        ...data
      }),
    })
  }

  async deleteEmployee(organizationId: string, employeeId: string) {
    return this.request('/deleteEmployee', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: employeeId
      }),
    })
  }

  // Boards
  async getBoards(organizationId: string) {
    return this.request(`/getBoards?userId=${organizationId}`)
  }

  async getEmployeeBoards(organizationId: string) {
    return this.request(`/getBoards?userId=${organizationId}`)
  }

  async assignUserToBoard(boardId: string, userId: string) {
    return this.request(`/updateBoard`, {
      method: 'POST',
      body: JSON.stringify({ 
        id: boardId,
        members: [userId] // This will need to be updated in Firebase Functions
      }),
    })
  }

  async getBoard(boardId: string) {
    return this.request(`/getBoard?boardId=${boardId}`)
  }

  async createBoard(data: {
    organizationId: string
    title: string
    description?: string
    color?: string
    userId?: string
  }) {
    return this.request('/createBoard', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBoard(boardId: string, data: Partial<{
    title: string
    description: string
    color: string
  }>) {
    return this.request('/updateBoard', {
      method: 'POST',
      body: JSON.stringify({
        id: boardId,
        ...data
      }),
    })
  }

  async deleteBoard(boardId: string) {
    return this.request('/updateBoard', {
      method: 'POST',
      body: JSON.stringify({
        id: boardId,
        deleted: true
      }),
    })
  }

  // Lists
  async createList(data: {
    boardId: string
    title: string
  }) {
    return this.request('/createList', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateList(listId: string, data: Partial<{
    title: string
    position: number
  }>) {
    return this.request('/updateList', {
      method: 'POST',
      body: JSON.stringify({
        id: listId,
        ...data
      }),
    })
  }

  async deleteList(listId: string) {
    return this.request('/updateList', {
      method: 'POST',
      body: JSON.stringify({
        id: listId,
        deleted: true
      }),
    })
  }

  async reorderLists(boardId: string, listOrders: { id: string; position: number }[]) {
    return this.request('/reorderLists', {
      method: 'POST',
      body: JSON.stringify({ 
        boardId,
        listOrders 
      }),
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

    return this.request(`/getCards?${params.toString()}`)
  }

  async createCard(data: {
    boardId: string
    listId: string
    title: string
    description?: string
    dueDate?: string
  }) {
    return this.request('/createCard', {
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
    return this.request('/updateCard', {
      method: 'POST',
      body: JSON.stringify({
        id: cardId,
        ...data
      }),
    })
  }

  async deleteCard(cardId: string) {
    return this.request('/updateCard', {
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
  }) {
    return this.request('/moveCard', {
      method: 'POST',
      body: JSON.stringify({
        cardId: cardId,
        ...data
      }),
    })
  }

  async updateBoardBackground(boardId: string, backgroundUrl: string) {
    return this.request('/updateBoardBackground', {
      method: 'POST',
      body: JSON.stringify({ boardId, backgroundUrl }),
    })
  }

  async getCalendarEvents(boardId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ boardId })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    return this.request(`/getCalendarEvents?${params.toString()}`)
  }

  // Card Members
  async addCardMember(cardId: string, boardId: string, memberName: string, memberEmail?: string) {
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

  async removeCardMember(cardId: string, boardId: string, memberName: string) {
    return this.request('/removeCardMember', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        memberName
      }),
    })
  }

  // Card Attachments
  async getCardAttachments(cardId: string, boardId: string) {
    return this.request(`/getCardAttachments?cardId=${cardId}&boardId=${boardId}`)
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
    return this.request('/removeCardAttachment', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        boardId,
        attachmentId
      }),
    })
  }

  // File Upload
  async uploadFile(boardId: string, cardId: string, file: File): Promise<{
    id: string
    fileName: string
    url: string
    size: number
    mimeType: string
  }> {
    // Convert file to base64
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string
        const base64Content = result.split(',')[1] // Remove data:type;base64, prefix
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

  // NOTE: Chat endpoints not implemented yet
  // TODO: Implement when needed:
  // - Chat system (getConversations, createConversation, getMessages, sendMessage)
}

export const apiClient = new ApiClient()

