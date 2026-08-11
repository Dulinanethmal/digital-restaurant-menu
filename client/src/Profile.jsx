import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- Imported useNavigate
import supabase from "./supabase";

export default function Profile() {
  const navigate = useNavigate(); // <-- Added for logout redirection
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // User Data State
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    phone_number: "",
    role: "",
    restaurant_name: "", 
    status: "Active",
    avatar_url: ""
  });

  // Password State
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    newOrders: true,
    payments: true,
    system: true
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      // 1. Get authenticated user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Could not authenticate user");
      
      setAuthUser(user);

      // 2. Fetch custom profile data (Role, Phone, shop_id, etc.)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile((prev) => ({ ...prev, ...profileData }));

        // 3. Fetch the actual Restaurant Name from the 'shops' table
        if (profileData.shop_id) {
          const { data: shopData } = await supabase
            .from("shops")
            .select("shop_name")
            .eq("id", profileData.shop_id)
            .single();
            
          if (shopData) {
            setProfile((prev) => ({ ...prev, restaurant_name: shopData.shop_name }));
          }
        }
      }
    } catch (error) {
      showMessage("error", error.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  }

  // --- Handlers ---

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone_number: profile.phone_number
        })
        .eq("id", authUser.id);

      if (error) throw error;

      showMessage("success", "Profile updated successfully.");
      setEditMode(false);
    } catch (error) {
      showMessage("error", "Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return showMessage("error", "New passwords do not match.");
    }
    if (passwords.new.length < 6) {
      return showMessage("error", "Password must be at least 6 characters.");
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      
      showMessage("success", "Password updated successfully.");
      setPasswords({ new: "", confirm: "" });
    } catch (error) {
      showMessage("error", "Failed to update password: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // --- FIXED LOGOUT HANDLER ---
  async function handleSignOut() {
    localStorage.removeItem("custom_session"); // Clear your custom session
    await supabase.auth.signOut();             // Clear Supabase session
    navigate("/login");                        // Redirect to login page
  }

  if (loading) {
    return <div className="loading-state" style={{ padding: "40px", textAlign: "center" }}>Loading your profile...</div>;
  }

  return (
    <div className="profile-page">
      {message.text && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 1. Header Section */}
      <div className="profile-header-card admin-card">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>
        <div className="profile-titles">
          <h2>{profile.full_name || "Unknown User"}</h2>
          <p className="role-text" style={{ textTransform: "capitalize" }}>
            {profile.role || "Owner"} at {profile.restaurant_name || "Your Restaurant"}
          </p>
          <span className={`badge ${profile.status === 'active' ? 'Served' : 'Cancelled'}`}>
            {profile.status}
          </span>
        </div>
        <div className="profile-actions">
          <button className="btn-outline">Change Photo</button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column */}
        <div className="profile-col">
          
          {/* 2. Personal Information */}
          <div className="admin-card">
            <div className="card-header">
              <h3>Personal Information</h3>
              {!editMode ? (
                <button className="btn-text" onClick={() => setEditMode(true)}>Edit</button>
              ) : (
                <div className="action-group">
                  <button className="btn-text text-danger" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="btn-primary-small" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="field-input"
                  value={profile.full_name || ""} 
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  disabled={!editMode}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  className="field-input"
                  value={profile.phone_number || ""} 
                  onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
                  disabled={!editMode}
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="field-input" value={authUser?.email || ""} disabled />
                <span className="field-hint" style={{ fontSize: "12px", color: "#666" }}>Email cannot be changed here.</span>
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" className="field-input" value={profile.role || "Owner"} disabled style={{ textTransform: "capitalize" }}/>
              </div>
            </div>
          </div>

          {/* 3. Account Details (Read Only) */}
          <div className="admin-card">
            <h3>Account Details</h3>
            <ul className="details-list" style={{ listStyle: "none", padding: 0, lineHeight: "2" }}>
              <li><strong>User ID:</strong> <span style={{ color: "#666" }}>{authUser?.id.slice(0, 8)}...</span></li>
              <li><strong>Restaurant:</strong> <span style={{ color: "#666" }}>{profile.restaurant_name || "N/A"}</span></li>
              <li><strong>Account Created:</strong> <span style={{ color: "#666" }}>{authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : "N/A"}</span></li>
              <li><strong>Last Login:</strong> <span style={{ color: "#666" }}>{authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : "N/A"}</span></li>
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-col">
          
          {/* 4. Change Password */}
          <div className="admin-card">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordChange} className="form-grid stacked">
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="field-input"
                  value={passwords.new} 
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: "15px" }}>
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  className="field-input"
                  value={passwords.confirm} 
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving || !passwords.new} style={{ marginTop: "15px", width: "100%" }}>
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* 5. Notifications */}
          <div className="admin-card" style={{ marginTop: "20px" }}>
            <h3>Notifications</h3>
            <div className="toggle-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
              <div className="toggle-row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>New Order Alerts</span>
                <input type="checkbox" checked={notifications.newOrders} onChange={(e) => setNotifications({...notifications, newOrders: e.target.checked})} />
              </div>
              <div className="toggle-row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Payment Notifications</span>
                <input type="checkbox" checked={notifications.payments} onChange={(e) => setNotifications({...notifications, payments: e.target.checked})} />
              </div>
              <div className="toggle-row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>System Updates</span>
                <input type="checkbox" checked={notifications.system} onChange={(e) => setNotifications({...notifications, system: e.target.checked})} />
              </div>
            </div>
          </div>

          {/* 6. Security / Logout */}
          <div className="admin-card danger-zone" style={{ marginTop: "20px" }}>
            <h3>Account Security</h3>
            <p className="security-text" style={{ marginBottom: "15px", color: "#666" }}>Active Session: This device</p>
            <button 
              className="btn-danger-outline full-width" 
              onClick={handleSignOut}
              style={{ width: "100%", padding: "10px", color: "#dc2626", border: "1px solid #dc2626", background: "transparent", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              Sign Out Securely
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}