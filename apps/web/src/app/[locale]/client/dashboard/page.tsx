'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  MessageSquare,
  Folder
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  description?: string
  color?: string
  status: 'active' | 'completed' | 'on_hold'
  progress: number
  dueDate: string
  tasksCompleted: number
  totalTasks: number
}

interface Invoice {
  id: string
  number: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
}

export default function ClientDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/tr/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    // Load client's projects and invoices
    const loadData = async () => {
      try {
        const user = session?.user as any
        if (!user?.id) {
          setLoading(false)
          return
        }

        // Fetch boards assigned to this client (these are the projects)
        const boardsData = await apiClient.getBoards(user.id, 'client', user.id) as any[]
        
        // Convert boards to projects with progress calculation
        const projectsData: Project[] = boardsData.map((board: any) => {
          const totalTasks = board.lists?.reduce((sum: number, list: any) => 
            sum + (list.cards?.length || 0), 0) || 0
          const completedTasks = board.lists?.reduce((sum: number, list: any) => {
            if (list.title.toLowerCase().includes('tamamlan') || list.title.toLowerCase().includes('done')) {
              return sum + (list.cards?.length || 0)
            }
            return sum
          }, 0) || 0
          
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          
          return {
            id: board.id,
            name: board.title,
            description: board.description || '',
            color: board.color || '#8B5CF6',
            status: progress === 100 ? 'completed' : 'active',
            progress,
            dueDate: board.lists?.[0]?.cards?.[0]?.dueDate || new Date().toISOString(),
            tasksCompleted: completedTasks,
            totalTasks
          }
        })
        
        setProjects(projectsData)

        // Mock invoices for now (would come from accounting system)
        setInvoices([
          {
            id: '1',
            number: 'INV-2024-001',
            amount: 15000,
            status: 'paid',
            dueDate: new Date(Date.now() - 604800000).toISOString()
          },
          {
            id: '2',
            number: 'INV-2024-002',
            amount: 8500,
            status: 'pending',
            dueDate: new Date(Date.now() + 604800000).toISOString()
          }
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Veriler yuklenirken hata olustu')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      loadData()
      
      // Set up polling for real-time updates every 10 seconds
      const interval = setInterval(loadData, 10000)
      return () => clearInterval(interval)
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  const user = session?.user as any
  const activeProjects = projects.filter(p => p.status === 'active').length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const pendingInvoices = invoices.filter(i => i.status === 'pending')
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-purple-800/50 border-b border-purple-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Merhaba, {user?.name || user?.company}
              </h1>
              <p className="text-sm text-purple-300">Musteri Paneli</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-purple-300 hover:text-white"
            onClick={() => signOut({ callbackUrl: '/tr/auth/login' })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cikis Yap
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-purple-800/50 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Aktif Projeler</p>
                  <p className="text-3xl font-bold text-white">{activeProjects}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-800/50 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Tamamlanan</p>
                  <p className="text-3xl font-bold text-green-400">{completedProjects}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-800/50 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Bekleyen Odeme</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {totalPending.toLocaleString('tr-TR')} TL
                  </p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-800/50 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Fatura Sayisi</p>
                  <p className="text-3xl font-bold text-white">{invoices.length}</p>
                </div>
                <FileText className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Projelerim ({projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-purple-300 text-center py-4">Henuz atanan proje yok</p>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Link 
                      key={project.id}
                      href={`/tr/org/spektif/board/${project.id}`}
                    >
                      <div 
                        className="p-4 bg-purple-700/50 rounded-lg hover:bg-purple-600/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{project.name}</h3>
                          <Badge className={
                            project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            project.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }>
                            {project.status === 'completed' ? 'Tamamlandi' :
                             project.status === 'active' ? 'Aktif' : 'Beklemede'}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-purple-300 mb-2">{project.description}</p>
                        )}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm text-purple-300 mb-1">
                            <span>{project.tasksCompleted}/{project.totalTasks} gorev</span>
                            <span>%{project.progress}</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                        <div className="flex items-center text-sm text-purple-300">
                          <Calendar className="w-4 h-4 mr-1" />
                          Teslim: {new Date(project.dueDate).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Faturalarim ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-purple-300 text-center py-4">Henuz fatura yok</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-purple-700/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{invoice.number}</p>
                        <p className="text-sm text-purple-300">
                          Son Odeme: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {invoice.amount.toLocaleString('tr-TR')} TL
                        </p>
                        <Badge className={
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }>
                          {invoice.status === 'paid' ? 'Odendi' :
                           invoice.status === 'pending' ? 'Bekliyor' : 'Gecikti'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white h-16">
            <MessageSquare className="w-5 h-5 mr-2" />
            Destek Talebi Olustur
          </Button>
          <Button variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-800 h-16">
            <FileText className="w-5 h-5 mr-2" />
            Tum Faturalari Gor
          </Button>
        </div>
      </main>
    </div>
  )
}
