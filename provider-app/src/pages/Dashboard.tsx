import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
// PERHATIAN: Semua import menggunakan ../ agar tidak stuck/error "Module not found"

import DashboardCards from "../components/DashboardCards";
import CustomerTable from "../components/CustomerTable";
import { Customer, Payment } from "../types/Customer";
import { getCustomers } from "../services/customerService";
import { getPayments } from "../services/paymentService";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate(); 

  // --- STATE MANAGEMENT ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- FILTER STATE ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [filterWilayah, setFilterWilayah] = useState<string>("");
  const [filterBulan, setFilterBulan] = useState<number>(currentMonth);
  const [filterTahun, setFilterTahun] = useState<number>(currentYear);
  const [searchNama, setSearchNama] = useState<string>("");

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custs, pays] = await Promise.all([getCustomers(), getPayments()]);
      setCustomers(custs);
      setPayments(pays);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data. Periksa koneksi internet atau database Firebase Anda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // reload when paymentsUpdated event dispatched
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('paymentsUpdated', handler);
    return () => window.removeEventListener('paymentsUpdated', handler);
  }, [loadData]);

  // --- LOGIKA FILTERING ---
  // 1. Filter Pelanggan berdasarkan Wilayah dan Nama
  const filteredCustomers = customers.filter((c) => {
    const matchWilayah = !filterWilayah || c.wilayah === filterWilayah;
    const matchNama = !searchNama || c.nama.toLowerCase().includes(searchNama.toLowerCase());
    return matchWilayah && matchNama;
  });

  const validCustomerIds = new Set(filteredCustomers.map((c) => c.id));

  // 2. Filter Pembayaran berdasarkan Pelanggan yang Tersaring, Bulan, dan Tahun
  const filteredPayments = payments.filter((p) => {
    const isTargetCustomer = validCustomerIds.has(p.customer_id);
    const isTargetYear = Number(p.tahun) === filterTahun;
    const isTargetMonth = Number(p.bulan) === filterBulan;
    return isTargetCustomer && isTargetYear && isTargetMonth;
  });

  // --- HITUNG METRIK DASHBOARD ---
  const paidPayments = filteredPayments.filter((p) => p.status_bayar === "lunas");
  const totalLunasCount = new Set(paidPayments.map((p) => p.customer_id)).size;
  const totalBelumCount = filteredCustomers.length - totalLunasCount;

  const totalPendapatan = paidPayments.reduce((sum, p) => {
    const customer = customers.find(c => c.id === p.customer_id);
    const amount = Number(p.total_bayar) || Number(customer?.harga) || 0;
    return sum + amount;
  }, 0);

  const metrics = {
    totalCustomers: filteredCustomers.length,
    totalLunas: totalLunasCount,
    totalBelum: totalBelumCount,
    totalPendapatan: totalPendapatan,
  };

  // --- GRAFIK KEUANGAN (POTENSI VS LUNAS) ---
  const getMonthlyRevenueData = () => {
    // Total uang yang HARUSNYA masuk bulan ini (dari pelanggan yang difilter)
    const potentialRevenuePerMonth = filteredCustomers.reduce((sum, c) => sum + (Number(c.harga) || 0), 0);

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      
      // Ambil pembayaran HANYA untuk bulan ini & tahun filter
      const paysForThisMonth = payments.filter(p => 
        validCustomerIds.has(p.customer_id) && 
        Number(p.bulan) === monthIndex && 
        Number(p.tahun) === filterTahun
      );

      // Hitung Lunas
      const lunas = paysForThisMonth
        .filter(p => p.status_bayar === "lunas")
        .reduce((sum, p) => {
          const c = customers.find(cust => cust.id === p.customer_id);
          return sum + (Number(p.total_bayar) || Number(c?.harga) || 0);
        }, 0);

      // Belum Bayar (Piutang) = Potensi Pendapatan - Yang Sudah Lunas
      const belum = potentialRevenuePerMonth - lunas;

      return { lunas, belum: belum > 0 ? belum : 0 };
    });

    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
      datasets: [
        {
          label: 'Lunas (Masuk)',
          data: monthlyData.map(d => d.lunas),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Piutang (Belum Bayar)',
          data: monthlyData.map(d => d.belum),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }
      ],
    };
  };

  // --- GRAFIK WILAYAH ---
  const getWilayahChartData = () => {
    // Ambil semua wilayah unik
    const semuaWilayah = Array.from(new Set(customers.map(c => c.wilayah))).filter(w => w);
    const wilayahDipilih = filterWilayah ? [filterWilayah] : semuaWilayah;

    const dataPerWilayah = wilayahDipilih.map((w) => {
      // Pelanggan di wilayah W
      const ids = customers.filter(c => c.wilayah === w).map(c => c.id);
      
      // Pembayaran untuk bulan ini & tahun filter HANYA di wilayah W
      const paymentsInW = payments.filter(p => 
        ids.includes(p.customer_id) && 
        Number(p.bulan) === filterBulan && 
        Number(p.tahun) === filterTahun
      );

      const paidCount = paymentsInW.filter(p => p.status_bayar === 'lunas').length;
      const unpaidCount = ids.length - paidCount;

      return { w, paid: paidCount, unpaid: unpaidCount };
    });

    return {
      labels: dataPerWilayah.map(d => d.w),
      datasets: [
        { label: 'Lunas', data: dataPerWilayah.map(d => d.paid), backgroundColor: '#10b981', borderRadius: 4 },
        { label: 'Belum Bayar', data: dataPerWilayah.map(d => d.unpaid), backgroundColor: '#f87171', borderRadius: 4 }
      ]
    };
  };

  return (
    <div style={styles.pageBackground}>

      <div style={styles.container}>
        {loading ? (
          <div style={styles.loadingContainer}>Memuat Data Dashboard...</div>
        ) : error ? (
          <div style={styles.errorAlert}>{error}</div>
        ) : (
          <>
            {/* HEADER DASHBOARD */}
            <div style={{ marginBottom: "30px" }}>
              <h1 style={styles.mainTitle}>Ringkasan Sistem</h1>
              <p style={styles.subTitle}>Kelola data ISP Anda dengan mudah.</p>
            </div>

            {/* KARTU FILTER */}
            <div style={styles.filterCard}>
               <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  
                  {/* Pencarian Nama */}
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Cari Nama</label>
                    <input style={styles.input} placeholder="Contoh: Budi" value={searchNama} onChange={(e) => setSearchNama(e.target.value)} />
                  </div>

                  {/* Filter Wilayah */}
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Wilayah</label>
                    <select style={styles.input} value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)}>
                      <option value="">Semua Wilayah</option>
                      {Array.from(new Set(customers.map(c => c.wilayah))).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>

                  {/* Filter Bulan */}
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Bulan</label>
                    <select style={styles.input} value={filterBulan} onChange={(e) => setFilterBulan(Number(e.target.value))}>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Bulan {m}</option>)}
                    </select>
                  </div>

                  {/* Filter Tahun */}
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Tahun</label>
                    <select style={styles.input} value={filterTahun} onChange={(e) => setFilterTahun(Number(e.target.value))}>
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

               </div>
            </div>

            {/* KARTU METRIK UTAMA (Total Pelanggan, Lunas, Belum, dll) */}
            <DashboardCards {...metrics} />

            {/* AREA GRAFIK */}
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '30px' }}>
                
                {/* Garis: Pendapatan Vs Piutang */}
                <div style={{ ...styles.tableCard, flex: 2, minWidth: '300px' }}>
                  <div style={styles.tableHeader}>
                    <h3 style={{ margin: 0 }}>Arus Kas Bulanan {filterTahun}</h3>
                  </div>
                  <div style={{ padding: "20px" }}>
                    <Line data={getMonthlyRevenueData()} />
                  </div>
                </div>

                {/* Batang: Statistik per Wilayah */}
                <div style={{ ...styles.tableCard, flex: 1, minWidth: '300px' }}>
                  <div style={styles.tableHeader}>
                    <h3 style={{ margin: 0 }}>Statistik Wilayah</h3>
                  </div>
                  <div style={{ padding: "20px" }}>
                    <Bar data={getWilayahChartData()} options={{ scales: { x: { stacked: true }, y: { stacked: true } } }} />
                  </div>
                </div>

            </div>

            {/* TABEL PELANGGAN */}
            <div style={styles.tableCard}>
              <div style={styles.tableHeader}>
                <h3 style={{ margin: 0 }}>Tabel Pelanggan & Pembayaran</h3>
              </div>
              <CustomerTable
                customers={filteredCustomers}
                payments={payments}
                currentMonth={new Date().getMonth() + 1} // Tambahkan ini
                currentYear={new Date().getFullYear()}   // Tambahkan ini
                onEdit={(customer) => {
                  navigate("/customers", { state: { editId: customer.id } });
                }}
                onMarkPaid={async () => { await loadData(); }} 
                onSendWa={(customer) => {
                  if (!customer.no_hp) {
                    alert("Nomor WhatsApp belum tersedia");
                    return;
                  }
                  const text = `Halo ${customer.nama}, mengingatkan tagihan WiFi...`;
                  window.open(`https://wa.me/${customer.no_hp}?text=${encodeURIComponent(text)}`, "_blank");
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- STYLING (Aman dan Rapi) ---
const styles: { [key: string]: React.CSSProperties } = {
  pageBackground: { minHeight: "100vh", backgroundColor: "#f4f7fb" },
  loadingContainer: { textAlign: 'center', padding: '100px', fontSize: '18px', fontWeight: 'bold' },
  container: { padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' },
  mainTitle: { margin: '0 0 6px 0', fontSize: 28, fontWeight: 800 },
  subTitle: { color: '#64748b', margin: 0, fontSize: 14 },
  filterCard: { backgroundColor: '#fff', padding: "20px", borderRadius: 15, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  tableCard: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 30, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  tableHeader: { padding: "15px 20px", borderBottom: "1px solid #eee", backgroundColor: "#f8f9fa" },
  errorAlert: { backgroundColor: "#fee2e2", color: "#b91c1c", padding: "15px", borderRadius: "10px", textAlign: "center", margin: "20px 0" },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: '150px' },
  filterLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }
};

export default Dashboard;