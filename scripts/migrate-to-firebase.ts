#!/usr/bin/env ts-node

/**
 * Migration Script: Railway PostgreSQL → Firebase Firestore
 * This script migrates all data from your current Railway database to Firebase
 */

import { PrismaClient } from '@prisma/client'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
const serviceAccount = {
  projectId: 'spektif-agency-final-prod',
  clientEmail: 'firebase-adminsdk-fbsvc@spektif-agency-final-prod.iam.gserviceaccount.com',
  privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCe/whcdro7sDKA\ns3rEDM5j47I6nHPatwvCjE8+vkln4OZYgNjxbuczPBFdhFiIBxEonpwXr5b7c0M/\nlzfdutQi2q0UpoZQ1QiESLUhECNFeA2JcW+TOZLdTcP7FSrX7PvHFTfrkSjdr+gB\n1cGGrMJYP4DsRno+nBK4FNivUnfT28y9fwAMJH2bNWGGhi9YP9srcqsWiu+zrlVw\nhFe+OHWcfR8xYsQoJ0apR0Q7oVZzBRc4LoxG6Hi5ch5HxabxWDhNvyjHO/UyX1Ap\nntGuHb+hhJwvGj464F0vCi7WiZOmH2Q9cRBMYOPzS5exASIhS9cVSF6hb+palvOa\ndF4D7G3BAgMBAAECggEAD9YH/6mlp+9HQHFf72n1HpbduB/AHE8yASkXdYDfb9TD\nLJp8wSNSLNS1SBK3/KhziY+urV9EUvwqfQlzO4bxvRz5sz5Yz3FAfWh+ffINCUzJ\nUGC3g7ruyVMHC5mSoFoOw8f1v2VAZEAyhAhF08OeQcrlbOMiJt1FsgcFhATbQYMR\nG0QCKqz7iuxQoV9TX9TUBBrIyK/6VDuNjccGXKtIGxtLEngRj8mERKRmQMlJzjWb\nnD+DjjyOkOUQy4rlU8PmRDRoDhCLl6IaGnyTBT4dUlOYgB3j4ken2mqfSpQHG+Q8\nfSEYbkd31jAKQ0/uMXOY10YOVtE+vswYgqKkDXZNvwKBgQDcYwF5N8DegKk1EEM6\njOFhYJkAeyxxCnti7dWsM1i0tTC1V225WPGHo6MNke+Kw63ZrqNd7LuYa48Z/een\nYGfU+lSvqa1+RCyI2APCVhXX9PyV07xDWWFr93dSkonRPzm+GZuT+vXgroA3B2oT\nvr6iHmIcJp9zCg9Qxyf/5Ul37wKBgQC4sGn6k44HJ5LgwzXY9mxYdYmvLU+rYbA4\nXZkTIYvushov2zToncqUNWc7ic7faXngp0lDG9Uw4YU3wkLVrJ5XXCysgz8jfFbA\noOYfzaR2peMT6xGU++h5esae9X2GwOPymiJA/C4fB4ooqfmDtlm9kXbfynbUTOiI\nijBRpONFTwKBgD6N85sekiYVyvF+3jY+SrLDImqai7DCUudvrpikMmeIjnzKhiB3\n+IaRkfSGGcH/bNc+1KwSR+UpkoLEKP6/RHmVXHhH5zDR1Po6pkaA/M5BgXhdkzBi\nrF5i7YGIionUMmWdCyXjs+rEXSxBdICKQb3uddabt+KFVneNL/NYd5QNAoGAV6mM\ntB5DhMvY4Ixny7KznI01rAtizGMS5L4wgS8kH0k0OtDeXSdAV3a9qDnyEoMbEXH1\nyT+1wnzY4a14UbmccrTSk5O8bViASPBWKnROgu6cSQEDmGa1YqvPCPZW/ZYi3C0i\n4xuPvLS0dDaxsz3jfKJF/VU5b+2NVfnZk3cjVOsCgYEAs7wzSomAwxYLDgKD0XLD\nkUUqKc/Jbt8jWGbr7PFluZxfM9H0KjRrFRgOzB6hPIe1gL2+EjXz/4ABP3glt3dh\nCW7kO2Lf3fi+pkTq+7G/VbDjltUlcq2cyJ01TxL7hgWkWnOmwj79gnEJVwrC11+U\nMp2hNKPfBxMo/OR786RX0Bg=\n-----END PRIVATE KEY-----\n',
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'spektif-agency-final-prod.firebasestorage.app',
  })
}

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
      console.log(`  📋 Migrating board: ${board.title}`)
      
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
        console.log(`    📝 Migrating list: ${list.title}`)
        
        await db.collection('boards').doc(board.id).collection('lists').doc(list.id).set({
          title: list.title,
          position: list.position,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })

        // Migrate cards
        for (const card of list.cards) {
          console.log(`      🃏 Migrating card: ${card.title}`)
          
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
    console.log('📊 Summary:')
    console.log(`  - Users: ${users.length}`)
    console.log(`  - Organizations: ${orgs.length}`)
    console.log(`  - Boards: ${boards.length}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

migrateData()
