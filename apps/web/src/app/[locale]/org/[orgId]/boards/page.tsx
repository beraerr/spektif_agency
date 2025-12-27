'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, Plus, Calendar, MessageSquare } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

export default function BoardsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const t = useTranslations()
  const { data: session } = useSession()
  const [boards, setBoards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [boardBackgrounds, setBoardBackgrounds] = useState<{[key: string]: string}>({})

  // Load saved backgrounds from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('boardBackgrounds')
    if (saved) {
      setBoardBackgrounds(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const user = session as any
        const userId = user?.user?.id || 'admin'
        
        // Use apiClient which handles emulator URLs correctly
        const data = await apiClient.getBoards(userId) as any[]
        setBoards(data)
        console.log('Workspace boards loaded:', data.length)
        
        // Load backgrounds from database
        const bgFromDb: {[key: string]: string} = {}
        data.forEach((board: any) => {
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

    if (session) {
      fetchBoards() // Initial fetch
      
      // Set up real-time updates every 60 seconds
      const interval = setInterval(fetchBoards, 60000)
      
      return () => clearInterval(interval)
    }
  }, [orgId, session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>Board'lar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card header-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Workspace Board'ları</h1>
            <p className="text-sm text-muted-foreground">
              Projelerinizi organize etmek için mevcut board'larınız
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Button onClick={() => router.push(`/${params.locale}/dashboard`)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Board
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
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
                <Link
                  key={board.id}
                  href={`/${params.locale}/org/${orgId}/board/${board.id}`}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative block"
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
                            className="w-8 h-8 rounded-full border-2 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-medium text-xs shadow-sm"
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
                </Link>
              )
            })}

            {boards.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Folder className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Henuz board bulunmuyor</h3>
                <p className="text-muted-foreground mb-4">
                  Ilk board'unuzu olusturarak baslayin
                </p>
                <Button onClick={() => router.push(`/${params.locale}/dashboard`)}>
                  <Folder className="w-4 h-4 mr-2" />
                  Yeni Board Olustur
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
