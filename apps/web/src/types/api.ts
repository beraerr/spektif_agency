/**
 * API request/response types and DTOs
 */

// Generic API Response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// File Upload Response
export interface FileUploadResponse {
  id: string
  fileName: string
  url: string
  size: number
  mimeType: string
}

// Create/Update DTOs
export interface CreateBoardDto {
  organizationId: string
  title: string
  description?: string
  color?: string
  userId?: string
}

export interface UpdateBoardDto {
  title?: string
  description?: string
  color?: string
  members?: string[]
  pinned?: boolean
  deleted?: boolean
}

export interface CreateListDto {
  boardId: string
  title: string
}

export interface UpdateListDto {
  title?: string
  position?: number
}

export interface CreateCardDto {
  boardId: string
  listId: string
  title: string
  description?: string
  dueDate?: string
}

export interface UpdateCardDto {
  title?: string
  description?: string
  dueDate?: string
  listId?: string
  position?: number
  members?: string[]
  attachments?: any[]
  labels?: string[]
}

export interface CreateEmployeeDto {
  organizationId: string
  email: string
  name: string
  surname: string
  position: string
  phone?: string
  role: string
  password?: string
}

export interface CreateClientDto {
  organizationId: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  password?: string
}
