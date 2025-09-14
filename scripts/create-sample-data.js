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

const db = admin.firestore();

async function createSampleData() {
  console.log('🚀 Creating sample data...');

  try {
    // Create organization
    await db.collection('organizations').doc('spektif-agency').set({
      id: 'spektif-agency',
      name: 'Spektif Agency',
      members: ['admin'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Organization created');

    // Create board
    await db.collection('boards').doc('sample-board-1').set({
      id: 'sample-board-1',
      title: 'Proje Yönetimi',
      description: 'Ana proje yönetim panosu',
      organizationId: 'spektif-agency',
      members: ['admin'],
      color: '#3B82F6',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Board created');

    // Create sample lists
    const lists = [
      { id: 'list-1', title: 'Yapılacaklar', position: 0 },
      { id: 'list-2', title: 'Devam Eden', position: 1 },
      { id: 'list-3', title: 'Tamamlandı', position: 2 }
    ];

    for (const list of lists) {
      await db.collection('boards').doc('sample-board-1').collection('lists').doc(list.id).set({
        ...list,
        boardId: 'sample-board-1',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Lists created');

    // Create sample cards
    const cards = [
      {
        id: 'card-1',
        title: 'Web sitesi tasarımı',
        description: 'Ana sayfa ve iç sayfaların tasarımı',
        listId: 'list-1',
        position: 0,
        members: ['admin'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'card-2',
        title: 'Veritabanı kurulumu',
        description: 'Firebase Firestore veritabanı yapılandırması',
        listId: 'list-2',
        position: 0,
        members: ['admin'],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'card-3',
        title: 'Test ve deploy',
        description: 'Uygulamanın test edilmesi ve production\'a deploy edilmesi',
        listId: 'list-3',
        position: 0,
        members: ['admin'],
        dueDate: new Date().toISOString()
      }
    ];

    for (const card of cards) {
      await db.collection('boards').doc('sample-board-1').collection('cards').doc(card.id).set({
        ...card,
        boardId: 'sample-board-1',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Cards created');

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
        organizationId: 'spektif-agency'
      },
      {
        id: 'emp-2',
        email: 'jane.smith@spektif.com',
        name: 'Jane',
        surname: 'Smith',
        position: 'Backend Developer',
        phone: '+90 555 987 6543',
        role: 'employee',
        organizationId: 'spektif-agency'
      }
    ];

    for (const employee of employees) {
      await db.collection('users').doc(employee.id).set({
        ...employee,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Employees created');

    console.log('🎉 All sample data created successfully!');
    console.log('📊 Created:');
    console.log('  - 1 organization');
    console.log('  - 1 board with 3 lists and 3 cards');
    console.log('  - 2 employees');
    console.log('  - 1 admin user (already exists)');

  } catch (error) {
    console.error('❌ Error creating data:', error);
  } finally {
    process.exit(0);
  }
}

createSampleData();
