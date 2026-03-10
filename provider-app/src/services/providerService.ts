import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Provider {
  id?: string;
  nama_provider: string;
  lokasi: string;
  kapasitas: number;
  status_online: boolean;
  created_at?: Timestamp;
}

const COLLECTION_NAME = "providers";

/**
 * Tambah provider baru ke Firestore
 */
export const addProvider = async (data: Omit<Provider, "id">) => {
  try {
    const providerData = {
      ...data,
      created_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), providerData);
    return {
      success: true,
      id: docRef.id,
      message: "Provider berhasil ditambahkan",
    };
  } catch (error) {
    console.error("Error adding provider:", error);
    throw error;
  }
};

/**
 * Ambil semua providers dari Firestore
 */
export const getProviders = async (): Promise<Provider[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const providers: Provider[] = [];

    querySnapshot.forEach((doc) => {
      providers.push({
        id: doc.id,
        ...(doc.data() as Omit<Provider, "id">),
      });
    });

    return providers;
  } catch (error) {
    console.error("Error getting providers:", error);
    throw error;
  }
};

/**
 * Update provider berdasarkan ID
 */
export const updateProvider = async (id: string, data: Partial<Provider>) => {
  try {
    const providerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(providerRef, data);
    return {
      success: true,
      message: "Provider berhasil diupdate",
    };
  } catch (error) {
    console.error("Error updating provider:", error);
    throw error;
  }
};

/**
 * Hapus provider berdasarkan ID
 */
export const deleteProvider = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return {
      success: true,
      message: "Provider berhasil dihapus",
    };
  } catch (error) {
    console.error("Error deleting provider:", error);
    throw error;
  }
};
