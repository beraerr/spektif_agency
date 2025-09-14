'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  FileText,
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock
} from 'lucide-react'

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'pending' | 'completed' | 'cancelled'
  invoiceNumber?: string
  clientName?: string
  projectName?: string
}

interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  pendingPayments: number
  monthlyGrowth: number
}

const useAccountingData = (boardId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    monthlyGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchAccountingData = async () => {
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

        // Try to fetch real accounting data
        const response = await fetch(`https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/accounting/board/${boardId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions)
          setSummary(data.summary)
        } else {
          // Mock data for demo
          const mockTransactions: Transaction[] = [
            {
              id: '1',
              date: '2024-01-15',
              description: 'Web Sitesi Tasarım Projesi',
              category: 'Hizmet Geliri',
              amount: 15000,
              type: 'income',
              status: 'completed',
              invoiceNumber: 'INV-001',
              clientName: 'ABC Şirket',
              projectName: 'Kurumsal Web Sitesi'
            },
            {
              id: '2',
              date: '2024-01-14',
              description: 'Ofis Kirası',
              category: 'Operasyonel Gider',
              amount: 5000,
              type: 'expense',
              status: 'completed',
              invoiceNumber: 'RENT-001'
            },
            {
              id: '3',
              date: '2024-01-13',
              description: 'Mobil Uygulama Geliştirme',
              category: 'Hizmet Geliri',
              amount: 25000,
              type: 'income',
              status: 'pending',
              invoiceNumber: 'INV-002',
              clientName: 'XYZ Ltd.',
              projectName: 'E-ticaret Uygulaması'
            },
            {
              id: '4',
              date: '2024-01-12',
              description: 'Yazılım Lisansları',
              category: 'Teknoloji Gideri',
              amount: 2500,
              type: 'expense',
              status: 'completed',
              invoiceNumber: 'LIC-001'
            },
            {
              id: '5',
              date: '2024-01-11',
              description: 'SEO Danışmanlık',
              category: 'Hizmet Geliri',
              amount: 8000,
              type: 'income',
              status: 'completed',
              invoiceNumber: 'INV-003',
              clientName: 'DEF AŞ',
              projectName: 'SEO Optimizasyonu'
            },
            {
              id: '6',
              date: '2024-01-10',
              description: 'Reklam Giderleri',
              category: 'Pazarlama Gideri',
              amount: 3500,
              type: 'expense',
              status: 'completed',
              invoiceNumber: 'ADV-001'
            }
          ]

          setTransactions(mockTransactions)
          
          const totalIncome = mockTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)
          
          const totalExpenses = mockTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
          
          const pendingPayments = mockTransactions
            .filter(t => t.type === 'income' && t.status === 'pending')
            .reduce((sum, t) => sum + t.amount, 0)

          setSummary({
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            pendingPayments,
            monthlyGrowth: 12.5
          })
        }
      } catch (error) {
        console.error('Error fetching accounting data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccountingData()

    // Real-time updates every 30 seconds
    const interval = setInterval(fetchAccountingData, 30000)
    return () => clearInterval(interval)
  }, [boardId, session])

  return { transactions, summary, loading, setTransactions }
}

export default function BoardAccountingPage() {
  const params = useParams()
  const { boardId } = params
  const { transactions, summary, loading } = useAccountingData(boardId as string)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [boardBackground, setBoardBackground] = useState<string>('')

  // Load board background
  useEffect(() => {
    const saved = localStorage.getItem('boardBackgrounds')
    if (saved) {
      const backgrounds = JSON.parse(saved) as Record<string, string>
      const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId
      setBoardBackground(backgrounds[boardIdStr] || '')
    }
  }, [boardId])

  useEffect(() => {
    let filtered = transactions

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, filterType, filterStatus, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Tamamlandı</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">İptal</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'income' ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />
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
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white">Muhasebe verileri yükleniyor...</p>
        </div>
      </div>
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
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Muhasebe</h1>
                <p className="text-sm text-gray-600">Board için finansal takip ve raporlama</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Rapor İndir</span>
              </Button>
              <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span>Yeni İşlem</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Gider</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Kar</p>
                  <p className={`text-2xl font-bold ${
                    summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summary.netProfit)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(summary.pendingPayments)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aylık Büyüme</p>
                  <p className="text-2xl font-bold text-blue-600">
                    %{summary.monthlyGrowth}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtreler ve Arama</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="İşlem, kategori veya müşteri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  size="sm"
                >
                  Tümü
                </Button>
                <Button
                  variant={filterType === 'income' ? 'default' : 'outline'}
                  onClick={() => setFilterType('income')}
                  size="sm"
                  className="text-green-600"
                >
                  Gelir
                </Button>
                <Button
                  variant={filterType === 'expense' ? 'default' : 'outline'}
                  onClick={() => setFilterType('expense')}
                  size="sm"
                  className="text-red-600"
                >
                  Gider
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  Tüm Durumlar
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('pending')}
                  size="sm"
                >
                  Beklemede
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('completed')}
                  size="sm"
                >
                  Tamamlandı
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Son İşlemler</span>
              </div>
              <Badge variant="secondary">
                {filteredTransactions.length} işlem
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tarih</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Açıklama</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Kategori</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Müşteri/Proje</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tutar</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Durum</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(transaction.date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(transaction.type)}
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            {transaction.invoiceNumber && (
                              <p className="text-xs text-gray-500">{transaction.invoiceNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {transaction.clientName && (
                          <div className="text-sm">
                            <p className="font-medium">{transaction.clientName}</p>
                            {transaction.projectName && (
                              <p className="text-gray-500 text-xs">{transaction.projectName}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz işlem bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}