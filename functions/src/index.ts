import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { Request, Response } from "express";

// Initialize Firebase Admin with NEW service account key
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'spektif-agency-final-prod',
    clientEmail: 'firebase-adminsdk-fbsvc@spektif-agency-final-prod.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCs8r1TuFgPUnWS
bDMS+RPXptVVCo0gLOdH6yAHrJJmM//pLbkHCEORh0qpq6xsJEWWOW25cKB25pKS
crPiTKDn9HBi9z3Ifyki73lWpThpaqkHVbXUo1pBzVBI34gGbWmNMMTIxssOM7qg
6wcubv0VLyQT3jgwaIqjEWNZO+9fbM4Vec57ahzmqbGoLg5K7Cw6lB8fLB/WbXVF
dSL65jA1495LziA+X5Dum+gnz8gXl9aFw0oR+X4bOfn3qnfU9uCJayeKSs+LFwHD
ZkqmyQL9Rw+3fT8emq4GBSkC+Pl+rViJv5qJ2BJGYTmUEOJUiQ6hblZym0qVhUQt
jAQpvk7bAgMBAAECggEAPdZC5HLGpZ/Voudl8ZQ2SIaBw3jU0drMTRYgKy5EYB+a
kjyDaiTFx/xoMTdNHJNxgA+DkGjZLvotEQjLEZBVfeoT3wbIw+3XfwLBzz2e6G43
BoTaUS+g/2MSICQwZh/rvAxiZ+lQRAEx6wRt2mfbvJ3Q1/u9+mz+mOSIMakw4tyV
bbFzqTHg7CinMNb5AaqfOLLZORW/lOXF6/heyXULYAbhBJblMXQTPxkISNfppr79
np9obhUieKU5vzN132oWqWp/1vrUUs3a2slmgiHnxMlvyURayxcgVkBkmeUCAaRO
pzz6f1ZFRnkwatHFAhd8Y3+l032R+J5EW8q9xDOiUQKBgQDVJgt7o4UxKCKJFF2b
fSBs5TPrVXjCBEd7wG2sR2qqaRDkrjVhlB0v2c7XkP+AkSqK+h2r1BjnqxzRIuBg
xl0pD1JGWj5zud/4GKo+z2vh+p0pXgbvqmT6+tx5+HfY3E/rOeErSo8/AOLaBrAI
lYkjJYyxiWlWH0ioUQIv0sYoKwKBgQDPt7stVhJxrcjaJwKquNLuitjw1bO7DDoq
gphb7miICJH1vNI9bfHl5metON9y5Ua1oEBN+dG+1eT9Y4WxfRtzQXieOSAGmzSP
v3TceFmbUbFfJ+Y8foS0TSHpb/2wnlzr1XmF84yprstsSQYnM0vdfTmMcsZWsod6
ZGDz86rsEQKBgQC3T8fyZliHRTgmYmB6+Crp3FlBnLmFSr7bnEv2LVl8A24m7fg0
2ngbjhvI4wgKX06SRbc87uUYYN4gsvj74b1/MZEVtkkdqA8JxNStvh/PMoT1bctT
VV0RSKxTLbCMzjThXV7cp3v4uF9hGP1N9KUDmCifC0mPaspHD5xs2r3XDwKBgFv3
9IchOe9dS7XTWenvBW2aymzvobFqu4JA6mahy2SXrtCH9uo9+MGa30KiEMVVYJZg
Srh7qPN+zvGmE/a+9t10GoyrrFNgesg+s+Y93ybW59rC1rzoI6eVEzPBYyjFJU1B
6pl1eU1T2DuspW3L14ZMwKM/2jNevn9hXFAHDiGRAoGBAJ5sJ9Kvr+bLwHfNbpuz
ICi9xDtZ+gsqtVBApk0KQcc2/lFAbAAZHOMwNPKf6FwknvMn0oOiUbFFQlcRlefF
zXTekLc5OoQp1sb328BntujGvwSXcbFvPwN1hXQ5Cennmfhp5yi6y8uHk0bHq5O/
qZ1DMDWJHOVMxQiKssl7NHIM
-----END PRIVATE KEY-----`,
  }),
  storageBucket: 'spektif-agency-final-prod.firebasestorage.app',
});

// CLEAN SETUP: USE SPEKTIF DATABASE ONLY
const db = getFirestore(admin.app(), "spektif");
console.log("🔥 CLEAN SETUP: USING SPEKTIF DATABASE");
const storage = admin.storage();

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
          email: user.email,
          role: user.role,
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

        const boardDoc = await db.collection('boards').doc(boardId as string).get();
        
        if (!boardDoc.exists) {
          return res.status(404).json({ error: 'Board not found' });
        }

        const boardData = boardDoc.data();
        
        // Get lists for the board
        const listsSnapshot = await db.collection('boards')
          .doc(boardId as string)
          .collection('lists')
          .orderBy('position', 'asc')
          .get();

        const lists = [];
        for (const listDoc of listsSnapshot.docs) {
          const listData = listDoc.data();
          
          // Get cards for each list
          const cardsSnapshot = await db.collection('boards')
            .doc(boardId as string)
            .collection('cards')
            .where('listId', '==', listDoc.id)
            .get();

          const cards = cardsSnapshot.docs
            .map(cardDoc => ({
              id: cardDoc.id,
              ...cardDoc.data()
            }))
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

          lists.push({
            id: listDoc.id,
            ...listData,
            cards
          });
        }

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
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const boardsSnapshot = await db.collection('boards')
        .where('members', 'array-contains', userId)
        .get();

      const boards = [];
      for (const doc of boardsSnapshot.docs) {
        const boardData = doc.data();
        
        // Get lists for each board
        const listsSnapshot = await db.collection('boards')
          .doc(doc.id)
          .collection('lists')
          .orderBy('position', 'asc')
          .get();

        const lists = [];
        for (const listDoc of listsSnapshot.docs) {
          const listData = listDoc.data();
          
          // Get cards for each list
          const cardsSnapshot = await db.collection('boards')
            .doc(doc.id)
            .collection('cards')
            .where('listId', '==', listDoc.id)
            .get();

          // Sort by position in memory to avoid composite index requirement
          const cards = cardsSnapshot.docs
            .map(cardDoc => ({
              id: cardDoc.id,
              ...cardDoc.data()
            }))
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

          lists.push({
            id: listDoc.id,
            ...listData,
            cards
          });
        }

        boards.push({
          id: doc.id,
          ...boardData,
          lists
        });
      }

      return res.json(boards);
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      const { boardId } = req.params;
      const updateData = req.body;

      if (!boardId) {
        return res.status(400).json({ error: 'Board ID is required' });
      }

      await db.collection('boards').doc(boardId).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedDoc = await db.collection('boards').doc(boardId).get();
      
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      await cardRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedDoc = await cardRef.get();

      return res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
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
        uploadedAt: admin.firestore.FieldValue.serverTimestamp()
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
      const { organizationId, email, name, surname, position, phone, role } = req.body;

      if (!organizationId || !email || !name || !surname) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const employeeData = {
        email,
        name,
        surname,
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
      const { organizationId, name, email, phone, company, address, notes } = req.body;
      
      if (!organizationId || !name || !email) {
        res.status(400).json({ error: 'organizationId, name, and email are required' });
        return;
      }

      const clientData = {
        organizationId,
        name,
        email,
        phone: phone || '',
        company: company || '',
        address: address || '',
        notes: notes || '',
        status: 'Aktif',
        projects: 0,
        lastProject: 'Henüz proje yok',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false
      };

      const docRef = await db.collection('clients').add(clientData);
      
      res.status(201).json({
        id: docRef.id,
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc('admin').set(adminUser);
      console.log('✅ Admin user created');

      // Create organization
      const organization = {
        id: 'spektif',
        name: 'Spektif Agency',
        members: ['admin'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('organizations').doc('spektif').set(organization);
      console.log('✅ Organization created');

      // Create sample board
      const board = {
        id: 'sample-board-1',
        title: 'Proje Yönetimi',
        description: 'Ana proje yönetim panosu',
        organizationId: 'spektif',
        members: ['admin'],
        color: '#3B82F6',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('boards').doc('sample-board-1').set(board);
      console.log('✅ Sample board created');

      // Create sample lists
      const lists = [
        {
          id: 'list-1',
          title: 'Yapılacaklar',
          position: 0,
          boardId: 'sample-board-1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'list-2',
          title: 'Devam Eden',
          position: 1,
          boardId: 'sample-board-1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'list-3',
          title: 'Tamamlandı',
          position: 2,
          boardId: 'sample-board-1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ];

      for (const card of cards) {
        await db.collection('boards').doc('sample-board-1').collection('cards').doc(card.id).set(card);
      }
      console.log('✅ Sample cards created');

      // Create sample employees
      const employees = [
        {
          id: 'emp-1',
          email: 'john.doe@spektif.com',
          name: 'John',
          surname: 'Doe',
          position: 'Frontend Developer',
          phone: '+90 555 123 4567',
          role: 'employee',
          organizationId: 'spektif',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'emp-2',
          email: 'jane.smith@spektif.com',
          name: 'Jane',
          surname: 'Smith',
          position: 'Backend Developer',
          phone: '+90 555 987 6543',
          role: 'employee',
          organizationId: 'spektif',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ];

      for (const employee of employees) {
        await db.collection('users').doc(employee.id).set(employee);
      }
      console.log('✅ Sample employees created');

      // Create sample clients
      const clients = [
        {
          id: 'client-1',
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+90 555 111 2233',
          company: 'Acme Corporation',
          address: 'İstanbul, Türkiye',
          notes: 'Ana müşteri - web tasarım projeleri',
          status: 'active',
          organizationId: 'spektif',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'client-2',
          name: 'TechStart Inc',
          email: 'info@techstart.com',
          phone: '+90 555 444 5566',
          company: 'TechStart Inc',
          address: 'Ankara, Türkiye',
          notes: 'Yeni müşteri - mobil uygulama geliştirme',
          status: 'active',
          organizationId: 'spektif',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'client-3',
          name: 'Design Studio',
          email: 'hello@designstudio.com',
          phone: '+90 555 777 8899',
          company: 'Design Studio',
          address: 'İzmir, Türkiye',
          notes: 'Tasarım odaklı projeler',
          status: 'inactive',
          organizationId: 'spektif',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ];

      for (const client of clients) {
        await db.collection('clients').doc(client.id).set(client);
      }
      console.log('✅ Sample clients created');

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
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
