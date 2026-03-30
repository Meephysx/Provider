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
  QueryConstraint,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { Payment, PaymentWithCustomer, Customer } from "../types/Customer";
import { getCustomers } from "./customerService";

const COLLECTION_NAME = "payments";

export const getPaymentsWithDetails = async (filters: {
  wilayah?: string;
  bulan?: number;
}): Promise<PaymentWithCustomer[]> => {
  const { wilayah, bulan } = filters;

  // 1. Fetch all customers and create a map for easy lookup
  const customers = await getCustomers();
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // 2. Build payments query
  const paymentQueryConstraints: QueryConstraint[] = [];
  if (bulan) {
    paymentQueryConstraints.push(where("bulan", "==", bulan));
  }
  const paymentsQuery = query(
    collection(db, COLLECTION_NAME),
    ...paymentQueryConstraints
  );

  // 3. Fetch payments
  const paymentsSnapshot = await getDocs(paymentsQuery);
  const payments: Payment[] = paymentsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      customer_id: data.customer_id,
      bulan: data.bulan,
      tahun: data.tahun,
      status_bayar: data.status_bayar,
      metode_pembayaran: data.metode_pembayaran,
      bank: data.bank,
      bank_pengirim: data.bank_pengirim,
      bank_penerima: data.bank_penerima,
      atas_nama_rekening: data.atas_nama_rekening,
      total_bayar: data.total_bayar,
      denda: data.denda,
      jatuh_tempo: data.jatuh_tempo ? data.jatuh_tempo.toDate() : new Date(),
      tanggal_bayar: data.tanggal_bayar ? data.tanggal_bayar.toDate() : null,
      created_at: data.created_at ? data.created_at.toDate() : undefined,
      updated_at: data.updated_at ? data.updated_at.toDate() : undefined,
      periode: data.periode,
    };
  });

  // 4. Join and filter
  let paymentsWithCustomers: PaymentWithCustomer[] = payments
    .map((p) => {
      const customer = customerMap.get(p.customer_id);
      if (customer) {
        return { ...p, customer };
      }
      return null;
    })
    .filter((p): p is PaymentWithCustomer => p !== null);

  if (wilayah) {
    paymentsWithCustomers = paymentsWithCustomers.filter(
      (p) => p.customer.wilayah === wilayah
    );
  }

  return paymentsWithCustomers;
};

/**
 * Tambah payment baru ke Firestore
 */
export const addPayment = async (data: Omit<Payment, "id">) => {
  try {
    // 1. Mencegah Duplikasi: Cek apakah sudah ada pembayaran untuk pelanggan ini di periode yang sama
    const q = query(
      collection(db, COLLECTION_NAME),
      where("customer_id", "==", data.customer_id),
      where("bulan", "==", data.bulan),
      where("tahun", "==", data.tahun)
    );
    const existingSnapshot = await getDocs(q);

    // 2. Jika sudah ada, lakukan UPDATE pada dokumen tersebut daripada membuat dokumen baru
    if (!existingSnapshot.empty) {
      const existingId = existingSnapshot.docs[0].id;
      return await updatePayment(existingId, data);
    }

    // 3. Jika benar-benar baru, buat dokumen pembayaran baru
    const paymentData = {
      ...data,
      tanggal_bayar: data.tanggal_bayar
        ? Timestamp.fromDate(data.tanggal_bayar)
        : null,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), paymentData);
    const result = {
      success: true,
      id: docRef.id,
      message: "Payment berhasil ditambahkan",
    };
    window.dispatchEvent(new Event("paymentsUpdated"));
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
        bank_pengirim: data.bank_pengirim,
        bank_penerima: data.bank_penerima,
        atas_nama_rekening: data.atas_nama_rekening,
        total_bayar: data.total_bayar,
        denda: data.denda,
        jatuh_tempo: data.jatuh_tempo ? data.jatuh_tempo.toDate() : new Date(),
        tanggal_bayar: data.tanggal_bayar ? data.tanggal_bayar.toDate() : null,
        created_at: data.created_at ? data.created_at.toDate() : undefined,
        updated_at: data.updated_at ? data.updated_at.toDate() : undefined,
        periode: data.periode,
      });
    });

    return payments;
  } catch (error) {
    console.error("Error getting payments:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for payments
 */
export const subscribeToPayments = (callback: (payments: Payment[]) => void) => {
  const q = collection(db, COLLECTION_NAME);
  return onSnapshot(q, (querySnapshot) => {
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
        bank_pengirim: data.bank_pengirim,
        bank_penerima: data.bank_penerima,
        atas_nama_rekening: data.atas_nama_rekening,
        total_bayar: data.total_bayar,
        denda: data.denda,
        jatuh_tempo: data.jatuh_tempo ? data.jatuh_tempo.toDate() : new Date(),
        tanggal_bayar: data.tanggal_bayar ? data.tanggal_bayar.toDate() : null,
        created_at: data.created_at ? data.created_at.toDate() : undefined,
        updated_at: data.updated_at ? data.updated_at.toDate() : undefined,
        periode: data.periode,
      });
    });
    callback(payments);
  }, (error) => {
    console.error("Error subscribing to payments:", error);
  });
};

/**
 * Update payment berdasarkan ID
 */
export const updatePayment = async (id: string, data: Partial<Payment>) => {
  try {
    const paymentRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { 
      ...data,
      updated_at: Timestamp.now() 
    };

    // Penanganan konversi tanggal yang lebih aman (termasuk jika nilainya null/reset)
    if (data.tanggal_bayar !== undefined) {
      updateData.tanggal_bayar = data.tanggal_bayar ? Timestamp.fromDate(data.tanggal_bayar) : null;
    }

    await updateDoc(paymentRef, updateData);
    const result = {
      success: true,
      message: "Payment berhasil diupdate",
    };
    window.dispatchEvent(new Event("paymentsUpdated"));
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
    window.dispatchEvent(new Event("paymentsUpdated"));
    return result;
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

/**
 * Ambil payments berdasarkan customerId dan bulan/tahun
 */
export const getPaymentsByCustomerAndPeriod = async (
  customerId: string,
  bulan: number,
  tahun: number
): Promise<Payment[]> => {
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
        bank_pengirim: data.bank_pengirim,
        bank_penerima: data.bank_penerima,
        atas_nama_rekening: data.atas_nama_rekening,
        total_bayar: data.total_bayar,
        denda: data.denda,
        jatuh_tempo: data.jatuh_tempo ? data.jatuh_tempo.toDate() : new Date(),
        tanggal_bayar: data.tanggal_bayar ? data.tanggal_bayar.toDate() : null,
        created_at: data.created_at ? data.created_at.toDate() : undefined,
        updated_at: data.updated_at ? data.updated_at.toDate() : undefined,
        periode: data.periode,
      });
    });

    return payments;
  } catch (error) {
    console.error("Error getting payments by customer and period:", error);
    throw error;
  }
};

export const getPaymentsByCustomer = async (
  customerId: string
): Promise<Payment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("customer_id", "==", customerId)
    );
    const snapshot = await getDocs(q);
    const payments: Payment[] = [];
    snapshot.forEach((docSnap) => {
      payments.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Payment, "id">),
      });
    });
    return payments;
  } catch (error) {
    console.error("Error getting payments by customer:", error);
    throw error;
  }
};
