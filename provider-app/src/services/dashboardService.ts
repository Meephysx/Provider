import { getCustomers } from "./customerService";
import { getPayments } from "./paymentService";

export interface DashboardMetrics {
  totalCustomers: number;
  totalLunas: number;
  totalBelum: number;
  totalPendapatan: number;
}

interface Filters {
  wilayah?: string;
  bulan?: number;
  tahun?: number;
  nama?: string;
}

export const getDashboardMetrics = async (filters: Filters = {}): Promise<DashboardMetrics> => {
  const customers = await getCustomers();
  let filteredCustomers = customers;

  if (filters.wilayah) {
    filteredCustomers = filteredCustomers.filter((c) => c.wilayah === filters.wilayah);
  }
  if (filters.nama) {
    const term = filters.nama.toLowerCase();
    filteredCustomers = filteredCustomers.filter((c) => c.nama.toLowerCase().includes(term));
  }

  const totalCustomers = filteredCustomers.length;

  let payments = await getPayments();

  if (filters.bulan && filters.tahun) {
    payments = payments.filter((p) => p.bulan === filters.bulan && p.tahun === filters.tahun);
  }

  if (filters.wilayah) {
    const validIds = new Set(filteredCustomers.map((c) => c.id));
    payments = payments.filter((p) => validIds.has(p.customer_id));
  }

  const totalLunas = payments.filter((p) => p.status_bayar === "lunas").length;
  const totalBelum = payments.filter((p) => p.status_bayar === "belum").length;
  const totalPendapatan = payments
    .filter((p) => p.status_bayar === "lunas")
    .reduce((sum, p) => {
      const customer = customers.find(c => c.id === p.customer_id);
      return sum + (customer?.harga || 0);
    }, 0);

  return {
    totalCustomers,
    totalLunas,
    totalBelum,
    totalPendapatan,
  };
};