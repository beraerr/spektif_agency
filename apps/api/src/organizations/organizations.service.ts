import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteUserDto, CreateEmployeeDto } from './dto/organizations.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findUserOrganizations(userId: string) {
    const orgMembers = await this.prisma.orgMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                boards: true,
              },
            },
          },
        },
      },
    });

    return orgMembers.map((member) => ({
      id: member.organization.id,
      name: member.organization.name,
      role: member.role,
      memberCount: member.organization._count.members,
      boardCount: member.organization._count.boards,
      // subscriptionStatus: member.organization.subscriptionStatus, // Field doesn't exist in current schema
    }));
  }

  async findOne(id: string, userId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                // avatar: true // Use name only for now,
              },
            },
          },
        },
        boards: {
          include: {
            _count: {
              select: { lists: true },
            },
          },
        },
        subscriptions: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is member
    const isMember = organization.members?.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string) {
    // Check if user is admin
    const member = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update organization');
    }

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async inviteUser(organizationId: string, dto: InviteUserDto, inviterId: string) {
    // Check if inviter is admin
    const inviter = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId: inviterId,
        },
      },
    });

    if (!inviter || inviter.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can invite users');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Create user account (they'll need to set password later)
      user = await this.prisma.user.create({
        data: {
          name: dto.name || dto.email.split('@')[0],
          email: dto.email,
        },
      });
    }

    // Check if already member
    const existingMember = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member');
    }

    // Add to organization
    await this.prisma.orgMember.create({
      data: {
        organizationId: organizationId,
        userId: user.id,
        role: (dto.role as any) || 'EMPLOYEE',
      },
    });

    // TODO: Send invitation email

    return { message: 'User invited successfully' };
  }

  async createEmployee(organizationId: string, dto: CreateEmployeeDto, adminId: string) {
    // Check if admin
    const admin = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId: adminId,
        },
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create employees');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

    // Generate a temporary password (employee will need to change it on first login)
    const bcrypt = require('bcryptjs');
    const tempPassword = Math.random().toString(36).slice(-8); // 8 character random password
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create new employee user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        surname: dto.surname,
        position: dto.position,
        phone: dto.phone,
        password: hashedPassword,
        role: (dto.role as any) || 'EMPLOYEE',
      },
    });

    // Add to organization
    await this.prisma.orgMember.create({
      data: {
        organizationId: organizationId,
        userId: user.id,
        role: (dto.role as any) || 'EMPLOYEE',
      },
    });

    return {
      message: 'Employee created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        position: user.position,
        phone: user.phone,
        role: user.role,
      },
      tempPassword: tempPassword, // Send temporary password to admin
    };
  }

  async removeUser(organizationId: string, userId: string, adminId: string) {
    // Check if admin
    const admin = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId: adminId,
        },
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can remove users');
    }

    // Can't remove yourself if you're the only admin
    if (userId === adminId) {
      const adminCount = await this.prisma.orgMember.count({
        where: {
          organizationId: organizationId,
          role: 'ADMIN',
        },
      });

      if (adminCount === 1) {
        throw new ForbiddenException('Cannot remove the last admin');
      }
    }

    await this.prisma.orgMember.delete({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId,
        },
      },
    });

    return { message: 'User removed successfully' };
  }

  async updateUserRole(organizationId: string, userId: string, role: string, adminId: string) {
    // Check if admin
    const admin = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId: adminId,
        },
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update user roles');
    }

    return this.prisma.orgMember.update({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId,
        },
      },
      data: { role: role as any },
    });
  }

  async getEmployees(organizationId: string, userId: string) {
    // Check if user is member of organization
    const orgMember = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId: userId,
        },
      },
    });

    if (!orgMember) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // Get all employees in the organization
    const employees = await this.prisma.orgMember.findMany({
      where: {
        organizationId: organizationId,
        role: {
          in: ['EMPLOYEE', 'ADMIN']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            position: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      }
    });

    return employees.map(member => ({
      id: member.user.id,
      name: member.user.name,
      surname: member.user.surname,
      email: member.user.email,
      position: member.user.position,
      phone: member.user.phone,
      role: member.role,
      avatar: member.user.avatar,
      joinDate: member.user.createdAt,
    }));
  }
}
