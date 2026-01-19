/**
 * User, Employee, Client API Service
 */
import { BaseApiService } from './base-api'
import type { Employee, Client, Organization, CreateEmployeeDto, CreateClientDto } from '@/types'

export class UserService extends BaseApiService {
  // Organizations
  async getOrganizations(userId?: string): Promise<Organization[]> {
    if (userId) {
      return this.request<Organization[]>(`/getOrganizations?userId=${userId}`)
    }
    return this.request<Organization[]>('/getOrganizations')
  }

  // Employees
  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    return this.request<Employee>('/createEmployee', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getEmployees(organizationId: string): Promise<Employee[]> {
    return this.request<Employee[]>(`/getEmployees?organizationId=${organizationId}`)
  }

  async updateEmployee(organizationId: string, employeeId: string, data: Partial<CreateEmployeeDto>): Promise<Employee> {
    return this.request<Employee>('/updateEmployee', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: employeeId,
        ...data
      }),
    })
  }

  async deleteEmployee(organizationId: string, employeeId: string): Promise<void> {
    await this.request('/deleteEmployee', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: employeeId
      }),
    })
  }

  // Clients
  async getClients(organizationId: string): Promise<Client[]> {
    return this.request<Client[]>(`/getClients?organizationId=${organizationId}`)
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    return this.request<Client>('/createClient', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClient(organizationId: string, clientId: string, data: Partial<CreateClientDto & { status: string }>): Promise<Client> {
    return this.request<Client>('/updateClient', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: clientId,
        ...data
      }),
    })
  }

  async deleteClient(organizationId: string, clientId: string): Promise<void> {
    await this.request('/deleteClient', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        id: clientId
      }),
    })
  }
}

export const userService = new UserService()
