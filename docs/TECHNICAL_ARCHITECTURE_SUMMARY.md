# Technical Architecture Summary

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Database      │
│   (Next.js)     │◄──►│   (Firebase      │◄──►│   (Firestore)   │
│   Vercel        │    │   Functions)     │    │   EU4           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components + shadcn/ui
- **State Management**: React hooks + Context
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 22
- **Framework**: Firebase Functions (2nd Gen)
- **Language**: TypeScript
- **API**: REST endpoints
- **Authentication**: Firebase Admin SDK
- **Deployment**: Firebase

### Database
- **Type**: NoSQL Document Database
- **Service**: Firestore
- **Region**: europe-west4 (EU4)
- **Database ID**: `spektif`
- **Collections**: boards, users, organizations, clients

## 📁 Project Structure

```
spektif_agency/
├── apps/
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/                  # App Router
│       │   │   ├── [locale]/         # Internationalization
│       │   │   │   ├── dashboard/    # Main dashboard
│       │   │   │   ├── auth/         # Authentication pages
│       │   │   │   └── org/          # Organization pages
│       │   │   │       └── [orgId]/  # Organization-specific
│       │   │   │           └── board/ # Board pages
│       │   │   │               └── [boardId]/
│       │   │   │                   ├── page.tsx      # Main board
│       │   │   │                   ├── chat/         # Chat page
│       │   │   │                   ├── calendar/     # Calendar page
│       │   │   │                   ├── accounting/   # Accounting page
│       │   │   │                   └── inbox/        # Inbox page
│       │   │   └── api/              # API routes
│       │   ├── components/           # React components
│       │   │   ├── ui/               # Base UI components
│       │   │   ├── board/            # Board-specific components
│       │   │   └── common/           # Shared components
│       │   ├── hooks/                # Custom React hooks
│       │   │   ├── use-board.ts      # Board management
│       │   │   ├── use-board-background.ts # Background management
│       │   │   ├── use-calendar.ts   # Calendar events
│       │   │   └── use-realtime.ts   # Real-time updates
│       │   ├── lib/                  # Utilities
│       │   │   ├── api.ts            # API client
│       │   │   └── auth.ts           # Authentication config
│       │   └── types/                # TypeScript types
│       ├── public/                   # Static assets
│       ├── package.json
│       └── next.config.js
├── functions/                        # Firebase Functions
│   ├── src/
│   │   └── index.ts                  # All API endpoints
│   ├── package.json
│   └── tsconfig.json
├── .docs/                           # Documentation
│   ├── COMPREHENSIVE_DEVELOPMENT_LOG.md
│   ├── API_REFERENCE.md
│   ├── CURRENT_PROBLEMS_AND_SOLUTIONS.md
│   └── TECHNICAL_ARCHITECTURE_SUMMARY.md
├── firebase.json                    # Firebase config
├── package.json                     # Root package
└── README.md
```

## 🔄 Data Flow

### 1. User Authentication
```
User Login → NextAuth.js → Firebase Auth → Backend Token → API Client
```

### 2. Board Management
```
Create Board → API Client → Firebase Function → Firestore → Real-time Update → UI
```

### 3. Real-time Updates
```
Data Change → Firestore → Polling (5s) → Custom Event → UI Update
```

## 🗄️ Database Schema

### Collections Structure
```
spektif (database)
├── boards/
│   ├── {boardId}/
│   │   ├── lists/
│   │   │   └── {listId}/
│   │   └── cards/
│   │       └── {cardId}/
├── users/
│   └── {userId}/
├── organizations/
│   └── {orgId}/
└── clients/
    └── {clientId}/
```

### Document Examples

#### Board Document
```json
{
  "id": "board-1",
  "title": "Project Board",
  "description": "Main project board",
  "organizationId": "spektif",
  "color": "#3B82F6",
  "backgroundUrl": "https://example.com/bg.jpg",
  "members": ["admin", "user1"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### List Document
```json
{
  "id": "list-1",
  "title": "To Do",
  "position": 0,
  "boardId": "board-1",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Card Document
```json
{
  "id": "card-1",
  "title": "Task Title",
  "description": "Task description",
  "dueDate": "2025-01-15T00:00:00.000Z",
  "listId": "list-1",
  "boardId": "board-1",
  "position": 0,
  "members": ["admin"],
  "priority": "medium",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 🔌 API Architecture

### Endpoint Categories
1. **Authentication** - Login, register
2. **Organizations** - Organization management
3. **Users** - Employee management
4. **Clients** - Client management
5. **Boards** - Board CRUD operations
6. **Lists** - List management
7. **Cards** - Card management
8. **Calendar** - Event management
9. **Files** - File upload
10. **System** - Health checks, seeding

### Request/Response Pattern
```typescript
// Request
POST /endpoint
Content-Type: application/json
{
  "param1": "value1",
  "param2": "value2"
}

// Response
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## 🔐 Security Architecture

### Authentication Flow
1. User logs in with email/password
2. NextAuth.js handles session management
3. Backend token generated for API calls
4. Token included in API requests
5. Firebase Admin SDK validates tokens

### CORS Configuration
```typescript
// All endpoints configured with:
{
  cors: true,
  invoker: "public"
}
```

### Database Security
- Firestore security rules (needs review)
- Public endpoints (security concern)
- No rate limiting implemented
- No input validation middleware

## 🚀 Deployment Architecture

### Frontend (Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment**: Production
- **URL**: https://spektif-agency-final.vercel.app

### Backend (Firebase Functions)
- **Runtime**: Node.js 22
- **Region**: europe-west4
- **Memory**: 256MB (default)
- **Timeout**: 60s (default)
- **URL**: https://europe-west4-spektif-agency-final-prod.cloudfunctions.net

### Database (Firestore)
- **Region**: europe-west4
- **Database ID**: spektif
- **Mode**: Native mode
- **Security**: Rules-based (needs review)

## 📊 Performance Characteristics

### Frontend Performance
- **Build Time**: ~30 seconds
- **Bundle Size**: ~87KB (First Load JS)
- **Page Load**: ~2-3 seconds
- **Real-time Updates**: 5-second polling

### Backend Performance
- **Cold Start**: ~2-3 seconds
- **Warm Request**: ~200-500ms
- **Database Read**: ~100-300ms
- **Database Write**: ~300-800ms

### Database Performance
- **Simple Queries**: Fast
- **Complex Queries**: Slow (avoided)
- **Write Operations**: Moderate
- **Real-time Listeners**: Not implemented

## 🔧 Development Workflow

### Local Development
1. **Frontend**: `npm run dev` (port 3000)
2. **Backend**: `firebase emulators:start` (port 5001)
3. **Database**: Firestore emulator (port 8080)

### Deployment Process
1. **Backend**: `firebase deploy --only functions`
2. **Frontend**: Automatic via Vercel (Git push)
3. **Database**: Changes via Firebase Console

### Testing Strategy
- **Unit Tests**: Not implemented
- **Integration Tests**: Manual curl testing
- **E2E Tests**: Not implemented
- **Load Tests**: Not implemented

## 🐛 Known Issues

### Critical Issues
1. **Database Persistence**: Data not actually saving
2. **Client System**: Not functional
3. **Calendar Integration**: Broken
4. **Real-time Updates**: Using polling instead of WebSocket

### Performance Issues
1. **Cold Starts**: Slow initial requests
2. **Polling**: Inefficient real-time updates
3. **Bundle Size**: Could be optimized
4. **Database Queries**: Some are inefficient

### Security Issues
1. **Public Endpoints**: No authentication required
2. **No Rate Limiting**: Vulnerable to abuse
3. **Input Validation**: Missing
4. **CORS**: Too permissive

## 🔮 Future Architecture Considerations

### Short Term
1. **Fix Database Persistence**: Critical priority
2. **Implement WebSocket**: Replace polling
3. **Add Authentication**: Secure endpoints
4. **Improve Error Handling**: Better UX

### Medium Term
1. **Add Caching**: Redis for performance
2. **Implement CDN**: For static assets
3. **Add Monitoring**: Error tracking
4. **Database Optimization**: Better queries

### Long Term
1. **Microservices**: Split functions
2. **Event Sourcing**: Better data consistency
3. **GraphQL**: More efficient API
4. **Kubernetes**: Better scaling

## 📈 Scalability Considerations

### Current Limitations
- **Firebase Functions**: 1000 concurrent executions
- **Firestore**: 1MB document limit
- **Vercel**: 100GB bandwidth/month
- **Polling**: Not scalable for many users

### Scaling Strategies
1. **Horizontal Scaling**: Multiple function instances
2. **Database Sharding**: Partition by organization
3. **Caching Layer**: Redis for frequent reads
4. **CDN**: Global content delivery
5. **WebSocket**: Real-time at scale

---

*This document provides a comprehensive overview of the current technical architecture and should be updated as the system evolves.*
