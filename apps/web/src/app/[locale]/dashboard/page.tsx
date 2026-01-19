'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar, MessageSquare, Users, BarChart3, Home, UserCheck, Building2, LogOut, Sparkles, Folder, MoreVertical, Image, Upload, X, Loader2, Edit, Save, Trash2, Pin, PinOff } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'
import { apiClient } from '@/lib/api'
import { cache, cacheKeys } from '@/lib/cache'
import { toast } from 'sonner'
import { CreateEmployeeModal } from '@/components/employee/create-employee-modal'
import { CreateClientModal } from '@/components/client/create-client-modal'
import EmployeeDashboardPage from '@/app/[locale]/employee/dashboard/page'
import ClientDashboardPage from '@/app/[locale]/client/dashboard/page'

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

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  // Wait for session to be available
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Session yukleniyor...</p>
        </div>
      </div>
    )
  }

  const userRole = (session as any)?.user?.role
  
  // Normalize role to uppercase for comparison (backend uses lowercase)
  const normalizedRole = userRole?.toUpperCase()
  
  const isAdmin = normalizedRole === 'ADMIN'
  const isEmployee = normalizedRole === 'EMPLOYEE' || normalizedRole === 'ACCOUNTANT'
  const isClient = normalizedRole === 'CLIENT'
  
  // Show employee dashboard for employees - MUST return early
  if (isEmployee) {
    return <EmployeeDashboardPage />
  }

  // Show client dashboard for clients - MUST return early
  if (isClient) {
    return <ClientDashboardPage />
  }

  // Only show admin dashboard for admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-white">Yukleniyor...</p>
        </div>
      </div>
    )
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

          {/* Only show Members and Clients for Admin */}
          {isAdmin && (
            <>
              <Button
                variant={activeView === 'members' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('members')}
              >
                <UserCheck className="w-4 h-4 mr-3" />
                Çalışanlar
              </Button>

              <Button
                variant={activeView === 'clients' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('clients')}
              >
                <Building2 className="w-4 h-4 mr-3" />
                Müşteriler
              </Button>
            </>
          )}

          {/* Logout Button */}
          <div className="pt-4 border-t border-border mt-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => signOut({ callbackUrl: '/tr/auth/login' })}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Çıkış Yap
            </Button>
          </div>
        </nav>
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
                {activeView === 'members' && 'Çalışanlar'}
                {activeView === 'clients' && 'Müşteriler'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeView === 'home' && 'Projenize genel bakış'}
                {activeView === 'templates' && 'Mevcut board şablonlarınız'}
                {activeView === 'members' && 'Çalışanlarınızı yönetin'}
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
  const [stats, setStats] = useState({ projects: 0, completed: 0, pending: 0, members: 0 })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userId = (session?.user as any)?.id || 'admin'
        const [boardsData, employeesData, clientsData] = await Promise.all([
          apiClient.getBoards(userId) as Promise<any[]>,
          apiClient.getEmployees('spektif') as Promise<any[]>,
          apiClient.getClients('spektif') as Promise<any[]>
        ])
        
        let projectCount = 0
        let completedCount = 0
        let pendingCount = 0
        
        boardsData?.forEach((board: any) => {
          board.lists?.forEach((list: any) => {
            list.cards?.forEach((card: any) => {
              const hasProjeLabel = card.labels?.some((l: string) => 
                l.toLowerCase().includes('proje') || l.toLowerCase() === 'project'
              )
              if (hasProjeLabel) projectCount++
              if (list.title?.toLowerCase().includes('tamamlan')) completedCount++
              else pendingCount++
            })
          })
        })
        
        setStats({
          projects: projectCount || boardsData?.length || 0,
          completed: completedCount,
          pending: pendingCount,
          members: (employeesData?.length || 0) + (clientsData?.length || 0)
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
  }, [session])

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
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground">Proje etiketli kartlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Görevler</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Tamamlanan listesinde</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Görevler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Diger listelerden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Takım Üyeleri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
            <p className="text-xs text-muted-foreground">Calisan + Musteri</p>
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
  const [availableMembers, setAvailableMembers] = useState<any[]>([]) // Employees + Clients
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Load saved backgrounds from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('boardBackgrounds')
    if (saved) {
      setBoardBackgrounds(JSON.parse(saved))
    }
  }, [])

  // Load available members (employees + clients) for board assignment
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true)
        const [employees, clients] = await Promise.all([
          apiClient.getEmployees('spektif') as Promise<any[]>,
          apiClient.getClients('spektif') as Promise<any[]>
        ])
        
        // Combine employees and clients
        const allMembers = [
          ...(employees || []).map(emp => ({
            id: emp.id,
            name: `${emp.name} ${emp.surname || ''}`.trim(),
            email: emp.email,
            type: 'employee',
            role: emp.role
          })),
          ...(clients || []).map(client => ({
            id: client.id,
            name: client.name || client.company,
            email: client.email,
            type: 'client',
            role: 'client'
          }))
        ]
        
        setAvailableMembers(allMembers)
      } catch (error) {
        console.error('Error loading members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }
    
    loadMembers()
  }, [])

  // Save backgrounds to localStorage, board context, and database
  const saveBoardBackground = async (boardId: string, backgroundUrl: string) => {
    const newBackgrounds = { ...boardBackgrounds, [boardId]: backgroundUrl }
    setBoardBackgrounds(newBackgrounds)
    localStorage.setItem('boardBackgrounds', JSON.stringify(newBackgrounds))
    
    // Also save to global context for use in board pages
    localStorage.setItem(`boardBackground_${boardId}`, backgroundUrl)
    
    // Save to database so all users see the same background
    try {
      await apiClient.updateBoardBackground(boardId, backgroundUrl)
      toast.success('Arkaplan kaydedildi!')
    } catch (error) {
      console.error('Error saving background to database:', error)
      toast.error('Arkaplan kaydedilemedi')
    }
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

  // Handle board pinning
  const handlePinBoard = async (boardId: string, pinned: boolean) => {
    try {
      await apiClient.pinBoard(boardId, pinned)
      // Reload boards to get fresh data (force refresh)
      await loadBoards(true)
      toast.success(pinned ? 'Board pinlendi!' : 'Board pin kaldirildi!')
      setShowBoardSettings(null)
    } catch (error) {
      console.error('Error pinning board:', error)
      toast.error('Board pinlenirken hata olustu')
    }
  }

  // Handle board member addition/removal
  const handleAddBoardMember = async (boardId: string, memberId: string) => {
    try {
      const board = boards.find(b => b.id === boardId)
      if (!board) return
      
      const currentMembers = board.members || []
      if (currentMembers.includes(memberId)) {
        toast.error('Bu uye zaten board\'a ekli')
        return
      }
      
      await apiClient.updateBoard(boardId, {
        members: [...currentMembers, memberId]
      })
      
      // Reload boards to get fresh data (force refresh)
      await loadBoards(true)
      toast.success('Uye board\'a eklendi!')
    } catch (error) {
      console.error('Error adding board member:', error)
      toast.error('Uye eklenirken hata olustu')
    }
  }

  const handleRemoveBoardMember = async (boardId: string, memberId: string) => {
    try {
      const board = boards.find(b => b.id === boardId)
      if (!board) return
      
      const currentMembers = board.members || []
      const newMembers = currentMembers.filter((id: string) => id !== memberId)
      
      await apiClient.updateBoard(boardId, {
        members: newMembers
      })
      
      // Reload boards to get fresh data (force refresh)
      await loadBoards(true)
      toast.success('Uye board\'dan cikarildi!')
    } catch (error) {
      console.error('Error removing board member:', error)
      toast.error('Uye cikarilirken hata olustu')
    }
  }

  // Handle board deletion
  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Bu boardu silmek istediginizden emin misiniz? Bu islem geri alinamaz.')) {
      return
    }
    
    try {
      const result = await apiClient.deleteBoard(boardId) as any
      console.log('Delete board result:', result)
      
      if (result?.success) {
        // Reload boards to get fresh data (force refresh)
        await loadBoards(true)
        toast.success('Board silindi!')
        setShowBoardSettings(null)
      } else {
        throw new Error(result?.error || 'Board silinemedi')
      }
    } catch (error: any) {
      console.error('Error deleting board:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Board silinirken hata olustu'
      toast.error(errorMessage)
    }
  }

  // Handle board creation
  const handleCreateBoard = async () => {
    try {
      setIsCreating(true)
      const user = session as any
      const userId = user?.user?.id || 'admin'
      
      const newBoard = await apiClient.createBoard({
        title: 'Yeni Board',
        description: 'Board açıklaması...',
        color: '#4ADE80',
        organizationId: 'spektif', // Default organization
        userId: userId // Use actual user ID
      })
      
      // Create default lists for the new board
      try {
        await apiClient.createList({
          boardId: (newBoard as any).id,
          title: 'To Do'
        })
        await apiClient.createList({
          boardId: (newBoard as any).id,
          title: 'In Progress'
        })
        await apiClient.createList({
          boardId: (newBoard as any).id,
          title: 'Done'
        })
      } catch (listError) {
        console.error('Error creating default lists:', listError)
        // Don't fail board creation if lists fail
      }
      
      // Reload boards from server to get fresh data (force refresh to bypass cache)
      await loadBoards(true)
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

  // Load boards function - can be called from anywhere
  const loadBoards = async (forceRefresh = false) => {
    try {
      const user = session as any
      const userId = user?.user?.id || 'admin' // Use actual user ID from session
      
      // If force refresh, invalidate cache first
      if (forceRefresh) {
        cache.delete(cacheKeys.boards(userId))
      }
      
      // Use apiClient which handles emulator URLs correctly
      const data = await apiClient.getBoards(userId) as any[]
      setBoards(data || [])
      console.log('Boards loaded:', data?.length || 0)
      
      // Load backgrounds from database
      const bgFromDb: {[key: string]: string} = {}
      data?.forEach((board: any) => {
        if (board.backgroundUrl) {
          bgFromDb[board.id] = board.backgroundUrl
        }
      })
      if (Object.keys(bgFromDb).length > 0) {
        setBoardBackgrounds(prev => ({ ...prev, ...bgFromDb }))
      }
    } catch (error) {
      console.error('Error fetching boards:', error)
      toast.error('Boardlar yuklenirken hata olustu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadBoards()
      
      // Set up polling for real-time updates every 10 seconds
      const interval = setInterval(loadBoards, 10000)
      return () => clearInterval(interval)
    }
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
                  window.location.href = `/tr/org/spektif/board/${board.id}`
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
                
                {/* Pinned Indicator */}
                {board.pinned && (
                  <div className="absolute top-2 left-2 z-20">
                    <Pin className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                  </div>
                )}

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
                <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowBoardSettings(null)}
                />
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

                    {/* Board Members Management */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Board Uyeleri</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {board.members?.map((memberId: string) => {
                          const member = availableMembers.find(m => m.id === memberId)
                          if (!member) return null
                          return (
                            <div key={memberId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  member.type === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-medium">{member.name}</p>
                                  <p className="text-xs text-gray-500">{member.type === 'employee' ? 'Calisan' : 'Musteri'}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBoardMember(board.id, memberId)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-2">
                        <select
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          onChange={(e) => {
                            const memberId = e.target.value
                            if (memberId) {
                              handleAddBoardMember(board.id, memberId)
                              e.target.value = ''
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">Uye Ekle...</option>
                          {availableMembers
                            .filter(m => !board.members?.includes(m.id))
                            .map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.type === 'employee' ? 'Calisan' : 'Musteri'})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Pin Board */}
                    <div className="border-t border-gray-200 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePinBoard(board.id, !board.pinned)}
                        className="w-full justify-start"
                      >
                        {board.pinned ? (
                          <>
                            <PinOff className="w-4 h-4 mr-2" />
                            Pin Kaldir
                          </>
                        ) : (
                          <>
                            <Pin className="w-4 h-4 mr-2" />
                            Boardu Pinle
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Delete Board */}
                    <div className="border-t border-gray-200 pt-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBoard(board.id)}
                        className="w-full justify-start"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Boardu Sil
                      </Button>
                    </div>
                  </div>
                </div>
                </>
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
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Member & { password?: string }>>({})

  // Use hardcoded organization ID since session doesn't have org info
  const organizationId = 'spektif'

  // Load members function - ONLY employees, NOT clients
  const loadMembers = async () => {
    try {
      setIsLoading(true)
      
      // Clear any cached employees data
      cache.delete(cacheKeys.employees(organizationId))
      
      const allUsers = await apiClient.getEmployees(organizationId) as Member[]
      
      // STRICT FILTER: Only show employees, accountants, admins - NO CLIENTS
      const employees = (allUsers || []).filter((user: any) => {
        const role = String(user.role || '').toUpperCase().trim()
        // EXCLUDE clients completely
        if (role === 'CLIENT') {
          return false
        }
        // Only include: EMPLOYEE, ACCOUNTANT, ADMIN
        return role === 'EMPLOYEE' || role === 'ACCOUNTANT' || role === 'ADMIN'
      })
      
      console.log('Loaded employees (filtered):', employees.length, 'from', allUsers.length, 'total users')
      setMembers(employees)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Çalışanlar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch employees on component mount
  useEffect(() => {
    loadMembers()
  }, [])

  const handleEmployeeCreated = async () => {
    // Reload members to get fresh data from backend
    await loadMembers()
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member.id)
    setEditForm({
      name: member.name,
      surname: member.surname,
      email: member.email,
      position: member.position,
      role: member.role
    })
  }

  const handleSaveEdit = async (memberId: string) => {
    try {
      // Only send password if it's provided (not empty)
      const updateData = { ...editForm }
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password
      }
      
      // API call to update member
      await apiClient.updateEmployee(organizationId, memberId, updateData)
      
      // Reload members to get fresh data from backend
      await loadMembers()
      
      setEditingMember(null)
      setEditForm({})
      toast.success('Üye bilgileri güncellendi!')
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Üye güncellenirken hata oluştu')
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setEditForm({})
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) return
    
    try {
      console.log('Deleting employee:', { organizationId, memberId })
      const result = await apiClient.deleteEmployee(organizationId, memberId)
      console.log('Delete employee result:', result)
      // Reload members to get fresh data from backend
      await loadMembers()
      toast.success('Çalışan silindi!')
    } catch (error: any) {
      console.error('Error deleting employee:', error)
      const errorMessage = error?.message || error?.response?.data?.error || 'Çalışan silinirken hata oluştu'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Çalışanlar</h3>
          <p className="text-sm text-muted-foreground">
            Çalışanlarınızı ve rollerini yönetin
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
            <Card key={member.id} className="relative">
              {/* Edit Button */}
              <div className="absolute top-3 right-3 flex space-x-1">
                {editingMember === member.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                      onClick={() => handleSaveEdit(member.id)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <CardHeader className="pb-3 pr-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-medium">
                      {member.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    {editingMember === member.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          placeholder="Ad"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editForm.surname || ''}
                          onChange={(e) => setEditForm({...editForm, surname: e.target.value})}
                          placeholder="Soyad"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          placeholder="Email"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-base">
                          {member.name} {member.surname}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pozisyon:</span>
                    {editingMember === member.id ? (
                      <Input
                        value={editForm.position || ''}
                        onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                        placeholder="Pozisyon"
                        className="h-6 text-xs w-24"
                      />
                    ) : (
                      <span className="text-sm font-medium">{member.position || 'Belirtilmemiş'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rol:</span>
                    {editingMember === member.id ? (
                      <select
                        value={editForm.role || member.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="h-6 text-xs w-20 border rounded px-1"
                      >
                        <option value="EMPLOYEE">Çalışan</option>
                        <option value="ACCOUNTANT">Muhasebeci</option>
                        <option value="ADMIN">Yönetici</option>
                      </select>
                    ) : (
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
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Katılım:</span>
                    <span className="text-sm">
                      {member.joinDate ? new Date(member.joinDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Şifre:</span>
                    {editingMember === member.id ? (
                      <Input
                        type="password"
                        value={editForm.password || ''}
                        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                        placeholder="Yeni şifre (boş bırakılırsa değişmez)"
                        className="h-6 text-xs w-40"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">••••••••</span>
                    )}
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<any>>({})
  const organizationId = 'spektif' // Same as employees section

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

  const handleClientCreated = () => {
    loadClients()
  }

  const handleEditClient = (client: any) => {
    setEditingClient(client.id)
    setEditForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
      notes: client.notes
    })
  }

  const handleSaveClientEdit = async (clientId: string) => {
    try {
      // Only send password if it's provided (not empty)
      const updateData = { ...editForm }
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password
      }
      
      await apiClient.updateClient(organizationId, clientId, updateData)
      
      // Reload clients to get fresh data from backend
      await loadClients()
      
      setEditingClient(null)
      setEditForm({})
      toast.success('Müşteri bilgileri güncellendi!')
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Müşteri güncellenirken hata oluştu')
    }
  }

  const handleCancelClientEdit = () => {
    setEditingClient(null)
    setEditForm({})
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return
    
    try {
      console.log('Deleting client:', { organizationId, clientId })
      const result = await apiClient.deleteClient(organizationId, clientId)
      console.log('Delete client result:', result)
      // Reload clients to get fresh data from backend
      await loadClients()
      toast.success('Müşteri silindi!')
    } catch (error: any) {
      console.error('Error deleting client:', error)
      const errorMessage = error?.message || error?.response?.data?.error || 'Müşteri silinirken hata oluştu'
      console.error('Full error details:', {
        message: error?.message,
        response: error?.response,
        stack: error?.stack
      })
      toast.error(errorMessage)
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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Building2 className="w-4 h-4 mr-2" />
          Yeni Müşteri
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz müşteri yok</h3>
          <p className="text-muted-foreground mb-4">İlk müşterinizi ekleyerek başlayın</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-2" />
            İlk Müşteri Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="relative">
              {/* Edit Button */}
              <div className="absolute top-3 right-3 flex space-x-1">
                {editingClient === client.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                      onClick={() => handleSaveClientEdit(client.id)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={handleCancelClientEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleEditClient(client)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <CardHeader className="pb-3 pr-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    {editingClient === client.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          placeholder="Müşteri Adı"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          placeholder="Email"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-base">{client.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Şirket:</span>
                    {editingClient === client.id ? (
                      <Input
                        value={editForm.company || ''}
                        onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                        placeholder="Şirket"
                        className="h-6 text-xs w-24"
                      />
                    ) : (
                      <span className="text-sm font-medium">{client.company || 'Belirtilmemiş'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Telefon:</span>
                    {editingClient === client.id ? (
                      <Input
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        placeholder="Telefon"
                        className="h-6 text-xs w-24"
                      />
                    ) : (
                      <span className="text-sm">{client.phone || '-'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    {editingClient === client.id ? (
                      <select
                        value={editForm.status || client.status || 'Aktif'}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="h-6 text-xs w-20 border rounded px-1"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Pasif">Pasif</option>
                      </select>
                    ) : (
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        client.status === 'Aktif' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {client.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projeler:</span>
                    <span className="text-sm font-medium">{client.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Şifre:</span>
                    {editingClient === client.id ? (
                      <Input
                        type="password"
                        value={editForm.password || ''}
                        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                        placeholder="Yeni şifre (boş bırakılırsa değişmez)"
                        className="h-6 text-xs w-40"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">••••••••</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      {organizationId && (
        <CreateClientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onClientCreated={handleClientCreated}
          organizationId={organizationId}
        />
      )}
    </div>
  )
}
