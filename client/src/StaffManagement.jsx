import { useState, useEffect } from "react";
import supabase from "./supabase";
import AddStaffModal from "./AddStaffModal";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);

  // Safely get the logged-in owner's shop_id from the session you saved during login
  const session = JSON.parse(localStorage.getItem("custom_session") || "{}");
  const shopId = session.shop_id;

  useEffect(() => {
    if (shopId) {
      fetchStaff();
    } else {
      setLoading(false);
    }
  }, [shopId]);

  async function fetchStaff() {
    if (!shopId) return; // Safety check: Do nothing if there's no shop ID
    
    setLoading(true);
    try {
      // Securely fetch ONLY the profiles that belong to this specific owner's shop
      // And hide the "owner" from the staff list so they can't be deactivated
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("shop_id", shopId)
        .neq("role", "owner") 
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(staffId, currentStatus) {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'deactivate' : 'activate'} this account?`)) return;

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", staffId);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      fetchStaff(); // Refresh the list
    }
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ margin: "0 0 5px 0", fontSize: "28px", color: "#111" }}>Staff Management</h2>
          <p style={{ margin: 0, color: "#666" }}>Manage access for your Cashiers and Kitchen staff.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)} 
          style={{ padding: "12px 24px", background: "#F4B400", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          + Add New Staff
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading staff...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8f9fa", borderBottom: "2px solid #eee", textAlign: "left" }}>
              <tr>
                <th style={{ padding: "15px 20px", color: "#444" }}>Name</th>
                <th style={{ padding: "15px 20px", color: "#444" }}>Role</th>
                <th style={{ padding: "15px 20px", color: "#444" }}>Status</th>
                <th style={{ padding: "15px 20px", textAlign: "right", color: "#444" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#999" }}>No staff found. Click "Add New Staff" to create one.</td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "15px 20px" }}>
                      <div style={{ fontWeight: "600", color: "#111" }}>{member.full_name || "N/A"}</div>
                      <div style={{ fontSize: "13px", color: "#666" }}>{member.email}</div>
                    </td>
                    <td style={{ padding: "15px 20px", textTransform: "uppercase", fontSize: "12px", fontWeight: "bold", color: "#555" }}>
                      {member.role || "Staff"}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      <span style={{ 
                        padding: "4px 10px", 
                        borderRadius: "20px", 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        backgroundColor: member.status === 'active' ? "#dcfce7" : "#fee2e2",
                        color: member.status === 'active' ? "#166534" : "#991b1b"
                      }}>
                        {member.status || "active"}
                      </span>
                    </td>
                    <td style={{ padding: "15px 20px", textAlign: "right" }}>
                      <button 
                        onClick={() => toggleStatus(member.id, member.status)}
                        style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${member.status === 'active' ? '#ef4444' : '#10b981'}`, color: member.status === 'active' ? '#ef4444' : '#10b981', borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                      >
                        {member.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && <AddStaffModal onClose={() => setModalOpen(false)} onRefresh={fetchStaff} shopId={shopId} />}
    </div>
  );
}