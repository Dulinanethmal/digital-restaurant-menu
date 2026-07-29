import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabase";
import "./Admin.css";

import Orders from "./Orders";
import MenuItems from "./MenuItems";
import FoodForm from "./FoodForm";
import Customize from "./Customize";
import QRCode from "./QRCode";
import PaymentSettings from "./PaymentSettings";
import OrdersManagement from "./OrdersManagement";
import ReportsAnalytics from "./ReportsAnalytics";
import Profile from "./Profile";

export default function Admin() {
  const navigate = useNavigate();

  // --- STATE ---
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: "", error: false });
  
  // SECURITY & TENANT STATE
  const [authLoading, setAuthLoading] = useState(true);
  const [shopId, setShopId] = useState(null);

  // Shop Settings State
  const [shopSettings, setShopSettings] = useState({
    shop_name: "Loading...",
    description: "",
    logo_url: ""
  });

  // 1. AUTHENTICATION CHECK
  useEffect(() => {
    const sessionData = localStorage.getItem("custom_session");
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      setShopId(parsedData.shop_id); // Save their specific shop_id
      setAuthLoading(false);
    } else {
      navigate("/login"); // Kick out unauthorized users
    }
  }, [navigate]);

  // 2. DATA FETCHING (Only runs after we know their shopId)
  useEffect(() => {
    if (!shopId) return; 

    fetchOrders();
    fetchMenuItems();
    fetchShopSettings();

    // Auto-refresh orders every 5 seconds
    const orderInterval = setInterval(() => {
      fetchOrders();
    }, 5000);

    // Listen for shop changes ONLY for this specific shop
    const settingsSub = supabase
      .channel('admin-shop-settings')
      .on('postgres', { event: '*', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` }, () => {
        fetchShopSettings();
      })
      .subscribe();

    return () => {
      clearInterval(orderInterval);
      supabase.removeChannel(settingsSub);
    };
  }, [shopId]);

  // --- QUERIES FILTERED BY SHOP ID ---
  async function fetchShopSettings() {
    // Notice we are querying the new "shops" table now!
    const { data } = await supabase.from("shops").select("*").eq("id", shopId).maybeSingle();
    if (data) setShopSettings(data);
  }

  async function fetchOrders() {
    const { data } = await supabase.from("orders").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    setOrders(data || []);
  }

  async function fetchMenuItems() {
    const { data } = await supabase.from("menu_items").select("*").eq("shop_id", shopId).order("name");
    setMenuItems(data || []);
  }

  function showToast(msg, error = false) {
    setToast({ visible: true, msg, error });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  }

  // --- ACTIONS ---
  async function updateStatus(id, newStatus) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id)
      .select();
    
    if (error || !data || data.length === 0) {
      showToast("Failed to update order", true);
      fetchOrders(); 
    } else {
      showToast(`Order marked as ${newStatus}`);
    }
  }

  async function handleAdd(fields) {
    setSaving(true);
    // Attach the shop_id to the new menu item!
    const payload = { ...fields, shop_id: shopId };
    
    const { error } = await supabase.from("menu_items").insert([payload]);
    setSaving(false);
    
    if (error) { showToast("Failed to add: " + error.message, true); return; }
    
    showToast("Item added to menu!");
    setShowAddModal(false);
    fetchMenuItems();
    setTab("menu");
  }

  async function handleEdit(fields) {
    setSaving(true);
    const { error } = await supabase.from("menu_items").update(fields).eq("id", editItem.id);
    setSaving(false);
    
    if (error) { showToast("Failed to save: " + error.message, true); return; }
    
    showToast("Item updated!");
    setEditItem(null);
    fetchMenuItems();
  }

  async function deleteFood(id) {
    if (!window.confirm("Delete this menu item?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    fetchMenuItems();
    showToast("Item deleted");
  }

  const handleLogout = () => {
    localStorage.removeItem("custom_session");
    supabase.auth.signOut();
    navigate("/login");
  };

  // --- RENDER HELPERS ---
  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'white' }}><h2>Loading dashboard...</h2></div>;
  }

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const preparingCount = orders.filter(o => o.status === "Preparing").length;
  const revenueAmount = orders.filter(o => o.status === "Served").reduce((sum, o) => sum + Number(o.total_amount), 0);

  const NAV = [
    { id: "orders", label: "Orders", badge: pendingCount + preparingCount },
    { id: "menu", label: "Menu Items", badge: menuItems.length },
    { id: "qrcode", label: "QR Generator" },
    { id: "orders-management", label: "Orders Management" },
    { id: "payment", label: "Payment Settings" },
    { id: "customize", label: "Customize Shop" },
    { id: "reports", label: "Reports & Analytics" },
    { id: "profile", label: "Profile" }
  ];

  return (
    <>
      <div className={`toast${toast.visible ? " visible" : ""}`} style={{ background: toast.error ? "#DC2626" : "#2D7D46" }}>
        {toast.error ? "✗" : "✓"} {toast.msg}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Menu Item</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <FoodForm onSave={handleAdd} onCancel={() => setShowAddModal(false)} saving={saving} />
          </div>
        </div>
      )}

      {editItem && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditItem(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit: {editItem.name}</div>
              <button className="modal-close" onClick={() => setEditItem(null)}>✕</button>
            </div>
            <FoodForm initial={editItem} onSave={handleEdit} onCancel={() => setEditItem(null)} saving={saving} />
          </div>
        </div>
      )}

      <div className="admin-layout">
        
        <div className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-tag">Admin Panel</div>
            <div className="sidebar-brand-name">{shopSettings.shop_name}</div>
            <div className="sidebar-brand-sub">Restaurant Management</div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                <span className="nav-icon"></span>
                {n.label}
                {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', padding: '20px' }}>
            <button onClick={handleLogout} className="btn-danger-outline" style={{ width: '100%', padding: '10px' }}>
              Log Out
            </button>
          </div>
        </div>

        <div className="main-area">
          <div className="main-header">
            <div>
              <div className="page-title">
                {tab === "orders" ? "Live Orders" 
                 : tab === "orders-management" ? "Orders Management" 
                 : tab === "menu" ? "Menu Items" 
                 : tab === "qrcode" ? "QR Generator" 
                 : tab === "payment" ? "Payment Settings" 
                 : tab === "reports" ? "Reports & Analytics" 
                 : tab === "profile" ? "Profile"
                 : "Shop Customization"}
              </div>
              <div className="page-sub">
                {tab === "orders" ? `${orders.length} total orders` 
                 : tab === "orders-management" ? "Manage and track order history"
                 : tab === "menu" ? `${menuItems.length} items on menu` 
                 : tab === "qrcode" ? "Generate table QR codes"
                 : tab === "payment" ? "Configure your payment gateways"
                 : tab === "reports" ? "View performance and sales"
                 : tab === "profile" ? "Manage your account"
                 : "Update your store branding"}
              </div>
            </div>

            {(tab === "orders" || tab === "menu") && (
              <div className="header-actions">
                <button className="btn-ghost" onClick={() => { fetchOrders(); fetchMenuItems(); }}>↻ Refresh</button>
                {tab === "menu" && (
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Item</button>
                )}
              </div>
            )}
          </div>

          <div className="main-content">
            {tab === "orders" && (
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">{orders.length}</div>
                  <div className="stat-sub">All time</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value" style={{ color: "#f4b400" }}>{pendingCount}</div>
                  <div className="stat-sub">Awaiting kitchen</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Preparing</div>
                  <div className="stat-value" style={{ color: "#3B82F6" }}>{preparingCount}</div>
                  <div className="stat-sub">In kitchen</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Revenue</div>
                  <div className="stat-value">${revenueAmount.toFixed(0)}</div>
                  <div className="stat-sub">From served orders</div>
                </div>
              </div>
            )}

            {/* ROUTING */}
            {tab === "orders" ? (
              <Orders orders={orders} updateStatus={updateStatus} />
            ) : tab === "orders-management" ? (
              <OrdersManagement showToast={showToast} />
            ) : tab === "menu" ? (
              <MenuItems
                menuItems={menuItems}
                setShowAddModal={setShowAddModal}
                setEditItem={setEditItem}
                deleteFood={deleteFood}
              />
            ) : tab === "qrcode" ? (
              <QRCode showToast={showToast} />
            ) : tab === "payment" ? (
              <PaymentSettings showToast={showToast} />
            ) : tab === "customize" ? (
              <Customize showToast={showToast} />
            ) : tab === "reports" ? (
              <ReportsAnalytics />
            ) : tab === "profile" ? (
              <Profile />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}