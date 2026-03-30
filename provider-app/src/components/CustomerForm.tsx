import React, { useState, useEffect } from "react";
import { addCustomer, updateCustomer } from "../services/customerService";
import { Customer } from "../types/Customer";

interface CustomerFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Customer | null;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onSave, onCancel, initialData }) => {
  const [nama, setNama] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [sektor, setSektor] = useState("");
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
      setSektor(initialData.sektor || "");
      setAlamat(initialData.alamat || "");
      setNoHp(initialData.no_hp || "");
      setPaket(initialData.paket || "");
      setHarga(initialData.harga || 0);
      setTahunMulai(initialData.tahun_mulai || new Date().getFullYear());
      setStatus((initialData.status as "aktif" | "berhenti") || "aktif");
    } else {
      // Reset form jika tidak ada initialData (Mode Tambah Baru)
      setNama("");
      setWilayah("");
      setSektor("");
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

    const customerData: Partial<Customer> = {
      nama,
      wilayah,
      sektor: sektor?.trim() || "", // Menghapus spasi tambahan
      alamat,
      no_hp,
      paket,
      harga,
      tahun_mulai: tahunMulai,
      status,
    };

    try {
      if (initialData && initialData.id) {
        await updateCustomer(initialData.id, customerData);
      } else {
        await addCustomer(customerData as Customer);
      }
      onSave(); // Menutup modal dan refresh data di parent
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Gagal menyimpan data pelanggan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.iconWrapper}>{initialData ? "📝" : "👤"}</div>
        <div>
          <h3 style={styles.title}>
            {initialData ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
          </h3>
          <p style={styles.subtitle}>Isi informasi detail pelanggan di bawah ini.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama Lengkap</label>
          <input
            style={styles.input}
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            placeholder="Contoh: Budi Santoso"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Wilayah / Area</label>
          <input
            style={styles.input}
            type="text"
            value={wilayah}
            onChange={(e) => setWilayah(e.target.value)}
            required
            placeholder="Contoh: Sukabumi Kota"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Sektor</label>
          <input
            style={styles.input}
            type="text"
            value={sektor}
            onChange={(e) => setSektor(e.target.value)}
            placeholder="Contoh: Sektor 1 / Blok A"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nomor WhatsApp</label>
          <input
            style={styles.input}
            type="text"
            value={no_hp}
            onChange={(e) => setNoHp(e.target.value)}
            required
            placeholder="628123xxx"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama Paket Internet</label>
          <input
            style={styles.input}
            type="text"
            value={paket}
            onChange={(e) => setPaket(e.target.value)}
            required
            placeholder="Contoh: Home 20Mbps"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Harga Bulanan (Rp)</label>
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

        <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Alamat Lengkap</label>
          <textarea
            style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            required
            placeholder="Masukkan alamat lengkap pelanggan..."
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Status Berlangganan</label>
          <select
            style={styles.input}
            value={status}
            onChange={(e) => setStatus(e.target.value as "aktif" | "berhenti")}
          >
            <option value="aktif">Aktif</option>
            <option value="berhenti">Berhenti</option>
          </select>
        </div>

        <div style={styles.buttonActionGroup}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.cancelButton}
            disabled={loading}
          >
            Batal
          </button>
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Menyimpan..." : initialData ? "Perbarui Data" : "Simpan Pelanggan"}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid #f1f5f9",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "28px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "20px",
  },
  iconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },
  title: { margin: "0 0 4px 0", fontSize: "20px", fontWeight: "700", color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "14px", color: "#64748b" },
  form: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
    gap: "20px" 
  },
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
    transition: "border-color 0.2s",
  },
  buttonActionGroup: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "12px",
    marginTop: "10px",
    justifyContent: "flex-end",
  },
  submitButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  cancelButton: {
    padding: "12px 24px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default CustomerForm;