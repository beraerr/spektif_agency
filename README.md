# Spektif Agency

A modern project management application optimized for Turkish users, built with Next.js frontend and Firebase backend.

## Current Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Firebase Functions (europe-west4)
- **Database**: Firebase Firestore (emulators for development)
- **Authentication**: NextAuth.js with credentials
- **Storage**: Firebase Storage

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js >= 18
- Bun (package manager)
- Java JDK (for Firebase emulators)

### 1. Install Dependencies
```bash
bun install
cd functions && npm install && cd ..
```

### 2. Start Firebase Emulators
```bash
firebase emulators:start
```
This starts:
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199
- Functions: http://localhost:5001
- Emulator UI: http://localhost:4000

### 3. Seed the Database (First time only)
Open the Emulator UI at http://localhost:4000 or call:
```bash
curl http://localhost:5001/spektif-agency-dev/europe-west4/seedDatabase
```

### 4. Start the Web App
```bash
cd apps/web
bun dev
```
The app runs at: http://localhost:8080

### 5. Login Credentials
- **Email**: admin@spektif.com
- **Password**: admin123

## 📁 Project Structure

```
spektif_agency/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom hooks
│       │   └── lib/         # Utilities & API client
│       └── messages/        # i18n translations (tr, en, pl)
├── functions/               # Firebase Functions backend
│   └── src/
│       └── index.ts         # All API endpoints
├── packages/                # Shared packages (eslint, typescript configs)
└── firebase.json            # Firebase configuration
```

## ✅ Completed Features

### Board Management (Trello-like)
- ✅ Create, update, delete boards
- ✅ Create, update, delete lists within boards
- ✅ Create, update, delete cards within lists
- ✅ Drag & drop cards between lists
- ✅ Drag & drop lists to reorder
- ✅ Card modal with detailed editing
- ✅ Card members (add/remove)
- ✅ Card attachments (file upload)
- ✅ Card due dates
- ✅ Custom board backgrounds

### Employee Management
- ✅ Create employees with roles
- ✅ Edit employee details
- ✅ Delete employees
- ✅ Role-based display (ADMIN, EMPLOYEE, ACCOUNTANT)

### Client Management
- ✅ Create clients
- ✅ Edit client details
- ✅ Delete clients
- ✅ Status tracking (Aktif/Pasif)

### Dashboard
- ✅ Home view with stats
- ✅ Templates/Boards view
- ✅ Members view
- ✅ Clients view (admin only)

### Internationalization
- ✅ Turkish (default)
- ✅ English
- ✅ Polish
- ✅ Language switcher

### Theme
- ✅ Dark mode
- ✅ Light mode
- ✅ Theme switcher

## 🚧 Unfinished Features (Need Implementation)

### Chat System
- 📌 Currently uses **mock data**
- 📌 Needs: Real-time messaging with WebSocket/Firestore
- 📌 Location: `apps/web/src/app/[locale]/org/[orgId]/chat/page.tsx`
- 📌 API endpoints needed in `functions/src/index.ts`:
  - `getConversations`
  - `createConversation`
  - `getMessages`
  - `sendMessage`

### Calendar (Organization Level)
- 📌 Currently uses **mock data**
- 📌 Location: `apps/web/src/app/[locale]/org/[orgId]/calendar/page.tsx`
- 📌 Needs: Integration with card due dates from all boards

### Accounting
- 📌 Currently uses **mock data**
- 📌 Location: `apps/web/src/app/[locale]/org/[orgId]/accounting/page.tsx`
- 📌 Needs:
  - iyzico payment integration
  - Subscription management
  - Invoice generation
  - Expense tracking database

### Board Calendar
- ⚠️ Partially working - fetches card due dates
- 📌 Location: `apps/web/src/app/[locale]/org/[orgId]/board/[boardId]/calendar/page.tsx`
- 📌 Needs: Better event management

### Real-time Updates
- 📌 WebSocket connection placeholder exists
- 📌 Location: `apps/web/src/hooks/use-realtime.ts`
- 📌 Needs: Proper Firestore real-time listeners or Socket.io

### User Registration
- 📌 Registration page exists but not fully functional
- 📌 Needs: User creation endpoint and email verification

### Notifications
- 📌 Component exists: `apps/web/src/components/notifications/notification-inbox.tsx`
- 📌 Needs: Backend integration

## 🔧 Development Notes

### API Endpoints (Firebase Functions)
All endpoints are in `functions/src/index.ts`:
- Authentication: `/login`
- Boards: `/getBoards`, `/getBoard`, `/createBoard`, `/updateBoard`
- Lists: `/createList`, `/updateList`, `/deleteList`, `/reorderLists`
- Cards: `/getCards`, `/createCard`, `/updateCard`, `/deleteCard`, `/moveCard`
- Members: `/addCardMember`, `/removeCardMember`
- Attachments: `/uploadFile`, `/getCardAttachments`, `/updateCardAttachments`, `/removeCardAttachment`
- Organizations: `/getOrganizations`
- Employees: `/getEmployees`, `/createEmployee`
- Clients: `/getClients`, `/createClient`, `/updateClient`
- Utility: `/health`, `/testFirestore`, `/seedDatabase`

### Important Files
- `apps/web/src/lib/api.ts` - API client for all backend calls
- `apps/web/src/lib/auth.ts` - NextAuth configuration
- `apps/web/src/lib/firebase.ts` - Firebase client configuration
- `AI_AGENT_GUIDELINES.md` - Important rules for development

## 📋 Next Steps Priority

1. **Test with emulators** - Verify all features work locally
2. **Complete Chat** - Implement real-time messaging
3. **Fix Calendar** - Connect to real card data
4. **Add Notifications** - Real-time notification system
5. **User Registration** - Complete signup flow

## 🔒 Security Notes

- Production Firebase credentials are NOT in the codebase
- Use environment variables for production deployment
- Never commit `.env.local` or sensitive files

## 📞 Repository

- **GitHub**: https://github.com/beraerr/spektif_agency

---

**Status**: Development mode with Firebase Emulators  
**Last Updated**: December 27, 2025
