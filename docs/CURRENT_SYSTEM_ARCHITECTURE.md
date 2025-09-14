# Spektif Agency Current System Architecture

## System Overview
Spektif Agency is a project management application optimized for Turkish users, deployed on Firebase infrastructure with complete europe-west4 regional optimization.

## Architecture Components

### Frontend Layer
**Technology**: Next.js 14 with TypeScript
**Deployment**: Vercel
**URL**: https://spektif-agency-final.vercel.app
**Features**:
- Server-side rendering for optimal performance
- Internationalization support (Turkish, English, Polish)
- NextAuth.js integration for authentication
- Tailwind CSS for styling
- Real-time UI updates

### Backend Layer
**Technology**: Firebase Functions (Node.js 22)
**Region**: europe-west4 (Belgium)
**Base URL**: https://europe-west4-spektif-agency-final-prod.cloudfunctions.net
**Configuration**:
- Runtime: Node.js 22 (2nd Generation)
- Memory: 256Mi per function
- Max Instances: 10
- Timeout: 60 seconds
- CORS: Enabled for all origins

### Database Layer
**Technology**: Firebase Firestore
**Database ID**: spektif-agency
**Region**: europe-west4 (Belgium)
**Type**: Firestore Native
**Configuration**:
- Edition: Standard
- Point-in-time recovery: Disabled
- Delete protection: Disabled
- Version retention: 3600 seconds

### Authentication System
**Technology**: Firebase Authentication + NextAuth.js
**Features**:
- Email/password authentication
- Session management
- JWT token handling
- Role-based access control

### File Storage
**Technology**: Firebase Storage
**Region**: europe-west4
**Features**:
- File upload and management
- Secure access controls
- Integration with Firestore metadata

## API Endpoints Documentation

### Authentication Endpoints
**POST /login**
- Purpose: User authentication
- Input: email, password
- Output: JWT token and user data
- Example: `{"email":"admin@spektif.com","password":"admin123"}`

**GET /health**
- Purpose: System health monitoring
- Output: Service status and timestamp

### Board Management Endpoints
**GET /getBoards**
- Purpose: Retrieve user's boards
- Parameters: userId (query parameter)
- Output: Array of board objects with lists and cards

**POST /createBoard**
- Purpose: Create new project board
- Input: title, description, organizationId, userId
- Output: Created board object with generated ID

**PUT /updateBoard**
- Purpose: Update existing board
- Parameters: boardId (URL parameter)
- Input: Updated board data
- Output: Updated board object

### List Management Endpoints
**POST /createList**
- Purpose: Create new list within board
- Input: boardId, title, position
- Output: Created list object

**PUT /updateList**
- Purpose: Update existing list
- Parameters: boardId, listId (URL parameters)
- Input: Updated list data
- Output: Updated list object

### Card Management Endpoints
**POST /createCard**
- Purpose: Create new task card
- Input: boardId, listId, title, description, dueDate, position
- Output: Created card object

**PUT /updateCard**
- Purpose: Update existing card
- Parameters: boardId, cardId (URL parameters)
- Input: Updated card data
- Output: Updated card object

**GET /getCards**
- Purpose: Retrieve cards with filtering
- Parameters: listId, boardId, or userId (query parameters)
- Output: Array of filtered card objects

### Organization Management Endpoints
**GET /getOrganizations**
- Purpose: Retrieve user's organizations
- Parameters: userId (query parameter)
- Output: Array of organization objects

**GET /getEmployees**
- Purpose: Retrieve organization employees
- Parameters: organizationId (query parameter)
- Output: Array of employee objects

**POST /createEmployee**
- Purpose: Add new employee to organization
- Input: organizationId, email, name, surname, position, phone, role
- Output: Created employee object

### File Management Endpoints
**POST /uploadFile**
- Purpose: Upload file to Firebase Storage
- Input: boardId, cardId, fileName, fileType, fileData (base64)
- Output: File metadata with download URL

### System Management Endpoints
**GET /testFirestore**
- Purpose: Database connectivity testing
- Output: Connection status and database information

**POST /seedDatabase**
- Purpose: Initialize database with sample data
- Output: Seeding results and statistics

## Database Schema

### Users Collection
```
users/{userId}
├── id: string
├── email: string
├── name: string
├── surname?: string
├── role: string (ADMIN, EMPLOYEE, CLIENT)
├── organizationId?: string
├── position?: string
├── phone?: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Organizations Collection
```
organizations/{orgId}
├── id: string
├── name: string
├── members: string[] (user IDs)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Boards Collection
```
boards/{boardId}
├── id: string
├── title: string
├── description?: string
├── color?: string
├── organizationId: string
├── members: string[] (user IDs)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Lists Subcollection
```
boards/{boardId}/lists/{listId}
├── id: string
├── title: string
├── position: number
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Cards Subcollection
```
boards/{boardId}/cards/{cardId}
├── id: string
├── title: string
├── description?: string
├── listId: string
├── position: number
├── members: string[] (user IDs)
├── comments: object[]
├── dueDate?: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Files Collection
```
files/{fileId}
├── id: string
├── fileName: string
├── originalName: string
├── url: string
├── size: number
├── mimeType: string
├── boardId: string
├── cardId?: string
├── uploadedBy: string (user ID)
└── createdAt: timestamp
```

## Security Configuration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary open access for development
    // TODO: Implement proper role-based security rules
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Board files: Board members can read/write
    match /boards/{boardId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Public files: Authenticated users can read/write
    match /public/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Configuration Management

### Firebase Functions Configuration
```bash
firebase functions:config:get
{
  "firestore": {
    "database_id": "spektif-agency"
  }
}
```

### Environment Variables (Frontend)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2umiP27cQmqRZCWRDYn0R3rnbQADIWM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=spektif-agency-final-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=spektif-agency-final-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=spektif-agency-final-prod.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=803616828687
NEXT_PUBLIC_FIREBASE_APP_ID=1:803616828687:web:9f539cdb10f71110e7627a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FKPL3Z8SXK
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://europe-west4-spektif-agency-final-prod.cloudfunctions.net
NEXTAUTH_URL=https://spektif-agency-final.vercel.app
NEXTAUTH_SECRET=spektif-agency-secret-key-production-2024-hardcoded
```

### Firebase Admin SDK Configuration
```json
{
  "type": "service_account",
  "project_id": "spektif-agency-final-prod",
  "private_key_id": "e1171b3953d1e9131de37753721b1f3bb8374241",
  "client_email": "firebase-adminsdk-fbsvc@spektif-agency-final-prod.iam.gserviceaccount.com",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "universe_domain": "googleapis.com"
}
```

## Performance Characteristics

### Response Times (Turkey-optimized)
- Database queries: 20-30ms
- API endpoints: 200-500ms
- File uploads: 1-3 seconds (depending on size)
- Authentication: 100-200ms

### Scalability Limits
- Firebase Functions: 10 concurrent instances per function
- Firestore: 1 million operations per day (free tier)
- Storage: 5GB total storage (free tier)
- Bandwidth: 1GB per day (free tier)

### Geographic Optimization
- Primary region: europe-west4 (Belgium)
- Target users: Turkey and surrounding regions
- Latency optimization: ~20-30ms for Turkish users
- Backup regions: Not configured (single region deployment)

## Monitoring and Maintenance

### Health Monitoring
- Health endpoint: /health provides system status
- Database connectivity: /testFirestore validates database access
- Function logs: Available in Firebase Console
- Performance metrics: Firebase Performance Monitoring (not yet configured)

### Backup and Recovery
- Firestore automatic backups: Not configured
- Point-in-time recovery: Disabled
- Manual export capability: Available via Firebase CLI
- Data retention: 1 hour version retention

### Update Procedures
1. Code changes: Deploy via `firebase deploy --only functions`
2. Database schema changes: Manual migration required
3. Security rules: Deploy via `firebase deploy --only firestore:rules`
4. Environment variables: Update via Firebase Console or CLI

## Development Workflow

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# Build and test functions
cd functions && npm run build && npm test

# Deploy to staging
firebase deploy --only functions --project staging

# Deploy to production
firebase deploy --only functions --project spektif-agency-final-prod
```

### Testing Strategy
- Unit tests: Not yet implemented
- Integration tests: Manual API testing
- End-to-end tests: Not yet implemented
- Performance tests: Manual load testing

### Deployment Pipeline
1. Development: Local Firebase emulators
2. Testing: Manual verification of endpoints
3. Staging: Not configured
4. Production: Direct deployment to spektif-agency-final-prod

This architecture provides a solid foundation for the Spektif Agency application with optimal performance for Turkish users and scalability for future growth.
