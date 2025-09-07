'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, LogOut, Home, UserCheck, Building2, Calendar, MessageSquare, BarChart3 } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface EmployeeDashboardProps {
  session: any
}

export function EmployeeDashboard({ session }: EmployeeDashboardProps) {
  const router = useRouter()
  const [activeView, setActiveView] = useState('home')
  const [boards, setBoards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get the first organization ID from session
  const organizationId = (session as any)?.user?.organizations?.[0]?.id

  // Fetch assigned boards (only boards employee is member of)
  useEffect(() => {
    const fetchBoards = async () => {
      if (!organizationId) return
      
      try {
        setIsLoading(true)
        const boardsData = await apiClient.getEmployeeBoards(organizationId) as any[]
        setBoards(boardsData)
      } catch (error) {
        console.error('Error fetching boards:', error)
        toast.error('Boardlar yüklenirken hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoards()
  }, [organizationId])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/tr/auth/login' })
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
              <p className="text-xs text-muted-foreground">Çalışan Paneli</p>
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
            variant={activeView === 'boards' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('boards')}
          >
            <Building2 className="w-4 h-4 mr-3" />
            Atanan Boardlar
          </Button>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                <span className="text-brand-primary font-medium text-sm">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name} {session?.user?.surname}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.position || 'Çalışan'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </Card>
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
                {activeView === 'boards' && 'Atanan Boardlar'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeView === 'home' && 'Hoş geldiniz! Atanan görevlerinizi görüntüleyin'}
                {activeView === 'templates' && 'Mevcut board şablonları'}
                {activeView === 'boards' && 'Size atanan boardlar ve görevler'}
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
          {activeView === 'home' && <EmployeeHomeView boards={boards} isLoading={isLoading} />}
          {activeView === 'templates' && <TemplatesView />}
          {activeView === 'boards' && <AssignedBoardsView boards={boards} isLoading={isLoading} />}
        </div>
      </main>
    </div>
  )
}

function EmployeeHomeView({ boards, isLoading }: { boards: any[], isLoading: boolean }) {
  const totalBoards = boards.length
  const totalCards = boards.reduce((acc, board) => acc + (board.lists?.reduce((listAcc: number, list: any) => listAcc + (list.cards?.length || 0), 0) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 rounded-lg p-6">
        <h3 className="text-2xl font-bold mb-2">Hoş Geldiniz! 👋</h3>
        <p className="text-muted-foreground">
          Size atanan görevleri ve boardları buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Board</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalBoards}</div>
            <p className="text-xs text-muted-foreground">
              Size atanan board sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalCards}</div>
            <p className="text-xs text-muted-foreground">
              Tüm boardlardaki görev sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durum</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktif</div>
            <p className="text-xs text-muted-foreground">
              Çalışan hesabınız aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Hızlı Erişim</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Atanan Boardlar
              </CardTitle>
              <CardDescription>
                Size atanan boardları görüntüleyin ve görevlerinizi takip edin
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Şablonlar
              </CardTitle>
              <CardDescription>
                Mevcut board şablonlarını inceleyin
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TemplatesView() {
  const templates = [
    {
      id: 1,
      name: 'Proje Yönetimi',
      description: 'Genel proje yönetimi için hazır şablon',
      category: 'Proje Yönetimi'
    },
    {
      id: 2,
      name: 'Sprint Planlama',
      description: 'Agile sprint planlama şablonu',
      category: 'Agile'
    },
    {
      id: 3,
      name: 'İçerik Takibi',
      description: 'İçerik üretim süreçleri için şablon',
      category: 'İçerik'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Board Şablonları</h3>
          <p className="text-sm text-muted-foreground">
            Mevcut board şablonlarını inceleyin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                {template.name}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{template.category}</span>
                <Button size="sm" variant="outline">
                  İncele
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AssignedBoardsView({ boards, isLoading }: { boards: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 bg-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>Boardlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Henüz atanan board yok</h3>
        <p className="text-muted-foreground">
          Size henüz bir board atanmamış. Yöneticinizle iletişime geçin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Atanan Boardlar</h3>
          <p className="text-sm text-muted-foreground">
            Size atanan boardlar ve görevler
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => (
          <Card key={board.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                {board.title}
              </CardTitle>
              <CardDescription>{board.description || 'Açıklama yok'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Liste Sayısı:</span>
                  <span className="text-sm font-medium">{board.lists?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Görev Sayısı:</span>
                  <span className="text-sm font-medium">
                    {board.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Oluşturulma:</span>
                  <span className="text-sm">
                    {new Date(board.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  onClick={() => window.open(`/tr/org/${board.organizationId}/board/${board.id}`, '_blank')}
                >
                  Boarda Git
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
