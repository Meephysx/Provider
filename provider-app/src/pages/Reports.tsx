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

  // Styles for a cleaner filter UI
  const formControlHeight = '38px';
  const filterContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px"
  };
  const filterGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 180px"
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    fontSize: '14px',
    color: '#334155',
    marginBottom: '4px'
  };
  const inputStyle: React.CSSProperties = { 
    width: "100%", 
    padding: "0 12px",
    height: formControlHeight,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    fontSize: '14px',
  };
  const buttonStyle: React.CSSProperties = {
      padding: "0 20px",
      height: formControlHeight,
      backgroundColor: "#1e3a8a", 
      color: "white", 
      border: "none", 
      borderRadius: 6,
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
  };

  const exportToExcel = () => {
    const dataToExport = filteredData();
    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    // 1. Judul Laporan Keuangan
    const reportTitle = "LAPORAN KEUANGAN PEMBAYARAN PELANGGAN WIFI";
    const exportDate = `Tanggal Export: ${new Date().toLocaleDateString("id-ID", {
      day: '2-digit', month: 'long', year: 'numeric'
    })}`;

    // 2. Header Tabel
    const headers = [
      "No",
      "Tanggal Pembayaran",
      "Nama Pelanggan",
      "Metode Pembayaran",
      "Bank",
      "Atas Nama",
      "Total Bayar",
      "Periode",
    ];

    // 3. Hitung Total Pendapatan dari data yang terfilter
    const totalPendapatan = dataToExport.reduce((sum, item) => {
        if (item.payment && item.payment.status_bayar === 'lunas') {
            return sum + Number(item.payment.total_bayar);
        }
        return sum;
    }, 0);
    const formattedTotalPendapatan = `Rp ${totalPendapatan.toLocaleString("id-ID")}`;

    // 4. Mapping data row
    const dataRows = dataToExport.map((item, index) => {
      const { customer, payment } = item;
      const tanggal = payment?.tanggal_bayar ? new Date(payment.tanggal_bayar) : null;
      const formattedTanggal = tanggal
        ? tanggal.toLocaleDateString("id-ID", {
            day: "2-digit", month: "2-digit", year: "numeric",
          })
        : "-";
      
      const totalBayar = Number(payment?.total_bayar ?? 0);
      const formattedTotalBayar = totalBayar > 0 ? `Rp ${totalBayar.toLocaleString("id-ID")}` : "-";

      const periode = payment?.periode
        ? String(payment.periode)
        : payment?.bulan && payment?.tahun
        ? `${String(payment.bulan).padStart(2, "0")}-${payment.tahun}`
        : "-";

      return [
        index + 1,
        formattedTanggal,
        customer.nama,
        payment?.metode_pembayaran ?? "-",
        payment?.bank ?? "-",
        payment?.atas_nama_rekening ?? "-",
        formattedTotalBayar,
        periode,
      ];
    });

    // --- PROSES PEMBUATAN WORKSHEET ---

    const ws = XLSX.utils.aoa_to_sheet([[]]);

    // Tambah Judul & Tanggal
    XLSX.utils.sheet_add_aoa(ws, [[reportTitle]], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, [[exportDate]], { origin: "A2" });

    // Tambah Header Tabel
    const headerRowIndex = 3; // Baris ke-4 di Excel
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${headerRowIndex + 1}` });

    // Tambah Data Tabel
    const dataRowStartIndex = headerRowIndex + 2; // Mulai dari baris ke-5
    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: `A${dataRowStartIndex}` });

    // Tambah Baris Ringkasan Keuangan (Total Pendapatan)
    const summaryRowIndex = dataRowStartIndex + dataRows.length + 1; // +1 untuk baris kosong
    const summaryRow = [
        "", // No
        "", // Tanggal
        "", // Nama
        "", // Atas Nama
        "", // Bank
        "TOTAL PENDAPATAN",   // Metode
        formattedTotalPendapatan, // Total Bayar
        "", // Periode
    ];
    XLSX.utils.sheet_add_aoa(ws, [summaryRow], { origin: `A${summaryRowIndex}` });


    // --- FORMATTING & STYLING ---

    // Merge & Style Judul
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];
    if(ws['A1']) ws['A1'].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };
    if(ws['A2']) ws['A2'].s = { alignment: { horizontal: "center" } };

    // Style Header
    headers.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "FFD3D3D3" } },
        };
      }
    });

    // Style Baris Total Pendapatan
    const summaryLabelCell = XLSX.utils.encode_cell({ r: summaryRowIndex - 1, c: 5 });
    const summaryValueCell = XLSX.utils.encode_cell({ r: summaryRowIndex - 1, c: 6 });
    
    if(ws[summaryLabelCell]) ws[summaryLabelCell].s = { font: { bold: true }, alignment: { horizontal: "right" } };
    if(ws[summaryValueCell]) ws[summaryValueCell].s = { font: { bold: true }, numFmt: `#,##0` };


    // Atur Lebar Kolom
    ws["!cols"] = [
      { wch: 6 },    // No
      { wch: 18 },   // Tanggal Pembayaran
      { wch: 28 },   // Nama Pelanggan
      { wch: 25 },   // Atas Nama
      { wch: 18 },   // Bank
      { wch: 20 },   // Metode Pembayaran
      { wch: 18 },   // Total Bayar
      { wch: 14 },   // Periode
    ];

    // Buat dan Download File Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    
    const fileName = `Laporan_Keuangan_WiFi_${new Date().toISOString().split("T")[0]}.xlsx`;
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
        <div style={filterContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Nama Pelanggan:</label>
            <input
              type="text"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              placeholder="Cari nama..."
              style={inputStyle}
            />
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Wilayah:</label>
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
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Bulan:</label>
            <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value ? Number(e.target.value) : "")} style={inputStyle}>
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Tahun:</label>
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
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Status Pembayaran:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "lunas" | "belum" | "")} style={inputStyle}>
              <option value="">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="belum">Belum</option>
            </select>
          </div>
          <div style={{ marginLeft: "auto" }}>
             <button onClick={exportToExcel} style={buttonStyle}>
                Export ke Excel
             </button>
          </div>
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