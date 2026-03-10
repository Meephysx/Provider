import React, { useState, useEffect } from "react";
import { addCustomer, updateCustomer } from "../services/customerService";
import { Customer } from "../types/Customer";

interface CustomerFormProps {
  onSave: () => void;
  initialData?: Customer | null;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onSave, initialData }) => {
  const [nama, setNama] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [alamat, setAlamat] = useState("");
  const [no_hp, setNoHp] = useState("");
  const [paket, setPaket] = useState("");
  const [harga, setHarga] = useState(0);
  const [tahunMulai, setTahunMulai] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<"aktif" | "berhenti">("aktif");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama || "");
      setWilayah(initialData.wilayah || "");
      setAlamat(initialData.alamat || "");
      setNoHp(initialData.no_hp || "");
      setPaket(initialData.paket || "");
      setHarga(initialData.harga || 0);
      setTahunMulai(initialData.tahunMulai || new Date().getFullYear());
      setStatus(initialData.status || "aktif");
    } else {
      setNama("");
      setWilayah("");
      setAlamat("");
      setNoHp("");
      setPaket("");
      setHarga(0);
      setTahunMulai(new Date().getFullYear());
      setStatus("aktif");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customerData = {
        nama,
        wilayah,
        alamat,
        no_hp,
        paket,
        harga,
        tahunMulai,
        status,
      };

      if (initialData?.id) {
        await updateCustomer(initialData.id, customerData);
      } else {
        await addCustomer(customerData);
      }
      onSave();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Gagal menyimpan pelanggan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.iconWrapper}>{initialData ? '✏️' : '+'}</div>
        <div>
          <h3 style={styles.title}>{initialData ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
          <p style={styles.subtitle}>
            {initialData ? 'Ubah data pelanggan di bawah ini.' : 'Masukkan data pelanggan dengan lengkap.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama</label>
          <input
            style={styles.input}
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Wilayah</label>
          <input
            style={styles.input}
            type="text"
            value={wilayah}
            onChange={(e) => setWilayah(e.target.value)}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Alamat</label>
          <input
            style={styles.input}
            type="text"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>No. HP/WhatsApp</label>
          <input
            style={styles.input}
            type="tel"
            value={no_hp}
            onChange={(e) => setNoHp(e.target.value)}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Paket</label>
          <input
            style={styles.input}
            type="text"
            value={paket}
            onChange={(e) => setPaket(e.target.value)}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Harga</label>
          <input
            style={styles.input}
            type="number"
            value={harga}
            onChange={(e) => setHarga(Number(e.target.value))}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Tahun Mulai Langganan</label>
          <input
            style={styles.input}
            type="number"
            value={tahunMulai}
            onChange={(e) => setTahunMulai(Number(e.target.value))}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Status Pelanggan</label>
          <select
            style={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as "aktif" | "berhenti")}
          >
            <option value="aktif">Aktif</option>
            <option value="berhenti">Berhenti</option>
          </select>
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Menyimpan..." : (initialData ? "Simpan Perubahan" : "Simpan Pelanggan")}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
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

export default CustomerForm;