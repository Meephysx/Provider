import { getPayments } from "./paymentService";
import { getCustomers } from "./customerService";

// Placeholder for WhatsApp API integration
export const sendWhatsAppMessage = async (phone: string, message: string) => {
  // Integrate with Fonnte/Wablas later
  return Promise.resolve({ success: true });
};

export const runDailyReminder = async () => {
  const payments = await getPayments();
  const customers = await getCustomers();
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = today.getFullYear();

  const pending = payments.filter(
    (p) => p.status_bayar === "belum" && p.bulan === currentMonth && p.tahun === currentYear
  );

  for (const payment of pending) {
    const customer = customers.find((c) => c.id === payment.customer_id);
    if (!customer || !customer.no_hp) continue;

    const message = `Halo Bapak/Ibu ${customer.nama},\nTagihan WiFi bulan ${payment.bulan}/${payment.tahun} sebesar Rp ${customer.harga} telah jatuh tempo.\nMohon segera melakukan pembayaran. Terima kasih 🙏`;
    await sendWhatsAppMessage(customer.no_hp, message);
  }
};
