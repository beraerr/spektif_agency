#!/usr/bin/env node

/**
 * Data Migration Script: Railway PostgreSQL → Firebase Firestore
 */

const { PrismaClient } = require('@prisma/client')
const admin = require('firebase-admin')

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const prisma = new PrismaClient()

async function migrateData() {
  console.log('🔄 Starting data migration from Railway to Firebase...')
  
  try {
    // Migrate users
    console.log('📝 Migrating users...')
    const users = await prisma.user.findMany()
    for (const user of users) {
      await db.collection('users').doc(user.id).set({
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
    }
    console.log(`✅ Migrated ${users.length} users`)

    // Migrate organizations
    console.log('🏢 Migrating organizations...')
    const orgs = await prisma.organization.findMany({
      include: { members: true }
    })
    for (const org of orgs) {
      await db.collection('organizations').doc(org.id).set({
        name: org.name,
        description: org.description,
        members: org.members.map(m => m.userId),
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      })
    }
    console.log(`✅ Migrated ${orgs.length} organizations`)

    // Migrate boards
    console.log('📋 Migrating boards...')
    const boards = await prisma.board.findMany({
      include: {
        lists: {
          include: {
            cards: {
              include: {
                members: true,
                comments: true
              }
            }
          }
        }
      }
    })
    
    for (const board of boards) {
      // Create board
      await db.collection('boards').doc(board.id).set({
        title: board.title,
        description: board.description,
        organizationId: board.organizationId,
        members: board.members || [],
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      })

      // Migrate lists
      for (const list of board.lists) {
        await db.collection('boards').doc(board.id).collection('lists').doc(list.id).set({
          title: list.title,
          position: list.position,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })

        // Migrate cards
        for (const card of list.cards) {
          await db.collection('boards').doc(board.id).collection('cards').doc(card.id).set({
            title: card.title,
            description: card.description,
            dueDate: card.dueDate,
            position: card.position,
            listId: list.id,
            members: card.members?.map(m => m.userId) || [],
            comments: card.comments?.map(c => ({
              id: c.id,
              content: c.content,
              authorId: c.authorId,
              createdAt: c.createdAt,
            })) || [],
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
          })
        }
      }
    }
    console.log(`✅ Migrated ${boards.length} boards`)

    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

migrateData()
