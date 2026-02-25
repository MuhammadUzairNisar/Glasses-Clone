import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'items';

// Get all items
export const getItems = async () => {
  try {
    const itemsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(itemsRef);
    const items = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const itemData = { _id: doc.id, ...doc.data() };
        
        // If categoryId is a reference, fetch the category
        if (itemData.categoryId) {
          try {
            const categoryRef = typeof itemData.categoryId === 'string' 
              ? doc(db, 'categories', itemData.categoryId)
              : itemData.categoryId;
            const categorySnap = await getDoc(categoryRef);
            if (categorySnap.exists()) {
              itemData.categoryId = {
                _id: categorySnap.id,
                ...categorySnap.data()
              };
            }
          } catch (error) {
            console.error('Error fetching category for item:', error);
          }
        }
        
        return itemData;
      })
    );
    return items;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Get item by ID
export const getItemById = async (id) => {
  try {
    const itemRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(itemRef);
    if (snapshot.exists()) {
      return { _id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }
};

// Create a new item
export const createItem = async (itemData) => {
  try {
    const itemsRef = collection(db, COLLECTION_NAME);
    const newItem = {
      ...itemData,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(itemsRef, newItem);
    return { _id: docRef.id, ...newItem };
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

// Update an item
export const updateItem = async (id, itemData) => {
  try {
    const itemRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(itemRef, {
      ...itemData,
      updatedAt: serverTimestamp()
    });
    return { _id: id, ...itemData };
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

// Delete an item
export const deleteItem = async (id) => {
  try {
    const itemRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(itemRef);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

