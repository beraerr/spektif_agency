'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

interface CreateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onEmployeeCreated: () => void
  organizationId: string
}

interface CreateEmployeeData {
  email: string
  name: string
  surname: string
  position: string
  phone: string
  role: string
  password: string
}

export function CreateEmployeeModal({ 
  isOpen, 
  onClose, 
  onEmployeeCreated, 
  organizationId 
}: CreateEmployeeModalProps) {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    email: '',
    name: '',
    surname: '',
    position: '',
    phone: '',
    role: 'EMPLOYEE',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof CreateEmployeeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email || !formData.name || !formData.surname || !formData.position || !formData.phone) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    if (!formData.email.includes('@')) {
      toast.error('Geçerli bir email adresi girin')
      return
    }

    setIsLoading(true)

    try {
      const result = await apiClient.createEmployee(organizationId, formData) as any
      toast.success(`Çalışan başarıyla oluşturuldu! Geçici şifre: ${result.tempPassword}`)
      onEmployeeCreated()
      onClose()
      
      // Reset form
      setFormData({
        email: '',
        name: '',
        surname: '',
        position: '',
        phone: '',
        role: 'EMPLOYEE',
        password: ''
      })
    } catch (error: any) {
      console.error('Employee creation error:', error)
      toast.error(error?.response?.data?.message || 'Çalışan oluşturulurken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-background border-border">
        <DialogHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Yeni Çalışan Ekle
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@spektif.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="bg-background border-input"
            />
          </div>

          {/* Name and Surname */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad *</Label>
              <Input
                id="name"
                placeholder="Ahmet"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Soyad *</Label>
              <Input
                id="surname"
                placeholder="Yılmaz"
                value={formData.surname}
                onChange={(e) => handleInputChange('surname', e.target.value)}
                required
                className="bg-background border-input"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Pozisyon *</Label>
            <Input
              id="position"
              placeholder="Frontend Developer"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              required
              className="bg-background border-input"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              placeholder="+90 555 123 4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
              className="bg-background border-input"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Sifre (bos birakilirsa otomatik olusturulur)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sifre girin veya bos birakin"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Çalışan</SelectItem>
                <SelectItem value="ADMIN">Yönetici</SelectItem>
                <SelectItem value="ACCOUNTANT">Muhasebeci</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-brand-primary hover:bg-brand-accent text-black"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Çalışan Oluştur
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-6"
            >
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
