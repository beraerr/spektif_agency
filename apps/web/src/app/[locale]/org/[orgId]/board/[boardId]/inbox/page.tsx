'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Inbox, Mail, Search, Filter, MoreHorizontal, Clock, Users, Calendar } from 'lucide-react'
import { useBoardBackground } from '@/hooks/use-board-background'

interface Notification {
  id: string
  type: 'mention' | 'assignment' | 'due_date' | 'comment' | 'board_update'
  title: string
  message: string
  time: string
  read: boolean
  avatar?: string
  user?: string
  board?: string
  card?: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Ahmet Yılmaz sizi etiketledi',
    message: '"Web Sitesi Tasarımı" kartında sizi etiketledi: @mehmet bu tasarım hakkında ne düşünüyorsun?',
    time: '5 dakika önce',
    read: false,
    user: 'Ahmet Yılmaz',
    board: 'Web Projesi',
    card: 'Web Sitesi Tasarımı'
  },
  {
    id: '2',
    type: 'assignment',
    title: 'Size yeni bir görev atandı',
    message: 'Elif Kaya tarafından "Logo Tasarımı" kartına atandınız',
    time: '1 saat önce',
    read: false,
    user: 'Elif Kaya',
    board: 'Branding Projesi',
    card: 'Logo Tasarımı'
  },
  {
    id: '3',
    type: 'due_date',
    title: 'Deadline yaklaşıyor',
    message: '"İçerik Stratejisi" kartının deadline\'ı yarın sona eriyor',
    time: '2 saat önce',
    read: true,
    board: 'Pazarlama Kampanyası',
    card: 'İçerik Stratejisi'
  },
  {
    id: '4',
    type: 'comment',
    title: 'Yeni yorum',
    message: 'Ayşe Demir "Sosyal Medya Planı" kartına yorum ekledi',
    time: '3 saat önce',
    read: true,
    user: 'Ayşe Demir',
    board: 'Pazarlama Kampanyası',
    card: 'Sosyal Medya Planı'
  },
  {
    id: '5',
    type: 'board_update',
    title: 'Board güncellendi',
    message: '"Web Projesi" board\'ına yeni liste eklendi: "Test & Onay"',
    time: '1 gün önce',
    read: true,
    board: 'Web Projesi'
  }
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'mention':
      return <Users className="w-4 h-4" />
    case 'assignment':
      return <Users className="w-4 h-4" />
    case 'due_date':
      return <Calendar className="w-4 h-4" />
    case 'comment':
      return <Mail className="w-4 h-4" />
    case 'board_update':
      return <Inbox className="w-4 h-4" />
    default:
      return <Mail className="w-4 h-4" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'mention':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'assignment':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'due_date':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'comment':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'board_update':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default function BoardInboxPage() {
  const params = useParams()
  const { boardId } = params
  const [notifications, setNotifications] = useState(mockNotifications)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const { boardBackground } = useBoardBackground(boardId as string)
  const unreadCount = notifications.filter(n => !n.read).length
  
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === 'unread') {
      return matchesSearch && !notification.read
    }
    
    return matchesSearch
  })

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  return (
    <div 
      className="min-h-screen relative pb-24"
      style={boardBackground ? {
        backgroundImage: `url(${boardBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-white">
              <Inbox className="w-6 h-6 mr-2" />
              Inbox
            </h1>
            <p className="text-white/80">Board bildirimlerinizi ve güncellemelerinizi takip edin</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                Tümünü Okundu İşaretle
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Bildirimlerde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              Tümü ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Okunmamış ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-md border border-white/20">
                <CardContent className="text-center py-12">
                  <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Bildirim bulunamadı</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Arama kriterlerinize uygun bildirim bulunamadı.' : 'Henüz bildirim bulunmuyor.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow bg-white/90 backdrop-blur-md border border-white/20 ${
                      !notification.read ? 'border-blue-400 bg-blue-50/30' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${!notification.read ? 'text-brand-primary' : ''}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                              )}
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {notification.time}
                              </div>
                              {notification.board && (
                                <Badge variant="secondary" className="text-xs">
                                  {notification.board}
                                </Badge>
                              )}
                              {notification.card && (
                                <span>→ {notification.card}</span>
                              )}
                            </div>
                            
                            {notification.user && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {notification.user.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {notification.user}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {filteredNotifications.filter(n => !n.read).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Okunmamış bildirim yok</h3>
                  <p className="text-muted-foreground">
                    Tüm bildirimler okundu! 🎉
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.filter(n => !n.read).map(notification => (
                  <Card 
                    key={notification.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-brand-primary bg-brand-primary/5"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-brand-primary">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {notification.time}
                              </div>
                              {notification.board && (
                                <Badge variant="secondary" className="text-xs">
                                  {notification.board}
                                </Badge>
                              )}
                              {notification.card && (
                                <span>→ {notification.card}</span>
                              )}
                            </div>
                            
                            {notification.user && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {notification.user.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {notification.user}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  )
}
