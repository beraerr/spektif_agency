'use client'

import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react'
// Background is now handled by the layout

interface CalendarEvent {
  id: string
  title: string
  date: string
  boardTitle: string
  listTitle?: string
  labels?: Array<{ id: string; name: string; color: string }>
  description?: string
  isCompleted?: boolean
  priority?: 'low' | 'medium' | 'high'
}

interface DayTask {
  id: string
  title: string
  description?: string
  date: string
  type: 'deadline' | 'note' | 'task'
  completed: boolean
}

const useCardEvents = (orgId: string, boardId?: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [dayTasks, setDayTasks] = useState<DayTask[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  const fetchCardEvents = useCallback(async () => {
    try {
      let token = (session as any)?.user?.backendToken
      
      if (!token) {
        const loginApiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
          : (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://europe-west4-spektif-agency-final-prod.cloudfunctions.net')
        const loginResponse = await fetch(`${loginApiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@spektif.com', password: 'admin123' }),
        })
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          token = loginData.token
        }
      }

      if (boardId) {
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
          : (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://europe-west4-spektif-agency-final-prod.cloudfunctions.net')
        const cardsResponse = await fetch(`${apiUrl}/getCards?boardId=${boardId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json()
          const calendarEvents: CalendarEvent[] = cardsData
            .filter((card: any) => card.dueDate)
            .map((card: any) => ({
              id: card.id,
              title: card.title,
              date: card.dueDate,
              boardTitle: card.list?.board?.title || 'Unknown Board',
              listTitle: card.list?.title,
              labels: card.labels || [],
              description: card.description,
              isCompleted: card.isCompleted || false,
              priority: card.priority || 'medium'
            }))
          
          setEvents(calendarEvents)
        }
      }

      // Load day tasks from localStorage for now
      const savedTasks = localStorage.getItem(`dayTasks_${boardId}`)
      if (savedTasks) {
        setDayTasks(JSON.parse(savedTasks))
      }
    } catch (error) {
      console.error('Error fetching card events:', error)
    } finally {
      setLoading(false)
    }
  }, [orgId, boardId, session])

  useEffect(() => {
    fetchCardEvents()
    const interval = setInterval(fetchCardEvents, 10000)
    return () => clearInterval(interval)
  }, [fetchCardEvents])

  const addDayTask = (task: DayTask) => {
    const newTasks = [...dayTasks, task]
    setDayTasks(newTasks)
    localStorage.setItem(`dayTasks_${boardId}`, JSON.stringify(newTasks))
  }

  const updateDayTask = (taskId: string, updates: Partial<DayTask>) => {
    const newTasks = dayTasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    )
    setDayTasks(newTasks)
    localStorage.setItem(`dayTasks_${boardId}`, JSON.stringify(newTasks))
  }

  const deleteDayTask = (taskId: string) => {
    const newTasks = dayTasks.filter(task => task.id !== taskId)
    setDayTasks(newTasks)
    localStorage.setItem(`dayTasks_${boardId}`, JSON.stringify(newTasks))
  }

  return { events, dayTasks, loading, refetch: fetchCardEvents, addDayTask, updateDayTask, deleteDayTask }
}

export default function BoardCalendarPage() {
  const params = useParams()
  const { orgId, boardId } = params
  const { events, dayTasks, loading, addDayTask, updateDayTask, deleteDayTask } = useCardEvents(orgId as string, boardId as string)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskType, setNewTaskType] = useState<'deadline' | 'note' | 'task'>('task')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  // Background is handled by layout

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1)
    } else {
      newDate.setMonth(currentMonth + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const cardEvents = events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
    
    const taskEvents = dayTasks.filter(task => task.date === dateStr)
    
    return { cardEvents, taskEvents }
  }

  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const firstDayWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    // Previous month's trailing days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, -i)
      days.push({ day: prevDate.getDate(), isCurrentMonth: false, date: prevDate })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true, date: new Date(currentYear, currentMonth, day) })
    }
    
    // Next month's leading days to fill the grid
    const totalCells = Math.ceil(days.length / 7) * 7
    let nextDay = 1
    while (days.length < totalCells) {
      days.push({ day: nextDay, isCurrentMonth: false, date: new Date(currentYear, currentMonth + 1, nextDay) })
      nextDay++
    }
    
    return days
  }

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDay(dateStr)
    setShowAddTask(true)
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedDay) return

    const newTask: DayTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      date: selectedDay,
      type: newTaskType,
      completed: false
    }

    addDayTask(newTask)
    setNewTaskTitle('')
    setNewTaskDescription('')
    setShowAddTask(false)
    setSelectedDay(null)
  }

  const isOverdue = (date: string) => {
    return new Date(date) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white">Planner yukleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      
      {/* Trello-style header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-4 sticky top-0">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-white">Planner</h1>
                <Badge variant="outline" className="text-xs border-white/30 text-white bg-white/10">
                  {events.length} kart planlandı
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} className="text-white hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center text-white">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} className="text-white hover:bg-white/10">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Bugün
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Trello Dark Style - FULL WIDTH */}
      <div className="relative z-10 w-full p-4 pb-24">
        <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {dayNames.map(day => (
              <div key={day} className="p-5 text-center text-base font-semibold text-white/90 border-r border-white/10 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((dayObj, index) => {
              const { cardEvents, taskEvents } = dayObj.isCurrentMonth ? getEventsForDay(dayObj.day) : { cardEvents: [], taskEvents: [] }
              const isToday = today.getDate() === dayObj.day && 
                             today.getMonth() === currentMonth && 
                             today.getFullYear() === currentYear &&
                             dayObj.isCurrentMonth

              return (
                <div
                  key={index}
                  className={`min-h-[160px] p-4 border-r border-b border-white/10 last:border-r-0 cursor-pointer transition-all duration-200 ${
                    !dayObj.isCurrentMonth 
                      ? 'bg-black/10 text-white/40' 
                      : 'hover:bg-white/5 text-white'
                  }`}
                  onClick={() => handleDayClick(dayObj.day, dayObj.isCurrentMonth)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isToday 
                        ? 'bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold' 
                        : dayObj.isCurrentMonth 
                          ? 'text-white' 
                          : 'text-white/40'
                    }`}>
                      {dayObj.day}
                    </span>
                    {(cardEvents.length > 0 || taskEvents.length > 0) && (
                      <span className="text-xs text-white/60 bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">
                        {cardEvents.length + taskEvents.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Card Events */}
                  <div className="space-y-1">
                    {cardEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`p-1.5 rounded text-xs text-white shadow-sm transition-all hover:scale-105 ${
                          event.isCompleted 
                            ? 'bg-green-500/80' 
                            : isOverdue(event.date)
                              ? 'bg-red-500/80'
                              : 'bg-blue-500/80'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          {event.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                          {isOverdue(event.date) && !event.isCompleted && <AlertCircle className="w-3 h-3" />}
                          <span className="truncate flex-1 font-medium">{event.title}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Day Tasks */}
                    {taskEvents.slice(0, 3 - cardEvents.length).map(task => (
                      <div
                        key={task.id}
                        className={`p-1.5 rounded text-xs border transition-all hover:scale-105 ${
                          task.completed 
                            ? 'bg-green-500/20 border-green-400/30 text-green-300 line-through' 
                            : task.type === 'deadline'
                              ? 'bg-red-500/20 border-red-400/30 text-red-300'
                              : task.type === 'note'
                                ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
                                : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          {task.type === 'deadline' && <Clock className="w-3 h-3" />}
                          <span className="truncate flex-1 font-medium">{task.title}</span>
                        </div>
                      </div>
                    ))}
                    
                    {(cardEvents.length + taskEvents.length) > 3 && (
                      <div className="text-xs text-white/60 text-center py-1 bg-white/5 rounded">
                        +{(cardEvents.length + taskEvents.length) - 3} daha
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && selectedDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowAddTask(false)}>
          <Card className="w-full max-w-md bg-slate-800 border-slate-700" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {new Date(selectedDay).toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'long' 
                  })} için Yeni Öğe
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddTask(false)} className="text-white hover:bg-slate-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-white">Tür</label>
                  <div className="flex space-x-2">
                    {[
                      { value: 'task', label: 'Görev', color: 'blue' },
                      { value: 'deadline', label: 'Deadline', color: 'red' },
                      { value: 'note', label: 'Not', color: 'yellow' }
                    ].map(type => (
                      <Button
                        key={type.value}
                        variant={newTaskType === type.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTaskType(type.value as any)}
                        className={newTaskType === type.value 
                          ? `bg-${type.color}-600 text-white border-${type.color}-600` 
                          : 'border-slate-600 text-white hover:bg-slate-700'
                        }
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-white">Başlık</label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Başlık yazın..."
                    className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-white">Açıklama (İsteğe bağlı)</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Açıklama yazın..."
                    rows={3}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button 
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddTask(false)}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}