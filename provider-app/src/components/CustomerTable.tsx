import React from "react";
import { Customer, Payment } from "../types/Customer";
import { updatePayment, addPayment } from "../services/paymentService";

interface CustomerTableProps {
  customers: Customer[];
  payments: Payment[];
  currentMonth: number;
  currentYear: number;
  onDelete?: (customer: Customer) => void; // Tambahkan ? agar opsional
  onEdit: (customer: Customer) => void;
  onMarkPaid?: () => Promise<void>; // Tambahkan ini untuk Dashboard
  onSendWa?: (customer: Customer) => void; // Tambahkan ini untuk fitur WhatsApp
  onStatusToggle?: () => void; // Tetap simpan ini jika digunakan
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  payments,
  currentMonth,
  currentYear,
  onDelete,
  onEdit,
  onMarkPaid,
  onSendWa,
  onStatusToggle,
}) => {
  const getPaymentStatus = (customerId: string) => {
    const payment = payments.find(
      (p) => p.customer_id === customerId && p.bulan === currentMonth && p.tahun === currentYear
    );
    return payment ? payment.status_bayar : "belum";
  };

  const toggleStatus = async (customer: Customer) => {
    const payment = payments.find(
      (p) => p.customer_id === customer.id && p.bulan === currentMonth && p.tahun === currentYear
    );
    try {
      if (payment && payment.id) {
        const newStatus = payment.status_bayar === "lunas" ? "belum" : "lunas";
        await updatePayment(payment.id, { status_bayar: newStatus });
      } else {
        // create unpaid entry then toggle to lunas
        await addPayment({
          customer_id: customer.id!,
          bulan: currentMonth,
          tahun: currentYear,
          status_bayar: "lunas",
          tanggal_bayar: new Date(),
        } as any);
      }

      // Call back to parent components to refresh data if provided.
      if (typeof onMarkPaid === "function") await onMarkPaid();
      if (typeof onStatusToggle === "function") onStatusToggle();
    } catch (err) {
      console.error("Error toggling status", err);
    }
  };
  const handleWhatsApp = (customer: Customer) => {
    if (typeof onSendWa === "function") {
      onSendWa(customer);
      return;
    }

    if (!customer.no_hp) {
      alert("Nomor WhatsApp belum tersedia");
      return;
    }

    const message = `Halo ${customer.nama}, kami dari admin WiFi ingin mengingatkan bahwa pembayaran internet bulan ini sebesar Rp${(customer.harga || 0).toLocaleString()}. Terima kasih.`;
    const url = `https://wa.me/${customer.no_hp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>No</th>
            <th style={styles.th}>Nama</th>
            <th style={styles.th}>Wilayah</th>
            <th style={styles.th}>Paket</th>
            <th style={styles.th}>Harga</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Status Pembayaran Bulan Ini</th>
            <th style={styles.th}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => {
            const paymentStatus = getPaymentStatus(customer.id!);

            return (
              <tr key={customer.id} style={styles.tr}>
                <td style={styles.td}>{index + 1}</td>
                <td style={{ ...styles.td, fontWeight: "600", color: "#0f172a" }}>
                  {customer.nama}
                </td>
                <td style={styles.td}>{customer.wilayah}</td>
                <td style={styles.td}>{customer.paket}</td>
                <td style={{ ...styles.td, fontWeight: "600" }}>
                  Rp {(customer.harga || 0).toLocaleString()}
                </td>
                <td style={styles.td}>
                  <span style={customer.status === "aktif" ? styles.badgeAktif : styles.badgeBerhenti}>
                    {customer.status === "aktif" ? "Aktif" : "Berhenti"}
                  </span>
                </td>
                <td style={styles.td}>{customer.no_hp || "-"}</td>
                <td style={styles.td}>
                  <span style={paymentStatus === "lunas" ? styles.badgeLunas : styles.badgeBelum}>
                    {paymentStatus === "lunas" ? "Lunas" : "Belum Bayar"}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(customer)}
                        style={styles.btnEdit}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => toggleStatus(customer)}
                      style={styles.btnWhatsApp}
                    >
                      Toggle Bayar
                    </button>
                    <button
                      onClick={() => handleWhatsApp(customer)}
                      style={styles.btnWhatsApp}
                    >
                      WhatsApp
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(customer)}
                        style={styles.btnDelete}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const styles: { [key: string]: any } = {
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#fff" },
  th: {
    textAlign: "left",
    padding: "16px",
    borderBottom: "2px solid #f1f5f9",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: {
    padding: "16px",
    color: "#475569",
    fontSize: "14px",
  },
  badgeAktif: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeBerhenti: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  badgeLunas: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeBelum: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  btnWhatsApp: {
    padding: "4px 8px",
    backgroundColor: "#25d366",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnEdit: {
    padding: "4px 8px",
    backgroundColor: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnDelete: {
    padding: "4px 8px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default CustomerTable;
