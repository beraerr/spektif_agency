#!/usr/bin/env node

/**
 * Firebase Setup Script for Spektif Agency
 * This script helps you set up Firebase Firestore for your project
 */

const fs = require('fs')
const path = require('path')

console.log('🔥 Firebase Setup for Spektif Agency')
console.log('=====================================\n')

// Step 1: Check if Firebase CLI is installed
console.log('1. Checking Firebase CLI...')
try {
  require('child_process').execSync('firebase --version', { stdio: 'pipe' })
  console.log('✅ Firebase CLI is installed')
} catch (error) {
  console.log('❌ Firebase CLI not found. Installing...')
  try {
    require('child_process').execSync('npm install -g firebase-tools', { stdio: 'inherit' })
    console.log('✅ Firebase CLI installed successfully')
  } catch (installError) {
    console.log('❌ Failed to install Firebase CLI. Please run: npm install -g firebase-tools')
    process.exit(1)
  }
}

// Step 2: Create Firebase configuration files
console.log('\n2. Creating Firebase configuration files...')

const firebaseConfig = {
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "apps/web/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}

fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2))
console.log('✅ Created firebase.json')

// Step 3: Create Firestore rules
const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Organizations: Members can read/write
    match /organizations/{orgId} {
      allow read, write: if request.auth != null 
        && request.auth.uid in resource.data.members;
    }
    
    // Boards: Organization members can read/write
    match /boards/{boardId} {
      allow read, write: if request.auth != null 
        && request.auth.uid in resource.data.members;
      
      // Cards: Board members can read/write
      match /cards/{cardId} {
        allow read, write: if request.auth != null 
          && request.auth.uid in get(/databases/$(database)/documents/boards/$(boardId)).data.members;
      }
      
      // Lists: Board members can read/write
      match /lists/{listId} {
        allow read, write: if request.auth != null 
          && request.auth.uid in get(/databases/$(database)/documents/boards/$(boardId)).data.members;
      }
    }
  }
}`

fs.writeFileSync('firestore.rules', firestoreRules)
console.log('✅ Created firestore.rules')

// Step 4: Create Firestore indexes
const firestoreIndexes = {
  "indexes": [
    {
      "collectionGroup": "cards",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "boardId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dueDate",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "boards",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "organizationId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}

fs.writeFileSync('firestore.indexes.json', JSON.stringify(firestoreIndexes, null, 2))
console.log('✅ Created firestore.indexes.json')

// Step 5: Create environment variables template
const envTemplate = `# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General

# Backend (Firebase Admin)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"

# Frontend (Firebase Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Keep existing variables
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=your-url
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
`

fs.writeFileSync('.env.firebase.template', envTemplate)
console.log('✅ Created .env.firebase.template')

// Step 6: Create package.json scripts
console.log('\n3. Adding Firebase scripts to package.json...')

const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

packageJson.scripts = {
  ...packageJson.scripts,
  "firebase:init": "firebase init",
  "firebase:login": "firebase login",
  "firebase:deploy": "firebase deploy",
  "firebase:emulators": "firebase emulators:start",
  "firebase:migrate": "node scripts/migrate-to-firebase.js"
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
console.log('✅ Added Firebase scripts to package.json')

// Step 7: Create migration script
const migrationScript = `#!/usr/bin/env node

/**
 * Data Migration Script: Railway PostgreSQL → Firebase Firestore
 */

const { PrismaClient } = require('@prisma/client')
const admin = require('firebase-admin')

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
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
    console.log(\`✅ Migrated \${users.length} users\`)

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
    console.log(\`✅ Migrated \${orgs.length} organizations\`)

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
    console.log(\`✅ Migrated \${boards.length} boards\`)

    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

migrateData()
`

fs.writeFileSync('scripts/migrate-to-firebase.js', migrationScript)
console.log('✅ Created migration script')

// Step 8: Instructions
console.log('\n🎯 Next Steps:')
console.log('==============')
console.log('1. Run: firebase login')
console.log('2. Run: firebase init')
console.log('3. Create a new Firebase project')
console.log('4. Copy .env.firebase.template to .env and fill in your values')
console.log('5. Install Firebase dependencies:')
console.log('   - Backend: cd apps/api && npm install firebase-admin')
console.log('   - Frontend: cd apps/web && npm install firebase')
console.log('6. Run migration: npm run firebase:migrate')
console.log('7. Test your app with Firebase!')
console.log('\n📚 Full documentation: .docs/FIREBASE_MIGRATION_PLAN.md')
console.log('\n🚀 Ready to make your app lightning fast!')
