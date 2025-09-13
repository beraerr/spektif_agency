import { Injectable } from '@nestjs/common'
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseService {
  private db: admin.firestore.Firestore
  private storage: admin.storage.Storage

  constructor() {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'spektif-agency-final-prod.firebasestorage.app',
      })
    }

    this.db = admin.firestore()
    this.storage = admin.storage()
  }

  // Board operations
  async getBoard(boardId: string) {
    const doc = await this.db.collection('boards').doc(boardId).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  }

  async createBoard(data: any) {
    const docRef = await this.db.collection('boards').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { id: docRef.id, ...data }
  }

  async updateBoard(boardId: string, data: any) {
    await this.db.collection('boards').doc(boardId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { id: boardId, ...data }
  }

  async deleteBoard(boardId: string) {
    await this.db.collection('boards').doc(boardId).delete()
  }

  // List operations
  async getLists(boardId: string) {
    const snapshot = await this.db
      .collection('boards')
      .doc(boardId)
      .collection('lists')
      .orderBy('position', 'asc')
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async createList(boardId: string, data: any) {
    const docRef = await this.db
      .collection('boards')
      .doc(boardId)
      .collection('lists')
      .add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    
    return { id: docRef.id, ...data }
  }

  async updateList(boardId: string, listId: string, data: any) {
    await this.db
      .collection('boards')
      .doc(boardId)
      .collection('lists')
      .doc(listId)
      .update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    
    return { id: listId, ...data }
  }

  async deleteList(boardId: string, listId: string) {
    await this.db
      .collection('boards')
      .doc(boardId)
      .collection('lists')
      .doc(listId)
      .delete()
  }

  // Card operations
  async getCards(boardId: string, listId?: string) {
    let query = this.db
      .collection('boards')
      .doc(boardId)
      .collection('cards')
      .orderBy('position', 'asc')
    
    if (listId) {
      query = query.where('listId', '==', listId)
    }
    
    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async createCard(boardId: string, data: any) {
    const docRef = await this.db
      .collection('boards')
      .doc(boardId)
      .collection('cards')
      .add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    
    return { id: docRef.id, ...data }
  }

  async updateCard(boardId: string, cardId: string, data: any) {
    await this.db
      .collection('boards')
      .doc(boardId)
      .collection('cards')
      .doc(cardId)
      .update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    
    return { id: cardId, ...data }
  }

  async deleteCard(boardId: string, cardId: string) {
    await this.db
      .collection('boards')
      .doc(boardId)
      .collection('cards')
      .doc(cardId)
      .delete()
  }

  // File operations
  async uploadFile(file: any, path: string) {
    const bucket = this.storage.bucket()
    const fileRef = bucket.file(path)
    
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    })
    
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future date
    })
    
    return {
      url,
      path,
      size: file.size,
      mimeType: file.mimetype,
    }
  }

  async deleteFile(path: string) {
    const bucket = this.storage.bucket()
    await bucket.file(path).delete()
  }

  // Real-time subscriptions
  subscribeToBoard(boardId: string, callback: (data: any) => void) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .onSnapshot(callback)
  }

  subscribeToCards(boardId: string, callback: (data: any) => void) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .collection('cards')
      .onSnapshot(callback)
  }

  subscribeToLists(boardId: string, callback: (data: any) => void) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .collection('lists')
      .onSnapshot(callback)
  }
}
