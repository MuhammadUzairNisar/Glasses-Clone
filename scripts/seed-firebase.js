/**
 * Firebase Database Seeding Script
 * 
 * This script seeds the Firebase Firestore database with initial data
 * and creates authentication users.
 * 
 * Usage: node scripts/seed-firebase.js
 * 
 * Make sure to set up your Firebase service account key:
 * 1. Download service account key from Firebase Console
 * 2. Save it as 'firebase-service-account.json' in the root directory
 * 3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✓ Firebase Admin already initialized');
      return;
    }

    // Try to use service account key file
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✓ Firebase Admin initialized with service account key');
    } else {
      // Try to use default credentials (for Firebase emulator or environment variable)
      admin.initializeApp();
      console.log('✓ Firebase Admin initialized with default credentials');
    }
  } catch (error) {
    if (error.code === 'app/already-exists') {
      console.log('✓ Firebase Admin already initialized');
      return;
    }
    console.error('✗ Error initializing Firebase Admin:', error.message);
    console.error('\nPlease ensure you have:');
    console.error('1. A firebase-service-account.json file in the root directory, OR');
    console.error('2. GOOGLE_APPLICATION_CREDENTIALS environment variable set');
    console.error('\nSee scripts/SETUP.md for detailed instructions.');
    process.exit(1);
  }
}

// Create authentication users
async function createAuthUsers() {
  console.log('\n📝 Creating authentication users...');
  
  const users = [
    {
      email: 'admin@hajinawabopticals.com',
      password: 'Admin@123',
      displayName: 'Admin User',
      emailVerified: true
    },
    {
      email: 'staff@hajinawabopticals.com',
      password: 'Staff@123',
      displayName: 'Staff User',
      emailVerified: true
    }
  ];

  const createdUsers = [];
  
  for (const userData of users) {
    try {
      // Check if user already exists
      let user;
      try {
        user = await admin.auth().getUserByEmail(userData.email);
        console.log(`  ⚠ User ${userData.email} already exists, skipping...`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // User doesn't exist, create it
          user = await admin.auth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
            emailVerified: userData.emailVerified
          });
          console.log(`  ✓ Created user: ${userData.email}`);
        } else {
          throw error;
        }
      }
      
      createdUsers.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
    } catch (error) {
      console.error(`  ✗ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

// Generate a strong password
function generateStrongPassword(length = 20) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each set
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Update passwords for specific users
async function updateUserPasswords() {
  console.log('\n🔐 Updating user passwords...');
  
  const usersToUpdate = [
    {
      email: 'admin@hajinawabopticals.com',
      displayName: 'Admin User',
      password: 'H@j!N@w@b@dm!n2024#Opt!c@ls'
    },
    {
      email: 'staff@hajinawabopticals.com',
      displayName: 'Staff User',
      password: 'H@j!N@w@bSt@ff2024#Opt!c@ls'
    }
  ];

  const updatedUsers = [];
  
  for (const userData of usersToUpdate) {
    try {
      // Get user by email
      const user = await admin.auth().getUserByEmail(userData.email);
      
      // Update the user's password with the fixed strong password
      await admin.auth().updateUser(user.uid, {
        password: userData.password
      });
      
      console.log(`  ✓ Updated password for: ${userData.email}`);
      console.log(`    New Password: ${userData.password}`);
      
      updatedUsers.push({
        email: userData.email,
        displayName: userData.displayName,
        password: userData.password
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`  ⚠ User ${userData.email} not found, skipping...`);
      } else {
        console.error(`  ✗ Error updating password for ${userData.email}:`, error.message);
      }
    }
  }
  
  return updatedUsers;
}

// Seed Categories
async function seedCategories() {
  console.log('\n📦 Seeding categories...');
  
  const db = admin.firestore();
  const categoriesRef = db.collection('categories');
  
  const categories = [
    {
      name: 'Frames',
      description: 'Eyeglass frames in various styles and materials',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Lenses',
      description: 'Prescription lenses for eyeglasses',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Sunglasses',
      description: 'Sunglasses and tinted lenses',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Contact Lenses',
      description: 'Contact lenses and accessories',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Accessories',
      description: 'Eyeglass accessories and cleaning supplies',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  const categoryIds = [];
  
  for (const category of categories) {
    try {
      // Check if category already exists
      const existing = await categoriesRef.where('name', '==', category.name).limit(1).get();
      
      if (!existing.empty) {
        const docId = existing.docs[0].id;
        categoryIds.push(docId);
        console.log(`  ⚠ Category "${category.name}" already exists, using existing...`);
      } else {
        const docRef = await categoriesRef.add(category);
        categoryIds.push(docRef.id);
        console.log(`  ✓ Created category: ${category.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating category ${category.name}:`, error.message);
    }
  }
  
  return categoryIds;
}

// Seed Items
async function seedItems(categoryIds) {
  console.log('\n📋 Seeding items...');
  
  const db = admin.firestore();
  const itemsRef = db.collection('items');
  
  const items = [
    {
      name: 'Classic Black Frames',
      description: 'Classic black plastic frames',
      categoryId: categoryIds[0], // Frames
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Metal Rimless Frames',
      description: 'Lightweight metal rimless frames',
      categoryId: categoryIds[0], // Frames
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Single Vision Lenses',
      description: 'Standard single vision prescription lenses',
      categoryId: categoryIds[1], // Lenses
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Progressive Lenses',
      description: 'Progressive multifocal lenses',
      categoryId: categoryIds[1], // Lenses
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Polarized Sunglasses',
      description: 'Polarized sunglasses with UV protection',
      categoryId: categoryIds[2], // Sunglasses
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Daily Contact Lenses',
      description: 'Daily disposable contact lenses',
      categoryId: categoryIds[3], // Contact Lenses
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Lens Cleaning Kit',
      description: 'Complete lens cleaning kit with microfiber cloth',
      categoryId: categoryIds[4], // Accessories
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  const itemIds = [];
  
  for (const item of items) {
    try {
      // Check if item already exists
      const existing = await itemsRef.where('name', '==', item.name).limit(1).get();
      
      if (!existing.empty) {
        const docId = existing.docs[0].id;
        itemIds.push(docId);
        console.log(`  ⚠ Item "${item.name}" already exists, using existing...`);
      } else {
        const docRef = await itemsRef.add(item);
        itemIds.push(docRef.id);
        console.log(`  ✓ Created item: ${item.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating item ${item.name}:`, error.message);
    }
  }
  
  return itemIds;
}

// Seed Stock
async function seedStock(itemIds) {
  console.log('\n📊 Seeding stock...');
  
  const db = admin.firestore();
  const stockRef = db.collection('stock');
  
  const stockItems = [
    {
      itemName: 'Classic Black Frames',
      itemId: itemIds[0],
      description: 'Classic black plastic frames - various sizes',
      quantity: 50,
      price: 2500.00,
      supplier: 'Frame Supplier Co.',
      sku: 'FRM-BLK-001',
      lowStockThreshold: 10,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemName: 'Metal Rimless Frames',
      itemId: itemIds[1],
      description: 'Lightweight metal rimless frames',
      quantity: 30,
      price: 3500.00,
      supplier: 'Frame Supplier Co.',
      sku: 'FRM-MTL-001',
      lowStockThreshold: 10,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemName: 'Single Vision Lenses',
      itemId: itemIds[2],
      description: 'Standard single vision prescription lenses',
      quantity: 100,
      price: 1500.00,
      supplier: 'Lens Manufacturer Inc.',
      sku: 'LNS-SV-001',
      lowStockThreshold: 20,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemName: 'Progressive Lenses',
      itemId: itemIds[3],
      description: 'Progressive multifocal lenses',
      quantity: 40,
      price: 5000.00,
      supplier: 'Lens Manufacturer Inc.',
      sku: 'LNS-PRG-001',
      lowStockThreshold: 10,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemName: 'Polarized Sunglasses',
      itemId: itemIds[4],
      description: 'Polarized sunglasses with UV protection',
      quantity: 25,
      price: 2000.00,
      supplier: 'Sunglass Distributor Ltd.',
      sku: 'SUN-POL-001',
      lowStockThreshold: 5,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemName: 'Daily Contact Lenses',
      itemId: itemIds[5],
      description: 'Daily disposable contact lenses - 30 pack',
      quantity: 60,
      price: 3000.00,
      supplier: 'Contact Lens Co.',
      sku: 'CL-DLY-001',
      lowStockThreshold: 15,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemName: 'Lens Cleaning Kit',
      itemId: itemIds[6],
      description: 'Complete lens cleaning kit with microfiber cloth',
      quantity: 80,
      price: 500.00,
      supplier: 'Accessories Supply Co.',
      sku: 'ACC-CLK-001',
      lowStockThreshold: 20,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  let createdCount = 0;
  
  for (const stockItem of stockItems) {
    try {
      // Check if stock item already exists
      const existing = await stockRef.where('sku', '==', stockItem.sku).limit(1).get();
      
      if (!existing.empty) {
        console.log(`  ⚠ Stock item with SKU "${stockItem.sku}" already exists, skipping...`);
      } else {
        await stockRef.add(stockItem);
        createdCount++;
        console.log(`  ✓ Created stock item: ${stockItem.itemName} (SKU: ${stockItem.sku})`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating stock item ${stockItem.itemName}:`, error.message);
    }
  }
  
  return createdCount;
}

// Seed Sample Customers
async function seedCustomers() {
  console.log('\n👥 Seeding sample customers...');
  
  const db = admin.firestore();
  const customersRef = db.collection('customers');
  
  const customers = [
    {
      customerId: 'CUST-001',
      phoneNumber: '03001234567',
      customerName: 'Ahmed Ali',
      familyMember: 'Ahmed Ali',
      familyMemberRelation: 'Self',
      doctorName: 'Dr. Muhammad Ali',
      prescription: {
        right: {
          sph: '-2.50',
          cyl: '-0.75',
          axis: '180'
        },
        left: {
          sph: '-2.25',
          cyl: '-0.50',
          axis: '175'
        },
        ipd: '64.0',
        add: '2.00'
      },
      notes: 'Regular customer, prefers lightweight frames',
      products: [
        {
          category: 'frames',
          description: 'Metal Rimless Frames',
          qty: 1,
          price: 3500.00,
          total: 3500.00
        },
        {
          category: 'lenses',
          description: 'Progressive Lenses',
          qty: 1,
          price: 5000.00,
          total: 5000.00
        }
      ],
      payment: {
        amount: 8500.00,
        paid: 8500.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-002',
      phoneNumber: '03009876543',
      customerName: 'Fatima Khan',
      familyMember: 'Zainab',
      familyMemberRelation: 'Daughter',
      doctorName: 'Dr. Sarah Ahmed',
      prescription: {
        right: {
          sph: '+1.50',
          cyl: '-0.25',
          axis: '90'
        },
        left: {
          sph: '+1.75',
          cyl: '-0.25',
          axis: '85'
        },
        ipd: '62.0',
        add: '1.50'
      },
      notes: 'First-time customer, needs follow-up',
      products: [
        {
          category: 'frames',
          description: 'Classic Black Frames',
          qty: 1,
          price: 2500.00,
          total: 2500.00
        },
        {
          category: 'lenses',
          description: 'Single Vision Lenses',
          qty: 1,
          price: 1500.00,
          total: 1500.00
        }
      ],
      payment: {
        amount: 4000.00,
        paid: 2000.00,
        remaining: 2000.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-003',
      phoneNumber: '03005556677',
      customerName: 'Hassan Raza',
      familyMember: 'Ali',
      familyMemberRelation: 'Son',
      doctorName: 'Dr. Ahmed Khan',
      prescription: {
        right: {
          sph: '',
          cyl: '',
          axis: ''
        },
        left: {
          sph: '',
          cyl: '',
          axis: ''
        },
        ipd: '',
        add: ''
      },
      notes: 'Purchased sunglasses only',
      products: [
        {
          category: 'sunglasses',
          description: 'Polarized Sunglasses',
          qty: 1,
          price: 2000.00,
          total: 2000.00
        }
      ],
      payment: {
        amount: 2000.00,
        paid: 2000.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-004',
      phoneNumber: '03001234567',
      customerName: 'Ahmed Ali',
      familyMember: 'Sara',
      familyMemberRelation: 'Wife',
      doctorName: 'Dr. Muhammad Ali',
      prescription: {
        right: {
          sph: '-1.75',
          cyl: '-0.50',
          axis: '90'
        },
        left: {
          sph: '-2.00',
          cyl: '-0.50',
          axis: '85'
        },
        ipd: '60.0',
        add: '1.75'
      },
      notes: 'Wife of Ahmed Ali, same phone number',
      products: [
        {
          category: 'frames',
          description: 'Designer Frames',
          qty: 1,
          price: 4000.00,
          total: 4000.00
        },
        {
          category: 'lenses',
          description: 'Anti-glare Lenses',
          qty: 1,
          price: 3000.00,
          total: 3000.00
        }
      ],
      payment: {
        amount: 7000.00,
        paid: 7000.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-005',
      phoneNumber: '03001234567',
      customerName: 'Ahmed Ali',
      familyMember: 'Omar',
      familyMemberRelation: 'Son',
      doctorName: 'Dr. Muhammad Ali',
      prescription: {
        right: {
          sph: '-3.00',
          cyl: '-1.00',
          axis: '180'
        },
        left: {
          sph: '-3.25',
          cyl: '-1.25',
          axis: '175'
        },
        ipd: '58.0',
        add: ''
      },
      notes: 'Son of Ahmed Ali, teenager',
      products: [
        {
          category: 'frames',
          description: 'Youth Frames',
          qty: 1,
          price: 2000.00,
          total: 2000.00
        },
        {
          category: 'lenses',
          description: 'Single Vision Lenses',
          qty: 1,
          price: 2000.00,
          total: 2000.00
        }
      ],
      payment: {
        amount: 4000.00,
        paid: 4000.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-006',
      phoneNumber: '03009876543',
      customerName: 'Fatima Khan',
      familyMember: 'Fatima Khan',
      familyMemberRelation: 'Self',
      doctorName: 'Dr. Sarah Ahmed',
      prescription: {
        right: {
          sph: '',
          cyl: '',
          axis: ''
        },
        left: {
          sph: '',
          cyl: '',
          axis: ''
        },
        ipd: '',
        add: ''
      },
      notes: 'Self purchase, no prescription needed',
      products: [
        {
          category: 'sunglasses',
          description: 'Designer Sunglasses',
          qty: 1,
          price: 3500.00,
          total: 3500.00
        }
      ],
      payment: {
        amount: 3500.00,
        paid: 3500.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-007',
      phoneNumber: '03009876543',
      customerName: 'Fatima Khan',
      familyMember: 'Ayesha',
      familyMemberRelation: 'Daughter',
      doctorName: 'Dr. Sarah Ahmed',
      prescription: {
        right: {
          sph: '+2.00',
          cyl: '-0.75',
          axis: '90'
        },
        left: {
          sph: '+2.25',
          cyl: '-0.75',
          axis: '85'
        },
        ipd: '59.0',
        add: ''
      },
      notes: 'Daughter of Fatima Khan',
      products: [
        {
          category: 'frames',
          description: 'Pink Frames',
          qty: 1,
          price: 3000.00,
          total: 3000.00
        },
        {
          category: 'lenses',
          description: 'Blue Light Filter Lenses',
          qty: 1,
          price: 2500.00,
          total: 2500.00
        }
      ],
      payment: {
        amount: 5500.00,
        paid: 3000.00,
        remaining: 2500.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-008',
      phoneNumber: '03005556677',
      customerName: 'Hassan Raza',
      familyMember: 'Hassan Raza',
      familyMemberRelation: 'Self',
      doctorName: 'Dr. Ahmed Khan',
      prescription: {
        right: {
          sph: '-4.50',
          cyl: '-1.50',
          axis: '180'
        },
        left: {
          sph: '-4.75',
          cyl: '-1.75',
          axis: '175'
        },
        ipd: '66.0',
        add: '2.50'
      },
      notes: 'Self purchase with high prescription',
      products: [
        {
          category: 'frames',
          description: 'Premium Frames',
          qty: 1,
          price: 5000.00,
          total: 5000.00
        },
        {
          category: 'lenses',
          description: 'High Index Lenses',
          qty: 1,
          price: 6000.00,
          total: 6000.00
        }
      ],
      payment: {
        amount: 11000.00,
        paid: 5000.00,
        remaining: 6000.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-009',
      phoneNumber: '03005556677',
      customerName: 'Hassan Raza',
      familyMember: 'Bilal',
      familyMemberRelation: 'Brother',
      doctorName: 'Dr. Ahmed Khan',
      prescription: {
        right: {
          sph: '-2.00',
          cyl: '-0.50',
          axis: '90'
        },
        left: {
          sph: '-2.25',
          cyl: '-0.75',
          axis: '85'
        },
        ipd: '64.0',
        add: ''
      },
      notes: 'Brother of Hassan Raza',
      products: [
        {
          category: 'frames',
          description: 'Classic Frames',
          qty: 1,
          price: 3000.00,
          total: 3000.00
        },
        {
          category: 'lenses',
          description: 'Standard Lenses',
          qty: 1,
          price: 2000.00,
          total: 2000.00
        }
      ],
      payment: {
        amount: 5000.00,
        paid: 5000.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-010',
      phoneNumber: '03001112233',
      customerName: 'Mohammad Shah',
      familyMember: 'Mohammad Shah',
      familyMemberRelation: 'Self',
      doctorName: 'Dr. Zainab Malik',
      prescription: {
        right: {
          sph: '-1.50',
          cyl: '-0.25',
          axis: '180'
        },
        left: {
          sph: '-1.75',
          cyl: '-0.25',
          axis: '175'
        },
        ipd: '65.0',
        add: '2.00'
      },
      notes: 'New customer',
      products: [
        {
          category: 'frames',
          description: 'Metal Frames',
          qty: 1,
          price: 3500.00,
          total: 3500.00
        },
        {
          category: 'lenses',
          description: 'Progressive Lenses',
          qty: 1,
          price: 5500.00,
          total: 5500.00
        }
      ],
      payment: {
        amount: 9000.00,
        paid: 9000.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-011',
      phoneNumber: '03001112233',
      customerName: 'Mohammad Shah',
      familyMember: 'Amina',
      familyMemberRelation: 'Wife',
      doctorName: 'Dr. Zainab Malik',
      prescription: {
        right: {
          sph: '+1.25',
          cyl: '-0.50',
          axis: '90'
        },
        left: {
          sph: '+1.50',
          cyl: '-0.50',
          axis: '85'
        },
        ipd: '61.0',
        add: '1.50'
      },
      notes: 'Wife of Mohammad Shah',
      products: [
        {
          category: 'frames',
          description: 'Elegant Frames',
          qty: 1,
          price: 4000.00,
          total: 4000.00
        },
        {
          category: 'lenses',
          description: 'Bifocal Lenses',
          qty: 1,
          price: 4000.00,
          total: 4000.00
        }
      ],
      payment: {
        amount: 8000.00,
        paid: 4000.00,
        remaining: 4000.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-012',
      phoneNumber: '03001112233',
      customerName: 'Mohammad Shah',
      familyMember: 'Yusuf',
      familyMemberRelation: 'Son',
      doctorName: 'Dr. Zainab Malik',
      prescription: {
        right: {
          sph: '-2.50',
          cyl: '-1.00',
          axis: '180'
        },
        left: {
          sph: '-2.75',
          cyl: '-1.25',
          axis: '175'
        },
        ipd: '57.0',
        add: ''
      },
      notes: 'Son of Mohammad Shah',
      products: [
        {
          category: 'frames',
          description: 'Sports Frames',
          qty: 1,
          price: 2500.00,
          total: 2500.00
        },
        {
          category: 'lenses',
          description: 'Impact Resistant Lenses',
          qty: 1,
          price: 3000.00,
          total: 3000.00
        }
      ],
      payment: {
        amount: 5500.00,
        paid: 5500.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      customerId: 'CUST-013',
      phoneNumber: '03001112233',
      customerName: 'Mohammad Shah',
      familyMember: 'Maryam',
      familyMemberRelation: 'Daughter',
      doctorName: 'Dr. Zainab Malik',
      prescription: {
        right: {
          sph: '',
          cyl: '',
          axis: ''
        },
        left: {
          sph: '',
          cyl: '',
          axis: ''
        },
        ipd: '',
        add: ''
      },
      notes: 'Daughter of Mohammad Shah, sunglasses only',
      products: [
        {
          category: 'sunglasses',
          description: 'Fashion Sunglasses',
          qty: 1,
          price: 1500.00,
          total: 1500.00
        }
      ],
      payment: {
        amount: 1500.00,
        paid: 1500.00,
        remaining: 0.00
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  let createdCount = 0;
  let updatedCount = 0;
  
  for (const customer of customers) {
    try {
      // Check if customer already exists
      const existing = await customersRef.where('customerId', '==', customer.customerId).limit(1).get();
      
      if (!existing.empty) {
        // Customer exists, update with doctor name if missing
        const existingDoc = existing.docs[0];
        const existingData = existingDoc.data();
        const docId = existingDoc.id;
        
        // Check if doctorName is missing or empty
        if (!existingData.doctorName || existingData.doctorName === '') {
          await customersRef.doc(docId).update({
            doctorName: customer.doctorName || ''
          });
          updatedCount++;
          console.log(`  ✓ Updated customer "${customer.customerId}" with doctor name: ${customer.doctorName || 'N/A'}`);
        } else {
          console.log(`  ⚠ Customer "${customer.customerId}" already exists with doctor name, skipping...`);
        }
      } else {
        await customersRef.add(customer);
        createdCount++;
        console.log(`  ✓ Created customer: ${customer.customerName} (${customer.customerId})`);
      }
    } catch (error) {
      console.error(`  ✗ Error processing customer ${customer.customerName}:`, error.message);
    }
  }
  
  console.log(`\n  Summary: ${createdCount} created, ${updatedCount} updated`);
  return createdCount;
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🚀 Starting Firebase database seeding...\n');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Create auth users
    const users = await createAuthUsers();
    
    // Seed categories
    const categoryIds = await seedCategories();
    
    // Seed items (depends on categories)
    const itemIds = await seedItems(categoryIds);
    
    // Seed stock (depends on items)
    const stockCount = await seedStock(itemIds);
    
    // Seed customers
    const customerCount = await seedCustomers();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Seeding completed successfully!');
    console.log('='.repeat(50));
    console.log(`\nSummary:`);
    console.log(`  - Auth Users: ${users.length}`);
    console.log(`  - Categories: ${categoryIds.length}`);
    console.log(`  - Items: ${itemIds.length}`);
    console.log(`  - Stock Items: ${stockCount}`);
    console.log(`  - Customers: ${customerCount}`);
    console.log('\n📧 Created Auth Users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.displayName})`);
    });
    console.log('\n✨ Database is ready to use!');
    
  } catch (error) {
    console.error('\n✗ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close Firebase Admin
    process.exit(0);
  }
}

// Function to only update passwords
async function updatePasswordsOnly() {
  try {
    console.log('🚀 Starting password update...\n');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Update passwords
    const updatedUsers = await updateUserPasswords();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Password update completed successfully!');
    console.log('='.repeat(50));
    console.log(`\n📧 Updated Passwords:`);
    updatedUsers.forEach(user => {
      console.log(`\n  Email: ${user.email}`);
      console.log(`  Display Name: ${user.displayName}`);
      console.log(`  New Password: ${user.password}`);
      console.log(`  ⚠️  IMPORTANT: Save this password securely!`);
    });
    console.log('\n✨ Passwords have been updated!');
    
  } catch (error) {
    console.error('\n✗ Error during password update:', error);
    process.exit(1);
  } finally {
    // Close Firebase Admin
    process.exit(0);
  }
}

// Function to add due dates to existing customers
async function addDueDatesToCustomers() {
  console.log('\n📅 Adding due dates to existing customers...');
  
  const db = admin.firestore();
  const customersRef = db.collection('customers');
  
  try {
    // Get all customers
    const snapshot = await customersRef.get();
    
    if (snapshot.empty) {
      console.log('  ⚠ No customers found in database');
      return 0;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Process each customer
    const docs = snapshot.docs;
    let currentBatch = db.batch();
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const customerData = doc.data();
      
      // Only update if dueDate is missing or empty
      if (!customerData.dueDate || customerData.dueDate === '' || customerData.dueDate.trim() === '') {
        // Set a default due date (30 days from creation date, or current date if no creation date)
        let defaultDueDate = '';
        
        if (customerData.createdAt) {
          // If createdAt exists, calculate 30 days from creation
          let createdDate;
          if (customerData.createdAt.toDate) {
            createdDate = customerData.createdAt.toDate();
          } else if (customerData.createdAt.seconds) {
            createdDate = new Date(customerData.createdAt.seconds * 1000);
          } else if (customerData.createdAt._seconds) {
            createdDate = new Date(customerData.createdAt._seconds * 1000);
          } else {
            createdDate = new Date();
          }
          
          // Add 30 days
          const dueDate = new Date(createdDate);
          dueDate.setDate(dueDate.getDate() + 30);
          
          // Format as YYYY-MM-DD
          defaultDueDate = dueDate.toISOString().split('T')[0];
        } else {
          // If no creation date, use current date + 30 days
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          defaultDueDate = dueDate.toISOString().split('T')[0];
        }
        
        currentBatch.update(doc.ref, { dueDate: defaultDueDate });
        batchCount++;
        updatedCount++;
        
        // Commit batch if it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          await currentBatch.commit();
          console.log(`  ✓ Committed batch of ${batchCount} updates...`);
          currentBatch = db.batch();
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} updates...`);
    }
    
    console.log(`  ✓ Updated ${updatedCount} customers with due dates`);
    if (skippedCount > 0) {
      console.log(`  ⚠ Skipped ${skippedCount} customers (already have due dates)`);
    }
    
    return updatedCount;
  } catch (error) {
    console.error('  ✗ Error adding due dates:', error.message);
    console.error('  Full error:', error);
    throw error;
  }
}

// Function to only add due dates
async function addDueDatesOnly() {
  try {
    console.log('🚀 Starting due date update...\n');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Add due dates to existing customers
    const updatedCount = await addDueDatesToCustomers();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Due date update completed successfully!');
    console.log('='.repeat(50));
    console.log(`\n📅 Updated ${updatedCount} customers with due dates`);
    console.log('\n✨ Due dates have been added to existing customers!');
    
  } catch (error) {
    console.error('\n✗ Error during due date update:', error);
    process.exit(1);
  } finally {
    // Close Firebase Admin
    process.exit(0);
  }
}

// Run the seeding script
if (require.main === module) {
  // Check if --update-passwords flag is passed
  if (process.argv.includes('--update-passwords')) {
    updatePasswordsOnly();
  } else if (process.argv.includes('--add-due-dates')) {
    addDueDatesOnly();
  } else {
    seedDatabase();
  }
}

module.exports = { seedDatabase, updatePasswordsOnly, addDueDatesToCustomers, addDueDatesOnly };

