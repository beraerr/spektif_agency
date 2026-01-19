/**
 * Board API Service - Handles all board-related API calls
 */
import { BaseApiService } from './base-api'
import { cache, cacheKeys, cacheTTL } from '@/lib/cache'
import type { Board, CreateBoardDto, UpdateBoardDto } from '@/types'

export class BoardService extends BaseApiService {
  async getBoards(userId: string, role?: string, clientId?: string): Promise<Board[]> {
    const cacheKey = cacheKeys.boards(userId)
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const params = new URLSearchParams({ userId })
    if (role) params.append('role', role)
    if (clientId) params.append('clientId', clientId)

    const data = await this.request<Board[]>(`/getBoards?${params.toString()}`)
    cache.set(cacheKey, data, cacheTTL.medium)
    return data
  }

  async getBoard(boardId: string): Promise<Board> {
    const cacheKey = cacheKeys.board(boardId)
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const data = await this.request<Board>(`/getBoard?boardId=${boardId}`)
    cache.set(cacheKey, data, cacheTTL.medium)
    return data
  }

  async createBoard(data: CreateBoardDto): Promise<Board> {
    const result = await this.request<Board>('/createBoard', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    if (data.userId) {
      cache.delete(cacheKeys.boards(data.userId))
    }
    cache.invalidatePattern('^boards_')
    return result
  }

  async updateBoard(boardId: string, data: UpdateBoardDto): Promise<Board> {
    const result = await this.request<Board>('/updateBoard', {
      method: 'POST',
      body: JSON.stringify({
        id: boardId,
        ...data
      }),
    })
    
    cache.invalidatePattern('boards_')
    return result
  }

  async deleteBoard(boardId: string): Promise<void> {
    await this.request('/updateBoard', {
      method: 'POST',
      body: JSON.stringify({
        id: boardId,
        deleted: true
      }),
    })
    
    cache.invalidatePattern('boards_')
  }

  async updateBoardBackground(boardId: string, backgroundUrl: string): Promise<Board> {
    const result = await this.request<Board>('/updateBoardBackground', {
      method: 'POST',
      body: JSON.stringify({ boardId, backgroundUrl }),
    })
    
    cache.invalidatePattern('^boards_')
    return result
  }
}

export const boardService = new BoardService()
