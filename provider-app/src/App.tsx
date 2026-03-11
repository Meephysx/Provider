import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import { getCurrentUser } from "./services/authService";
import Navbar from "./components/Navbar";
import React from "react";
// --- 1. KOMPONEN PRIVATE ROUTE ---
// Hanya untuk cek akses, jika belum login dilempar ke /login
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const user = getCurrentUser();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// --- 2. LAYOUT UTAMA (DIBIKIN SEKALI UNTUK SEMUA) ---
// Di sini tempat Navbar berada. Konten halaman akan muncul di <Outlet />
const MainLayout = () => {
  return (
    <div style={styles.appContainer}>
      {/* Navbar dipasang di sini, jadi di file Dashboard.tsx dkk HARUS DIHAPUS Navbarnya */}
      <Navbar />
      
      <main style={styles.contentArea}>
        <Outlet />
      </main>
    </div>
  );
};

// --- 3. KOMPONEN UTAMA APP ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* A. ROUTE PUBLIK (Tanpa Navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* B. ROUTE TERPROTEKSI (Pakai MainLayout & PrivateRoute) */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* C. FALLBACK (Jika link ngasal) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// --- 4. STYLING DASAR ---
const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc", // Warna background abu-abu muda halus (slate-50)
    display: "flex",
    flexDirection: "column",
  },
  contentArea: {
    flex: 1,
    padding: "24px",
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  }
};

export default App;