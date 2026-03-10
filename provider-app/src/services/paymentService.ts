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
import { Payment } from "../types/Customer";

const COLLECTION_NAME = "payments";

/**
 * Tambah payment baru ke Firestore
 */
export const addPayment = async (data: Omit<Payment, "id">) => {
  try {
    const paymentData = {
      ...data,
      tanggal_bayar: data.tanggal_bayar ? Timestamp.fromDate(data.tanggal_bayar) : null,
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), paymentData);
    const result = {
      success: true,
      id: docRef.id,
      message: "Payment berhasil ditambahkan",
    };
    window.dispatchEvent(new Event('paymentsUpdated'));
    return result;
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

/**
 * Ambil semua payments dari Firestore
 */
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const payments: Payment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        customer_id: data.customer_id,
        bulan: data.bulan,
        tahun: data.tahun,
        status_bayar: data.status_bayar,
        metode_pembayaran: data.metode_pembayaran,
        bank: data.bank,
        atas_nama_rekening: data.atas_nama_rekening,
        total_bayar: data.total_bayar,
        denda: data.denda,
        tanggal_bayar: data.tanggal_bayar ? data.tanggal_bayar.toDate() : null,
        created_at: data.created_at ? data.created_at.toDate() : undefined,
        updated_at: data.updated_at ? data.updated_at.toDate() : undefined,
      });
    });

    return payments;
  } catch (error) {
    console.error("Error getting payments:", error);
    throw error;
  }
};

/**
 * Update payment berdasarkan ID
 */
export const updatePayment = async (id: string, data: Partial<Payment>) => {
  try {
    const paymentRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...data };
    if (data.tanggal_bayar) {
      updateData.tanggal_bayar = Timestamp.fromDate(data.tanggal_bayar);
    }
    await updateDoc(paymentRef, updateData);
    const result = {
      success: true,
      message: "Payment berhasil diupdate",
    };
    window.dispatchEvent(new Event('paymentsUpdated'));
    return result;
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

/**
 * Hapus payment berdasarkan ID
 */
export const deletePayment = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    const result = {
      success: true,
      message: "Payment berhasil dihapus",
    };
    window.dispatchEvent(new Event('paymentsUpdated'));
    return result;
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

/**
 * Ambil payments berdasarkan customerId dan bulan/tahun
 */
export const getPaymentsByCustomerAndPeriod = async (customerId: string, bulan: number, tahun: number): Promise<Payment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("customer_id", "==", customerId),
      where("bulan", "==", bulan),
      where("tahun", "==", tahun)
    );
    const querySnapshot = await getDocs(q);
    const payments: Payment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        customer_id: data.customer_id,
        bulan: data.bulan,
        tahun: data.tahun,
        status_bayar: data.status_bayar,
        metode_pembayaran: data.metode_pembayaran,
        bank: data.bank,
        atas_nama_rekening: data.atas_nama_rekening,
        total_bayar: data.total_bayar,
        denda: data.denda,
        tanggal_bayar: data.tanggal_bayar ? data.tanggal_bayar.toDate() : null,
        created_at: data.created_at ? data.created_at.toDate() : undefined,
        updated_at: data.updated_at ? data.updated_at.toDate() : undefined,
      });
    });

    return payments;
  } catch (error) {
    console.error("Error getting payments by customer and period:", error);
    throw error;
  }
};

export const getPaymentsByCustomer = async (customerId: string): Promise<Payment[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("customer_id", "==", customerId));
    const snapshot = await getDocs(q);
    const payments: Payment[] = [];
    snapshot.forEach((docSnap) => {
      payments.push({ id: docSnap.id, ...(docSnap.data() as Omit<Payment, "id">) });
    });
    return payments;
  } catch (error) {
    console.error("Error getting payments by customer:", error);
    throw error;
  }
};
