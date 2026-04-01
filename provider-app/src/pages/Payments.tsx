import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Customer, Payment } from "../types/Customer";
import { subscribeToCustomers } from "../services/customerService";
import { addPayment, updatePayment, subscribeToPayments } from "../services/paymentService";
import "./Payments.css"; // Pastikan import CSS ini ada

const Payments = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<"lunas" | "belum">("belum");
  const [metodePembayaran, setMetodePembayaran] = useState<"Tunai" | "Transfer" | "QRIS">("Tunai");
  const [bankPengirim, setBankPengirim] = useState<string>("");
  const [bankPenerima, setBankPenerima] = useState<string>("");
  const [atasNamaRekening, setAtasNamaRekening] = useState<string>("");
  const [totalBayar, setTotalBayar] = useState<number>(0);
  const [tanggalBayar, setTanggalBayar] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isTanggalBayarChanged, setIsTanggalBayarChanged] = useState<boolean>(false);
  const [searchCustomerName, setSearchCustomerName] = useState<string>("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to real-time updates for customers
    const unsubscribeCustomers = subscribeToCustomers((customers) => {
      setCustomers(customers);
    });

    // Subscribe to real-time updates for payments
    const unsubscribePayments = subscribeToPayments((payments) => {
      setPayments(payments);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCustomers();
      unsubscribePayments();
    };
  }, []);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.nama.toLowerCase().includes(searchCustomerName.toLowerCase())
  );

  // Update search input when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        setSearchCustomerName(customer.nama);
      }
    } else {
      setSearchCustomerName("");
    }
  }, [selectedCustomer, customers]);

  // Sync form fields with existing payment when selection changes
  useEffect(() => {
    const customer = customers.find((c) => c.id === selectedCustomer);
    const existingPayment = payments.find(
      (p) => p.customer_id === selectedCustomer && p.bulan === selectedMonth && p.tahun === selectedYear
    );

    if (existingPayment) {
      setTotalBayar(existingPayment.total_bayar ?? customer?.harga ?? 0);
      setAtasNamaRekening(
        existingPayment.atas_nama_rekening && existingPayment.atas_nama_rekening !== "-"
          ? existingPayment.atas_nama_rekening
          : ""
      );
      setMetodePembayaran((existingPayment.metode_pembayaran as "Tunai" | "Transfer" | "QRIS") ?? "Tunai");
      setBankPengirim(existingPayment.bank_pengirim ?? "");
      setBankPenerima(existingPayment.bank_penerima ?? "");
      // Set tanggalBayar hanya jika belum diubah oleh user
      if (!isTanggalBayarChanged) {
        if (existingPayment.tanggal_bayar) {
          setTanggalBayar(new Date(existingPayment.tanggal_bayar).toISOString().split("T")[0]);
        } else {
          setTanggalBayar(new Date().toISOString().split("T")[0]);
        }
      }
    } else {
      setTotalBayar(customer?.harga ?? 0);
      setAtasNamaRekening("");
      setMetodePembayaran("Tunai");
      setBankPengirim("");
      setBankPenerima("");
      // Set tanggal default hanya jika belum diubah oleh user
      if (!isTanggalBayarChanged) {
        setTanggalBayar(new Date().toISOString().split("T")[0]);
      }
    }
  }, [selectedCustomer, selectedMonth, selectedYear, customers, payments, isTanggalBayarChanged]);

  const handleUpdatePayment = async () => {
    if (!selectedCustomer) {
      alert("Pilih pelanggan terlebih dahulu");
      return;
    }

    const existingPayment = payments.find(
      (p) => p.customer_id === selectedCustomer && p.bulan === selectedMonth && p.tahun === selectedYear
    );

    try {
      // Validasi input agar tidak tersimpan data default
      if (metodePembayaran === "Transfer") {
        if (!bankPengirim) {
          alert("Masukkan bank pengirim (bank pelanggan).");
          return;
        }
        if (!bankPenerima) {
          alert("Pilih bank penerima (bank admin).");
          return;
        }
        if (!atasNamaRekening) {
          alert("Masukkan nama pemilik rekening.");
          return;
        }
      }

      const paymentPayload = {
        customer_id: selectedCustomer,
        periode: `${selectedMonth}-${selectedYear}`,
        bulan: selectedMonth,
        tahun: selectedYear,
        status_bayar: selectedStatus,
        tanggal_bayar: tanggalBayar ? new Date(tanggalBayar) : null,
        metode_pembayaran: metodePembayaran,
        bank: metodePembayaran === "Transfer" ? `${bankPengirim} -> ${bankPenerima}` : "",
        bank_pengirim: metodePembayaran === "Transfer" ? bankPengirim : "",
        bank_penerima: metodePembayaran === "Transfer" ? bankPenerima : "",
        atas_nama_rekening: atasNamaRekening || "-",
        total_bayar: totalBayar,
        jatuh_tempo: new Date(selectedYear, selectedMonth, 1), // Jatuh tempo tanggal 1 bulan berikutnya
      };

      if (existingPayment) {
        await updatePayment(existingPayment.id!, paymentPayload);
      } else {
        await addPayment(paymentPayload as Omit<Payment, "id">);
      }
      alert("Status pembayaran berhasil diperbarui");
      window.dispatchEvent(new Event('paymentsUpdated'));
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Gagal memperbarui status pembayaran");
    }
  };



  return (
    <div className="payments-container">
      <div className="payments-header">
        <h1>Update Pembayaran</h1>
        <button onClick={() => navigate("/dashboard")} className="btn btn-primary">
          Kembali ke Dashboard
        </button>
      </div>

      <div className="card">
        <h2>Update Status Pembayaran</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Cari Pelanggan:</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchCustomerName}
                onChange={(e) => {
                  setSearchCustomerName(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Ketik nama pelanggan..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
              {showCustomerDropdown && searchCustomerName && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer.id!);
                          setSearchCustomerName(customer.nama);
                          setShowCustomerDropdown(false);
                          setTotalBayar(customer.harga);
                        }}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          backgroundColor: selectedCustomer === customer.id ? "#f0f8ff" : "white"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCustomer === customer.id ? "#f0f8ff" : "white"}
                      >
                        <div style={{ fontWeight: "bold" }}>{customer.nama}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {customer.sektor ? `(${customer.sektor})` : ""} - {customer.wilayah}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "8px 12px", color: "#999", fontStyle: "italic" }}>
                      Tidak ada pelanggan ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Bulan:</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tahun:</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Status:</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as "lunas" | "belum")}>
              <option value="belum">Belum</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

          <div className="form-group">
            <label>Metode Pembayaran:</label>
            <select 
              value={metodePembayaran} 
              onChange={(e) => { 
                setMetodePembayaran(e.target.value as "Tunai" | "Transfer" | "QRIS"); 
                if (e.target.value !== "Transfer") {
                  setBankPengirim("");
                  setBankPenerima("");
                }
              }}>
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          {metodePembayaran === "Transfer" && (
            <>
              <div className="form-group">
                <label>Bank Pengirim (Pelanggan):</label>
                <input
                  type="text"
                  value={bankPengirim}
                  onChange={(e) => setBankPengirim(e.target.value)}
                  placeholder="Contoh: BCA / BRI / Dana"
                />
              </div>
              <div className="form-group">
                <label>Bank Penerima (Admin):</label>
                <input
                  type="text"
                  value={bankPenerima}
                  onChange={(e) => setBankPenerima(e.target.value)}
                  placeholder="Contoh: BCA Aldi / BRI"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Total Bayar:</label>
            <input
              type="number"
              value={totalBayar}
              onChange={(e) => setTotalBayar(Number(e.target.value))}
              placeholder="Total pembayaran"
            />
          </div>

          <div className="form-group">
            <label>Atas Nama Rekening:</label>
            <input
              type="text"
              value={atasNamaRekening}
              onChange={(e) => setAtasNamaRekening(e.target.value)}
              placeholder="Nama pemilik rekening"
            />
          </div>

          <div className="form-group">
            <label>Tanggal Bayar:</label>
            <input
              type="date"
              value={tanggalBayar}
              onChange={(e) => {
                setTanggalBayar(e.target.value);
                setIsTanggalBayarChanged(true);
              }}
            />
          </div>
        </div>
        
        {/* Tambahkan margin top sedikit agar tombol tidak terlalu nempel dengan grid form */}
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleUpdatePayment} className="btn btn-success">
            Update Pembayaran
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Status Pembayaran Pelanggan</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>NO</th>
                <th>Nama</th>
                <th>Wilayah</th>
                <th>Sektor</th>
                <th>Bulan</th>
                <th>Tahun</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Alur Transfer</th>
                <th>Atas Nama</th>
                <th>Total Bayar</th>
                <th>Tanggal Bayar</th>
              </tr>
            </thead>
            <tbody>
              {payments
                .filter((payment) => customers.some((c) => c.id === payment.customer_id))
                .map((payment, index) => {
                const customer = customers.find((c) => c.id === payment.customer_id);
                return (
                  <tr key={payment.id}>
                    <td>{index + 1}</td>
                    <td>{customer?.nama || "-"}</td>
                    <td>{customer?.wilayah || "-"}</td>
                    <td>{customer?.sektor || "-"}</td>
                    <td>{payment.bulan}</td>
                    <td>{payment.tahun}</td>
                    <td>
                      <span className={`status-badge ${payment.status_bayar === "lunas" ? "status-lunas" : "status-belum"}`}>
                        {payment.status_bayar === "lunas" ? "Lunas" : "Belum"}
                      </span>
                    </td>
                    <td>{payment.metode_pembayaran || "-"}</td>
                    <td>{payment.bank_pengirim && payment.bank_penerima ? `${payment.bank_pengirim} ➔ ${payment.bank_penerima}` : "-"}</td>
                    <td>{payment.atas_nama_rekening || "-"}</td>
                    <td>{payment.total_bayar ?? customer?.harga ?? "-"}</td>
                    <td>{payment.tanggal_bayar ? new Date(payment.tanggal_bayar).toLocaleDateString("id-ID") : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;