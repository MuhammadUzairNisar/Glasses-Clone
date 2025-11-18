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

const COLLECTION_NAME = 'customers';

// Get all customers
export const getCustomers = async () => {
  try {
    const customersRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(customersRef);
    const customers = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Get customer by ID
export const getCustomerById = async (id) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(customerRef);
    if (snapshot.exists()) {
      return { _id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
};

// Search customers by phone number
export const searchCustomersByPhone = async (phoneNumber) => {
  try {
    const customersRef = collection(db, COLLECTION_NAME);
    const q = query(customersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    return customers;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

// Create a new customer
export const createCustomer = async (customerData) => {
  try {
    const customersRef = collection(db, COLLECTION_NAME);
    const newCustomer = {
      ...customerData,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(customersRef, newCustomer);
    return { _id: docRef.id, ...newCustomer };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id, customerData) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(customerRef, {
      ...customerData,
      updatedAt: serverTimestamp()
    });
    return { _id: id, ...customerData };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(customerRef);
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

