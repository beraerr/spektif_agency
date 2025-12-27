'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  ListTodo
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface Task {
  id: string
  title: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed'
  boardName: string
}

export default function EmployeeDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/tr/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    // Load employee's tasks
    const loadTasks = async () => {
      try {
        // For now, use mock data
        setTasks([
          {
            id: '1',
            title: 'Homepage tasarimini tamamla',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'in_progress',
            boardName: 'Web Sitesi Projesi'
          },
          {
            id: '2',
            title: 'API entegrasyonu',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
            status: 'pending',
            boardName: 'Web Sitesi Projesi'
          },
          {
            id: '3',
            title: 'Test dokumantasyonu',
            dueDate: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            boardName: 'Web Sitesi Projesi'
          }
        ])
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      loadTasks()
    }
  }, [session])

  if (status === 'loading' || loading) {
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

        {/* Tasks */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ListTodo className="w-5 h-5 mr-2" />
              Gorevlerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
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
                    <div className="flex items-center text-sm text-slate-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                    </div>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

