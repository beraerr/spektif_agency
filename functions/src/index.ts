import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { Request, Response } from "express";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// CORS middleware
const cors = require('cors')({ origin: true });

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

export const login = onRequest(async (req: Request, res: Response) => {
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

export const getBoards = onRequest(async (req: Request, res: Response) => {
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
            .orderBy('position', 'asc')
            .get();

          const cards = cardsSnapshot.docs.map(cardDoc => ({
            id: cardDoc.id,
            ...cardDoc.data()
          }));

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

export const createBoard = onRequest(async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { title, description, organizationId, userId } = req.body;

      if (!title || !userId) {
        return res.status(400).json({ error: 'Title and user ID are required' });
      }

      const boardData = {
        title,
        description: description || '',
        organizationId: organizationId || '',
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

export const updateBoard = onRequest(async (req: Request, res: Response) => {
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

export const createList = onRequest(async (req: Request, res: Response) => {
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

export const updateList = onRequest(async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, listId } = req.params;
      const updateData = req.body;

      if (!boardId || !listId) {
        return res.status(400).json({ error: 'Board ID and List ID are required' });
      }

      await db.collection('boards')
        .doc(boardId)
        .collection('lists')
        .doc(listId)
        .update({
          ...updateData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      const updatedDoc = await db.collection('boards')
        .doc(boardId)
        .collection('lists')
        .doc(listId)
        .get();

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

export const createCard = onRequest(async (req: Request, res: Response) => {
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

export const updateCard = onRequest(async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    try {
      const { boardId, cardId } = req.params;
      const updateData = req.body;

      if (!boardId || !cardId) {
        return res.status(400).json({ error: 'Board ID and Card ID are required' });
      }

      await db.collection('boards')
        .doc(boardId)
        .collection('cards')
        .doc(cardId)
        .update({
          ...updateData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      const updatedDoc = await db.collection('boards')
        .doc(boardId)
        .collection('cards')
        .doc(cardId)
        .get();

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

export const uploadFile = onRequest(async (req: Request, res: Response) => {
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
// HEALTH CHECK
// ============================================================================

export const health = onRequest(async (req: Request, res: Response) => {
  return cors(req, res, async () => {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'spektif-agency-firebase-functions'
    });
  });
});
