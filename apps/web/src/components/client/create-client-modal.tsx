'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface CreateClientData {
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  password?: string
}

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientCreated: () => void
  organizationId: string
}

export function CreateClientModal({ 
  isOpen, 
  onClose, 
  onClientCreated, 
  organizationId 
}: CreateClientModalProps) {
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof CreateClientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      toast.error('İsim ve email zorunludur')
      return
    }

    try {
      setIsSubmitting(true)
      await apiClient.createClient(organizationId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
        password: formData.password || undefined
      })
      
      toast.success('Müşteri başarıyla oluşturuldu!')
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
        password: ''
      })
      onClientCreated()
      onClose()
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Müşteri oluşturulurken hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-background border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">İsim *</Label>
            <Input
              id="name"
              placeholder="Müşteri adı"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-background border-input"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="musteri@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-background border-input"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Şifre (Boş bırakılırsa otomatik oluşturulur)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Şifre"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              placeholder="+90 555 123 4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Şirket</Label>
            <Input
              id="company"
              placeholder="Şirket adı"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              placeholder="Adres bilgisi"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Input
              id="notes"
              placeholder="Müşteri notları"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

