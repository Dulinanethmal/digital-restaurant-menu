import { useState } from "react";
import supabase from "./supabase";
import { FunctionsHttpError } from "@supabase/supabase-js"; // <-- Imported this to decode backend errors

export default function AddStaffModal({ onClose, onRefresh, shopId }) {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", role: "cashier" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCreateStaff(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke('create-staff', {
        body: {
          // Sending both camelCase and snake_case to guarantee the Edge Function finds it
          fullName: formData.fullName,
          full_name: formData.fullName, 
          email: formData.email,
          password: formData.password,
          role: formData.role,
          shopId: shopId,
          shop_id: shopId 
        }
      });

      // --- NEW ERROR UNPACKING LOGIC ---
      if (error) {
        if (error instanceof FunctionsHttpError) {
          // This extracts the hidden JSON error message from the Edge Function response
          const errorBody = await error.context.json();
          throw new Error(errorBody.error || errorBody.message || "Edge Function Error");
        }
        throw new Error(error.message);
      }
      
      if (data?.error) throw new Error(data.error);

      // Success! Close modal and refresh the list
      if (onRefresh) onRefresh();
      if (onClose) onClose();
      
    } catch (error) {
      console.error(error);
      // Now this will display the exact database/auth error on the screen!
      setErrorMsg(error.message || "Failed to create staff account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: "20px" }}>Add New Staff</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleCreateStaff} style={styles.body}>
          {errorMsg && <div style={styles.error}>{errorMsg}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input 
              required 
              type="text" 
              style={styles.input} 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              placeholder="e.g. NAME" 
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input 
              required 
              type="email" 
              style={styles.input} 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="staff@restaurant.com" 
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Temporary Password (Give this to the staff)</label>
            <input 
              required 
              type="text" 
              minLength={6} 
              style={styles.input} 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              placeholder="Minimum 6 characters" 
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select 
              style={styles.input} 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="cashier">Cashier (POS & Payments)</option>
              <option value="kitchen">Kitchen (Order Management)</option>
            </select>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={loading}>Cancel</button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Creating..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Clean inline styles for the modal
const styles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#fff", width: "100%", maxWidth: "450px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
  header: { padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#666" },
  body: { padding: "20px" },
  error: { padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "15px", fontSize: "14px", fontWeight: "500", border: "1px solid #f87171" },
  field: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#333" },
  input: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" },
  cancelBtn: { padding: "10px 16px", background: "transparent", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer" },
  submitBtn: { padding: "10px 16px", background: "#F4B400", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }
};