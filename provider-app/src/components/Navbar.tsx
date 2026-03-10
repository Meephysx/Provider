import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/authService";

const Navbar = () => {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const styles = {
    navbar: {
      backgroundColor: "#ffffff",
      padding: "8px 32px", // Sedikit dikecilkan agar logo 60px tidak membuat navbar terlalu gemuk
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      position: "sticky" as const,
      top: 0,
      zIndex: 1000,
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
    },
    logoSquare: {
      width: "60px", // Disesuaikan dengan tinggi logo baru
      height: "60px",
      backgroundColor: "#2563eb",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "bold",
      borderRadius: "12px",
    },
    logoImage: {
      width: "158px", // Ukuran memanjang sesuai request
      height: "60px", // Tinggi sesuai request
      objectFit: "contain" as const, // Gambar tetap proporsional
      borderRadius: "160px", // Rounded parah sesuai request
    },
    navLink: {
      textDecoration: "none",
      fontSize: "16px",
      fontWeight: "500",
      padding: "8px 0",
      transition: "all 0.2s ease",
    },
    logoutBtn: {
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "background-color 0.2s ease",
    },
  };

  const getLinkStyle = (path: string, name: string) => {
    const isCurrent = location.pathname === path;
    const isHovered = hoveredNav === name;

    return {
      ...styles.navLink,
      borderBottom: (isCurrent || isHovered) ? '2px solid #2563eb' : '2px solid transparent',
      color: (isCurrent || isHovered) ? '#2563eb' : '#475569',
    };
  };

  return (
    <nav style={styles.navbar}>
      {/* LOGO MEMANJANG KE SAMPING */}
      <Link to="/dashboard" style={styles.logoContainer}>
        {logoError ? (
          <div style={styles.logoSquare}>A</div>
        ) : (
          <img
            src="/image.png"
            alt="Aldeephy Logo"
            style={styles.logoImage}
            onError={() => setLogoError(true)}
          />
        )}
      </Link>

      {/* NAVIGASI KANAN */}
      <div style={{ display: "flex", gap: "28px", alignItems: 'center' }}>
        <Link
          to="/dashboard"
          onMouseEnter={() => setHoveredNav('dashboard')}
          onMouseLeave={() => setHoveredNav(null)}
          style={getLinkStyle("/dashboard", "dashboard")}
        >
          Dashboard
        </Link>
        <Link
          to="/customers"
          onMouseEnter={() => setHoveredNav('customers')}
          onMouseLeave={() => setHoveredNav(null)}
          style={getLinkStyle("/customers", "customers")}
        >
          Pelanggan
        </Link>
        <Link
          to="/payments"
          onMouseEnter={() => setHoveredNav('payments')}
          onMouseLeave={() => setHoveredNav(null)}
          style={getLinkStyle("/payments", "payments")}
        >
          Pembayaran
        </Link>
        <Link
          to="/reports"
          onMouseEnter={() => setHoveredNav('reports')}
          onMouseLeave={() => setHoveredNav(null)}
          style={getLinkStyle("/reports", "reports")}
        >
          Laporan
        </Link>
        
        <button 
          onClick={handleLogout} 
          style={styles.logoutBtn}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#b91c1c"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc2626"}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;