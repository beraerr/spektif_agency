import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto, UpdateBoardDto, CreateListDto, UpdateListDto } from './dto/boards.dto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, userId: string) {
    // Check if user is member of organization
    const orgMember = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organizationId,
          userId,
        },
      },
    });

    if (!orgMember) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // For CLIENT role, only show boards they have access to via BoardMember
    if (orgMember.role === 'CLIENT') {
      return this.prisma.board.findMany({
        where: {
          organizationId,
          members: {
            some: {
              userId,
              role: 'CLIENT_VIEW',
            },
          },
        },
        include: {
          lists: {
            include: {
              cards: {
                where: {
                  // Only show cards where client is a member
                  members: {
                    some: {
                      userId,
                    },
                  },
                },
                include: {
                  members: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          // avatar: true, // Use name only for now
                        },
                      },
                    },
                  },
                  // attachments: true, // Field doesn't exist in current schema
                  comments: {
                    include: {
                      author: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { position: 'asc' },
              },
            },
            orderBy: { position: 'asc' },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  // avatar: true, // Use name only for now
                },
              },
            },
          },
          _count: {
            select: {
              lists: true,
            },
          },
        },
      });
    }

    // For other roles, show all boards they have access to
    return this.prisma.board.findMany({
      where: {
        organizationId,
        OR: [
          // Boards where user is a member
          {
            members: {
              some: {
                userId,
              },
            },
          },
          // For ADMIN and EMPLOYEE, also include boards without explicit membership
          ...(orgMember.role === 'ADMIN' || orgMember.role === 'EMPLOYEE'
            ? [{ organizationId }]
            : []),
        ],
      },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        // avatar: true, // Use name only for now
                      },
                    },
                  },
                },
                // attachments: true, // Field doesn't exist in current schema
                _count: {
                  select: {
                    comments: true,
                  },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
                        orderBy: { position: 'asc' },
        },
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
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });
  }

  async assignUserToBoard(boardId: string, userId: string, assignedBy: string) {
    // Check if the user assigning has permission
    const assignerOrgMember = await this.prisma.orgMember.findFirst({
      where: {
        userId: assignedBy,
        organization: {
          boards: {
            some: { id: boardId }
          }
        }
      }
    });

    if (!assignerOrgMember || assignerOrgMember.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can assign users to boards');
    }

    // Check if user is already assigned to board
    const existingAssignment = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: userId,
        },
      },
    });

    if (existingAssignment) {
      throw new ForbiddenException('User is already assigned to this board');
    }

    // Assign user to board
    return this.prisma.boardMember.create({
      data: {
        boardId: boardId,
        userId: userId,
        role: 'USER',
      },
    });
  }

  async findEmployeeBoards(organizationId: string, userId: string) {
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

    // For employees, only show boards they are explicitly assigned to as members
    return this.prisma.board.findMany({
      where: {
        organizationId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true,
                        avatar: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    comments: true,
                  },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
        lists: {
          include: {
            cards: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        // avatar: true, // Use name only for now
                      },
                    },
                  },
                },
                // attachments: true, // Field doesn't exist in current schema
                comments: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                  orderBy: { createdAt: 'asc' },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
                        orderBy: { position: 'asc' },
        },
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
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check access permissions
    const orgMember = (board as any).organization?.members?.find((member: any) => member.userId === userId);
    if (!orgMember) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: id,
          userId,
        },
      },
    });

    // CLIENT role needs explicit board access
    if (orgMember.role === 'CLIENT' && (!boardMember || boardMember.role !== 'CLIENT_VIEW')) {
      throw new ForbiddenException('No access to this board');
    }

    // Filter cards for CLIENT users
    if (orgMember.role === 'CLIENT' && (board as any).lists) {
      (board as any).lists = (board as any).lists.map((list: any) => ({
        ...list,
        cards: list.cards?.filter((card: any) =>
          card.members?.some((member: any) => member.userId === userId)
        ) || [],
      }));
    }

    return board;
  }

  async create(dto: CreateBoardDto, userId: string) {
    // Check if user can create boards in this organization
    const orgMember = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          organizationId: dto.organizationId,
          userId,
        },
      },
    });

    if (!orgMember || (orgMember.role !== 'ADMIN' && orgMember.role !== 'EMPLOYEE')) {
      throw new ForbiddenException('Not authorized to create boards');
    }

    const board = await this.prisma.board.create({
      data: {
        title: dto.title,
        description: dto.description,
        // color: dto.color, // Field doesn't exist in current schema
        organization: {
          connect: { id: dto.organizationId }
        },
        creator: {
          connect: { id: userId }
        },
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
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
      },
    });

    // Create default lists
    await this.prisma.list.createMany({
      data: [
        { boardId: board.id, title: 'Yapılacak', position: 1 },
        { boardId: board.id, title: 'Devam Ediyor', position: 2 },
        { boardId: board.id, title: 'Bitti', position: 3 },
      ],
    });

    return board;
  }

  async update(id: string, dto: UpdateBoardDto, userId: string) {
    // Check if user can update this board
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: id,
          userId,
        },
      },
    });

    if (!boardMember || boardMember.role === 'VIEWER') {
      throw new ForbiddenException('Not authorized to update this board');
    }

    return this.prisma.board.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    // Check if user can delete this board
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: id,
          userId,
        },
      },
    });

    if (!boardMember || boardMember.role !== 'ADMIN') {
      throw new ForbiddenException('Only board admins can delete boards');
    }

    await this.prisma.board.delete({
      where: { id },
    });

    return { message: 'Board deleted successfully' };
  }

  // List operations
  async createList(dto: CreateListDto, userId: string) {
    // Check board access
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: dto.boardId,
          userId,
        },
      },
    });

    if (!boardMember || boardMember.role === 'VIEWER') {
      throw new ForbiddenException('Not authorized to create lists');
    }

    // Get next order
    const lastList = await this.prisma.list.findFirst({
      where: { boardId: dto.boardId },
      orderBy: { position: 'desc' },
    });

    const nextOrder = lastList ? lastList.position + 1 : 1;

    return this.prisma.list.create({
      data: {
        boardId: dto.boardId,
        title: dto.title,
        position: nextOrder,
      },
    });
  }

  async updateList(listId: string, dto: UpdateListDto, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Check board access
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: list.boardId,
          userId,
        },
      },
    });

    if (!boardMember || boardMember.role === 'VIEWER') {
      throw new ForbiddenException('Not authorized to update lists');
    }

    return this.prisma.list.update({
      where: { id: listId },
      data: dto,
    });
  }

  async deleteList(listId: string, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Check board access
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: list.boardId,
          userId,
        },
      },
    });

    if (!boardMember || boardMember.role === 'VIEWER') {
      throw new ForbiddenException('Not authorized to delete lists');
    }

    await this.prisma.list.delete({
      where: { id: listId },
    });

    return { message: 'List deleted successfully' };
  }

  async reorderLists(boardId: string, listOrders: { id: string; position: number }[], userId: string) {
    // Check board access
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });

    if (!boardMember || boardMember.role === 'VIEWER') {
      throw new ForbiddenException('Not authorized to reorder lists');
    }

    // Update list orders in transaction
    await this.prisma.$transaction(
      listOrders.map(({ id, position }) =>
        this.prisma.list.update({
          where: { id },
          data: { position },
        })
      )
    );

    return { message: 'Lists reordered successfully' };
  }
}
