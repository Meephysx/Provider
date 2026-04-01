import * as XLSX from "xlsx";
import { Customer, Payment } from "../types/Customer";

const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(wb, filename);
};

const formatDataForExport = (data: Array<Payment & { customer?: Customer }>) => {
  return data.map((item, index) => ({
    NO: index + 1,
    Nama: item.customer?.nama || "",
    Wilayah: item.customer?.wilayah || "",
    Paket: item.customer?.paket || "",
    Harga: typeof item.total_bayar === "number" ? item.total_bayar : (item.customer?.harga || 0),
    Bulan: item.bulan,
    Tahun: item.tahun,
    "Status Pembayaran": item.status_bayar === "lunas" ? "Lunas" : "Belum",
    "Metode Pembayaran": item.metode_pembayaran || "",
    "Atas Nama Rekening": item.atas_nama_rekening || "",
    "Tanggal Bayar": item.tanggal_bayar ? new Date(item.tanggal_bayar).toLocaleDateString("id-ID") : "",
  }));
};

export const exportAll = async (customers: Customer[], payments: Payment[]) => {
  const data = payments.map((payment) => {
    const customer = customers.find((c) => c.id === payment.customer_id);
    return { ...payment, customer };
  });
  const formattedData = formatDataForExport(data);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Pembayaran");
  downloadWorkbook(wb, `laporan-pembayaran-${new Date().getFullYear()}.xlsx`);
};

export const exportByFilter = (filteredData: Array<Payment & { customer?: Customer }>) => {
  const formattedData = formatDataForExport(filteredData);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Filter");
  downloadWorkbook(wb, `laporan-filter-${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportOverdue = (overdueData: Array<Payment & { customer?: Customer }>) => {
  const formattedData = formatDataForExport(overdueData);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  XLSX.utils.book_append_sheet(wb, ws, "Pelanggan Menunggak");
  downloadWorkbook(wb, `laporan-menunggak.xlsx`);
};

export const exportByWilayah = async (wilayah: string) => {
  const { getCustomers } = await import("./customerService");
  const { getPayments } = await import("./paymentService");
  const customers = (await getCustomers()).filter((c) => c.wilayah === wilayah);
  const payments = (await getPayments()).filter((p) => {
    const cust = customers.find((c) => c.id === p.customer_id);
    return Boolean(cust);
  });
  const data = payments.map((payment) => {
    const customer = customers.find((c) => c.id === payment.customer_id);
    return { ...payment, customer };
  });
  const formattedData = formatDataForExport(data);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Wilayah");
  downloadWorkbook(wb, `laporan-wilayah-${wilayah.toLowerCase()}.xlsx`);
};
