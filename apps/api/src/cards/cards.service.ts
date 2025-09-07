import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto, UpdateCardDto, MoveCardDto, AddCardMemberDto } from './dto/cards.dto';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(listId?: string, boardId?: string, userId?: string) {
    const where: any = {};

    if (listId) {
      where.listId = listId;
    }

    if (boardId) {
      where.list = { boardId };
    }

    // For regular users, only show cards they have access to
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          orgMembers: true,
        },
      });

      // CLIENT role sees only cards they are members of
      const isClient = user?.orgMembers.some(member => member.role === 'CLIENT');
      if (isClient) {
        where.members = {
          some: {
            userId,
          },
        };
      }
    }

    return this.prisma.card.findMany({
      where,
      include: {
        list: {
          include: {
            board: true,
          },
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
        // attachments: true // Field doesn't exist in current schema,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                // avatar: true // Use name only for now,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            comments: true,
            // attachments: true // Field doesn't exist in current schema
          },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
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
        // attachments: true // Field doesn't exist in current schema,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                // avatar: true // Use name only for now,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        // // creator: // Field not needed { // Field doesn't exist in current schema
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     // avatar: true // Use name only for now,
        //   },
        // },
        // conversation: // Field doesn't exist in current schema
        // {
        //   include: {
        //     messages: {
        //       take: 10,
        //       orderBy: { createdAt: 'desc' },
        //       include: {
        //         author: {
        //           select: {
        //             id: true,
        //             name: true,
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check access permissions
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (!orgMember) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // CLIENT role can only see cards they are members of
    if (orgMember?.role === 'CLIENT') {
      const isCardMember = (card as any).members.some(member => member.userId === userId);
      if (!isCardMember) {
        throw new ForbiddenException('No access to this card');
      }
    }

    return card;
  }

  async create(dto: CreateCardDto, userId: string) {
    // Check if user can create cards in this list/board
    const list = await this.prisma.list.findUnique({
      where: { id: dto.listId },
      include: {
        board: {
          include: {
            organization: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    const orgMember = list.board.organization.members[0];
    const boardMember = list.board.members[0];

    // Check permissions
    if (!orgMember || (orgMember?.role === 'CLIENT' && (!boardMember || boardMember.role !== 'CLIENT_VIEW'))) {
      throw new ForbiddenException('Not authorized to create cards');
    }

    // Get next order
    const lastCard = await this.prisma.card.findFirst({
      where: { listId: dto.listId },
      orderBy: { position: 'desc' },
    });

    const nextOrder = lastCard ? lastCard.position + 1 : 1;

    // Create card
    const card = await this.prisma.card.create({
      data: {
        listId: dto.listId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        // position: // Use order instead nextOrder,
        // createdBy: userId, // Field doesn't exist in current schema
        members: dto.memberIds ? {
          create: dto.memberIds.map(memberId => ({
            userId: memberId,
          })),
        } : undefined,
      },
      include: {
        list: {
          include: {
            board: true,
          },
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
        // // creator: // Field not needed { // Field doesn't exist in current schema
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     // avatar: true // Use name only for now,
        //   },
        // },
      },
    });

    // Create card thread conversation if it's a project card
    if ((card as any).members.length > 1) {
      await this.prisma.conversation.create({
        data: {
          organizationId: list.board.organization.id,
          type: 'CARD_THREAD',
          // title: `${card.title} - Kart Konuşması`, // Field doesn't exist in current schema
          // cardId: card.id, // Field doesn't exist in current schema
          participants: {
            create: [
              { userId, role: 'admin' },
              ...(card as any).members
                .filter(member => member.userId !== userId)
                .map(member => ({
                  userId: member.userId,
                  role: 'member',
                })),
            ],
          },
        },
      });
    }

    // TODO: Create notification for assigned members
    // TODO: Create activity log entry

    return card;
  }

  async update(id: string, dto: UpdateCardDto, userId: string) {
    const card = await this.findOne(id, userId);

    // Check if user can update this card
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT') {
      // Clients can only update cards they are members of and only certain fields
      const isCardMember = (card as any).members.some(member => member.userId === userId);
      if (!isCardMember) {
        throw new ForbiddenException('Cannot update this card');
      }

      // Restrict what clients can update
      const allowedFields = ['description'];
      const updateFields = Object.keys(dto);
      const hasRestrictedFields = updateFields.some(field => !allowedFields.includes(field));

      if (hasRestrictedFields) {
        throw new ForbiddenException('Clients can only update description');
      }
    }

    const updatedCard = await this.prisma.card.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        // archived: dto.archived, // Field doesn't exist in current schema
      },
      include: {
        list: {
          include: {
            board: true,
          },
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
        // attachments: true // Field doesn't exist in current schema,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                // avatar: true // Use name only for now,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // TODO: Create activity log entry
    // TODO: Send notifications for important changes

    return updatedCard;
  }

  async move(id: string, dto: MoveCardDto, userId: string) {
    const card = await this.findOne(id, userId);

    // Check permissions
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT') {
      throw new ForbiddenException('Clients cannot move cards');
    }

    // Verify target list exists and is in the same board
    const targetList = await this.prisma.list.findUnique({
      where: { id: dto.targetListId },
      include: {
        board: true,
      },
    });

    if (!targetList || targetList.board.id !== (card as any).list?.board?.id) {
      throw new ForbiddenException('Invalid target list');
    }

    // Move card
    const movedCard = await this.prisma.$transaction(async (prisma) => {
      // Update other cards in the target list
      if (dto.targetListId !== card.listId) {
        // Moving to different list
        await prisma.card.updateMany({
          where: {
            listId: dto.targetListId,
            // position: // Use order instead { gte: dto.newOrder },
          },
          data: {
            // position: // Use order instead { increment: 1 },
          },
        });

        // Update cards in the source list
        await prisma.card.updateMany({
          where: {
            listId: card.listId,
            position: { gt: card.position },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        // Moving within same list
        if (dto.newOrder > card.position) {
          // Moving down
          await prisma.card.updateMany({
            where: {
              listId: card.listId,
              position: { gt: card.position, lte: dto.newOrder },
            },
            data: {
              position: { decrement: 1 },
            },
          });
        } else {
          // Moving up
          await prisma.card.updateMany({
            where: {
              listId: card.listId,
              position: { gte: dto.newOrder, lt: card.position },
            },
            data: {
              position: { increment: 1 },
            },
          });
        }
      }

      // Update the moved card
      return prisma.card.update({
        where: { id },
        data: {
          listId: dto.targetListId,
          // position: // Use order instead dto.newOrder,
        },
        include: {
          list: {
            include: {
              board: true,
            },
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
    });

    // TODO: Create activity log entry
    // TODO: Send real-time update via WebSocket

    return movedCard;
  }

  async addMember(cardId: string, dto: AddCardMemberDto, userId: string) {
    const card = await this.findOne(cardId, userId);

    // Check permissions
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT') {
      throw new ForbiddenException('Clients cannot add members to cards');
    }

    // Check if member is already added
    const existingMember = await this.prisma.cardMember.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId: dto.userId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this card');
    }

    // Add member
    const cardMember = await this.prisma.cardMember.create({
      data: {
        cardId,
        userId: dto.userId,
      },
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
    });

    // Add to card conversation if exists
    // const conversation = await this.prisma.conversation.findUnique({
    //   where: { cardId }, // cardId field doesn't exist in Conversation model
    // });

    // if (conversation) {
    //   await this.prisma.participant.create({
    //     data: {
    //       conversationId: conversation.id,
    //       userId: dto.userId,
    //       role: 'member',
    //     },
    //   });
    // }

    // TODO: Create notification for new member
    // TODO: Create activity log entry

    return cardMember;
  }

  async removeMember(cardId: string, memberId: string, userId: string) {
    const card = await this.findOne(cardId, userId);

    // Check permissions
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT' && memberId !== userId) {
      throw new ForbiddenException('Clients can only remove themselves from cards');
    }

    // Remove member
    await this.prisma.cardMember.delete({
      where: {
        cardId_userId: {
          cardId,
          userId: memberId,
        },
      },
    });

    // Remove from card conversation if exists
    // const conversation = await this.prisma.conversation.findUnique({
    //   where: { cardId }, // cardId field doesn't exist in Conversation model
    // });

    // if (conversation) {
    //   await this.prisma.participant.deleteMany({
    //     where: {
    //       conversationId: conversation.id,
    //       userId: memberId,
    //     },
    //   });
    // }

    // TODO: Create activity log entry

    return { success: true };
  }

  async addComment(cardId: string, text: string, userId: string) {
    const card = await this.findOne(cardId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        cardId,
        authorId: userId,
        content: text,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            // avatar: true // Use name only for now,
          },
        },
      },
    });

    // TODO: Create notifications for card members
    // TODO: Create activity log entry

    return comment;
  }

  async getComments(cardId: string, userId: string) {
    await this.findOne(cardId, userId); // Check access

    return this.prisma.comment.findMany({
      where: { cardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            // avatar: true // Use name only for now,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string, userId: string) {
    const card = await this.findOne(id, userId);

    // Check permissions (only admins and card creator can delete)
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT' || (orgMember?.role !== 'ADMIN' && (card as any).createdBy !== userId)) {
      throw new ForbiddenException('Not authorized to delete this card');
    }

    // Delete card (cascade will handle relations)
    await this.prisma.card.delete({
      where: { id },
    });

    // TODO: Create activity log entry

    return { success: true };
  }

  async archive(id: string, userId: string) {
    const card = await this.findOne(id, userId);

    // Check permissions
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT') {
      throw new ForbiddenException('Clients cannot archive cards');
    }

    const archivedCard = await this.prisma.card.update({
      where: { id },
      data: { 
        // archived: true, // Field doesn't exist in current schema
        completed: true // Use completed field instead
      },
    });

    // TODO: Create activity log entry

    return archivedCard;
  }

  async unarchive(id: string, userId: string) {
    const card = await this.findOne(id, userId);

    // Check permissions
    const orgMember = (card as any).list?.board?.organization?.members?.[0];
    if (orgMember?.role === 'CLIENT') {
      throw new ForbiddenException('Clients cannot unarchive cards');
    }

    const unarchivedCard = await this.prisma.card.update({
      where: { id },
      data: { 
        // archived: false, // Field doesn't exist in current schema
        completed: false // Use completed field instead
      },
    });

    // TODO: Create activity log entry

    return unarchivedCard;
  }

  async getAvailableMembers(cardId: string, userId: string) {
    // Get the card and its board
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user has access to this card's board
    const boardMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: card.list.board.id,
          userId,
        },
      },
    });

    if (!boardMember) {
      throw new ForbiddenException('Not authorized to view this card');
    }

    // Get all members of the organization who are not already assigned to this card
    const availableMembers = await this.prisma.orgMember.findMany({
      where: {
        organizationId: card.list.board.organizationId,
        role: {
          in: ['EMPLOYEE', 'ADMIN']
        },
        user: {
          cardMembers: {
            none: {
              cardId: cardId
            }
          }
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
            avatar: true,
          },
        },
      },
    });

    return availableMembers.map(member => ({
      id: member.user.id,
      name: member.user.name,
      surname: member.user.surname,
      email: member.user.email,
      position: member.user.position,
      avatar: member.user.avatar,
    }));
  }
}
