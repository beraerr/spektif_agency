import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { Request, Response } from "express";

// Initialize Firebase Admin
// In development/emulator mode, credentials are not needed
// In production, set GOOGLE_APPLICATION_CREDENTIALS environment variable
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  // Running in emulator - no credentials needed
  admin.initializeApp({
    projectId: 'spektif-agency-dev',
    storageBucket: 'spektif-agency-dev.appspot.com',
  });
} else {
  // Production - use environment variables or default credentials
  admin.initializeApp();
}

// Use default database in development, 'spektif' in production
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
const db = isEmulator ? getFirestore(admin.app()) : getFirestore(admin.app(), "spektif");
const storage = getStorage(admin.app());
console.log(isEmulator ? "🔥 DEV MODE: Using Firebase Emulators" : "🔥 PROD MODE: Using Spektif Database");

// Set global options for cost control and region
setGlobalOptions({ 
  maxInstances: 10,
  region: 'europe-west4'
});

// CORS middleware
const cors = require('cors')({ origin: true });

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

export const login = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Handle demo credentials
      if (email === 'admin@spektif.com' && password === 'admin123') {
        // Generate a simple token
        const token = `firebase-token-${Date.now()}`;
        
        return res.json({
          token,
          user: {
            id: 'admin',
            email: 'admin@spektif.com',
            name: 'Admin User',
            role: 'ADMIN',
            backendToken: token
          }
        });
      }

      // For other users, check Firestore
      const userDoc = await db.collection('users').where('email', '==', email).get();
      
      if (userDoc.empty) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userDoc.docs[0].data();
      
      // Simple password check (in production, use proper hashing)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate a simple token
      const token = `firebase-token-${Date.now()}`;
      
      return res.json({
        token,
        user: {
          id: userDoc.docs[0].id,
          name: user.name,
          surname: user.surname || '',
          email: user.email,
          role: user.role,
          position: user.position || '',
          company: user.company || '',
          organizationId: user.organizationId,
          backendToken: token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// BOARDS ENDPOINTS
// ============================================================================

export const getBoard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      try {
        const { boardId } = req.query;

        if (!boardId) {
          return res.status(400).json({ error: 'Board ID is required' });
        }

        // Get board data and all related data in parallel
        const [boardDoc, listsSnapshot, cardsSnapshot] = await Promise.all([
          db.collection('boards').doc(boardId as string).get(),
          db.collection('boards')
            .doc(boardId as string)
            .collection('lists')
            .orderBy('position', 'asc')
            .get(),
          db.collection('boards')
            .doc(boardId as string)
            .collection('cards')
            .get()
        ]);
        
        if (!boardDoc.exists) {
          return res.status(404).json({ error: 'Board not found' });
        }

        const boardData = boardDoc.data();
        
        // Group cards by listId for efficient processing
        const cardsByListId = new Map();
        cardsSnapshot.docs.forEach(cardDoc => {
          const cardData = cardDoc.data();
          const listId = cardData.listId;
          if (!cardsByListId.has(listId)) {
            cardsByListId.set(listId, []);
          }
          cardsByListId.get(listId).push({
            id: cardDoc.id,
            ...cardData
          });
        });

        // Sort cards by position
        cardsByListId.forEach(cards => {
          cards.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        });

        // Build lists with their cards
        const lists = listsSnapshot.docs.map(listDoc => {
          const listData = listDoc.data();
          const cards = cardsByListId.get(listDoc.id) || [];
          
          return {
            id: listDoc.id,
            ...listData,
            cards
          };
        });

        return res.json({
          id: boardDoc.id,
          ...boardData,
          lists
        });
      } catch (error) {
        console.error('Get board error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);

export const getBoards = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { userId, role, clientId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      let boardsSnapshot;

      // Filter based on role
      if (role === 'client' && clientId) {
        // Clients can only see boards assigned to them
        boardsSnapshot = await db.collection('boards')
          .where('clientId', '==', clientId)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
      } else if (role === 'employee') {
        // Employees can only see boards they are members of
        boardsSnapshot = await db.collection('boards')
          .where('members', 'array-contains', userId)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
      } else {
        // Admin can see all boards (or boards they are members of)
        boardsSnapshot = await db.collection('boards')
          .where('members', 'array-contains', userId)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
      }

      const boards = [];
      
      // Use Promise.all for parallel processing
      const boardPromises = boardsSnapshot.docs.map(async (doc) => {
        const boardData = doc.data();
        
        // Get lists and cards in parallel
        const [listsSnapshot, cardsSnapshot] = await Promise.all([
          db.collection('boards')
            .doc(doc.id)
            .collection('lists')
            .orderBy('position', 'asc')
            .get(),
          db.collection('boards')
            .doc(doc.id)
            .collection('cards')
            .get()
        ]);

        // Group cards by listId for efficient processing
        const cardsByListId = new Map();
        cardsSnapshot.docs.forEach(cardDoc => {
          const cardData = cardDoc.data();
          const listId = cardData.listId;
          if (!cardsByListId.has(listId)) {
            cardsByListId.set(listId, []);
          }
          cardsByListId.get(listId).push({
            id: cardDoc.id,
            ...cardData
          });
        });

        // Sort cards by position
        cardsByListId.forEach(cards => {
          cards.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        });

        // Build lists with their cards
        const lists = listsSnapshot.docs.map(listDoc => {
          const listData = listDoc.data();
          const cards = cardsByListId.get(listDoc.id) || [];
          
          return {
            id: listDoc.id,
            ...listData,
            cards
          };
        });

        return {
          id: doc.id,
          ...boardData,
          lists
        };
      });

      const boardsResult = await Promise.all(boardPromises);
      
      // Filter out deleted boards
      const activeBoards = boardsResult.filter((board: any) => !board.deleted);
      
      // Sort boards: pinned first, then by creation date
      activeBoards.sort((a: any, b: any) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Newest first
      });
      
      return res.json(activeBoards);
    } catch (error) {
      logger.error('Get boards error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const createBoard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { title, description, organizationId, userId, color } = req.body;

      if (!title || !userId) {
        return res.status(400).json({ error: 'Title and user ID are required' });
      }

      const boardData = {
        title,
        description: description || '',
        organizationId: organizationId || '',
        color: color || '#3B82F6',
        members: [userId],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('boards').add(boardData);

      return res.json({
        id: docRef.id,
        ...boardData
      });
    } catch (error) {
      logger.error('Create board error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const updateBoard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Board ID is required' });
      }

      // If deleted flag is set, mark as deleted instead of actually deleting
      if (updateData.deleted) {
        await db.collection('boards').doc(id).update({
          deleted: true,
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.json({ success: true, message: 'Board deleted' });
      }

      await db.collection('boards').doc(id).update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp()
      });

      const updatedDoc = await db.collection('boards').doc(id).get();
      
      return res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      logger.error('Update board error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// LISTS ENDPOINTS
// ============================================================================

export const createList = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, title, position } = req.body;

      if (!boardId || !title) {
        return res.status(400).json({ error: 'Board ID and title are required' });
      }

      const listData = {
        title,
        position: position || 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('boards')
        .doc(boardId)
        .collection('lists')
        .add(listData);

      return res.json({
        id: docRef.id,
        ...listData
      });
    } catch (error) {
      logger.error('Create list error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const updateList = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { id: listId, ...updateData } = req.body;

      if (!listId) {
        return res.status(400).json({ error: 'List ID is required' });
      }

      // Find the list by searching all boards
      const boardsSnapshot = await db.collection('boards').get();
      let listRef = null;
      
      for (const boardDoc of boardsSnapshot.docs) {
        const listDoc = await boardDoc.ref.collection('lists').doc(listId).get();
        if (listDoc.exists) {
          listRef = listDoc.ref;
          break;
        }
      }

      if (!listRef) {
        return res.status(404).json({ error: 'List not found' });
      }
      await listRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp()
      });

      const updatedDoc = await listRef.get();

      return res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      logger.error('Update list error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// CARDS ENDPOINTS
// ============================================================================

export const createCard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, listId, title, description, dueDate, position } = req.body;

      if (!boardId || !listId || !title) {
        return res.status(400).json({ error: 'Board ID, List ID, and title are required' });
      }

      const cardData = {
        title,
        description: description || '',
        dueDate: dueDate || null,
        listId,
        position: position || 0,
        members: [],
        comments: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('boards')
        .doc(boardId)
        .collection('cards')
        .add(cardData);

      return res.json({
        id: docRef.id,
        ...cardData
      });
    } catch (error) {
      logger.error('Create card error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const updateCard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { id: cardId, ...updateData } = req.body;

      if (!cardId) {
        return res.status(400).json({ error: 'Card ID is required' });
      }

      // Find the card by searching all boards
      const boardsSnapshot = await db.collection('boards').get();
      let cardRef = null;
      
      for (const boardDoc of boardsSnapshot.docs) {
        const cardDoc = await boardDoc.ref.collection('cards').doc(cardId).get();
        if (cardDoc.exists) {
          cardRef = cardDoc.ref;
          break;
        }
      }

      if (!cardRef) {
        return res.status(404).json({ error: 'Card not found' });
      }
      // Log the update data for debugging
      logger.info('Updating card with data:', updateData);

      await cardRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp()
      });

      const updatedDoc = await cardRef.get();
      const updatedData = updatedDoc.data();

      // Log the updated data for debugging
      logger.info('Card updated successfully:', {
        id: updatedDoc.id,
        members: updatedData?.members,
        attachments: updatedData?.attachments
      });

      return res.json({
        id: updatedDoc.id,
        ...updatedData
      });
    } catch (error) {
      logger.error('Update card error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// FILE UPLOAD ENDPOINTS
// ============================================================================

export const uploadFile = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, cardId, fileName, fileType, fileData } = req.body;

      if (!boardId || !fileName || !fileData) {
        return res.status(400).json({ error: 'Board ID, file name, and file data are required' });
      }

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileData, 'base64');
      
      // Upload to Firebase Storage
      const bucket = storage.bucket();
      const filePath = `boards/${boardId}/cards/${cardId || 'general'}/${fileName}`;
      const file = bucket.file(filePath);

      await file.save(fileBuffer, {
        metadata: {
          contentType: fileType || 'application/octet-stream'
        }
      });

      // Get download URL
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });

      // Save file metadata to Firestore
      const fileDoc = await db.collection('files').add({
        fileName,
        originalName: fileName,
        url,
        size: fileBuffer.length,
        mimeType: fileType || 'application/octet-stream',
        boardId,
        cardId: cardId || null,
        uploadedAt: FieldValue.serverTimestamp()
      });

      return res.json({
        id: fileDoc.id,
        fileName,
        url,
        size: fileBuffer.length,
        mimeType: fileType || 'application/octet-stream'
      });
    } catch (error) {
      logger.error('Upload file error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// CARDS ENDPOINTS
// ============================================================================

export const getCards = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { listId, boardId, userId } = req.query;

      if (boardId) {
        // Get all cards for a board
        const cardsSnapshot = await db.collection('boards')
          .doc(boardId as string)
          .collection('cards')
          .get();

        const cards = cardsSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));

        return res.json(cards);
      } else if (listId) {
        // Get cards for a specific list - need to find boardId first
        // This is complex, so we'll require boardId for now
        return res.status(400).json({ error: 'Board ID is required when filtering by list ID' });
      } else {
        return res.status(400).json({ error: 'Board ID is required' });
      }
    } catch (error) {
      logger.error('Get cards error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// ORGANIZATIONS ENDPOINTS
// ============================================================================

export const getOrganizations = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const orgsSnapshot = await db.collection('organizations')
        .where('members', 'array-contains', userId)
        .get();

      const organizations = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.json(organizations);
    } catch (error) {
      logger.error('Get organizations error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const getEmployees = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const employeesSnapshot = await db.collection('users')
        .where('organizationId', '==', organizationId)
        .get();

      const employees = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.json(employees);
    } catch (error) {
      logger.error('Get employees error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const createEmployee = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { organizationId, email, name, surname, position, phone, role, password } = req.body;

      if (!organizationId || !email || !name || !surname) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate a random password if not provided
      const generatedPassword = password || `emp${Math.random().toString(36).substring(2, 8)}`;

      const employeeData = {
        email,
        name,
        surname,
        password: generatedPassword,
        position: position || '',
        phone: phone || '',
        role: role || 'employee',
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const employeeRef = await db.collection('users').add(employeeData);

      return res.json({
        id: employeeRef.id,
        tempPassword: generatedPassword, // Return password so admin can share it
        ...employeeData
      });
    } catch (error) {
      logger.error('Create employee error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

export const getClients = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { organizationId } = req.query;
      
      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const clientsSnapshot = await db.collection('clients')
        .where('organizationId', '==', organizationId)
        .get();

      // Filter out deleted clients in memory
      const clients = clientsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((client: any) => !client.deleted);

      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  });
});

export const createClient = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { organizationId, name, email, phone, company, address, notes, password } = req.body;
      
      if (!organizationId || !name || !email) {
        res.status(400).json({ error: 'organizationId, name, and email are required' });
        return;
      }

      // Generate a random password if not provided
      const generatedPassword = password || `client${Math.random().toString(36).substring(2, 8)}`;

      const clientData = {
        organizationId,
        name,
        email,
        password: generatedPassword,
        phone: phone || '',
        company: company || name,
        address: address || '',
        notes: notes || '',
        role: 'client',
        status: 'Aktif',
        projects: 0,
        lastProject: 'Henuz proje yok',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false
      };

      const docRef = await db.collection('clients').add(clientData);
      
      // Also add to users collection for login
      await db.collection('users').doc(docRef.id).set(clientData);
      
      res.status(201).json({
        id: docRef.id,
        tempPassword: generatedPassword, // Return password so admin can share it
        ...clientData
      });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ error: 'Failed to create client' });
    }
  });
});

export const updateClient = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { id, ...updateData } = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Client ID is required' });
        return;
      }

      const clientRef = db.collection('clients').doc(id);
      await clientRef.update({
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, message: 'Client updated successfully' });
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  });
});

// HEALTH CHECK
// ============================================================================

export const health = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'spektif-agency-firebase-functions'
    });
  });
});

export const testFirestore = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      console.log('Testing Firestore connection...');
      console.log('Database instance configured');
      
      // Try to create a test document first
      await db.collection('test').doc('connection').set({
        timestamp: new Date(),
        status: 'connected'
      });
      
      const testDoc = await db.collection('test').doc('connection').get();
      console.log('✅ Firestore connection successful');
      
      // Get the actual database ID (hardcoded since we know it's spektif)
      const actualDatabaseId = 'spektif';
      
      return res.json({
        success: true,
        message: 'Firestore connection successful',
        exists: testDoc.exists,
        data: testDoc.data(),
        projectId: 'spektif-agency-final-prod',
        actualDatabaseId: actualDatabaseId,
        configuredDatabaseId: 'spektif',
        dbObject: typeof db
      });
    } catch (error) {
      console.error('❌ Firestore connection failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Firestore connection failed',
        details: error.message,
        projectId: 'spektif-agency-final-prod',
        databaseId: 'spektif'
      });
    }
  });
});

// ============================================================================
// SEED DATABASE
// ============================================================================

export const seedDatabase = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      console.log('🌱 Starting database seeding...');

      // Test basic connection first
      console.log('Testing Firestore connection...');
      const testDoc = await db.collection('test').doc('connection').get();
      console.log('✅ Firestore connection successful');

      // Create admin user
      const adminUser = {
        id: 'admin',
        email: 'admin@spektif.com',
        name: 'Admin User',
        role: 'ADMIN',
        organizationId: 'spektif',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      await db.collection('users').doc('admin').set(adminUser);
      console.log('✅ Admin user created');

      // Create organization
      const organization = {
        id: 'spektif',
        name: 'Spektif Agency',
        members: ['admin'],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      await db.collection('organizations').doc('spektif').set(organization);
      console.log('✅ Organization created');

      // Create sample boards with member and client assignments
      const boards = [
        {
          id: 'sample-board-1',
          title: 'Proje Yonetimi',
          description: 'Ana proje yonetim panosu',
          organizationId: 'spektif',
          members: ['admin', 'emp-1', 'emp-2'], // Admin and both employees
          clientId: 'client-1', // Assigned to Acme Corporation
          color: '#3B82F6',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'sample-board-2',
          title: 'Mobil Uygulama',
          description: 'TechStart mobil uygulama projesi',
          organizationId: 'spektif',
          members: ['admin', 'emp-1'], // Admin and John Doe only
          clientId: 'client-2', // Assigned to TechStart
          color: '#10B981',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'sample-board-3',
          title: 'Tasarim Projesi',
          description: 'Design Studio logo ve marka tasarimi',
          organizationId: 'spektif',
          members: ['admin', 'emp-2'], // Admin and Jane Smith only
          clientId: 'client-3', // Assigned to Design Studio
          color: '#8B5CF6',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      ];

      for (const board of boards) {
        await db.collection('boards').doc(board.id).set(board);
      }
      console.log('Sample boards created');

      // Create sample lists
      const lists = [
        {
          id: 'list-1',
          title: 'Yapılacaklar',
          position: 0,
          boardId: 'sample-board-1',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'list-2',
          title: 'Devam Eden',
          position: 1,
          boardId: 'sample-board-1',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'list-3',
          title: 'Tamamlandı',
          position: 2,
          boardId: 'sample-board-1',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      ];

      for (const list of lists) {
        await db.collection('boards').doc('sample-board-1').collection('lists').doc(list.id).set(list);
      }
      console.log('✅ Sample lists created');

      // Create sample cards
      const cards = [
        {
          id: 'card-1',
          title: 'Web sitesi tasarımı',
          description: 'Ana sayfa ve iç sayfaların tasarımı',
          listId: 'list-1',
          boardId: 'sample-board-1',
          position: 0,
          members: ['admin'],
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'card-2',
          title: 'Veritabanı kurulumu',
          description: 'Firebase Firestore veritabanı yapılandırması',
          listId: 'list-2',
          boardId: 'sample-board-1',
          position: 0,
          members: ['admin'],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'card-3',
          title: 'Test ve deploy',
          description: 'Uygulamanın test edilmesi ve production\'a deploy edilmesi',
          listId: 'list-3',
          boardId: 'sample-board-1',
          position: 0,
          members: ['admin'],
          dueDate: new Date().toISOString(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      ];

      for (const card of cards) {
        await db.collection('boards').doc('sample-board-1').collection('cards').doc(card.id).set(card);
      }
      console.log('✅ Sample cards created');

      // Create sample employees (with passwords for login)
      const employees = [
        {
          id: 'emp-1',
          email: 'john.doe@spektif.com',
          password: 'employee123',
          name: 'John',
          surname: 'Doe',
          position: 'Frontend Developer',
          phone: '+90 555 123 4567',
          role: 'employee',
          organizationId: 'spektif',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'emp-2',
          email: 'jane.smith@spektif.com',
          password: 'employee123',
          name: 'Jane',
          surname: 'Smith',
          position: 'Backend Developer',
          phone: '+90 555 987 6543',
          role: 'employee',
          organizationId: 'spektif',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      ];

      for (const employee of employees) {
        await db.collection('users').doc(employee.id).set(employee);
      }
      console.log('✅ Sample employees created');

      // Create sample clients (with passwords for login)
      const clients = [
        {
          id: 'client-1',
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          password: 'client123',
          phone: '+90 555 111 2233',
          company: 'Acme Corporation',
          address: 'Istanbul, Turkiye',
          notes: 'Ana musteri - web tasarim projeleri',
          status: 'active',
          role: 'client',
          organizationId: 'spektif',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'client-2',
          name: 'TechStart Inc',
          email: 'info@techstart.com',
          password: 'client123',
          phone: '+90 555 444 5566',
          company: 'TechStart Inc',
          address: 'Ankara, Turkiye',
          notes: 'Yeni musteri - mobil uygulama gelistirme',
          status: 'active',
          role: 'client',
          organizationId: 'spektif',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        {
          id: 'client-3',
          name: 'Design Studio',
          email: 'hello@designstudio.com',
          password: 'client123',
          phone: '+90 555 777 8899',
          company: 'Design Studio',
          address: 'Izmir, Turkiye',
          notes: 'Tasarim odakli projeler',
          status: 'inactive',
          role: 'client',
          organizationId: 'spektif',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      ];

      // Save clients to both collections for different use cases
      for (const client of clients) {
        await db.collection('clients').doc(client.id).set(client);
        // Also add to users collection for login
        await db.collection('users').doc(client.id).set(client);
      }
      console.log('Sample clients created');

      return res.json({
        success: true,
        message: 'Database seeded successfully!',
        data: {
          users: 3, // admin + 2 employees
          organizations: 1,
          boards: 1,
          lists: 3,
          cards: 3,
          clients: 3
        }
      });

    } catch (error) {
      logger.error('Seed database error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to seed database',
        details: error.message 
      });
    }
  });
});

// ============================================================================
// MISSING ENDPOINTS
// ============================================================================

export const deleteList = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      try {
        const { listId } = req.body;

        if (!listId) {
          return res.status(400).json({ error: 'List ID is required' });
        }

        // Delete all cards in the list first
        const cardsSnapshot = await db.collectionGroup('cards')
          .where('listId', '==', listId)
          .get();

        const batch = db.batch();
        cardsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete the list
        const listQuery = await db.collectionGroup('lists')
          .where('__name__', '==', listId)
          .get();

        if (listQuery.empty) {
          return res.status(404).json({ error: 'List not found' });
        }

        await listQuery.docs[0].ref.delete();

        return res.json({ success: true });
      } catch (error) {
        console.error('Delete list error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);

export const deleteCard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      try {
        const { cardId } = req.body;

        if (!cardId) {
          return res.status(400).json({ error: 'Card ID is required' });
        }

        // Find and delete the card
        const cardQuery = await db.collectionGroup('cards')
          .where('__name__', '==', cardId)
          .get();

        if (cardQuery.empty) {
          return res.status(404).json({ error: 'Card not found' });
        }

        await cardQuery.docs[0].ref.delete();

        return res.json({ success: true });
      } catch (error) {
        console.error('Delete card error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);

export const moveCard = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      try {
        const { id: cardId, listId, position, boardId } = req.body;

        if (!cardId || !listId || position === undefined) {
          return res.status(400).json({ error: 'Card ID, List ID, and position are required' });
        }

        // Find the card by searching all boards
        const boardsSnapshot = await db.collection('boards').get();
        let cardRef = null;
        
        for (const boardDoc of boardsSnapshot.docs) {
          const cardDoc = await boardDoc.ref.collection('cards').doc(cardId).get();
          if (cardDoc.exists) {
            cardRef = cardDoc.ref;
            break;
          }
        }

        if (!cardRef) {
          return res.status(404).json({ error: 'Card not found' });
        }

        await cardRef.update({
          listId,
          position,
          updatedAt: FieldValue.serverTimestamp()
        });

        return res.json({ success: true });
      } catch (error) {
        console.error('Move card error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);

export const reorderLists = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      try {
        const { boardId, listOrders } = req.body;

        if (!boardId || !listOrders || !Array.isArray(listOrders)) {
          return res.status(400).json({ error: 'Board ID and list orders are required' });
        }

        const batch = db.batch();
        
        for (const { id, position } of listOrders) {
          const listRef = db.collection('boards').doc(boardId).collection('lists').doc(id);
          batch.update(listRef, {
            position,
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        await batch.commit();

        return res.json({ success: true });
      } catch (error) {
        console.error('Reorder lists error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);

export const updateBoardBackground = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, backgroundUrl } = req.body;

      if (!boardId || !backgroundUrl) {
        return res.status(400).json({ error: 'Board ID and background URL are required' });
      }

      await db.collection('boards').doc(boardId).update({
        backgroundUrl,
        updatedAt: FieldValue.serverTimestamp()
      });

      return res.json({ success: true });
    } catch (error) {
      logger.error('Update board background error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const getCalendarEvents = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, startDate, endDate } = req.query;

      if (!boardId) {
        return res.status(400).json({ error: 'Board ID is required' });
      }

      // Get all cards with due dates
      const cardsSnapshot = await db.collection('boards')
        .doc(boardId as string)
        .collection('cards')
        .where('dueDate', '!=', null)
        .get();

      const events = cardsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          listId: data.listId,
          boardId: boardId,
          members: data.members || [],
          priority: data.priority || 'medium'
        };
      });

      return res.json(events);
    } catch (error) {
      logger.error('Get calendar events error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// CARD MEMBER MANAGEMENT ENDPOINTS
// ============================================================================

export const addCardMember = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { cardId, boardId, memberName, memberEmail } = req.body;

      if (!cardId || !boardId || !memberName) {
        return res.status(400).json({ error: 'Card ID, Board ID, and member name are required' });
      }

      // Find the card
      const boardsSnapshot = await db.collection('boards').get();
      let cardRef = null;
      
      for (const boardDoc of boardsSnapshot.docs) {
        const cardDoc = await boardDoc.ref.collection('cards').doc(cardId).get();
        if (cardDoc.exists) {
          cardRef = cardDoc.ref;
          break;
        }
      }

      if (!cardRef) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const cardData = (await cardRef.get()).data();
      const currentMembers = cardData?.members || [];
      
      // Check if member already exists
      const memberExists = currentMembers.some((member: any) => 
        member.name === memberName || member.email === memberEmail
      );

      if (memberExists) {
        return res.status(400).json({ error: 'Member already exists on this card' });
      }

      // Add new member
      const newMember = {
        name: memberName,
        email: memberEmail || '',
        addedAt: FieldValue.serverTimestamp()
      };

      const updatedMembers = [...currentMembers, newMember];

      await cardRef.update({
        members: updatedMembers,
        updatedAt: FieldValue.serverTimestamp()
      });

      return res.json({ 
        success: true, 
        member: newMember,
        totalMembers: updatedMembers.length
      });
    } catch (error) {
      logger.error('Add card member error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const removeCardMember = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { cardId, boardId, memberName } = req.body;

      if (!cardId || !boardId || !memberName) {
        return res.status(400).json({ error: 'Card ID, Board ID, and member name are required' });
      }

      // Find the card
      const boardsSnapshot = await db.collection('boards').get();
      let cardRef = null;
      
      for (const boardDoc of boardsSnapshot.docs) {
        const cardDoc = await boardDoc.ref.collection('cards').doc(cardId).get();
        if (cardDoc.exists) {
          cardRef = cardDoc.ref;
          break;
        }
      }

      if (!cardRef) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const cardData = (await cardRef.get()).data();
      const currentMembers = cardData?.members || [];
      
      // Remove member
      const updatedMembers = currentMembers.filter((member: any) => member.name !== memberName);

      await cardRef.update({
        members: updatedMembers,
        updatedAt: FieldValue.serverTimestamp()
      });

      return res.json({ 
        success: true, 
        totalMembers: updatedMembers.length
      });
    } catch (error) {
      logger.error('Remove card member error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// ============================================================================
// CARD ATTACHMENT MANAGEMENT ENDPOINTS
// ============================================================================

export const getCardAttachments = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { cardId, boardId } = req.query;

      if (!cardId || !boardId) {
        return res.status(400).json({ error: 'Card ID and Board ID are required' });
      }

      // Get attachments for the specific card
      const attachmentsSnapshot = await db.collection('files')
        .where('cardId', '==', cardId)
        .where('boardId', '==', boardId)
        .orderBy('uploadedAt', 'desc')
        .get();

      const attachments = attachmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.json(attachments);
    } catch (error) {
      logger.error('Get card attachments error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const updateCardAttachments = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { cardId, boardId, attachmentId } = req.body;

      if (!cardId || !boardId || !attachmentId) {
        return res.status(400).json({ error: 'Card ID, Board ID, and attachment ID are required' });
      }

      // Find the card
      const boardsSnapshot = await db.collection('boards').get();
      let cardRef = null;
      
      for (const boardDoc of boardsSnapshot.docs) {
        const cardDoc = await boardDoc.ref.collection('cards').doc(cardId).get();
        if (cardDoc.exists) {
          cardRef = cardDoc.ref;
          break;
        }
      }

      if (!cardRef) {
        return res.status(404).json({ error: 'Card not found' });
      }

      // Get attachment info
      const attachmentDoc = await db.collection('files').doc(attachmentId).get();
      if (!attachmentDoc.exists) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      const attachmentData = attachmentDoc.data();
      const cardData = (await cardRef.get()).data();
      const currentAttachments = cardData?.attachments || [];

      // Add attachment to card if not already present
      const attachmentExists = currentAttachments.some((att: any) => att.id === attachmentId);
      
      if (!attachmentExists) {
        const newAttachment = {
          id: attachmentId,
          name: attachmentData?.fileName,
          url: attachmentData?.url,
          size: attachmentData?.size,
          mimeType: attachmentData?.mimeType,
          uploadedAt: attachmentData?.uploadedAt
        };

        const updatedAttachments = [...currentAttachments, newAttachment];

        await cardRef.update({
          attachments: updatedAttachments,
          updatedAt: FieldValue.serverTimestamp()
        });

        return res.json({ 
          success: true, 
          attachment: newAttachment,
          totalAttachments: updatedAttachments.length
        });
      } else {
        return res.json({ 
          success: true, 
          message: 'Attachment already exists on card',
          totalAttachments: currentAttachments.length
        });
      }
    } catch (error) {
      logger.error('Update card attachments error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const removeCardAttachment = onRequest(
  { 
    cors: true,
    invoker: "public"
  },
  async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { cardId, boardId, attachmentId } = req.body;

      if (!cardId || !boardId || !attachmentId) {
        return res.status(400).json({ error: 'Card ID, Board ID, and attachment ID are required' });
      }

      // Find the card
      const boardsSnapshot = await db.collection('boards').get();
      let cardRef = null;
      
      for (const boardDoc of boardsSnapshot.docs) {
        const cardDoc = await boardDoc.ref.collection('cards').doc(cardId).get();
        if (cardDoc.exists) {
          cardRef = cardDoc.ref;
          break;
        }
      }

      if (!cardRef) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const cardData = (await cardRef.get()).data();
      const currentAttachments = cardData?.attachments || [];
      
      // Remove attachment
      const updatedAttachments = currentAttachments.filter((att: any) => att.id !== attachmentId);

      await cardRef.update({
        attachments: updatedAttachments,
        updatedAt: FieldValue.serverTimestamp()
      });

      return res.json({ 
        success: true, 
        totalAttachments: updatedAttachments.length
      });
    } catch (error) {
      logger.error('Remove card attachment error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});
