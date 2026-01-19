/**
 * Base API service - Common functionality for all API services
 */
import { getSession } from 'next-auth/react'

// Get the correct API URL (emulator in dev, production in prod)
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
  }
  return process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
}

export class BaseApiService {
  protected async getAuthHeaders() {
    const session = await getSession()
    return {
      'Content-Type': 'application/json',
      ...((session?.user as any)?.backendToken && {
        Authorization: `Bearer ${(session?.user as any)?.backendToken}`
      })
    }
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders()
    const apiUrl = getApiUrl()
    
    try {
      console.log(`[API] ${options.method || 'GET'} ${apiUrl}${endpoint}`)
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        const error = new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`)
        ;(error as any).response = { data: errorData, status: response.status }
        throw error
      }

      return await response.json()
    } catch (error: any) {
      if (error.response) {
        throw error
      }
      console.error('[API] Network error:', error)
      const networkError = new Error(error.message || 'Network error occurred. Check if Firebase emulators are running.')
      ;(networkError as any).isNetworkError = true
      throw networkError
    }
  }
}
