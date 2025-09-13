'use client'

import React, { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Upload, Link, FileText, Image, Video } from 'lucide-react'

interface AttachmentModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, displayText?: string) => void
  onAddLink: (url: string, displayText?: string) => void
}

interface RecentItem {
  id: string
  title: string
  type: 'board' | 'card' | 'template'
  subtitle: string
  timestamp: string
  icon: React.ReactNode
}

export function AttachmentModal({ isOpen, onClose, onUpload, onAddLink }: AttachmentModalProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload')
  const [linkUrl, setLinkUrl] = useState('')
  const [displayText, setDisplayText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentItems: RecentItem[] = [
    {
      id: '1',
      title: 'Follow up with unanswered Q&A',
      type: 'card',
      subtitle: 'Speaker guide for onli...',
      timestamp: 'Viewed 11 minutes ago',
      icon: <FileText className="w-4 h-4 text-blue-500" />
    },
    {
      id: '2',
      title: 'Speaker guide for online events',
      type: 'card',
      subtitle: 'Viewed 12 minutes ago',
      timestamp: 'Viewed 12 minutes ago',
      icon: <FileText className="w-4 h-4 text-blue-500" />
    },
    {
      id: '3',
      title: 'Kanban Template',
      type: 'template',
      subtitle: 'Trello Calendar',
      timestamp: 'Viewed 12 minutes ago',
      icon: <FileText className="w-4 h-4 text-green-500" />
    },
    {
      id: '4',
      title: 'This list has the List Limits Power-up e...',
      type: 'card',
      subtitle: 'Kanban Template',
      timestamp: 'Viewed 12 minutes ago',
      icon: <FileText className="w-4 h-4 text-blue-500" />
    },
    {
      id: '5',
      title: 'Design & Research',
      type: 'board',
      subtitle: 'Kanban Template',
      timestamp: 'Viewed 13 minutes ago',
      icon: <FileText className="w-4 h-4 text-purple-500" />
    }
  ]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // Upload file to backend
        const formData = new FormData()
        formData.append('file', file)
        formData.append('boardId', 'current-board-id') // This should be passed as prop
        formData.append('cardId', 'current-card-id') // This should be passed as prop
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${(session as any)?.backendToken}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          onUpload(file, displayText || result.originalName)
          onClose()
        } else {
          console.error('File upload failed')
        }
      } catch (error) {
        console.error('File upload error:', error)
      }
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      onUpload(file, displayText)
      onClose()
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      onAddLink(linkUrl, displayText)
      onClose()
    }
  }

  const selectRecentItem = (item: RecentItem) => {
    // This would typically create a link to the Trello item
    onAddLink(`https://trello.com/item/${item.id}`, item.title)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-gray-800 text-white border-gray-700">
        <DialogHeader className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Attach</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4">
          {/* Upload Section */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Attach a file from your computer</h3>
            <p className="text-sm text-gray-400 mb-3">You can also drag and drop files to upload them.</p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Choose a file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
              />
            </div>
          </div>

          {/* Link Section */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Search or paste a link</h3>
            <Input
              placeholder="Find recent links or paste a new link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 mb-2"
            />
            <Input
              placeholder="Text to display (optional)"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Recently Viewed */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Recently Viewed</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectRecentItem(item)}
                  className="flex items-start space-x-3 p-2 rounded hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                    <p className="text-xs text-gray-500">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddLink} 
              disabled={!linkUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              Insert
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}







