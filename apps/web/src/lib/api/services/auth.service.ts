/**
 * Authentication API Service
 */
import { BaseApiService } from './base-api'

export class AuthService extends BaseApiService {
  async login(email: string, password: string) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }
}

export const authService = new AuthService()
