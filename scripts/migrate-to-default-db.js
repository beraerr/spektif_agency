const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'spektif-agency-final-prod',
    clientEmail: 'firebase-adminsdk-fbsvc@spektif-agency-final-prod.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCe/whcdro7sDKA
s3rEDM5j47I6nHPatwvCjE8+vkln4OZYgNjxbuczPBFdhFiIBxEonpwXr5b7c0M/
lzfdutQi2q0UpoZQ1QiESLUhECNFeA2JcW+TOZLdTcP7FSrX7PvHFTfrkSjdr+gB
1cGGrMJYP4DsRno+nBK4FNivUnfT28y9fwAMJH2bNWGGhi9YP9srcqsWiu+zrlVw
hFe+OHWcfR8xYsQoJ0apR0Q7oVZzBRc4LoxG6Hi5ch5HxabxWDhNvyjHO/UyX1Ap
ntGuHb+hhJwvGj464F0vCi7WiZOmH2Q9cRBMYOPzS5exASIhS9cVSF6hb+palvOa
dF4D7G3BAgMBAAECggEAD9YH/6mlp+9HQHFf72n1HpbduB/AHE8yASkXdYDfb9TD
LJp8wSNSLNS1SBK3/KhziY+urV9EUvwqfQlzO4bxvRz5sz5Yz3FAfWh+ffINCUzJ
UGC3g7ruyVMHC5mSoFoOw8f1v2VAZEAyhAhF08OeQcrlbOMiJt1FsgcFhATbQYMR
G0QCKqz7iuxQoV9TX9TUBBrIyK/6VDuNjccGXKtIGxtLEngRj8mERKRmQMlJzjWb
nD+DjjyOkOUQy4rlU8PmRDRoDhCLl6IaGnyTBT4dUlOYgB3j4ken2mqfSpQHG+Q8
fSEYbkd31jAKQ0/uMXOY10YOVtE+vswYgqKkDXZNvwKBgQDcYwF5N8DegKk1EEM6
jOFhYJkAeyxxCnti7dWsM1i0tTC1V225WPGHo6MNke+Kw63ZrqNd7LuYa48Z/een
YGfU+lSvqa1+RCyI2APCVhXX9PyV07xDWWFr93dSkonRPzm+GZuT+vXgroA3B2oT
vr6iHmIcJp9zCg9Qxyf/5Ul37wKBgQC4sGn6k44HJ5LgwzXY9mxYdYmvLU+rYbA4
XZkTIYvushov2zToncqUNWc7ic7faXngp0lDG9Uw4YU3wkLVrJ5XXCysgz8jfFbA
oOYfzaR2peMT6xGU++h5esae9X2GwOPymiJA/C4fB4ooqfmDtlm9kXbfynbUTOiI
ijBRpONFTwKBgD6N85sekiYVyvF+3jY+SrLDImqai7DCUudvrpikMmeIjnzKhiB3
+IaRkfSGGcH/bNc+1KwSR+UpkoLEKP6/RHmVXHhH5zDR1Po6pkaA/M5BgXhdkzBi
rF5i7YGIionUMmWdCyXjs+rEXSxBdICKQb3uddabt+KFVneNL/NYd5QNAoGAV6mM
tB5DhMvY4Ixny7KznI01rAtizGMS5L4wgS8kH0k0OtDeXSdAV3a9qDnyEoMbEXH1
yT+1wnzY4a14UbmccrTSk5O8bViASPBWKnROgu6cSQEDmGa1YqvPCPZW/ZYi3C0i
4xuPvLS0dDaxsz3jfKJF/VU5b+2NVfnZk3cjVOsCgYEAs7wzSomAwxYLDgKD0XLD
kUUqKc/Jbt8jWGbr7PFluZxfM9H0KjRrFRgOzB6hPIe1gL2+EjXz/4ABP3glt3dh
CW7kO2Lf3fi+pkTq+7G/VbDjltUlcq2cyJ01TxL7hgWkWnOmwj79gnEJVwrC11+U
Mp2hNKPfBxMo/OR786RX0Bg=
-----END PRIVATE KEY-----`,
  }),
  storageBucket: 'spektif-agency-final-prod.firebasestorage.app',
});

// Get the main database
const db = admin.firestore(); // main database (us-central1)

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from spektif-agency to default database...');

    // Create sample data in the default database
    const sampleData = {
      users: {
        admin: {
          id: 'admin',
          email: 'admin@spektif.com',
          name: 'Admin User',
          role: 'ADMIN',
          organizationId: 'spektif-agency',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      organizations: {
        'spektif-agency': {
          id: 'spektif-agency',
          name: 'Spektif Agency',
          members: ['admin'],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      boards: {
        'board-1': {
          id: 'board-1',
          title: 'Proje Yönetimi',
          description: 'Ana proje yönetim panosu',
          organizationId: 'spektif-agency',
          createdBy: 'admin',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      lists: {
        'list-1': {
          id: 'list-1',
          title: 'Yapılacaklar',
          boardId: 'board-1',
          order: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        'list-2': {
          id: 'list-2',
          title: 'Devam Eden',
          boardId: 'board-1',
          order: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        'list-3': {
          id: 'list-3',
          title: 'Tamamlandı',
          boardId: 'board-1',
          order: 2,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      cards: {
        'card-1': {
          id: 'card-1',
          title: 'Web Sitesi Tasarımı',
          description: 'Ana sayfa ve iç sayfaların tasarımı',
          listId: 'list-1',
          boardId: 'board-1',
          assignedTo: 'admin',
          priority: 'HIGH',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        'card-2': {
          id: 'card-2',
          title: 'Veritabanı Kurulumu',
          description: 'Firebase Firestore veritabanı kurulumu',
          listId: 'list-2',
          boardId: 'board-1',
          assignedTo: 'admin',
          priority: 'MEDIUM',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    };

    // Create data in main database
    for (const [collection, docs] of Object.entries(sampleData)) {
      console.log(`📝 Creating ${collection} collection...`);
      for (const [docId, docData] of Object.entries(docs)) {
        await db.collection(collection).doc(docId).set(docData);
        console.log(`  ✅ Created ${collection}/${docId}`);
      }
    }

    console.log('🎉 Data migration completed successfully!');
    console.log('📊 Created collections: users, organizations, boards, lists, cards');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();
