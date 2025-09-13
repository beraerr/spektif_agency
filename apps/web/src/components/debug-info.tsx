'use client'

import { useState, useEffect } from 'react'

export function DebugInfo() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [apiUrl, setApiUrl] = useState('')

  useEffect(() => {
    const checkApiStatus = async () => {
      // Use Firebase Functions in production, local API in development
      const firebaseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://us-central1-spektif-agency-final-prod.cloudfunctions.net'
      const localUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = process.env.NODE_ENV === 'production' ? firebaseUrl : localUrl
      setApiUrl(url)
      
      try {
        const response = await fetch(`${url}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        setApiStatus(response.ok ? 'online' : 'offline')
      } catch (error) {
        console.error('API Health Check Failed:', error)
        setApiStatus('offline')
      }
    }

    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Always show debug info for now
  // if (process.env.NODE_ENV === 'production') {
  //   return null // Hide in production unless needed
  // }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          apiStatus === 'online' ? 'bg-green-500' : 
          apiStatus === 'offline' ? 'bg-red-500' : 
          'bg-yellow-500'
        }`} />
        <span>API: {apiStatus}</span>
      </div>
      <div className="text-gray-300 mt-1">
        URL: {apiUrl}
      </div>
      <div className="text-gray-300">
        ENV: {process.env.NODE_ENV}
      </div>
    </div>
  )
}
