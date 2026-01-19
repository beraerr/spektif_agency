/**
 * List API Service - Handles list operations
 */
import { BaseApiService } from './base-api'
import type { List, CreateListDto, UpdateListDto } from '@/types'

export class ListService extends BaseApiService {
  async createList(data: CreateListDto): Promise<List> {
    return this.request<List>('/createList', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateList(listId: string, data: UpdateListDto): Promise<List> {
    return this.request<List>('/updateList', {
      method: 'POST',
      body: JSON.stringify({
        id: listId,
        ...data
      }),
    })
  }

  async deleteList(listId: string): Promise<void> {
    await this.request('/updateList', {
      method: 'POST',
      body: JSON.stringify({
        id: listId,
        deleted: true
      }),
    })
  }

  async reorderLists(boardId: string, listOrders: { id: string; position: number }[]): Promise<void> {
    return this.request('/reorderLists', {
      method: 'POST',
      body: JSON.stringify({ 
        boardId,
        listOrders 
      }),
    })
  }
}

export const listService = new ListService()
