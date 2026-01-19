'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Clock, 
  Calendar,
  LogOut,
  User,
  Briefcase,
  ListTodo,
  Folder
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface Board {
  id: string
  title: string
  description: string
  color: string
  lists?: any[]
}

interface Task {
  id: string
  title: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed'
  boardName: string
  boardId: string
}

export default function EmployeeDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/tr/auth/login')
      return
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
  
  // Show loading if no session
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

  useEffect(() => {
    // Load employee's boards and tasks
    const loadData = async () => {
      try {
        const user = session?.user as any
        if (!user?.id) {
          setLoading(false)
          return
        }

        // Fetch boards assigned to this employee using apiClient
        const boardsData = await apiClient.getBoards(user.id, 'employee') as any[]
        setBoards(boardsData || [])

        // Extract tasks from all boards
        const allTasks: Task[] = []
        boardsData?.forEach((board: any) => {
          board.lists?.forEach((list: any) => {
            list.cards?.forEach((card: any) => {
              const memberName = typeof card.members?.[0] === 'string' 
                ? card.members[0] 
                : card.members?.[0]?.name || ''
              const userFullName = `${user.name} ${user.surname || ''}`.trim()
              
              if (card.members?.includes(user.name) || 
                  card.members?.includes(userFullName) ||
                  memberName === user.name ||
                  memberName === userFullName) {
                allTasks.push({
                  id: card.id,
                  title: card.title,
                  dueDate: card.dueDate || '',
                  status: list.title.toLowerCase().includes('tamamlan') ? 'completed' :
                          list.title.toLowerCase().includes('devam') ? 'in_progress' : 'pending',
                  boardName: board.title,
                  boardId: board.id
                })
              }
            })
          })
        })
        setTasks(allTasks)
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
    } else {
      setLoading(false)
    }
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  const user = session?.user as any
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const completedTasks = tasks.filter(t => t.status === 'completed').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Merhaba, {user?.name} {user?.surname || ''}
              </h1>
              <p className="text-sm text-slate-400">{user?.position || 'Calisan'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white"
            onClick={() => signOut({ callbackUrl: '/tr/auth/login' })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cikis Yap
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Bekleyen</p>
                  <p className="text-3xl font-bold text-yellow-500">{pendingTasks}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Devam Eden</p>
                  <p className="text-3xl font-bold text-blue-500">{inProgressTasks}</p>
                </div>
                <Briefcase className="w-10 h-10 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Tamamlanan</p>
                  <p className="text-3xl font-bold text-green-500">{completedTasks}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Templates (Sablonlar) */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Atanan Sablonlar ({boards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Henuz atanan sablon yok</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boards.map((board) => (
                  <Link 
                    key={board.id}
                    href={`/tr/org/spektif/board/${board.id}`}
                  >
                    <div 
                      className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-slate-600"
                      style={{ backgroundColor: board.color || '#3B82F6' }}
                    >
                      <h3 className="text-white font-bold">{board.title}</h3>
                      <p className="text-white/70 text-sm">{board.description || 'Aciklama yok'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-white/50 text-xs">
                          {board.lists?.length || 0} liste
                        </p>
                        <p className="text-white/50 text-xs">
                          {board.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0} kart
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ListTodo className="w-5 h-5 mr-2" />
              Gorevlerim ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Henuz atanan gorev yok</p>
            ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tr/org/spektif/board/${task.boardId}`}
                >
                  <div 
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        <p className="text-sm text-slate-400">{task.boardName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {task.dueDate && (
                        <div className="flex items-center text-sm text-slate-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                      <Badge className={
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {task.status === 'completed' ? 'Tamamlandi' :
                         task.status === 'in_progress' ? 'Devam Ediyor' : 'Bekliyor'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

