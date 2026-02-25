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

const COLLECTION_NAME = 'categories';

// Get all categories
export const getCategories = async () => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(categoriesRef);
    const categories = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (id) => {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(categoryRef);
    if (snapshot.exists()) {
      return { _id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (categoryData) => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const newCategory = {
      ...categoryData,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(categoriesRef, newCategory);
    return { _id: docRef.id, ...newCategory };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (id, categoryData) => {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
    return { _id: id, ...categoryData };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id) => {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(categoryRef);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

