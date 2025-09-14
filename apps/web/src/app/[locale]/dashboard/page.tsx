'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MessageSquare, Users, BarChart3, Home, UserCheck, Building2, LogOut, Sparkles, Folder, MoreVertical, Image, Upload, X, Loader2 } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { CreateEmployeeModal } from '@/components/employee/create-employee-modal'
import { EmployeeDashboard } from '@/components/employee/employee-dashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations()
  const [activeView, setActiveView] = useState('home')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/tr/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  const isEmployee = (session as any)?.user?.role === 'EMPLOYEE' || (session as any)?.user?.role === 'ACCOUNTANT'

  // Show employee dashboard for employees
  if (isEmployee) {
    return <EmployeeDashboard session={session} />
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Spektif Agency</h1>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <Button
            variant={activeView === 'home' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('home')}
          >
            <Home className="w-4 h-4 mr-3" />
            Ana Sayfa
          </Button>
          
          <Button
            variant={activeView === 'templates' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('templates')}
          >
            <Folder className="w-4 h-4 mr-3" />
            Şablonlar
          </Button>

          <Button
            variant={activeView === 'members' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('members')}
          >
            <UserCheck className="w-4 h-4 mr-3" />
            Üyeler
          </Button>

          {isAdmin && (
            <Button
              variant={activeView === 'clients' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('clients')}
            >
              <Building2 className="w-4 h-4 mr-3" />
              Müşteriler
            </Button>
          )}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                <span className="text-brand-primary font-medium text-sm">
                  {session.user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold">
                {activeView === 'home' && 'Ana Sayfa'}
                {activeView === 'templates' && 'Şablonlar'}
                {activeView === 'members' && 'Üyeler'}
                {activeView === 'clients' && 'Müşteriler'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeView === 'home' && 'Projenize genel bakış'}
                {activeView === 'templates' && 'Mevcut board şablonlarınız'}
                {activeView === 'members' && 'Takım üyelerinizi yönetin'}
                {activeView === 'clients' && 'Müşteri bilgilerini yönetin'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {activeView === 'home' && <HomeView session={session} />}
          {activeView === 'templates' && <TemplatesView session={session} />}
          {activeView === 'members' && <MembersView session={session} />}
          {activeView === 'clients' && <ClientsView session={session} />}
        </div>
      </main>
    </div>
  )
}

function HomeView({ session }: { session: any }) {
  const t = useTranslations()
  const firstName = session.user?.name?.split(' ')[0] || ''

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">
          Merhaba, {firstName}! 👋
        </h3>
        <p className="text-muted-foreground">
          Bugün hangi projelerde çalışacaksınız?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Projeler</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 bu hafta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Görevler</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+12 bu hafta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Görevler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-3 bu hafta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Takım Üyeleri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+1 bu hafta</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Ahmet Yılmaz</span> "Sosyal Medya Kampanyası" kartını taşıdı
                  </p>
                  <p className="text-xs text-muted-foreground">2 dakika önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Elif Kaya</span> yeni bir mesaj gönderdi
                  </p>
                  <p className="text-xs text-muted-foreground">5 dakika önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Mehmet Can</span> "İçerik Üretimi" projesine yorum ekledi
                  </p>
                  <p className="text-xs text-muted-foreground">1 saat önce</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Deadline'lar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Web Sitesi Tasarımı</p>
                  <p className="text-xs text-muted-foreground">Müşteri Projesi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">Yarın</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Logo Tasarımı</p>
                  <p className="text-xs text-muted-foreground">Branding Projesi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">3 gün</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div>
                  <p className="text-sm font-medium">İçerik Stratejisi</p>
                  <p className="text-xs text-muted-foreground">Pazarlama Projesi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600">1 hafta</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TemplatesView({ session }: { session: any }) {
  const [boards, setBoards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBoardSettings, setShowBoardSettings] = useState<string | null>(null)
  const [boardBackgrounds, setBoardBackgrounds] = useState<{[key: string]: string}>({})
  const [isCreating, setIsCreating] = useState(false)

  // Load saved backgrounds from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('boardBackgrounds')
    if (saved) {
      setBoardBackgrounds(JSON.parse(saved))
    }
  }, [])

  // Save backgrounds to localStorage and board context
  const saveBoardBackground = (boardId: string, backgroundUrl: string) => {
    const newBackgrounds = { ...boardBackgrounds, [boardId]: backgroundUrl }
    setBoardBackgrounds(newBackgrounds)
    localStorage.setItem('boardBackgrounds', JSON.stringify(newBackgrounds))
    
    // Also save to global context for use in board pages
    localStorage.setItem(`boardBackground_${boardId}`, backgroundUrl)
  }

  // Handle file upload
  const handleBackgroundUpload = (boardId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      saveBoardBackground(boardId, result)
      setShowBoardSettings(null)
    }
    reader.readAsDataURL(file)
  }

  // Handle board creation
  const handleCreateBoard = async () => {
    try {
      setIsCreating(true)
      const newBoard = await apiClient.createBoard({
        title: 'Yeni Board',
        description: 'Board açıklaması...',
        color: '#4ADE80',
        organizationId: 'spektif-agency', // Default organization
        userId: 'spektif-agency' // User ID for board access
      })
      
      // Add to boards list
      setBoards(prev => [...prev, newBoard])
      toast.success('Board başarıyla oluşturuldu!')
      
      // Stay on templates page - no redirect
    } catch (error) {
      console.error('Board creation error:', error)
      toast.error('Board oluşturulurken hata oluştu')
    } finally {
      setIsCreating(false)
    }
  }

  // Predefined beautiful backgrounds
  const predefinedBackgrounds = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464822759844-d150baec843a?w=800&h=600&fit=crop'
  ]

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const token = (session as any)?.user?.backendToken
        console.log('Session:', session)
        console.log('Backend token:', token)
        
        let response
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        console.log('🔗 API URL:', apiUrl)
        console.log('🌍 Environment:', process.env.NODE_ENV)
        
        if (token) {
          // Try with authentication first
          response = await fetch(`${apiUrl}/boards?organizationId=spektif-agency`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
        } else {
          // Fallback: Try to login with demo credentials and get token
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const loginResponse = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'admin@spektif.com',
              password: 'admin123',
            }),
          })
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json()
            response = await fetch(`${apiUrl}/getBoards?userId=spektif-agency`, {
              headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json',
              },
            })
          }
        }
        
        if (response && response.ok) {
          const data = await response.json()
          setBoards(data)
          console.log('Boards loaded:', data.length)
        }
      } catch (error) {
        console.error('Error fetching boards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBoards() // Initial fetch
    
    // Set up real-time updates every 15 seconds
    const interval = setInterval(fetchBoards, 15000)
    
    return () => clearInterval(interval)
  }, [session])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>Şablonlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Board Şablonları</h3>
          <p className="text-sm text-muted-foreground">
            Projelerinizi organize etmek için mevcut board'larınız
          </p>
        </div>
        <Button onClick={handleCreateBoard} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Folder className="w-4 h-4 mr-2" />
          )}
          Yeni Board
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map((board, index) => {
          // Check if board has custom background
          const customBackground = boardBackgrounds[board.id]
          
          // Beautiful gradient backgrounds like Trello
          const gradients = [
            'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
            'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600', 
            'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
            'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
            'bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600',
            'bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600',
          ]
          const gradient = gradients[index % gradients.length]
          
          return (
            <div key={board.id} className="relative group">
              <div
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative"
                onClick={() => {
                  window.location.href = `/tr/org/spektif-agency/board/${board.id}`
                }}
              >
                {/* Cover Image - Large like Trello */}
                <div className="h-40 relative overflow-hidden">
                  {customBackground ? (
                    <img
                      src={customBackground}
                      alt={board.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${gradient}`} />
                  )}
                  {/* Subtle overlay for text readability */}
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
                
                {/* Board Settings Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowBoardSettings(showBoardSettings === board.id ? null : board.id)
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {/* Board Header with relative positioning */}
                {/* Board Info - Clean white background like Trello */}
                <div className="bg-white p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {board.description}
                    </p>
                  )}
                </div>
                
                {/* Board Stats - Clean Trello style */}
                <div className="bg-white border-t border-gray-200 p-3">
                  <div className="flex items-center justify-between text-gray-600 text-sm mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Folder className="w-4 h-4 mr-1" />
                        {board.lists?.length || 0} liste
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {board.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0} kart
                      </span>
                    </div>
                  </div>
                  
                  {/* Team Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {board.members?.slice(0, 4).map((member: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 bg-blue-500 flex items-center justify-center text-white font-medium text-xs shadow-sm"
                          title={member.user?.name}
                        >
                          {member.user?.name?.charAt(0) || 'U'}
                        </div>
                      ))}
                      {board.members?.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-white/30 backdrop-blur-sm flex items-center justify-center text-white font-medium text-xs">
                          +{board.members.length - 4}
                        </div>
                      )}
                    </div>
                    
                    {/* Quick action indicators */}
                    <div className="flex space-x-1">
                      {board.lists?.some((list: any) => list.cards?.some((card: any) => card.dueDate)) && (
                        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                          <Calendar className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Board Settings Menu */}
              {showBoardSettings === board.id && (
                <div 
                  className="absolute top-10 right-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20 w-72"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Board Ayarları</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBoardSettings(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Arkaplan Seç</h5>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {predefinedBackgrounds.map((bg, idx) => (
                          <div
                            key={idx}
                            className="w-full h-12 rounded cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                            style={{
                              backgroundImage: `url(${bg})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                            onClick={() => {
                              saveBoardBackground(board.id, bg)
                              setShowBoardSettings(null)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Özel Fotoğraf Yükle</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleBackgroundUpload(board.id, file)
                            }
                          }}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </label>
                    </div>
                    
                    {customBackground && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          saveBoardBackground(board.id, '')
                          setShowBoardSettings(null)
                        }}
                        className="w-full"
                      >
                        Arkaplan Sil
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {boards.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Folder className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz board bulunmuyor</h3>
            <p className="text-muted-foreground mb-4">
              İlk board'unuzu oluşturarak başlayın
            </p>
            <Button onClick={handleCreateBoard} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Folder className="w-4 h-4 mr-2" />
              )}
              Yeni Board Oluştur
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface Member {
  id: string
  name: string
  surname: string
  email: string
  position: string
  phone: string
  role: string
  avatar: string
  joinDate: string
}

function MembersView({ session }: { session: any }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use hardcoded organization ID since session doesn't have org info
  const organizationId = 'spektif-agency'

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        const employees = await apiClient.getEmployees(organizationId) as Member[]
        setMembers(employees)
      } catch (error) {
        console.error('Error fetching employees:', error)
        toast.error('Çalışanlar yüklenirken hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const handleEmployeeCreated = async () => {
    // Refetch the members list
    try {
      const employees = await apiClient.getEmployees(organizationId) as Member[]
      setMembers(employees)
      toast.success('Çalışan başarıyla oluşturuldu!')
    } catch (error) {
      console.error('Error refetching employees:', error)
      toast.error('Çalışan listesi güncellenirken hata oluştu')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Takım Üyeleri</h3>
          <p className="text-sm text-muted-foreground">
            Workspace'inizdeki tüm üyeleri görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserCheck className="w-4 h-4 mr-2" />
          Üye Davet Et
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Çalışanlar yükleniyor...</span>
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8">
          <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Henüz çalışan yok</h3>
          <p className="text-muted-foreground mb-4">
            İlk çalışanınızı ekleyerek başlayın
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserCheck className="w-4 h-4 mr-2" />
            İlk Çalışanı Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-medium">
                      {member.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {member.name} {member.surname}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pozisyon:</span>
                    <span className="text-sm font-medium">{member.position || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rol:</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      member.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : member.role === 'ACCOUNTANT'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {member.role === 'ADMIN' ? 'Yönetici' : 
                       member.role === 'ACCOUNTANT' ? 'Muhasebeci' : 'Çalışan'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Katılım:</span>
                    <span className="text-sm">
                      {new Date(member.joinDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Employee Modal */}
      {organizationId && (
        <CreateEmployeeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onEmployeeCreated={handleEmployeeCreated}
          organizationId={organizationId}
        />
      )}
    </div>
  )
}

function ClientsView({ session }: { session: any }) {
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const organizationId = 'spektif-agency' // Same as employees section

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const clientsData = await apiClient.getClients(organizationId) as any[]
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Müşteriler yüklenemedi!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClient = async () => {
    try {
      setIsCreating(true)
      await apiClient.createClient(organizationId, {
        name: "Yeni Müşteri",
        email: "musteri@example.com",
        phone: "+90 555 123 4567",
        company: "Şirket Adı",
        address: "Adres bilgisi",
        notes: "Müşteri notları"
      })
      toast.success('Yeni müşteri oluşturuldu!')
      loadClients() // Reload the list
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Müşteri oluşturulamadı!')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Müşteriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Müşteriler</h3>
          <p className="text-sm text-muted-foreground">
            Müşteri bilgilerini ve projelerini yönetin
          </p>
        </div>
        <Button onClick={handleCreateClient} disabled={isCreating}>
          <Building2 className="w-4 h-4 mr-2" />
          {isCreating ? 'Oluşturuluyor...' : 'Yeni Müşteri'}
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz müşteri yok</h3>
          <p className="text-muted-foreground mb-4">İlk müşterinizi ekleyerek başlayın</p>
          <Button onClick={handleCreateClient} disabled={isCreating}>
            <Building2 className="w-4 h-4 mr-2" />
            {isCreating ? 'Oluşturuluyor...' : 'İlk Müşteri Ekle'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Şirket:</span>
                    <span className="text-sm font-medium">{client.company || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Telefon:</span>
                    <span className="text-sm">{client.phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      client.status === 'Aktif' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projeler:</span>
                    <span className="text-sm font-medium">{client.projects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
