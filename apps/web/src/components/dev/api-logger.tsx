'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { X, Trash2, Copy, Download } from 'lucide-react'
import { toast } from 'sonner'

interface ApiLog {
  id: string
  timestamp: Date
  method: string
  endpoint: string
  status?: number
  statusText?: string
  requestBody?: any
  response?: any
  error?: string
  duration?: number
}

export function ApiLogger() {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Intercept fetch calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      const startTime = Date.now()
      const logId = `${Date.now()}-${Math.random()}`
      
      let requestBody: any = undefined
      if (options?.body) {
        try {
          if (typeof options.body === 'string') {
            requestBody = JSON.parse(options.body)
          } else {
            requestBody = options.body
          }
        } catch (e) {
          requestBody = options.body
        }
      }

      const log: ApiLog = {
        id: logId,
        timestamp: new Date(),
        method: (options?.method as string) || 'GET',
        endpoint: typeof url === 'string' ? url : (url instanceof URL ? url.toString() : (url as Request).url || String(url)),
        requestBody,
      }

      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()
        const duration = endTime - startTime

        // Clone response to read it without consuming it
        const clonedResponse = response.clone()
        let responseData: any = null
        
        try {
          const contentType = clonedResponse.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            responseData = await clonedResponse.json()
          } else {
            responseData = await clonedResponse.text()
          }
        } catch (e) {
          responseData = 'Unable to parse response'
        }

        log.status = response.status
        log.statusText = response.statusText
        log.response = responseData
        log.duration = duration

        setLogs(prev => {
          const newLogs = [...prev, log]
          return newLogs.slice(-100) // Keep last 100 logs
        })

        return response
      } catch (error: any) {
        const endTime = Date.now()
        const duration = endTime - startTime

        log.error = error.message || 'Unknown error'
        log.duration = duration

        setLogs(prev => {
          const newLogs = [...prev, log]
          return newLogs.slice(-100)
        })

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const clearLogs = () => {
    setLogs([])
    toast.success('Loglar temizlendi')
  }

  const copyLogs = () => {
    const logsText = JSON.stringify(logs, null, 2)
    navigator.clipboard.writeText(logsText)
    toast.success('Loglar kopyalandı')
  }

  const downloadLogs = () => {
    const logsText = JSON.stringify(logs, null, 2)
    const blob = new Blob([logsText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Loglar indirildi')
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-500'
    if (status >= 200 && status < 300) return 'bg-green-500'
    if (status >= 300 && status < 400) return 'bg-yellow-500'
    if (status >= 400) return 'bg-red-500'
    return 'bg-gray-500'
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          API Logger ({logs.length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[600px] max-h-[80vh]">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">API Logger</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyLogs}
                className="h-8 w-8 p-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadLogs}
                className="h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="autoScroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="autoScroll" className="text-sm text-muted-foreground">
              Otomatik kaydır
            </label>
            <Badge variant="outline" className="ml-auto">
              {logs.length} log
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full overflow-y-auto" ref={scrollRef}>
            <div className="space-y-2 p-4">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henüz log yok. API çağrıları burada görünecek.
                </p>
              ) : (
                [...logs].reverse().map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`${getStatusColor(log.status)} text-white`}
                        >
                          {log.method}
                        </Badge>
                        <span className="text-sm font-mono text-xs">
                          {log.endpoint}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {log.status && (
                          <Badge variant="outline" className="text-xs">
                            {log.status} {log.statusText}
                          </Badge>
                        )}
                        {log.duration && (
                          <span className="text-xs text-muted-foreground">
                            {log.duration}ms
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {log.requestBody && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Request Body
                        </summary>
                        <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.requestBody, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.response && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Response
                        </summary>
                        <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                          {typeof log.response === 'string'
                            ? log.response
                            : JSON.stringify(log.response, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.error && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {log.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

