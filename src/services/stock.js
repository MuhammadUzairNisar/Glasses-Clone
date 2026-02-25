import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'stock';

// Get all stock items
export const getStockItems = async (filters = {}) => {
  try {
    let stockRef = collection(db, COLLECTION_NAME);
    
    // Apply filters if provided
    if (filters.lowStock) {
      // Note: Firestore doesn't support complex queries easily for low stock
      // We'll filter in JavaScript after fetching
      const snapshot = await getDocs(stockRef);
      const stockItems = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const stockData = { _id: doc.id, ...doc.data() };
          
          // Fetch item details if itemId exists
          if (stockData.itemId) {
            try {
              const itemRef = typeof stockData.itemId === 'string' 
                ? doc(db, 'items', stockData.itemId)
                : stockData.itemId;
              const itemSnap = await getDoc(itemRef);
              if (itemSnap.exists()) {
                stockData.itemId = {
                  _id: itemSnap.id,
                  ...itemSnap.data()
                };
              }
            } catch (error) {
              console.error('Error fetching item for stock:', error);
            }
          }
          
          return stockData;
        })
      );
      
      // Filter for low stock if requested
      if (filters.lowStock === 'true') {
        return stockItems.filter(item => 
          item.quantity <= (item.lowStockThreshold || 10)
        );
      }
      
      return stockItems;
    } else {
      const snapshot = await getDocs(stockRef);
      const stockItems = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const stockData = { _id: doc.id, ...doc.data() };
          
          // Fetch item details if itemId exists
          if (stockData.itemId) {
            try {
              const itemRef = typeof stockData.itemId === 'string' 
                ? doc(db, 'items', stockData.itemId)
                : stockData.itemId;
              const itemSnap = await getDoc(itemRef);
              if (itemSnap.exists()) {
                stockData.itemId = {
                  _id: itemSnap.id,
                  ...itemSnap.data()
                };
              }
            } catch (error) {
              console.error('Error fetching item for stock:', error);
            }
          }
          
          return stockData;
        })
      );
      
      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return stockItems.filter(item => 
          item.itemName?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.sku?.toLowerCase().includes(searchTerm)
        );
      }
      
      return stockItems;
    }
  } catch (error) {
    console.error('Error fetching stock items:', error);
    throw error;
  }
};

// Get stock item by ID
export const getStockItemById = async (id) => {
  try {
    const stockRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(stockRef);
    if (snapshot.exists()) {
      return { _id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching stock item:', error);
    throw error;
  }
};

// Create a new stock item
export const createStockItem = async (stockData) => {
  try {
    const stockRef = collection(db, COLLECTION_NAME);
    const newStock = {
      ...stockData,
      quantity: parseFloat(stockData.quantity) || 0,
      price: parseFloat(stockData.price) || 0,
      lowStockThreshold: parseFloat(stockData.lowStockThreshold) || 10,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(stockRef, newStock);
    return { _id: docRef.id, ...newStock };
  } catch (error) {
    console.error('Error creating stock item:', error);
    throw error;
  }
};

// Update a stock item
export const updateStockItem = async (id, stockData) => {
  try {
    const stockRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(stockRef, {
      ...stockData,
      quantity: parseFloat(stockData.quantity) || 0,
      price: parseFloat(stockData.price) || 0,
      lowStockThreshold: parseFloat(stockData.lowStockThreshold) || 10,
      updatedAt: serverTimestamp()
    });
    return { _id: id, ...stockData };
  } catch (error) {
    console.error('Error updating stock item:', error);
    throw error;
  }
};

// Delete a stock item
export const deleteStockItem = async (id) => {
  try {
    const stockRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(stockRef);
    return true;
  } catch (error) {
    console.error('Error deleting stock item:', error);
    throw error;
  }
};

// Get stock statistics
export const getStockStats = async () => {
  try {
    const stockRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(stockRef);
    const stockItems = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    
    const stats = {
      totalItems: stockItems.length,
      totalQuantity: stockItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      totalValue: stockItems.reduce((sum, item) => 
        sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0
      ),
      lowStockCount: stockItems.filter(item => 
        (parseFloat(item.quantity) || 0) <= (parseFloat(item.lowStockThreshold) || 10)
      ).length
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching stock stats:', error);
    throw error;
  }
};

