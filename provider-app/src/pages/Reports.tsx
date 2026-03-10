import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import xlsx library

import { Customer, Payment } from "../types/Customer";
import { getCustomers } from "../services/customerService";
import { getPayments } from "../services/paymentService";

const Reports = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterNama, setFilterNama] = useState("");
  const [filterWilayah, setFilterWilayah] = useState("");
  const [filterBulan, setFilterBulan] = useState<number | "">("");
  const [filterTahun, setFilterTahun] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"lunas" | "belum" | "">("");

  // dropdown options
  const wilayahList = Array.from(new Set(customers.map(c => c.wilayah))).filter(w => w);
  const yearOptions = Array.from(new Set(payments.map(p => Number(p.tahun)))).sort();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('paymentsUpdated', handler);
    return () => window.removeEventListener('paymentsUpdated', handler);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getCustomers(), getPayments()]);
      setCustomers(c);
      setPayments(p);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    // start from customers so unpaid ones are included
    let data = customers.map((c) => {
      const payment = payments.find(
        (p) => p.customer_id === c.id &&
               (filterBulan === "" || p.bulan === filterBulan) &&
               (filterTahun === "" || p.tahun === filterTahun)
      );
      return { customer: c, payment };
    });

    if (filterNama) {
      data = data.filter((item) => item.customer.nama.toLowerCase().includes(filterNama.toLowerCase()));
    }
    if (filterWilayah) {
      data = data.filter((item) => item.customer.wilayah.toLowerCase().includes(filterWilayah.toLowerCase()));
    }
    if (filterStatus) {
      if (filterStatus === "lunas") {
        data = data.filter((item) => item.payment && item.payment.status_bayar === "lunas");
      } else {
        data = data.filter((item) => !item.payment || item.payment.status_bayar === "belum");
      }
    }

    return data;
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px", marginTop: "5px", borderRadius: 4, border: "1px solid #cbd5e1" };

  const exportToExcel = () => {
    const dataToExport = filteredData();
    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    // ---------------------------------------------
    // 1. Header kolom dan urutan harus sesuai
    // ---------------------------------------------
    const headers = [
      "No",
      "Tanggal",
      "Nama Pelanggan",
      "Atas Nama",
      "Bank",
      "Metode",
      "Total Bayar",
      "Periode",
    ];

    // ---------------------------------------------
    // 2. Mapping data (preisi dengan tipe yang benar)
    // ---------------------------------------------
    const dataRows = dataToExport.map((item, index) => {
      const { customer, payment } = item;

      const tanggal = payment?.tanggal_bayar
        ? new Date(payment.tanggal_bayar)
        : null;

      const formattedTanggal = tanggal
        ? tanggal.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const totalBayar = Number(payment?.total_bayar ?? customer.harga ?? 0);

      const periode = payment?.periode
        ? String(payment.periode)
        : payment?.bulan && payment?.tahun
        ? `${String(payment.bulan).padStart(2, "0")}-${payment.tahun}`
        : "-";

      return [
        index + 1,
        formattedTanggal,
        customer.nama,
        payment?.atas_nama_rekening ?? "-",
        payment?.bank ?? "-",
        payment?.metode_pembayaran ?? "-",
        totalBayar,
        periode,
      ];
    });

    // ---------------------------------------------
    // 3. Buat worksheet + styling header sederhana
    // ---------------------------------------------
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Styling header (bold)
    headers.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "FFEEEEEE" } },
      };
    });

    // Lebar kolom agar rapi
    ws["!cols"] = [
      { wch: 6 }, // No
      { wch: 14 }, // Tanggal
      { wch: 25 }, // Nama Pelanggan
      { wch: 25 }, // Atas Nama
      { wch: 18 }, // Bank
      { wch: 18 }, // Metode
      { wch: 15 }, // Total Bayar
      { wch: 14 }, // Periode
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Bulanan");

    // ---------------------------------------------
    // 4. Download file
    // ---------------------------------------------
    const fileName = `Laporan_Bulanan_WiFi_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div>
      
      <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Laporan Pembayaran</h1>
        <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          Kembali ke Dashboard
        </button>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h2>Filter Laporan</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <div>
            <label>Nama Pelanggan:</label>
            <input
              type="text"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              placeholder="Cari nama..."
              style={inputStyle}
            />
          </div>
          <div>
            <label>Wilayah:</label>
            <select
              value={filterWilayah}
              onChange={(e) => setFilterWilayah(e.target.value)}
              style={inputStyle}
            >
              <option value="">Semua Wilayah</option>
              {wilayahList.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Bulan:</label>
            <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value ? Number(e.target.value) : "")} style={inputStyle}>
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Tahun:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value ? Number(e.target.value) : "")}
              style={inputStyle}
            >
              <option value="">Semua Tahun</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Status Pembayaran:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "lunas" | "belum" | "")} style={inputStyle}>
              <option value="">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="belum">Belum</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={exportToExcel} 
            style={{ 
              padding: "10px 20px", 
              backgroundColor: "#1e3a8a", 
              color: "white", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Export Laporan ke Excel
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2>Data Laporan</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>NO</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Nama</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Wilayah</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Paket</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Harga</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Bulan</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Tahun</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData().map((item, index) => {
                const payment = item.payment;
                const status = payment ? (payment.status_bayar === "lunas" ? "lunas" : "belum") : "belum";
                return (
                <tr key={`${item.customer.id}-${payment?.bulan || ''}-${payment?.tahun || ''}`}> 
                  <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.customer.nama}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.customer.wilayah}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.customer.paket}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>Rp {item.customer.harga.toLocaleString()}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{payment?.bulan || "-"}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{payment?.tahun || "-"}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: "20px",
                        color: "white",
                        backgroundColor: status === "lunas" ? "#28a745" : "#dc3545",
                      }}
                    >
                      {status === "lunas" ? "Lunas" : "Belum"}
                    </span>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
};

export default Reports;