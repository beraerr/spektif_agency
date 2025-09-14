'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Paperclip, Smile, Phone, Video, Search, MoreVertical, User } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: string
  type: 'text' | 'file' | 'image'
  isCurrentUser: boolean
  status: 'sent' | 'delivered' | 'read'
}

interface ChatParticipant {
  id: string
  name: string
  avatar?: string
  role: string
  isOnline: boolean
  lastSeen?: string
}

const useBoardChat = (boardId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [participants, setParticipants] = useState<ChatParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        let token = (session as any)?.user?.backendToken
        
        if (!token) {
          const apiUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://europe-west4-spektif-agency-final-prod.cloudfunctions.net'
          const loginResponse = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@spektif.com', password: 'admin123' }),
          })
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json()
            token = loginData.token
          }
        }

        // Fetch chat messages
        const messagesResponse = await fetch(`https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/chat/board/${boardId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.map((msg: any) => ({
            ...msg,
            isCurrentUser: msg.senderId === (session as any)?.user?.id
          })))
        } else {
          // Mock data for demo
          setMessages([
            {
              id: '1',
              content: 'Merhaba! Bu board için chat sistemini başlattım.',
              senderId: 'admin',
              senderName: 'Admin User',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              type: 'text',
              isCurrentUser: false,
              status: 'read'
            },
            {
              id: '2',
              content: 'Harika! Şimdi real-time olarak konuşabiliyoruz.',
              senderId: 'current',
              senderName: 'Sen',
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              type: 'text',
              isCurrentUser: true,
              status: 'read'
            },
            {
              id: '3',
              content: 'Kartların deadline\'larını takvimde görebiliyoruz artık!',
              senderId: 'admin',
              senderName: 'Admin User',
              timestamp: new Date(Date.now() - 900000).toISOString(),
              type: 'text',
              isCurrentUser: false,
              status: 'read'
            }
          ])
        }

        // Mock participants data
        setParticipants([
          {
            id: 'admin',
            name: 'Admin User',
            role: 'Admin',
            isOnline: true
          },
          {
            id: 'user1',
            name: 'Müşteri Temsilcisi',
            role: 'Employee',
            isOnline: true
          },
          {
            id: 'user2',
            name: 'Muhasebeci',
            role: 'Accountant',
            isOnline: false,
            lastSeen: '2 saat önce'
          }
        ])

      } catch (error) {
        console.error('Error fetching chat data:', error)
        // Set mock data on error
        setMessages([])
        setParticipants([])
      } finally {
        setLoading(false)
      }
    }

    fetchChatData()

    // Set up real-time polling
    const interval = setInterval(fetchChatData, 5000)
    return () => clearInterval(interval)
  }, [boardId, session])

  return { messages, participants, loading, setMessages }
}

export default function BoardChatPage() {
  const params = useParams()
  const { boardId } = params
  const { messages, participants, loading, setMessages } = useBoardChat(boardId as string)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [boardBackground, setBoardBackground] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  // Load board background
  useEffect(() => {
    const saved = localStorage.getItem('boardBackgrounds')
    if (saved) {
      const backgrounds = JSON.parse(saved) as Record<string, string>
      const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId
      setBoardBackground(backgrounds[boardIdStr] || '')
    }
  }, [boardId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: 'current',
      senderName: 'Sen',
      timestamp: new Date().toISOString(),
      type: 'text',
      isCurrentUser: true,
      status: 'sent'
    }

    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')

    try {
      let token = (session as any)?.user?.backendToken
      
      if (!token) {
        const loginResponse = await fetch(`https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@spektif.com', password: 'admin123' }),
        })
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          token = loginData.token
        }
      }

      // Send to backend
      const response = await fetch(`https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/chat/board/${boardId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          type: 'text'
        })
      })

      if (response.ok) {
        // Update message status
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'delivered' } 
            : msg
        ))
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün'
    } else {
      return date.toLocaleDateString('tr-TR')
    }
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={boardBackground ? {
          backgroundImage: `url(${boardBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        } : {
          background: 'linear-gradient(135deg, #16a085 0%, #0d7c66 100%)'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white">Chat yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-screen flex flex-col relative"
      style={boardBackground ? {
        backgroundImage: `url(${boardBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {
        background: 'linear-gradient(135deg, #16a085 0%, #0d7c66 100%)'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      {/* WhatsApp-style Header */}
      <div className="relative z-10 bg-green-600/80 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold">Board Chat</h1>
            <p className="text-sm text-green-100">
              {participants.filter(p => p.isOnline).length} çevrimiçi
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Participants Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4 overflow-x-auto">
          {participants.map(participant => (
            <div key={participant.id} className="flex items-center space-x-2 whitespace-nowrap">
              <div className="relative">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {participant.name.charAt(0)}
                  </span>
                </div>
                {participant.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="text-sm">
                <div className="font-medium">{participant.name}</div>
                <div className="text-gray-500 text-xs">
                  {participant.isOnline ? 'Çevrimiçi' : participant.lastSeen}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const showDate = index === 0 || 
            formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp)
          
          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(message.timestamp)}
                  </Badge>
                </div>
              )}
              
              <div className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md flex ${message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                  {!message.isCurrentUser && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">
                        {message.senderName.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`px-4 py-2 rounded-lg ${
                    message.isCurrentUser 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    {!message.isCurrentUser && (
                      <p className="text-xs font-medium text-green-600 mb-1">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                      message.isCurrentUser ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                      {message.isCurrentUser && (
                        <div className="flex space-x-1">
                          <div className={`w-1 h-1 rounded-full ${
                            message.status === 'sent' ? 'bg-gray-400' :
                            message.status === 'delivered' ? 'bg-green-300' : 'bg-green-100'
                          }`}></div>
                          <div className={`w-1 h-1 rounded-full ${
                            message.status === 'delivered' ? 'bg-green-300' :
                            message.status === 'read' ? 'bg-green-100' : 'bg-gray-400'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-md flex space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">A</span>
              </div>
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - WhatsApp Style */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesaj yazın..."
              className="pr-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>
          
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`w-10 h-10 rounded-full p-0 ${
              newMessage.trim() 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}