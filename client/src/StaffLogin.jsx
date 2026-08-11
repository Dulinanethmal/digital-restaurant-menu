import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "./supabase";

export default function StaffLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // This grabs the role ("kitchen" or "cashier") that they clicked on the First.jsx page
  const intendedRole = location.state?.selectedRole || "Staff";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Log in via Supabase Authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Fetch their custom profile to get their shop_id and role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Save the session data (This makes your Profile.jsx and StaffManagement.jsx work perfectly!)
      localStorage.setItem("custom_session", JSON.stringify({
        shop_id: profileData.shop_id,
        role: profileData.role
      }));

      // 4. Redirect them to the main dashboard / profile
      navigate("/admin");

    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          <span style={{ textTransform: "capitalize" }}>{intendedRole}</span> Login
        </h2>
        <p style={styles.subtitle}>Enter the credentials provided by your manager.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          {errorMsg && <div style={styles.error}>{errorMsg}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@restaurant.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button 
            type="button" 
            onClick={() => navigate("/")} 
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline" }}
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// Clean inline styles for the login page
const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "20px" },
  card: { background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px" },
  title: { margin: "0 0 10px 0", fontSize: "24px", color: "#111", textAlign: "center" },
  subtitle: { margin: "0 0 30px 0", color: "#666", textAlign: "center", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  error: { padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "14px", border: "1px solid #f87171" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontWeight: "600", fontSize: "14px", color: "#333" },
  input: { width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" },
  button: { padding: "14px", background: "#F4B400", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }
};