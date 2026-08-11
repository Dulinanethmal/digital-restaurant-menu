import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OwnerLogin() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you would verify this password against your Supabase database here.
    // For now, as long as they type a password, it lets them in.
    if (password.trim() !== "") {
      navigate("/admin");
    } else {
      alert("Please enter your owner password.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Owner Verification</h2>
        <p style={styles.subtext}>
          Please enter your master password to unlock the Admin Dashboard.
        </p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="Enter Owner Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Unlock Dashboard
          </button>
        </form>
        
        <button onClick={() => navigate("/first")} style={styles.backButton}>
          ← Back to Role Selection
        </button>
      </div>
    </div>
  );
}

// Clean inline styles for the verification screen
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#111", // Dark background to match the premium feel
    padding: "20px"
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    textAlign: "center",
    width: "100%",
    maxWidth: "400px"
  },
  heading: {
    margin: "0 0 10px 0",
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "800"
  },
  subtext: {
    color: "#666",
    marginBottom: "30px",
    fontSize: "14px",
    lineHeight: "1.5"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    outline: "none"
  },
  button: {
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#F4B400",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  backButton: {
    marginTop: "20px",
    background: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: "14px"
  }
};