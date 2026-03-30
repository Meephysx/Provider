import React, { useState, useEffect, useMemo } from "react";
import { Customer, Payment } from "../types/Customer";
import { addPayment, updatePayment } from "../services/paymentService";

interface PaymentFormProps {
  customers: Customer[];
  payments: Payment[];
  selectedPayment?: Payment | null;
  onSave: () => void;
  onClose: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  customers, 
  payments, 
  selectedPayment, 
  onSave, 
  onClose 
}) => {
  // --- States ---
  const [selectedSektor, setSelectedSektor] = useState(""); // State baru untuk filter
  const [customerId, setCustomerId] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<"lunas" | "belum">("belum");
  const [totalBayar, setTotalBayar] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState<string>("Cash");
  const [bankPengirim, setBankPengirim] = useState("");
  const [bankPenerima, setBankPenerima] = useState("");
  const [atasNamaRekening, setAtasNamaRekening] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Helpers ---
  // Memfilter pelanggan berdasarkan sektor yang dipilih
  const filteredCustomers = useMemo(() => {
    if (!selectedSektor) return customers;
    return customers.filter((c) => c.sektor?.toLowerCase().includes(selectedSektor.toLowerCase()));
  }, [selectedSektor, customers]);

  // --- Effects ---
  useEffect(() => {
    if (selectedPayment) {
      const customer = customers.find(c => c.id === selectedPayment.customer_id);
      setCustomerId(selectedPayment.customer_id);
      setBulan(selectedPayment.bulan);
      setTahun(selectedPayment.tahun);
      setStatus(selectedPayment.status_bayar as "lunas" | "belum");
      setTotalBayar(selectedPayment.total_bayar ?? customer?.harga ?? 0);
      setMetodePembayaran(selectedPayment.metode_pembayaran ?? "Cash");
      setBankPengirim(selectedPayment.bank_pengirim ?? "");
      setBankPenerima(selectedPayment.bank_penerima ?? "");
      setAtasNamaRekening(selectedPayment.atas_nama_rekening ?? "");
      // Jika sedang edit, set sektornya juga agar dropdown sinkron
      if (customer?.sektor) setSelectedSektor(customer.sektor);
    } else {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) setTotalBayar(customer.harga ?? 0);
    }
  }, [selectedPayment, customerId, customers]);

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return alert("Silakan pilih pelanggan terlebih dahulu");
    
    if (metodePembayaran !== "Cash") {
      if (!bankPengirim) return alert("Silakan pilih Bank Pengirim");
      if (!bankPenerima) return alert("Silakan pilih Bank Penerima");
    }
    
    setLoading(true);
    try {
      const existingPayment = payments.find(
        p => p.customer_id === customerId && p.bulan === bulan && p.tahun === tahun
      );

      const paymentData: Partial<Payment> = {
        customer_id: customerId,
        bulan,
        tahun,
        status_bayar: status,
        tanggal_bayar: status === "lunas" ? new Date() : null,
        total_bayar: totalBayar,
        metode_pembayaran: metodePembayaran,
        bank: metodePembayaran !== "Cash" ? `${bankPengirim} -> ${bankPenerima}` : "",
        bank_pengirim: metodePembayaran !== "Cash" ? bankPengirim : "",
        bank_penerima: metodePembayaran !== "Cash" ? bankPenerima : "",
        atas_nama_rekening: atasNamaRekening || "-",
      };

      if (existingPayment) {
        await updatePayment(existingPayment.id!, paymentData);
      } else {
        await addPayment(paymentData as any);
      }
      onSave();
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Gagal menyimpan pembayaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.title}>{selectedPayment ? "📋 Edit" : "💳 Tambah"} Pembayaran</h3>
          <p style={styles.subtitle}>
            {selectedPayment ? "Update detail pembayaran lama." : "Input pembayaran baru pelanggan."}
          </p>
        </div>
        <button onClick={onClose} style={styles.closeButton}>&times;</button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* STEP 1: PILIH SEKTOR (Sesuai Firestore kamu) */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Filter Sektor (Input Manual)</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Ketik Sektor..."
            value={selectedSektor}
            onChange={(e) => {
              setSelectedSektor(e.target.value);
              setCustomerId(""); // Reset pilihan pelanggan jika sektor berubah
            }}
            disabled={!!selectedPayment}
          />
        </div>

        {/* STEP 2: PILIH PELANGGAN */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama Pelanggan</label>
          <select
            style={styles.select}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            disabled={!!selectedPayment}
          >
            <option value="">-- Pilih Pelanggan --</option>
            {filteredCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.nama} {customer.sektor ? `(${customer.sektor})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* PERIODE */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Bulan</label>
          <select
            style={styles.select}
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            disabled={!!selectedPayment}
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
            disabled={!!selectedPayment}
          />
        </div>

        {/* STATUS & NOMINAL */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Status Bayar</label>
          <select
            style={{ 
                ...styles.select, 
                backgroundColor: status === "lunas" ? "#dcfce7" : "#fef3c7",
                color: status === "lunas" ? "#166534" : "#92400e"
            }}
            value={status}
            onChange={(e) => setStatus(e.target.value as "lunas" | "belum")}
          >
            <option value="belum">❌ Belum Lunas</option>
            <option value="lunas">✅ Lunas</option>
          </select>
        </div>

        <div style={styles.inputGroup}>
            <label style={styles.label}>Total Bayar (Rp)</label>
            <input
                style={styles.input}
                type="number"
                value={totalBayar}
                onChange={e => setTotalBayar(Number(e.target.value))}
                required
            />
        </div>

        {/* METODE PEMBAYARAN */}
        <div style={styles.inputGroup}>
            <label style={styles.label}>Metode</label>
            <select
                style={styles.select}
                value={metodePembayaran}
                onChange={e => setMetodePembayaran(e.target.value)}
            >
                <option value="Cash">Tunai</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS / E-Wallet</option>
                <option value="Lainnya">Lainnya</option>
            </select>
        </div>

        {metodePembayaran !== "Cash" && (
          <>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Pengirim (Pelanggan)</label>
                <input
                    style={styles.input}
                    type="text"
                    value={bankPengirim}
                    onChange={e => setBankPengirim(e.target.value)}
                    placeholder="Contoh: BCA / BRI / Dana"
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Penerima (Admin)</label>
                <input
                    style={styles.input}
                    type="text"
                    value={bankPenerima}
                    onChange={e => setBankPenerima(e.target.value)}
                    placeholder="Contoh: BCA Aldi / BRI"
                />
            </div>
          </>
        )}

        <div style={styles.inputGroup}>
            <label style={styles.label}>Atas Nama (Opsional)</label>
            <input
                style={styles.input}
                type="text"
                value={atasNamaRekening}
                onChange={e => setAtasNamaRekening(e.target.value)}
                placeholder="Nama pengirim..."
            />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "⌛ Memproses..." : "💾 Simpan Pembayaran"}
        </button>
      </form>
    </div>
  );
};

// --- Styles (Tetap Konsisten) ---
const styles: { [key: string]: any } = {
    card: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
      border: "1px solid #f1f5f9",
      zIndex: 1000,
      width: '95%',
      maxWidth: '750px',
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: 'space-between',
      marginBottom: "20px",
      borderBottom: "1px solid #f1f5f9",
      paddingBottom: "15px",
    },
    title: { margin: "0", fontSize: "20px", fontWeight: "700", color: "#0f172a" },
    subtitle: { margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" },
    form: { 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
        gap: "16px" 
    },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
    input: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      outline: "none",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
    },
    select: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      outline: "none",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
      cursor: "pointer"
    },
    button: {
      gridColumn: "1 / -1",
      padding: "14px",
      backgroundColor: "#10b981", // Hijau agar fresh
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: '10px',
    },
    closeButton: {
        background: 'transparent',
        border: 'none',
        fontSize: '28px',
        cursor: 'pointer',
        color: '#94a3b8',
    }
  };

export default PaymentForm;