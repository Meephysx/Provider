import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { Customer } from "../types/Customer";

const COLLECTION_NAME = "customers";

/**
 * Tambah customer baru ke Firestore
 */
export const addCustomer = async (data: Omit<Customer, "id" | "createdAt">) => {
  try {
    const customerData = {
      ...data,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), customerData);
    return {
      success: true,
      id: docRef.id,
      message: "Customer berhasil ditambahkan",
    };
  } catch (error) {
    console.error("Error adding customer:", error);
    throw error;
  }
};

/**
 * Ambil semua customers dari Firestore
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const customers: Customer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        nama: data.nama,
        wilayah: data.wilayah,
        alamat: data.alamat,
        no_hp: data.no_hp,
        paket: data.paket,
        harga: data.harga,
        tahunMulai: data.tahunMulai,
        status: data.status,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      });
    });

    return customers;
  } catch (error) {
    console.error("Error getting customers:", error);
    throw error;
  }
};

/**
 * Update customer berdasarkan ID
 */
export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(customerRef, data);
    return {
      success: true,
      message: "Customer berhasil diupdate",
    };
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

/**
 * Hapus customer berdasarkan ID
 */
export const deleteCustomer = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return {
      success: true,
      message: "Customer berhasil dihapus",
    };
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

/**
 * Query customers berdasarkan wilayah dan tahun mulai
 */
export const getCustomersByWilayahAndTahun = async (wilayah: string, tahunMulai: number): Promise<Customer[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("wilayah", "==", wilayah),
      where("tahunMulai", "==", tahunMulai)
    );
    const querySnapshot = await getDocs(q);
    const customers: Customer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        nama: data.nama,
        wilayah: data.wilayah,
        alamat: data.alamat,
        no_hp: data.no_hp,
        paket: data.paket,
        harga: data.harga,
        tahunMulai: data.tahunMulai,
        status: data.status,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      });
    });

    return customers;
  } catch (error) {
    console.error("Error getting customers by wilayah and tahun:", error);
    throw error;
  }
};
