/**
 * User and organization-related types
 */

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'ACCOUNTANT'
export type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'CLIENT_VIEW'

// User Entity
export interface User {
  id: string
  email: string
  name: string
  surname?: string
  role: UserRole
  position?: string
  company?: string
  organizationId?: string
  image?: string
  createdAt?: string
  updatedAt?: string
}

// Employee (extends User concept)
export interface Employee {
  id: string
  email: string
  name: string
  surname: string
  position: string
  phone?: string
  role: UserRole
  organizationId: string
  createdAt?: string
  updatedAt?: string
}

// Client Entity
export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  status: 'active' | 'inactive'
  organizationId: string
  createdAt?: string
  updatedAt?: string
}

// Organization Entity
export interface Organization {
  id: string
  name: string
  slug?: string
  description?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}
