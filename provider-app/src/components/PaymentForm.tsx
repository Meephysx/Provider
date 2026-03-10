import React, { useState } from "react";
import { Customer } from "../types/Customer";
import { addPayment } from "../services/paymentService";

interface PaymentFormProps {
  customers: Customer[];
  onSave: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ customers, onSave }) => {
  const [customerId, setCustomerId] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<"lunas" | "belum">("belum");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentData = {
        customer_id: customerId,
        bulan,
        tahun,
        status_bayar: status,
        tanggal_bayar: status === "lunas" ? new Date() : null,
      };

      await addPayment(paymentData);
      onSave();
      // Reset form
      setCustomerId("");
      setBulan(new Date().getMonth() + 1);
      setTahun(new Date().getFullYear());
      setStatus("belum");
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Gagal menambahkan pembayaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.iconWrapper}>💳</div>
        <div>
          <h3 style={styles.title}>Update Status Pembayaran</h3>
          <p style={styles.subtitle}>Pilih pelanggan dan periode pembayaran.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Pelanggan</label>
          <select
            style={styles.select}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Pilih Pelanggan</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.nama} - {customer.wilayah}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Bulan</label>
          <select
            style={styles.select}
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Tahun</label>
          <input
            style={styles.input}
            type="number"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Status</label>
          <select
            style={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as "lunas" | "belum")}
          >
            <option value="lunas">Lunas</option>
            <option value="belum">Belum</option>
          </select>
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: any } = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
    border: "1px solid #f1f5f9",
    marginBottom: "32px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "20px",
  },
  iconWrapper: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
  },
  title: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "13px", color: "#64748b" },
  form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  select: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  button: {
    gridColumn: "1 / -1",
    padding: "12px 28px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};

export default PaymentForm;