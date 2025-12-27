'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Edit, Check } from 'lucide-react'

interface Label {
  id: string
  name: string
  color: string
  selected: boolean
}

interface LabelsModalProps {
  isOpen: boolean
  onClose: () => void
  currentLabels: string[]
  onSave: (labels: string[]) => void
}

export function LabelsModal({ isOpen, onClose, currentLabels, onSave }: LabelsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [labels, setLabels] = useState<Label[]>([
    { id: '1', name: 'PRO LEVEL', color: 'bg-green-600', selected: currentLabels.includes('PRO LEVEL') },
    { id: '2', name: 'IMPORTANT', color: 'bg-red-600', selected: currentLabels.includes('IMPORTANT') },
    { id: '3', name: 'GOOD TO DO', color: 'bg-blue-600', selected: currentLabels.includes('GOOD TO DO') },
    { id: '4', name: 'Priority', color: 'bg-red-500', selected: currentLabels.includes('Priority') },
    { id: '5', name: 'Design', color: 'bg-purple-500', selected: currentLabels.includes('Design') },
    { id: '6', name: 'Strategy', color: 'bg-blue-500', selected: currentLabels.includes('Strategy') },
    { id: '7', name: 'Research', color: 'bg-green-500', selected: currentLabels.includes('Research') },
    { id: '8', name: 'Review', color: 'bg-orange-500', selected: currentLabels.includes('Review') },
    { id: '9', name: 'Proje', color: 'bg-indigo-500', selected: currentLabels.includes('Proje') },
  ])
  const [colorblindMode, setColorblindMode] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleLabel = (labelId: string) => {
    setLabels(labels.map(label =>
      label.id === labelId ? { ...label, selected: !label.selected } : label
    ))
  }

  const startEditing = (label: Label) => {
    setEditingLabel(label.id)
    setEditText(label.name)
  }

  const saveEdit = (labelId: string) => {
    setLabels(labels.map(label =>
      label.id === labelId ? { ...label, name: editText } : label
    ))
    setEditingLabel(null)
    setEditText('')
  }

  const handleSave = () => {
    const selectedLabels = labels.filter(label => label.selected).map(label => label.name)
    onSave(selectedLabels)
    onClose()
  }

  const createNewLabel = () => {
    // This would typically open a new label creation modal
    console.log('Create new label')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-0 bg-gray-800 text-white border-gray-700">
        <DialogHeader className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Labels</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4">
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Labels List */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 mb-2">Labels</p>
            <div className="space-y-1">
              {filteredLabels.map((label) => (
                <div key={label.id} className="flex items-center space-x-2 group">
                  <Checkbox
                    checked={label.selected}
                    onCheckedChange={() => toggleLabel(label.id)}
                    className="border-gray-600"
                  />
                  <div className="flex-1 flex items-center space-x-2">
                    {editingLabel === label.id ? (
                      <div className="flex items-center space-x-1 flex-1">
                        <div className={`w-4 h-2 rounded ${label.color}`} />
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white text-sm h-6 flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(label.id)
                            if (e.key === 'Escape') setEditingLabel(null)
                          }}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(label.id)}
                          className="text-white hover:bg-gray-700 h-6 w-6 p-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center space-x-2 flex-1 px-2 py-1 rounded cursor-pointer ${label.color} text-white`}
                        onClick={() => toggleLabel(label.id)}
                      >
                        <span className="text-sm font-medium">{label.name}</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(label)}
                      className="text-white hover:bg-gray-700 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Label */}
          <Button
            variant="ghost"
            onClick={createNewLabel}
            className="w-full justify-start text-gray-300 hover:bg-gray-700 mb-4"
          >
            Create a new label
          </Button>

          {/* Colorblind Mode */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={colorblindMode}
                onCheckedChange={(checked) => setColorblindMode(checked === true)}
                className="border-gray-600"
              />
              <span className="text-sm text-gray-300">Enable colorblind friendly mode</span>
            </div>
          </div>

          {/* Apply Button */}
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}




