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
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { Customer } from "../types/Customer";

const COLLECTION_NAME = "customers";

/**
 * Tambah customer baru ke Firestore
 */
export const addCustomer = async (data: Customer) => {
  try {
    const customerData = {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
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
      // Pastikan semua properti yang ada di Interface dipetakan di sini
      customers.push({
        id: doc.id,
        nama: data.nama || "",
        no_hp: data.no_hp || "",
        wilayah: data.wilayah || "",
        sektor: data.sektor || "-", // Beri nilai default agar tidak error missing property
        alamat: data.alamat || "",
        bandwidth: data.bandwidth || "-", // Beri nilai default
        paket: data.paket || "",
        harga: data.harga || 0,
        status: data.status || "aktif",
        tahun_mulai: data.tahun_mulai || data.tahunMulai || new Date().getFullYear(),
        created_at: data.created_at || data.createdAt || null,
        updated_at: data.updated_at || null,
      } as Customer);
    });

    return customers;
  } catch (error) {
    console.error("Error getting customers:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for customers
 */
export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  const q = collection(db, COLLECTION_NAME);
  return onSnapshot(q, (querySnapshot) => {
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        nama: data.nama || "",
        no_hp: data.no_hp || "",
        wilayah: data.wilayah || "",
        sektor: data.sektor || "-", // Beri nilai default agar tidak error missing property
        alamat: data.alamat || "",
        bandwidth: data.bandwidth || "-", // Beri nilai default
        paket: data.paket || "",
        harga: data.harga || 0,
        status: data.status || "aktif",
        tahun_mulai: data.tahun_mulai || data.tahunMulai || new Date().getFullYear(),
        created_at: data.created_at || data.createdAt || null,
        updated_at: data.updated_at || null,
      } as Customer);
    });
    callback(customers);
  }, (error) => {
    console.error("Error subscribing to customers:", error);
  });
};

/**
 * Update customer berdasarkan ID
 */
export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...data,
      updated_at: Timestamp.now(),
    };
    await updateDoc(customerRef, updateData);
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
    // Sesuaikan nama field query dengan yang ada di Firestore (tahun_mulai)
    const q = query(
      collection(db, COLLECTION_NAME),
      where("wilayah", "==", wilayah),
      where("tahun_mulai", "==", tahunMulai)
    );
    const querySnapshot = await getDocs(q);
    const customers: Customer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        nama: data.nama || "",
        no_hp: data.no_hp || "",
        wilayah: data.wilayah || "",
        sektor: data.sektor || "-",
        alamat: data.alamat || "",
        bandwidth: data.bandwidth || "-",
        paket: data.paket || "",
        harga: data.harga || 0,
        status: data.status || "aktif",
        tahun_mulai: data.tahun_mulai || tahunMulai,
        created_at: data.created_at || null,
        updated_at: data.updated_at || null,
      } as Customer);
    });

    return customers;
  } catch (error) {
    console.error("Error getting customers by wilayah and tahun:", error);
    throw error;
  }
};