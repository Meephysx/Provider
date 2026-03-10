import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string>("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) return setError("Password tidak cocok");
    if (password.length < 6) return setError("Password minimal 6 karakter");

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoSquare}>W</div>
          <h2 style={styles.title}>Buat Akun Admin</h2>
          <p style={styles.subtitle}>Mulai kelola jaringan WiFi Anda</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              style={{ ...styles.input, ...(focused === "email" ? styles.inputFocus : {}) }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused("")}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Password</label>
              <input
                style={{ ...styles.input, ...(focused === "password" ? styles.inputFocus : {}) }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
                required
              />
            </div>

            <div style={{ width: 16 }} />

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Konfirmasi Password</label>
              <input
                style={{ ...styles.input, ...(focused === "confirm" ? styles.inputFocus : {}) }}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused("")}
                required
              />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }} disabled={loading}>
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <p style={styles.footerText}>
          Sudah punya akun? <Link to="/login" style={styles.link}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif", padding: "20px" },
  card: { backgroundColor: "#ffffff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", width: "100%", maxWidth: "420px" },
  header: { textAlign: "center", marginBottom: "32px" },
  logoSquare: { width: "48px", height: "48px", backgroundColor: "#3b82f6", color: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", margin: "0 auto 16px" },
  title: { margin: "0 0 8px 0", fontSize: "24px", color: "#0f172a", fontWeight: "700" },
  subtitle: { margin: 0, color: "#64748b", fontSize: "14px" },
  errorAlert: { backgroundColor: "#fef2f2", color: "#ef4444", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", outline: "none", backgroundColor: "#f8fafc" },
  button: { padding: "14px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  footerText: { textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" },
  link: { color: "#3b82f6", textDecoration: "none", fontWeight: "600" }
};

export default Register;