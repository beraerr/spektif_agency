'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { CheckSquare, Clock, Users, MoreHorizontal, X, Plus } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  assignee?: string
  dueDate?: string
}

interface ChecklistManagerProps {
  items: ChecklistItem[]
  onItemsChange: (items: ChecklistItem[]) => void
  onDelete: () => void
}

export function ChecklistManager({ items, onItemsChange, onDelete }: ChecklistManagerProps) {
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [hideCompleted, setHideCompleted] = useState(false)

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const visibleItems = hideCompleted ? items.filter(item => !item.completed) : items

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    )
    onItemsChange(updatedItems)
  }

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText,
        completed: false
      }
      onItemsChange([...items, newItem])
      setNewItemText('')
      setIsAddingItem(false)
    }
  }

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    onItemsChange(updatedItems)
  }

  const updateItemText = (id: string, text: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, text } : item
    )
    onItemsChange(updatedItems)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Checklist</h3>
          {totalCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHideCompleted(!hideCompleted)}
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {hideCompleted ? 'Show' : 'Hide'} checked items
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{progressPercentage}%</span>
            <span className="text-gray-500 dark:text-gray-500">
              {completedCount} of {totalCount} complete
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-gray-200 dark:bg-gray-700"
          />
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <ChecklistItemComponent
            key={item.id}
            item={item}
            onToggle={() => toggleItem(item.id)}
            onDelete={() => deleteItem(item.id)}
            onUpdateText={(text) => updateItemText(item.id, text)}
          />
        ))}
      </div>

      {/* Add New Item */}
      {isAddingItem ? (
        <div className="space-y-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add an item"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addItem()
              if (e.key === 'Escape') {
                setIsAddingItem(false)
                setNewItemText('')
              }
            }}
            autoFocus
          />
          <div className="flex space-x-2">
            <Button size="sm" onClick={addItem} disabled={!newItemText.trim()}>
              Add
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsAddingItem(false)
                setNewItemText('')
              }}
            >
              Cancel
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto">
              <Users className="w-4 h-4 mr-1" />
              Assign
            </Button>
            <Button variant="ghost" size="sm">
              <Clock className="w-4 h-4 mr-1" />
              Due date
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setIsAddingItem(true)}
          className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add an item
        </Button>
      )}
    </div>
  )
}

interface ChecklistItemComponentProps {
  item: ChecklistItem
  onToggle: () => void
  onDelete: () => void
  onUpdateText: (text: string) => void
}

function ChecklistItemComponent({ item, onToggle, onDelete, onUpdateText }: ChecklistItemComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)

  const saveEdit = () => {
    onUpdateText(editText)
    setIsEditing(false)
  }

  return (
    <div className={`flex items-start space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group ${
      item.completed ? 'opacity-75' : ''
    }`}>
      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') {
                setEditText(item.text)
                setIsEditing(false)
              }
            }}
            onBlur={saveEdit}
            className="text-sm h-auto py-1 px-2"
            autoFocus
          />
        ) : (
          <span
            className={`text-sm cursor-pointer block ${
              item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
            }`}
            onClick={() => setIsEditing(true)}
          >
            {item.text}
          </span>
        )}
        
        {item.assignee && (
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">{item.assignee}</span>
            </div>
          </div>
        )}
        
        {item.dueDate && (
          <div className="flex items-center space-x-1 mt-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{item.dueDate}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        >
          <X className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}











